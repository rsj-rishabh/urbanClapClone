/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { convertPropertyBinding } from '../../compiler_util/expression_converter';
import * as core from '../../core';
import * as o from '../../output/output_ast';
import { sanitizeIdentifier } from '../../parse_util';
import { CssSelector } from '../../selector';
import { ShadowCss } from '../../shadow_css';
import { error } from '../../util';
import { BoundEvent } from '../r3_ast';
import { Identifiers as R3 } from '../r3_identifiers';
import { prepareSyntheticListenerFunctionName, prepareSyntheticPropertyName, typeWithParameters } from '../util';
import { MIN_STYLING_BINDING_SLOTS_REQUIRED, StylingBuilder } from './styling_builder';
import { BindingScope, makeBindingParser, prepareEventListenerParameters, renderFlagCheckIfStmt, resolveSanitizationFn, TemplateDefinitionBuilder, ValueConverter } from './template';
import { asLiteral, chainedInstruction, conditionallyCreateMapObjectLiteral, CONTEXT_NAME, DefinitionMap, getQueryPredicate, RENDER_FLAGS, TEMPORARY_NAME, temporaryAllocator } from './util';
// This regex matches any binding names that contain the "attr." prefix, e.g. "attr.required"
// If there is a match, the first matching group will contain the attribute name to bind.
const ATTR_REGEX = /attr\.([^\]]+)/;
const COMPONENT_VARIABLE = '%COMP%';
const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
function baseDirectiveFields(meta, constantPool, bindingParser) {
    const definitionMap = new DefinitionMap();
    const selectors = core.parseSelectorToR3Selector(meta.selector);
    // e.g. `type: MyDirective`
    definitionMap.set('type', meta.internalType);
    // e.g. `selectors: [['', 'someDir', '']]`
    if (selectors.length > 0) {
        definitionMap.set('selectors', asLiteral(selectors));
    }
    if (meta.queries.length > 0) {
        // e.g. `contentQueries: (rf, ctx, dirIndex) => { ... }
        definitionMap.set('contentQueries', createContentQueriesFunction(meta.queries, constantPool, meta.name));
    }
    if (meta.viewQueries.length) {
        definitionMap.set('viewQuery', createViewQueriesFunction(meta.viewQueries, constantPool, meta.name));
    }
    // e.g. `hostBindings: (rf, ctx) => { ... }
    definitionMap.set('hostBindings', createHostBindingsFunction(meta.host, meta.typeSourceSpan, bindingParser, constantPool, meta.selector || '', meta.name, definitionMap));
    // e.g 'inputs: {a: 'a'}`
    definitionMap.set('inputs', conditionallyCreateMapObjectLiteral(meta.inputs, true));
    // e.g 'outputs: {a: 'a'}`
    definitionMap.set('outputs', conditionallyCreateMapObjectLiteral(meta.outputs));
    if (meta.exportAs !== null) {
        definitionMap.set('exportAs', o.literalArr(meta.exportAs.map(e => o.literal(e))));
    }
    return definitionMap;
}
/**
 * Add features to the definition map.
 */
function addFeatures(definitionMap, meta) {
    // e.g. `features: [NgOnChangesFeature]`
    const features = [];
    const providers = meta.providers;
    const viewProviders = meta.viewProviders;
    if (providers || viewProviders) {
        const args = [providers || new o.LiteralArrayExpr([])];
        if (viewProviders) {
            args.push(viewProviders);
        }
        features.push(o.importExpr(R3.ProvidersFeature).callFn(args));
    }
    if (meta.usesInheritance) {
        features.push(o.importExpr(R3.InheritDefinitionFeature));
    }
    if (meta.fullInheritance) {
        features.push(o.importExpr(R3.CopyDefinitionFeature));
    }
    if (meta.lifecycle.usesOnChanges) {
        features.push(o.importExpr(R3.NgOnChangesFeature));
    }
    if (features.length) {
        definitionMap.set('features', o.literalArr(features));
    }
}
/**
 * Compile a directive for the render3 runtime as defined by the `R3DirectiveMetadata`.
 */
export function compileDirectiveFromMetadata(meta, constantPool, bindingParser) {
    const definitionMap = baseDirectiveFields(meta, constantPool, bindingParser);
    addFeatures(definitionMap, meta);
    const expression = o.importExpr(R3.defineDirective).callFn([definitionMap.toLiteralMap()], undefined, true);
    const type = createDirectiveType(meta);
    return { expression, type, statements: [] };
}
/**
 * Compile a component for the render3 runtime as defined by the `R3ComponentMetadata`.
 */
export function compileComponentFromMetadata(meta, constantPool, bindingParser) {
    const definitionMap = baseDirectiveFields(meta, constantPool, bindingParser);
    addFeatures(definitionMap, meta);
    const selector = meta.selector && CssSelector.parse(meta.selector);
    const firstSelector = selector && selector[0];
    // e.g. `attr: ["class", ".my.app"]`
    // This is optional an only included if the first selector of a component specifies attributes.
    if (firstSelector) {
        const selectorAttributes = firstSelector.getAttrs();
        if (selectorAttributes.length) {
            definitionMap.set('attrs', constantPool.getConstLiteral(o.literalArr(selectorAttributes.map(value => value != null ? o.literal(value) : o.literal(undefined))), 
            /* forceShared */ true));
        }
    }
    // e.g. `template: function MyComponent_Template(_ctx, _cm) {...}`
    const templateTypeName = meta.name;
    const templateName = templateTypeName ? `${templateTypeName}_Template` : null;
    const changeDetection = meta.changeDetection;
    const template = meta.template;
    const templateBuilder = new TemplateDefinitionBuilder(constantPool, BindingScope.createRootScope(), 0, templateTypeName, null, null, templateName, R3.namespaceHTML, meta.relativeContextFilePath, meta.i18nUseExternalIds);
    const templateFunctionExpression = templateBuilder.buildTemplateFunction(template.nodes, []);
    // We need to provide this so that dynamically generated components know what
    // projected content blocks to pass through to the component when it is instantiated.
    const ngContentSelectors = templateBuilder.getNgContentSelectors();
    if (ngContentSelectors) {
        definitionMap.set('ngContentSelectors', ngContentSelectors);
    }
    // e.g. `decls: 2`
    definitionMap.set('decls', o.literal(templateBuilder.getConstCount()));
    // e.g. `vars: 2`
    definitionMap.set('vars', o.literal(templateBuilder.getVarCount()));
    // Generate `consts` section of ComponentDef:
    // - either as an array:
    //   `consts: [['one', 'two'], ['three', 'four']]`
    // - or as a factory function in case additional statements are present (to support i18n):
    //   `consts: function() { var i18n_0; if (ngI18nClosureMode) {...} else {...} return [i18n_0]; }`
    const { constExpressions, prepareStatements } = templateBuilder.getConsts();
    if (constExpressions.length > 0) {
        let constsExpr = o.literalArr(constExpressions);
        // Prepare statements are present - turn `consts` into a function.
        if (prepareStatements.length > 0) {
            constsExpr = o.fn([], [...prepareStatements, new o.ReturnStatement(constsExpr)]);
        }
        definitionMap.set('consts', constsExpr);
    }
    definitionMap.set('template', templateFunctionExpression);
    // e.g. `directives: [MyDirective]`
    if (meta.directives.length > 0) {
        const directivesList = o.literalArr(meta.directives.map(dir => dir.type));
        const directivesExpr = compileDeclarationList(directivesList, meta.declarationListEmitMode);
        definitionMap.set('directives', directivesExpr);
    }
    // e.g. `pipes: [MyPipe]`
    if (meta.pipes.size > 0) {
        const pipesList = o.literalArr(Array.from(meta.pipes.values()));
        const pipesExpr = compileDeclarationList(pipesList, meta.declarationListEmitMode);
        definitionMap.set('pipes', pipesExpr);
    }
    if (meta.encapsulation === null) {
        meta.encapsulation = core.ViewEncapsulation.Emulated;
    }
    // e.g. `styles: [str1, str2]`
    if (meta.styles && meta.styles.length) {
        const styleValues = meta.encapsulation == core.ViewEncapsulation.Emulated ?
            compileStyles(meta.styles, CONTENT_ATTR, HOST_ATTR) :
            meta.styles;
        const strings = styleValues.map(str => constantPool.getConstLiteral(o.literal(str)));
        definitionMap.set('styles', o.literalArr(strings));
    }
    else if (meta.encapsulation === core.ViewEncapsulation.Emulated) {
        // If there is no style, don't generate css selectors on elements
        meta.encapsulation = core.ViewEncapsulation.None;
    }
    // Only set view encapsulation if it's not the default value
    if (meta.encapsulation !== core.ViewEncapsulation.Emulated) {
        definitionMap.set('encapsulation', o.literal(meta.encapsulation));
    }
    // e.g. `animation: [trigger('123', [])]`
    if (meta.animations !== null) {
        definitionMap.set('data', o.literalMap([{ key: 'animation', value: meta.animations, quoted: false }]));
    }
    // Only set the change detection flag if it's defined and it's not the default.
    if (changeDetection != null && changeDetection !== core.ChangeDetectionStrategy.Default) {
        definitionMap.set('changeDetection', o.literal(changeDetection));
    }
    const expression = o.importExpr(R3.defineComponent).callFn([definitionMap.toLiteralMap()], undefined, true);
    const type = createComponentType(meta);
    return { expression, type, statements: [] };
}
/**
 * Creates the type specification from the component meta. This type is inserted into .d.ts files
 * to be consumed by upstream compilations.
 */
export function createComponentType(meta) {
    const typeParams = createDirectiveTypeParams(meta);
    typeParams.push(stringArrayAsType(meta.template.ngContentSelectors));
    return o.expressionType(o.importExpr(R3.ComponentDeclaration, typeParams));
}
/**
 * Compiles the array literal of declarations into an expression according to the provided emit
 * mode.
 */
function compileDeclarationList(list, mode) {
    switch (mode) {
        case 0 /* Direct */:
            // directives: [MyDir],
            return list;
        case 1 /* Closure */:
            // directives: function () { return [MyDir]; }
            return o.fn([], [new o.ReturnStatement(list)]);
        case 2 /* ClosureResolved */:
            // directives: function () { return [MyDir].map(ng.resolveForwardRef); }
            const resolvedList = list.prop('map').callFn([o.importExpr(R3.resolveForwardRef)]);
            return o.fn([], [new o.ReturnStatement(resolvedList)]);
    }
}
function prepareQueryParams(query, constantPool) {
    const parameters = [getQueryPredicate(query, constantPool), o.literal(toQueryFlags(query))];
    if (query.read) {
        parameters.push(query.read);
    }
    return parameters;
}
/**
 * Translates query flags into `TQueryFlags` type in packages/core/src/render3/interfaces/query.ts
 * @param query
 */
function toQueryFlags(query) {
    return (query.descendants ? 1 /* descendants */ : 0 /* none */) |
        (query.static ? 2 /* isStatic */ : 0 /* none */) |
        (query.emitDistinctChangesOnly ? 4 /* emitDistinctChangesOnly */ : 0 /* none */);
}
function convertAttributesToExpressions(attributes) {
    const values = [];
    for (let key of Object.getOwnPropertyNames(attributes)) {
        const value = attributes[key];
        values.push(o.literal(key), value);
    }
    return values;
}
// Define and update any content queries
function createContentQueriesFunction(queries, constantPool, name) {
    const createStatements = [];
    const updateStatements = [];
    const tempAllocator = temporaryAllocator(updateStatements, TEMPORARY_NAME);
    for (const query of queries) {
        // creation, e.g. r3.contentQuery(dirIndex, somePredicate, true, null);
        createStatements.push(o.importExpr(R3.contentQuery)
            .callFn([o.variable('dirIndex'), ...prepareQueryParams(query, constantPool)])
            .toStmt());
        // update, e.g. (r3.queryRefresh(tmp = r3.loadQuery()) && (ctx.someDir = tmp));
        const temporary = tempAllocator();
        const getQueryList = o.importExpr(R3.loadQuery).callFn([]);
        const refresh = o.importExpr(R3.queryRefresh).callFn([temporary.set(getQueryList)]);
        const updateDirective = o.variable(CONTEXT_NAME)
            .prop(query.propertyName)
            .set(query.first ? temporary.prop('first') : temporary);
        updateStatements.push(refresh.and(updateDirective).toStmt());
    }
    const contentQueriesFnName = name ? `${name}_ContentQueries` : null;
    return o.fn([
        new o.FnParam(RENDER_FLAGS, o.NUMBER_TYPE), new o.FnParam(CONTEXT_NAME, null),
        new o.FnParam('dirIndex', null)
    ], [
        renderFlagCheckIfStmt(1 /* Create */, createStatements),
        renderFlagCheckIfStmt(2 /* Update */, updateStatements)
    ], o.INFERRED_TYPE, null, contentQueriesFnName);
}
function stringAsType(str) {
    return o.expressionType(o.literal(str));
}
function stringMapAsType(map) {
    const mapValues = Object.keys(map).map(key => {
        const value = Array.isArray(map[key]) ? map[key][0] : map[key];
        return {
            key,
            value: o.literal(value),
            quoted: true,
        };
    });
    return o.expressionType(o.literalMap(mapValues));
}
function stringArrayAsType(arr) {
    return arr.length > 0 ? o.expressionType(o.literalArr(arr.map(value => o.literal(value)))) :
        o.NONE_TYPE;
}
export function createDirectiveTypeParams(meta) {
    // On the type side, remove newlines from the selector as it will need to fit into a TypeScript
    // string literal, which must be on one line.
    const selectorForType = meta.selector !== null ? meta.selector.replace(/\n/g, '') : null;
    return [
        typeWithParameters(meta.type.type, meta.typeArgumentCount),
        selectorForType !== null ? stringAsType(selectorForType) : o.NONE_TYPE,
        meta.exportAs !== null ? stringArrayAsType(meta.exportAs) : o.NONE_TYPE,
        stringMapAsType(meta.inputs),
        stringMapAsType(meta.outputs),
        stringArrayAsType(meta.queries.map(q => q.propertyName)),
    ];
}
/**
 * Creates the type specification from the directive meta. This type is inserted into .d.ts files
 * to be consumed by upstream compilations.
 */
export function createDirectiveType(meta) {
    const typeParams = createDirectiveTypeParams(meta);
    return o.expressionType(o.importExpr(R3.DirectiveDeclaration, typeParams));
}
// Define and update any view queries
function createViewQueriesFunction(viewQueries, constantPool, name) {
    const createStatements = [];
    const updateStatements = [];
    const tempAllocator = temporaryAllocator(updateStatements, TEMPORARY_NAME);
    viewQueries.forEach((query) => {
        // creation, e.g. r3.viewQuery(somePredicate, true);
        const queryDefinition = o.importExpr(R3.viewQuery).callFn(prepareQueryParams(query, constantPool));
        createStatements.push(queryDefinition.toStmt());
        // update, e.g. (r3.queryRefresh(tmp = r3.loadQuery()) && (ctx.someDir = tmp));
        const temporary = tempAllocator();
        const getQueryList = o.importExpr(R3.loadQuery).callFn([]);
        const refresh = o.importExpr(R3.queryRefresh).callFn([temporary.set(getQueryList)]);
        const updateDirective = o.variable(CONTEXT_NAME)
            .prop(query.propertyName)
            .set(query.first ? temporary.prop('first') : temporary);
        updateStatements.push(refresh.and(updateDirective).toStmt());
    });
    const viewQueryFnName = name ? `${name}_Query` : null;
    return o.fn([new o.FnParam(RENDER_FLAGS, o.NUMBER_TYPE), new o.FnParam(CONTEXT_NAME, null)], [
        renderFlagCheckIfStmt(1 /* Create */, createStatements),
        renderFlagCheckIfStmt(2 /* Update */, updateStatements)
    ], o.INFERRED_TYPE, null, viewQueryFnName);
}
// Return a host binding function or null if one is not necessary.
function createHostBindingsFunction(hostBindingsMetadata, typeSourceSpan, bindingParser, constantPool, selector, name, definitionMap) {
    const bindingContext = o.variable(CONTEXT_NAME);
    const styleBuilder = new StylingBuilder(bindingContext);
    const { styleAttr, classAttr } = hostBindingsMetadata.specialAttributes;
    if (styleAttr !== undefined) {
        styleBuilder.registerStyleAttr(styleAttr);
    }
    if (classAttr !== undefined) {
        styleBuilder.registerClassAttr(classAttr);
    }
    const createStatements = [];
    const updateStatements = [];
    const hostBindingSourceSpan = typeSourceSpan;
    // Calculate host event bindings
    const eventBindings = bindingParser.createDirectiveHostEventAsts(hostBindingsMetadata.listeners, hostBindingSourceSpan);
    if (eventBindings && eventBindings.length) {
        const listeners = createHostListeners(eventBindings, name);
        createStatements.push(...listeners);
    }
    // Calculate the host property bindings
    const bindings = bindingParser.createBoundHostProperties(hostBindingsMetadata.properties, hostBindingSourceSpan);
    const allOtherBindings = [];
    // We need to calculate the total amount of binding slots required by
    // all the instructions together before any value conversions happen.
    // Value conversions may require additional slots for interpolation and
    // bindings with pipes. These calculates happen after this block.
    let totalHostVarsCount = 0;
    bindings && bindings.forEach((binding) => {
        const stylingInputWasSet = styleBuilder.registerInputBasedOnName(binding.name, binding.expression, hostBindingSourceSpan);
        if (stylingInputWasSet) {
            totalHostVarsCount += MIN_STYLING_BINDING_SLOTS_REQUIRED;
        }
        else {
            allOtherBindings.push(binding);
            totalHostVarsCount++;
        }
    });
    let valueConverter;
    const getValueConverter = () => {
        if (!valueConverter) {
            const hostVarsCountFn = (numSlots) => {
                const originalVarsCount = totalHostVarsCount;
                totalHostVarsCount += numSlots;
                return originalVarsCount;
            };
            valueConverter = new ValueConverter(constantPool, () => error('Unexpected node'), // new nodes are illegal here
            hostVarsCountFn, () => error('Unexpected pipe')); // pipes are illegal here
        }
        return valueConverter;
    };
    const propertyBindings = [];
    const attributeBindings = [];
    const syntheticHostBindings = [];
    allOtherBindings.forEach((binding) => {
        // resolve literal arrays and literal objects
        const value = binding.expression.visit(getValueConverter());
        const bindingExpr = bindingFn(bindingContext, value);
        const { bindingName, instruction, isAttribute } = getBindingNameAndInstruction(binding);
        const securityContexts = bindingParser.calcPossibleSecurityContexts(selector, bindingName, isAttribute)
            .filter(context => context !== core.SecurityContext.NONE);
        let sanitizerFn = null;
        if (securityContexts.length) {
            if (securityContexts.length === 2 &&
                securityContexts.indexOf(core.SecurityContext.URL) > -1 &&
                securityContexts.indexOf(core.SecurityContext.RESOURCE_URL) > -1) {
                // Special case for some URL attributes (such as "src" and "href") that may be a part
                // of different security contexts. In this case we use special sanitization function and
                // select the actual sanitizer at runtime based on a tag name that is provided while
                // invoking sanitization function.
                sanitizerFn = o.importExpr(R3.sanitizeUrlOrResourceUrl);
            }
            else {
                sanitizerFn = resolveSanitizationFn(securityContexts[0], isAttribute);
            }
        }
        const instructionParams = [o.literal(bindingName), bindingExpr.currValExpr];
        if (sanitizerFn) {
            instructionParams.push(sanitizerFn);
        }
        updateStatements.push(...bindingExpr.stmts);
        if (instruction === R3.hostProperty) {
            propertyBindings.push(instructionParams);
        }
        else if (instruction === R3.attribute) {
            attributeBindings.push(instructionParams);
        }
        else if (instruction === R3.syntheticHostProperty) {
            syntheticHostBindings.push(instructionParams);
        }
        else {
            updateStatements.push(o.importExpr(instruction).callFn(instructionParams).toStmt());
        }
    });
    if (propertyBindings.length > 0) {
        updateStatements.push(chainedInstruction(R3.hostProperty, propertyBindings).toStmt());
    }
    if (attributeBindings.length > 0) {
        updateStatements.push(chainedInstruction(R3.attribute, attributeBindings).toStmt());
    }
    if (syntheticHostBindings.length > 0) {
        updateStatements.push(chainedInstruction(R3.syntheticHostProperty, syntheticHostBindings).toStmt());
    }
    // since we're dealing with directives/components and both have hostBinding
    // functions, we need to generate a special hostAttrs instruction that deals
    // with both the assignment of styling as well as static attributes to the host
    // element. The instruction below will instruct all initial styling (styling
    // that is inside of a host binding within a directive/component) to be attached
    // to the host element alongside any of the provided host attributes that were
    // collected earlier.
    const hostAttrs = convertAttributesToExpressions(hostBindingsMetadata.attributes);
    styleBuilder.assignHostAttrs(hostAttrs, definitionMap);
    if (styleBuilder.hasBindings) {
        // finally each binding that was registered in the statement above will need to be added to
        // the update block of a component/directive templateFn/hostBindingsFn so that the bindings
        // are evaluated and updated for the element.
        styleBuilder.buildUpdateLevelInstructions(getValueConverter()).forEach(instruction => {
            if (instruction.calls.length > 0) {
                const calls = [];
                instruction.calls.forEach(call => {
                    // we subtract a value of `1` here because the binding slot was already allocated
                    // at the top of this method when all the input bindings were counted.
                    totalHostVarsCount +=
                        Math.max(call.allocateBindingSlots - MIN_STYLING_BINDING_SLOTS_REQUIRED, 0);
                    calls.push(convertStylingCall(call, bindingContext, bindingFn));
                });
                updateStatements.push(chainedInstruction(instruction.reference, calls).toStmt());
            }
        });
    }
    if (totalHostVarsCount) {
        definitionMap.set('hostVars', o.literal(totalHostVarsCount));
    }
    if (createStatements.length > 0 || updateStatements.length > 0) {
        const hostBindingsFnName = name ? `${name}_HostBindings` : null;
        const statements = [];
        if (createStatements.length > 0) {
            statements.push(renderFlagCheckIfStmt(1 /* Create */, createStatements));
        }
        if (updateStatements.length > 0) {
            statements.push(renderFlagCheckIfStmt(2 /* Update */, updateStatements));
        }
        return o.fn([new o.FnParam(RENDER_FLAGS, o.NUMBER_TYPE), new o.FnParam(CONTEXT_NAME, null)], statements, o.INFERRED_TYPE, null, hostBindingsFnName);
    }
    return null;
}
function bindingFn(implicit, value) {
    return convertPropertyBinding(null, implicit, value, 'b', () => error('Unexpected interpolation'));
}
function convertStylingCall(call, bindingContext, bindingFn) {
    return call.params(value => bindingFn(bindingContext, value).currValExpr);
}
function getBindingNameAndInstruction(binding) {
    let bindingName = binding.name;
    let instruction;
    // Check to see if this is an attr binding or a property binding
    const attrMatches = bindingName.match(ATTR_REGEX);
    if (attrMatches) {
        bindingName = attrMatches[1];
        instruction = R3.attribute;
    }
    else {
        if (binding.isAnimation) {
            bindingName = prepareSyntheticPropertyName(bindingName);
            // host bindings that have a synthetic property (e.g. @foo) should always be rendered
            // in the context of the component and not the parent. Therefore there is a special
            // compatibility instruction available for this purpose.
            instruction = R3.syntheticHostProperty;
        }
        else {
            instruction = R3.hostProperty;
        }
    }
    return { bindingName, instruction, isAttribute: !!attrMatches };
}
function createHostListeners(eventBindings, name) {
    const listeners = [];
    const syntheticListeners = [];
    const instructions = [];
    eventBindings.forEach(binding => {
        let bindingName = binding.name && sanitizeIdentifier(binding.name);
        const bindingFnName = binding.type === 1 /* Animation */ ?
            prepareSyntheticListenerFunctionName(bindingName, binding.targetOrPhase) :
            bindingName;
        const handlerName = name && bindingName ? `${name}_${bindingFnName}_HostBindingHandler` : null;
        const params = prepareEventListenerParameters(BoundEvent.fromParsedEvent(binding), handlerName);
        if (binding.type == 1 /* Animation */) {
            syntheticListeners.push(params);
        }
        else {
            listeners.push(params);
        }
    });
    if (syntheticListeners.length > 0) {
        instructions.push(chainedInstruction(R3.syntheticHostListener, syntheticListeners).toStmt());
    }
    if (listeners.length > 0) {
        instructions.push(chainedInstruction(R3.listener, listeners).toStmt());
    }
    return instructions;
}
const HOST_REG_EXP = /^(?:\[([^\]]+)\])|(?:\(([^\)]+)\))$/;
export function parseHostBindings(host) {
    const attributes = {};
    const listeners = {};
    const properties = {};
    const specialAttributes = {};
    for (const key of Object.keys(host)) {
        const value = host[key];
        const matches = key.match(HOST_REG_EXP);
        if (matches === null) {
            switch (key) {
                case 'class':
                    if (typeof value !== 'string') {
                        // TODO(alxhub): make this a diagnostic.
                        throw new Error(`Class binding must be string`);
                    }
                    specialAttributes.classAttr = value;
                    break;
                case 'style':
                    if (typeof value !== 'string') {
                        // TODO(alxhub): make this a diagnostic.
                        throw new Error(`Style binding must be string`);
                    }
                    specialAttributes.styleAttr = value;
                    break;
                default:
                    if (typeof value === 'string') {
                        attributes[key] = o.literal(value);
                    }
                    else {
                        attributes[key] = value;
                    }
            }
        }
        else if (matches[1 /* Binding */] != null) {
            if (typeof value !== 'string') {
                // TODO(alxhub): make this a diagnostic.
                throw new Error(`Property binding must be string`);
            }
            // synthetic properties (the ones that have a `@` as a prefix)
            // are still treated the same as regular properties. Therefore
            // there is no point in storing them in a separate map.
            properties[matches[1 /* Binding */]] = value;
        }
        else if (matches[2 /* Event */] != null) {
            if (typeof value !== 'string') {
                // TODO(alxhub): make this a diagnostic.
                throw new Error(`Event binding must be string`);
            }
            listeners[matches[2 /* Event */]] = value;
        }
    }
    return { attributes, listeners, properties, specialAttributes };
}
/**
 * Verifies host bindings and returns the list of errors (if any). Empty array indicates that a
 * given set of host bindings has no errors.
 *
 * @param bindings set of host bindings to verify.
 * @param sourceSpan source span where host bindings were defined.
 * @returns array of errors associated with a given set of host bindings.
 */
export function verifyHostBindings(bindings, sourceSpan) {
    // TODO: abstract out host bindings verification logic and use it instead of
    // creating events and properties ASTs to detect errors (FW-996)
    const bindingParser = makeBindingParser();
    bindingParser.createDirectiveHostEventAsts(bindings.listeners, sourceSpan);
    bindingParser.createBoundHostProperties(bindings.properties, sourceSpan);
    return bindingParser.errors;
}
function compileStyles(styles, selector, hostSelector) {
    const shadowCss = new ShadowCss();
    return styles.map(style => {
        return shadowCss.shimCssText(style, selector, hostSelector);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvcmVuZGVyMy92aWV3L2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDBDQUEwQyxDQUFDO0FBRWhGLE9BQU8sS0FBSyxJQUFJLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE9BQU8sS0FBSyxDQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDN0MsT0FBTyxFQUE4QixrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0MsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNqQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxXQUFXLElBQUksRUFBRSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEQsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLDRCQUE0QixFQUF3QixrQkFBa0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUdySSxPQUFPLEVBQUMsa0NBQWtDLEVBQUUsY0FBYyxFQUF5QixNQUFNLG1CQUFtQixDQUFDO0FBQzdHLE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUUscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BMLE9BQU8sRUFBQyxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGtCQUFr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QUFJLEVBQUU7WUFDbEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQzdCLHdDQUF3QztnQkFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2FBQ2pEO1lBQ0QsU0FBUyxDQUFDLE9BQU8sZUFBd0IsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUNwRDtLQUNGO0lBRUQsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLFFBQTRCLEVBQUUsVUFBMkI7SUFDM0QsNEVBQTRFO0lBQzVFLGdFQUFnRTtJQUNoRSxNQUFNLGFBQWEsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO0lBQzFDLGFBQWEsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzNFLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUM5QixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsTUFBZ0IsRUFBRSxRQUFnQixFQUFFLFlBQW9CO0lBQzdFLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7SUFDbEMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sU0FBVSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvbnZlcnRQcm9wZXJ0eUJpbmRpbmd9IGZyb20gJy4uLy4uL2NvbXBpbGVyX3V0aWwvZXhwcmVzc2lvbl9jb252ZXJ0ZXInO1xuaW1wb3J0IHtDb25zdGFudFBvb2x9IGZyb20gJy4uLy4uL2NvbnN0YW50X3Bvb2wnO1xuaW1wb3J0ICogYXMgY29yZSBmcm9tICcuLi8uLi9jb3JlJztcbmltcG9ydCB7QVNULCBQYXJzZWRFdmVudCwgUGFyc2VkRXZlbnRUeXBlLCBQYXJzZWRQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtQYXJzZUVycm9yLCBQYXJzZVNvdXJjZVNwYW4sIHNhbml0aXplSWRlbnRpZmllcn0gZnJvbSAnLi4vLi4vcGFyc2VfdXRpbCc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yfSBmcm9tICcuLi8uLi9zZWxlY3Rvcic7XG5pbXBvcnQge1NoYWRvd0Nzc30gZnJvbSAnLi4vLi4vc2hhZG93X2Nzcyc7XG5pbXBvcnQge0JpbmRpbmdQYXJzZXJ9IGZyb20gJy4uLy4uL3RlbXBsYXRlX3BhcnNlci9iaW5kaW5nX3BhcnNlcic7XG5pbXBvcnQge2Vycm9yfSBmcm9tICcuLi8uLi91dGlsJztcbmltcG9ydCB7Qm91bmRFdmVudH0gZnJvbSAnLi4vcjNfYXN0JztcbmltcG9ydCB7SWRlbnRpZmllcnMgYXMgUjN9IGZyb20gJy4uL3IzX2lkZW50aWZpZXJzJztcbmltcG9ydCB7cHJlcGFyZVN5bnRoZXRpY0xpc3RlbmVyRnVuY3Rpb25OYW1lLCBwcmVwYXJlU3ludGhldGljUHJvcGVydHlOYW1lLCBSM0NvbXBpbGVkRXhwcmVzc2lvbiwgdHlwZVdpdGhQYXJhbWV0ZXJzfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtEZWNsYXJhdGlvbkxpc3RFbWl0TW9kZSwgUjNDb21wb25lbnRNZXRhZGF0YSwgUjNEaXJlY3RpdmVNZXRhZGF0YSwgUjNIb3N0TWV0YWRhdGEsIFIzUXVlcnlNZXRhZGF0YX0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtNSU5fU1RZTElOR19CSU5ESU5HX1NMT1RTX1JFUVVJUkVELCBTdHlsaW5nQnVpbGRlciwgU3R5bGluZ0luc3RydWN0aW9uQ2FsbH0gZnJvbSAnLi9zdHlsaW5nX2J1aWxkZXInO1xuaW1wb3J0IHtCaW5kaW5nU2NvcGUsIG1ha2VCaW5kaW5nUGFyc2VyLCBwcmVwYXJlRXZlbnRMaXN0ZW5lclBhcmFtZXRlcnMsIHJlbmRlckZsYWdDaGVja0lmU3RtdCwgcmVzb2x2ZVNhbml0aXphdGlvbkZuLCBUZW1wbGF0ZURlZmluaXRpb25CdWlsZGVyLCBWYWx1ZUNvbnZlcnRlcn0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5pbXBvcnQge2FzTGl0ZXJhbCwgY2hhaW5lZEluc3RydWN0aW9uLCBjb25kaXRpb25hbGx5Q3JlYXRlTWFwT2JqZWN0TGl0ZXJhbCwgQ09OVEVYVF9OQU1FLCBEZWZpbml0aW9uTWFwLCBnZXRRdWVyeVByZWRpY2F0ZSwgUkVOREVSX0ZMQUdTLCBURU1QT1JBUllfTkFNRSwgdGVtcG9yYXJ5QWxsb2NhdG9yfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8vIFRoaXMgcmVnZXggbWF0Y2hlcyBhbnkgYmluZGluZyBuYW1lcyB0aGF0IGNvbnRhaW4gdGhlIFwiYXR0ci5cIiBwcmVmaXgsIGUuZy4gXCJhdHRyLnJlcXVpcmVkXCJcbi8vIElmIHRoZXJlIGlzIGEgbWF0Y2gsIHRoZSBmaXJzdCBtYXRjaGluZyBncm91cCB3aWxsIGNvbnRhaW4gdGhlIGF0dHJpYnV0ZSBuYW1lIHRvIGJpbmQuXG5jb25zdCBBVFRSX1JFR0VYID0gL2F0dHJcXC4oW15cXF1dKykvO1xuXG5cbmNvbnN0IENPTVBPTkVOVF9WQVJJQUJMRSA9ICclQ09NUCUnO1xuY29uc3QgSE9TVF9BVFRSID0gYF9uZ2hvc3QtJHtDT01QT05FTlRfVkFSSUFCTEV9YDtcbmNvbnN0IENPTlRFTlRfQVRUUiA9IGBfbmdjb250ZW50LSR7Q09NUE9ORU5UX1ZBUklBQkxFfWA7XG5cbmZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVGaWVsZHMoXG4gICAgbWV0YTogUjNEaXJlY3RpdmVNZXRhZGF0YSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsXG4gICAgYmluZGluZ1BhcnNlcjogQmluZGluZ1BhcnNlcik6IERlZmluaXRpb25NYXAge1xuICBjb25zdCBkZWZpbml0aW9uTWFwID0gbmV3IERlZmluaXRpb25NYXAoKTtcbiAgY29uc3Qgc2VsZWN0b3JzID0gY29yZS5wYXJzZVNlbGVjdG9yVG9SM1NlbGVjdG9yKG1ldGEuc2VsZWN0b3IpO1xuXG4gIC8vIGUuZy4gYHR5cGU6IE15RGlyZWN0aXZlYFxuICBkZWZpbml0aW9uTWFwLnNldCgndHlwZScsIG1ldGEuaW50ZXJuYWxUeXBlKTtcblxuICAvLyBlLmcuIGBzZWxlY3RvcnM6IFtbJycsICdzb21lRGlyJywgJyddXWBcbiAgaWYgKHNlbGVjdG9ycy5sZW5ndGggPiAwKSB7XG4gICAgZGVmaW5pdGlvbk1hcC5zZXQoJ3NlbGVjdG9ycycsIGFzTGl0ZXJhbChzZWxlY3RvcnMpKTtcbiAgfVxuXG4gIGlmIChtZXRhLnF1ZXJpZXMubGVuZ3RoID4gMCkge1xuICAgIC8vIGUuZy4gYGNvbnRlbnRRdWVyaWVzOiAocmYsIGN0eCwgZGlySW5kZXgpID0+IHsgLi4uIH1cbiAgICBkZWZpbml0aW9uTWFwLnNldChcbiAgICAgICAgJ2NvbnRlbnRRdWVyaWVzJywgY3JlYXRlQ29udGVudFF1ZXJpZXNGdW5jdGlvbihtZXRhLnF1ZXJpZXMsIGNvbnN0YW50UG9vbCwgbWV0YS5uYW1lKSk7XG4gIH1cblxuICBpZiAobWV0YS52aWV3UXVlcmllcy5sZW5ndGgpIHtcbiAgICBkZWZpbml0aW9uTWFwLnNldChcbiAgICAgICAgJ3ZpZXdRdWVyeScsIGNyZWF0ZVZpZXdRdWVyaWVzRnVuY3Rpb24obWV0YS52aWV3UXVlcmllcywgY29uc3RhbnRQb29sLCBtZXRhLm5hbWUpKTtcbiAgfVxuXG4gIC8vIGUuZy4gYGhvc3RCaW5kaW5nczogKHJmLCBjdHgpID0+IHsgLi4uIH1cbiAgZGVmaW5pdGlvbk1hcC5zZXQoXG4gICAgICAnaG9zdEJpbmRpbmdzJyxcbiAgICAgIGNyZWF0ZUhvc3RCaW5kaW5nc0Z1bmN0aW9uKFxuICAgICAgICAgIG1ldGEuaG9zdCwgbWV0YS50eXBlU291cmNlU3BhbiwgYmluZGluZ1BhcnNlciwgY29uc3RhbnRQb29sLCBtZXRhLnNlbGVjdG9yIHx8ICcnLFxuICAgICAgICAgIG1ldGEubmFtZSwgZGVmaW5pdGlvbk1hcCkpO1xuXG4gIC8vIGUuZyAnaW5wdXRzOiB7YTogJ2EnfWBcbiAgZGVmaW5pdGlvbk1hcC5zZXQoJ2lucHV0cycsIGNvbmRpdGlvbmFsbHlDcmVhdGVNYXBPYmplY3RMaXRlcmFsKG1ldGEuaW5wdXRzLCB0cnVlKSk7XG5cbiAgLy8gZS5nICdvdXRwdXRzOiB7YTogJ2EnfWBcbiAgZGVmaW5pdGlvbk1hcC5zZXQoJ291dHB1dHMnLCBjb25kaXRpb25hbGx5Q3JlYXRlTWFwT2JqZWN0TGl0ZXJhbChtZXRhLm91dHB1dHMpKTtcblxuICBpZiAobWV0YS5leHBvcnRBcyAhPT0gbnVsbCkge1xuICAgIGRlZmluaXRpb25NYXAuc2V0KCdleHBvcnRBcycsIG8ubGl0ZXJhbEFycihtZXRhLmV4cG9ydEFzLm1hcChlID0+IG8ubGl0ZXJhbChlKSkpKTtcbiAgfVxuXG4gIHJldHVybiBkZWZpbml0aW9uTWFwO1xufVxuXG4vKipcbiAqIEFkZCBmZWF0dXJlcyB0byB0aGUgZGVmaW5pdGlvbiBtYXAuXG4gKi9cbmZ1bmN0aW9uIGFkZEZlYXR1cmVzKGRlZmluaXRpb25NYXA6IERlZmluaXRpb25NYXAsIG1ldGE6IFIzRGlyZWN0aXZlTWV0YWRhdGF8UjNDb21wb25lbnRNZXRhZGF0YSkge1xuICAvLyBlLmcuIGBmZWF0dXJlczogW05nT25DaGFuZ2VzRmVhdHVyZV1gXG4gIGNvbnN0IGZlYXR1cmVzOiBvLkV4cHJlc3Npb25bXSA9IFtdO1xuXG4gIGNvbnN0IHByb3ZpZGVycyA9IG1ldGEucHJvdmlkZXJzO1xuICBjb25zdCB2aWV3UHJvdmlkZXJzID0gKG1ldGEgYXMgUjNDb21wb25lbnRNZXRhZGF0YSkudmlld1Byb3ZpZGVycztcbiAgaWYgKHByb3ZpZGVycyB8fCB2aWV3UHJvdmlkZXJzKSB7XG4gICAgY29uc3QgYXJncyA9IFtwcm92aWRlcnMgfHwgbmV3IG8uTGl0ZXJhbEFycmF5RXhwcihbXSldO1xuICAgIGlmICh2aWV3UHJvdmlkZXJzKSB7XG4gICAgICBhcmdzLnB1c2godmlld1Byb3ZpZGVycyk7XG4gICAgfVxuICAgIGZlYXR1cmVzLnB1c2goby5pbXBvcnRFeHByKFIzLlByb3ZpZGVyc0ZlYXR1cmUpLmNhbGxGbihhcmdzKSk7XG4gIH1cblxuICBpZiAobWV0YS51c2VzSW5oZXJpdGFuY2UpIHtcbiAgICBmZWF0dXJlcy5wdXNoKG8uaW1wb3J0RXhwcihSMy5Jbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUpKTtcbiAgfVxuICBpZiAobWV0YS5mdWxsSW5oZXJpdGFuY2UpIHtcbiAgICBmZWF0dXJlcy5wdXNoKG8uaW1wb3J0RXhwcihSMy5Db3B5RGVmaW5pdGlvbkZlYXR1cmUpKTtcbiAgfVxuICBpZiAobWV0YS5saWZlY3ljbGUudXNlc09uQ2hhbmdlcykge1xuICAgIGZlYXR1cmVzLnB1c2goby5pbXBvcnRFeHByKFIzLk5nT25DaGFuZ2VzRmVhdHVyZSkpO1xuICB9XG4gIGlmIChmZWF0dXJlcy5sZW5ndGgpIHtcbiAgICBkZWZpbml0aW9uTWFwLnNldCgnZmVhdHVyZXMnLCBvLmxpdGVyYWxBcnIoZmVhdHVyZXMpKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSBkaXJlY3RpdmUgZm9yIHRoZSByZW5kZXIzIHJ1bnRpbWUgYXMgZGVmaW5lZCBieSB0aGUgYFIzRGlyZWN0aXZlTWV0YWRhdGFgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZURpcmVjdGl2ZUZyb21NZXRhZGF0YShcbiAgICBtZXRhOiBSM0RpcmVjdGl2ZU1ldGFkYXRhLCBjb25zdGFudFBvb2w6IENvbnN0YW50UG9vbCxcbiAgICBiaW5kaW5nUGFyc2VyOiBCaW5kaW5nUGFyc2VyKTogUjNDb21waWxlZEV4cHJlc3Npb24ge1xuICBjb25zdCBkZWZpbml0aW9uTWFwID0gYmFzZURpcmVjdGl2ZUZpZWxkcyhtZXRhLCBjb25zdGFudFBvb2wsIGJpbmRpbmdQYXJzZXIpO1xuICBhZGRGZWF0dXJlcyhkZWZpbml0aW9uTWFwLCBtZXRhKTtcbiAgY29uc3QgZXhwcmVzc2lvbiA9XG4gICAgICBvLmltcG9ydEV4cHIoUjMuZGVmaW5lRGlyZWN0aXZlKS5jYWxsRm4oW2RlZmluaXRpb25NYXAudG9MaXRlcmFsTWFwKCldLCB1bmRlZmluZWQsIHRydWUpO1xuICBjb25zdCB0eXBlID0gY3JlYXRlRGlyZWN0aXZlVHlwZShtZXRhKTtcblxuICByZXR1cm4ge2V4cHJlc3Npb24sIHR5cGUsIHN0YXRlbWVudHM6IFtdfTtcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgY29tcG9uZW50IGZvciB0aGUgcmVuZGVyMyBydW50aW1lIGFzIGRlZmluZWQgYnkgdGhlIGBSM0NvbXBvbmVudE1ldGFkYXRhYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVDb21wb25lbnRGcm9tTWV0YWRhdGEoXG4gICAgbWV0YTogUjNDb21wb25lbnRNZXRhZGF0YSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsXG4gICAgYmluZGluZ1BhcnNlcjogQmluZGluZ1BhcnNlcik6IFIzQ29tcGlsZWRFeHByZXNzaW9uIHtcbiAgY29uc3QgZGVmaW5pdGlvbk1hcCA9IGJhc2VEaXJlY3RpdmVGaWVsZHMobWV0YSwgY29uc3RhbnRQb29sLCBiaW5kaW5nUGFyc2VyKTtcbiAgYWRkRmVhdHVyZXMoZGVmaW5pdGlvbk1hcCwgbWV0YSk7XG5cbiAgY29uc3Qgc2VsZWN0b3IgPSBtZXRhLnNlbGVjdG9yICYmIENzc1NlbGVjdG9yLnBhcnNlKG1ldGEuc2VsZWN0b3IpO1xuICBjb25zdCBmaXJzdFNlbGVjdG9yID0gc2VsZWN0b3IgJiYgc2VsZWN0b3JbMF07XG5cbiAgLy8gZS5nLiBgYXR0cjogW1wiY2xhc3NcIiwgXCIubXkuYXBwXCJdYFxuICAvLyBUaGlzIGlzIG9wdGlvbmFsIGFuIG9ubHkgaW5jbHVkZWQgaWYgdGhlIGZpcnN0IHNlbGVjdG9yIG9mIGEgY29tcG9uZW50IHNwZWNpZmllcyBhdHRyaWJ1dGVzLlxuICBpZiAoZmlyc3RTZWxlY3Rvcikge1xuICAgIGNvbnN0IHNlbGVjdG9yQXR0cmlidXRlcyA9IGZpcnN0U2VsZWN0b3IuZ2V0QXR0cnMoKTtcbiAgICBpZiAoc2VsZWN0b3JBdHRyaWJ1dGVzLmxlbmd0aCkge1xuICAgICAgZGVmaW5pdGlvbk1hcC5zZXQoXG4gICAgICAgICAgJ2F0dHJzJyxcbiAgICAgICAgICBjb25zdGFudFBvb2wuZ2V0Q29uc3RMaXRlcmFsKFxuICAgICAgICAgICAgICBvLmxpdGVyYWxBcnIoc2VsZWN0b3JBdHRyaWJ1dGVzLm1hcChcbiAgICAgICAgICAgICAgICAgIHZhbHVlID0+IHZhbHVlICE9IG51bGwgPyBvLmxpdGVyYWwodmFsdWUpIDogby5saXRlcmFsKHVuZGVmaW5lZCkpKSxcbiAgICAgICAgICAgICAgLyogZm9yY2VTaGFyZWQgKi8gdHJ1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGUuZy4gYHRlbXBsYXRlOiBmdW5jdGlvbiBNeUNvbXBvbmVudF9UZW1wbGF0ZShfY3R4LCBfY20pIHsuLi59YFxuICBjb25zdCB0ZW1wbGF0ZVR5cGVOYW1lID0gbWV0YS5uYW1lO1xuICBjb25zdCB0ZW1wbGF0ZU5hbWUgPSB0ZW1wbGF0ZVR5cGVOYW1lID8gYCR7dGVtcGxhdGVUeXBlTmFtZX1fVGVtcGxhdGVgIDogbnVsbDtcblxuICBjb25zdCBjaGFuZ2VEZXRlY3Rpb24gPSBtZXRhLmNoYW5nZURldGVjdGlvbjtcblxuICBjb25zdCB0ZW1wbGF0ZSA9IG1ldGEudGVtcGxhdGU7XG4gIGNvbnN0IHRlbXBsYXRlQnVpbGRlciA9IG5ldyBUZW1wbGF0ZURlZmluaXRpb25CdWlsZGVyKFxuICAgICAgY29uc3RhbnRQb29sLCBCaW5kaW5nU2NvcGUuY3JlYXRlUm9vdFNjb3BlKCksIDAsIHRlbXBsYXRlVHlwZU5hbWUsIG51bGwsIG51bGwsIHRlbXBsYXRlTmFtZSxcbiAgICAgIFIzLm5hbWVzcGFjZUhUTUwsIG1ldGEucmVsYXRpdmVDb250ZXh0RmlsZVBhdGgsIG1ldGEuaTE4blVzZUV4dGVybmFsSWRzKTtcblxuICBjb25zdCB0ZW1wbGF0ZUZ1bmN0aW9uRXhwcmVzc2lvbiA9IHRlbXBsYXRlQnVpbGRlci5idWlsZFRlbXBsYXRlRnVuY3Rpb24odGVtcGxhdGUubm9kZXMsIFtdKTtcblxuICAvLyBXZSBuZWVkIHRvIHByb3ZpZGUgdGhpcyBzbyB0aGF0IGR5bmFtaWNhbGx5IGdlbmVyYXRlZCBjb21wb25lbnRzIGtub3cgd2hhdFxuICAvLyBwcm9qZWN0ZWQgY29udGVudCBibG9ja3MgdG8gcGFzcyB0aHJvdWdoIHRvIHRoZSBjb21wb25lbnQgd2hlbiBpdCBpcyBpbnN0YW50aWF0ZWQuXG4gIGNvbnN0IG5nQ29udGVudFNlbGVjdG9ycyA9IHRlbXBsYXRlQnVpbGRlci5nZXROZ0NvbnRlbnRTZWxlY3RvcnMoKTtcbiAgaWYgKG5nQ29udGVudFNlbGVjdG9ycykge1xuICAgIGRlZmluaXRpb25NYXAuc2V0KCduZ0NvbnRlbnRTZWxlY3RvcnMnLCBuZ0NvbnRlbnRTZWxlY3RvcnMpO1xuICB9XG5cbiAgLy8gZS5nLiBgZGVjbHM6IDJgXG4gIGRlZmluaXRpb25NYXAuc2V0KCdkZWNscycsIG8ubGl0ZXJhbCh0ZW1wbGF0ZUJ1aWxkZXIuZ2V0Q29uc3RDb3VudCgpKSk7XG5cbiAgLy8gZS5nLiBgdmFyczogMmBcbiAgZGVmaW5pdGlvbk1hcC5zZXQoJ3ZhcnMnLCBvLmxpdGVyYWwodGVtcGxhdGVCdWlsZGVyLmdldFZhckNvdW50KCkpKTtcblxuICAvLyBHZW5lcmF0ZSBgY29uc3RzYCBzZWN0aW9uIG9mIENvbXBvbmVudERlZjpcbiAgLy8gLSBlaXRoZXIgYXMgYW4gYXJyYXk6XG4gIC8vICAgYGNvbnN0czogW1snb25lJywgJ3R3byddLCBbJ3RocmVlJywgJ2ZvdXInXV1gXG4gIC8vIC0gb3IgYXMgYSBmYWN0b3J5IGZ1bmN0aW9uIGluIGNhc2UgYWRkaXRpb25hbCBzdGF0ZW1lbnRzIGFyZSBwcmVzZW50ICh0byBzdXBwb3J0IGkxOG4pOlxuICAvLyAgIGBjb25zdHM6IGZ1bmN0aW9uKCkgeyB2YXIgaTE4bl8wOyBpZiAobmdJMThuQ2xvc3VyZU1vZGUpIHsuLi59IGVsc2Ugey4uLn0gcmV0dXJuIFtpMThuXzBdOyB9YFxuICBjb25zdCB7Y29uc3RFeHByZXNzaW9ucywgcHJlcGFyZVN0YXRlbWVudHN9ID0gdGVtcGxhdGVCdWlsZGVyLmdldENvbnN0cygpO1xuICBpZiAoY29uc3RFeHByZXNzaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgbGV0IGNvbnN0c0V4cHI6IG8uTGl0ZXJhbEFycmF5RXhwcnxvLkZ1bmN0aW9uRXhwciA9IG8ubGl0ZXJhbEFycihjb25zdEV4cHJlc3Npb25zKTtcbiAgICAvLyBQcmVwYXJlIHN0YXRlbWVudHMgYXJlIHByZXNlbnQgLSB0dXJuIGBjb25zdHNgIGludG8gYSBmdW5jdGlvbi5cbiAgICBpZiAocHJlcGFyZVN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3RzRXhwciA9IG8uZm4oW10sIFsuLi5wcmVwYXJlU3RhdGVtZW50cywgbmV3IG8uUmV0dXJuU3RhdGVtZW50KGNvbnN0c0V4cHIpXSk7XG4gICAgfVxuICAgIGRlZmluaXRpb25NYXAuc2V0KCdjb25zdHMnLCBjb25zdHNFeHByKTtcbiAgfVxuXG4gIGRlZmluaXRpb25NYXAuc2V0KCd0ZW1wbGF0ZScsIHRlbXBsYXRlRnVuY3Rpb25FeHByZXNzaW9uKTtcblxuICAvLyBlLmcuIGBkaXJlY3RpdmVzOiBbTXlEaXJlY3RpdmVdYFxuICBpZiAobWV0YS5kaXJlY3RpdmVzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBkaXJlY3RpdmVzTGlzdCA9IG8ubGl0ZXJhbEFycihtZXRhLmRpcmVjdGl2ZXMubWFwKGRpciA9PiBkaXIudHlwZSkpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZXNFeHByID0gY29tcGlsZURlY2xhcmF0aW9uTGlzdChkaXJlY3RpdmVzTGlzdCwgbWV0YS5kZWNsYXJhdGlvbkxpc3RFbWl0TW9kZSk7XG4gICAgZGVmaW5pdGlvbk1hcC5zZXQoJ2RpcmVjdGl2ZXMnLCBkaXJlY3RpdmVzRXhwcik7XG4gIH1cblxuICAvLyBlLmcuIGBwaXBlczogW015UGlwZV1gXG4gIGlmIChtZXRhLnBpcGVzLnNpemUgPiAwKSB7XG4gICAgY29uc3QgcGlwZXNMaXN0ID0gby5saXRlcmFsQXJyKEFycmF5LmZyb20obWV0YS5waXBlcy52YWx1ZXMoKSkpO1xuICAgIGNvbnN0IHBpcGVzRXhwciA9IGNvbXBpbGVEZWNsYXJhdGlvbkxpc3QocGlwZXNMaXN0LCBtZXRhLmRlY2xhcmF0aW9uTGlzdEVtaXRNb2RlKTtcbiAgICBkZWZpbml0aW9uTWFwLnNldCgncGlwZXMnLCBwaXBlc0V4cHIpO1xuICB9XG5cbiAgaWYgKG1ldGEuZW5jYXBzdWxhdGlvbiA9PT0gbnVsbCkge1xuICAgIG1ldGEuZW5jYXBzdWxhdGlvbiA9IGNvcmUuVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQ7XG4gIH1cblxuICAvLyBlLmcuIGBzdHlsZXM6IFtzdHIxLCBzdHIyXWBcbiAgaWYgKG1ldGEuc3R5bGVzICYmIG1ldGEuc3R5bGVzLmxlbmd0aCkge1xuICAgIGNvbnN0IHN0eWxlVmFsdWVzID0gbWV0YS5lbmNhcHN1bGF0aW9uID09IGNvcmUuVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQgP1xuICAgICAgICBjb21waWxlU3R5bGVzKG1ldGEuc3R5bGVzLCBDT05URU5UX0FUVFIsIEhPU1RfQVRUUikgOlxuICAgICAgICBtZXRhLnN0eWxlcztcbiAgICBjb25zdCBzdHJpbmdzID0gc3R5bGVWYWx1ZXMubWFwKHN0ciA9PiBjb25zdGFudFBvb2wuZ2V0Q29uc3RMaXRlcmFsKG8ubGl0ZXJhbChzdHIpKSk7XG4gICAgZGVmaW5pdGlvbk1hcC5zZXQoJ3N0eWxlcycsIG8ubGl0ZXJhbEFycihzdHJpbmdzKSk7XG4gIH0gZWxzZSBpZiAobWV0YS5lbmNhcHN1bGF0aW9uID09PSBjb3JlLlZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3R5bGUsIGRvbid0IGdlbmVyYXRlIGNzcyBzZWxlY3RvcnMgb24gZWxlbWVudHNcbiAgICBtZXRhLmVuY2Fwc3VsYXRpb24gPSBjb3JlLlZpZXdFbmNhcHN1bGF0aW9uLk5vbmU7XG4gIH1cblxuICAvLyBPbmx5IHNldCB2aWV3IGVuY2Fwc3VsYXRpb24gaWYgaXQncyBub3QgdGhlIGRlZmF1bHQgdmFsdWVcbiAgaWYgKG1ldGEuZW5jYXBzdWxhdGlvbiAhPT0gY29yZS5WaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCkge1xuICAgIGRlZmluaXRpb25NYXAuc2V0KCdlbmNhcHN1bGF0aW9uJywgby5saXRlcmFsKG1ldGEuZW5jYXBzdWxhdGlvbikpO1xuICB9XG5cbiAgLy8gZS5nLiBgYW5pbWF0aW9uOiBbdHJpZ2dlcignMTIzJywgW10pXWBcbiAgaWYgKG1ldGEuYW5pbWF0aW9ucyAhPT0gbnVsbCkge1xuICAgIGRlZmluaXRpb25NYXAuc2V0KFxuICAgICAgICAnZGF0YScsIG8ubGl0ZXJhbE1hcChbe2tleTogJ2FuaW1hdGlvbicsIHZhbHVlOiBtZXRhLmFuaW1hdGlvbnMsIHF1b3RlZDogZmFsc2V9XSkpO1xuICB9XG5cbiAgLy8gT25seSBzZXQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZmxhZyBpZiBpdCdzIGRlZmluZWQgYW5kIGl0J3Mgbm90IHRoZSBkZWZhdWx0LlxuICBpZiAoY2hhbmdlRGV0ZWN0aW9uICE9IG51bGwgJiYgY2hhbmdlRGV0ZWN0aW9uICE9PSBjb3JlLkNoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQpIHtcbiAgICBkZWZpbml0aW9uTWFwLnNldCgnY2hhbmdlRGV0ZWN0aW9uJywgby5saXRlcmFsKGNoYW5nZURldGVjdGlvbikpO1xuICB9XG5cbiAgY29uc3QgZXhwcmVzc2lvbiA9XG4gICAgICBvLmltcG9ydEV4cHIoUjMuZGVmaW5lQ29tcG9uZW50KS5jYWxsRm4oW2RlZmluaXRpb25NYXAudG9MaXRlcmFsTWFwKCldLCB1bmRlZmluZWQsIHRydWUpO1xuICBjb25zdCB0eXBlID0gY3JlYXRlQ29tcG9uZW50VHlwZShtZXRhKTtcblxuICByZXR1cm4ge2V4cHJlc3Npb24sIHR5cGUsIHN0YXRlbWVudHM6IFtdfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSB0eXBlIHNwZWNpZmljYXRpb24gZnJvbSB0aGUgY29tcG9uZW50IG1ldGEuIFRoaXMgdHlwZSBpcyBpbnNlcnRlZCBpbnRvIC5kLnRzIGZpbGVzXG4gKiB0byBiZSBjb25zdW1lZCBieSB1cHN0cmVhbSBjb21waWxhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21wb25lbnRUeXBlKG1ldGE6IFIzQ29tcG9uZW50TWV0YWRhdGEpOiBvLlR5cGUge1xuICBjb25zdCB0eXBlUGFyYW1zID0gY3JlYXRlRGlyZWN0aXZlVHlwZVBhcmFtcyhtZXRhKTtcbiAgdHlwZVBhcmFtcy5wdXNoKHN0cmluZ0FycmF5QXNUeXBlKG1ldGEudGVtcGxhdGUubmdDb250ZW50U2VsZWN0b3JzKSk7XG4gIHJldHVybiBvLmV4cHJlc3Npb25UeXBlKG8uaW1wb3J0RXhwcihSMy5Db21wb25lbnREZWNsYXJhdGlvbiwgdHlwZVBhcmFtcykpO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIHRoZSBhcnJheSBsaXRlcmFsIG9mIGRlY2xhcmF0aW9ucyBpbnRvIGFuIGV4cHJlc3Npb24gYWNjb3JkaW5nIHRvIHRoZSBwcm92aWRlZCBlbWl0XG4gKiBtb2RlLlxuICovXG5mdW5jdGlvbiBjb21waWxlRGVjbGFyYXRpb25MaXN0KFxuICAgIGxpc3Q6IG8uTGl0ZXJhbEFycmF5RXhwciwgbW9kZTogRGVjbGFyYXRpb25MaXN0RW1pdE1vZGUpOiBvLkV4cHJlc3Npb24ge1xuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlIERlY2xhcmF0aW9uTGlzdEVtaXRNb2RlLkRpcmVjdDpcbiAgICAgIC8vIGRpcmVjdGl2ZXM6IFtNeURpcl0sXG4gICAgICByZXR1cm4gbGlzdDtcbiAgICBjYXNlIERlY2xhcmF0aW9uTGlzdEVtaXRNb2RlLkNsb3N1cmU6XG4gICAgICAvLyBkaXJlY3RpdmVzOiBmdW5jdGlvbiAoKSB7IHJldHVybiBbTXlEaXJdOyB9XG4gICAgICByZXR1cm4gby5mbihbXSwgW25ldyBvLlJldHVyblN0YXRlbWVudChsaXN0KV0pO1xuICAgIGNhc2UgRGVjbGFyYXRpb25MaXN0RW1pdE1vZGUuQ2xvc3VyZVJlc29sdmVkOlxuICAgICAgLy8gZGlyZWN0aXZlczogZnVuY3Rpb24gKCkgeyByZXR1cm4gW015RGlyXS5tYXAobmcucmVzb2x2ZUZvcndhcmRSZWYpOyB9XG4gICAgICBjb25zdCByZXNvbHZlZExpc3QgPSBsaXN0LnByb3AoJ21hcCcpLmNhbGxGbihbby5pbXBvcnRFeHByKFIzLnJlc29sdmVGb3J3YXJkUmVmKV0pO1xuICAgICAgcmV0dXJuIG8uZm4oW10sIFtuZXcgby5SZXR1cm5TdGF0ZW1lbnQocmVzb2x2ZWRMaXN0KV0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVRdWVyeVBhcmFtcyhxdWVyeTogUjNRdWVyeU1ldGFkYXRhLCBjb25zdGFudFBvb2w6IENvbnN0YW50UG9vbCk6IG8uRXhwcmVzc2lvbltdIHtcbiAgY29uc3QgcGFyYW1ldGVycyA9IFtnZXRRdWVyeVByZWRpY2F0ZShxdWVyeSwgY29uc3RhbnRQb29sKSwgby5saXRlcmFsKHRvUXVlcnlGbGFncyhxdWVyeSkpXTtcbiAgaWYgKHF1ZXJ5LnJlYWQpIHtcbiAgICBwYXJhbWV0ZXJzLnB1c2gocXVlcnkucmVhZCk7XG4gIH1cbiAgcmV0dXJuIHBhcmFtZXRlcnM7XG59XG5cbi8qKlxuICogQSBzZXQgb2YgZmxhZ3MgdG8gYmUgdXNlZCB3aXRoIFF1ZXJpZXMuXG4gKlxuICogTk9URTogRW5zdXJlIGNoYW5nZXMgaGVyZSBhcmUgaW4gc3luYyB3aXRoIGBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHNgXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFF1ZXJ5RmxhZ3Mge1xuICAvKipcbiAgICogTm8gZmxhZ3NcbiAgICovXG4gIG5vbmUgPSAwYjAwMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBxdWVyeSBzaG91bGQgZGVzY2VuZCBpbnRvIGNoaWxkcmVuLlxuICAgKi9cbiAgZGVzY2VuZGFudHMgPSAwYjAwMDEsXG5cbiAgLyoqXG4gICAqIFRoZSBxdWVyeSBjYW4gYmUgY29tcHV0ZWQgc3RhdGljYWxseSBhbmQgaGVuY2UgY2FuIGJlIGFzc2lnbmVkIGVhZ2VybHkuXG4gICAqXG4gICAqIE5PVEU6IEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgICovXG4gIGlzU3RhdGljID0gMGIwMDEwLFxuXG4gIC8qKlxuICAgKiBJZiB0aGUgYFF1ZXJ5TGlzdGAgc2hvdWxkIGZpcmUgY2hhbmdlIGV2ZW50IG9ubHkgaWYgYWN0dWFsIGNoYW5nZSB0byBxdWVyeSB3YXMgY29tcHV0ZWQgKHZzIG9sZFxuICAgKiBiZWhhdmlvciB3aGVyZSB0aGUgY2hhbmdlIHdhcyBmaXJlZCB3aGVuZXZlciB0aGUgcXVlcnkgd2FzIHJlY29tcHV0ZWQsIGV2ZW4gaWYgdGhlIHJlY29tcHV0ZWRcbiAgICogcXVlcnkgcmVzdWx0ZWQgaW4gdGhlIHNhbWUgbGlzdC4pXG4gICAqL1xuICBlbWl0RGlzdGluY3RDaGFuZ2VzT25seSA9IDBiMDEwMCxcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIHF1ZXJ5IGZsYWdzIGludG8gYFRRdWVyeUZsYWdzYCB0eXBlIGluIHBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9xdWVyeS50c1xuICogQHBhcmFtIHF1ZXJ5XG4gKi9cbmZ1bmN0aW9uIHRvUXVlcnlGbGFncyhxdWVyeTogUjNRdWVyeU1ldGFkYXRhKTogbnVtYmVyIHtcbiAgcmV0dXJuIChxdWVyeS5kZXNjZW5kYW50cyA/IFF1ZXJ5RmxhZ3MuZGVzY2VuZGFudHMgOiBRdWVyeUZsYWdzLm5vbmUpIHxcbiAgICAgIChxdWVyeS5zdGF0aWMgPyBRdWVyeUZsYWdzLmlzU3RhdGljIDogUXVlcnlGbGFncy5ub25lKSB8XG4gICAgICAocXVlcnkuZW1pdERpc3RpbmN0Q2hhbmdlc09ubHkgPyBRdWVyeUZsYWdzLmVtaXREaXN0aW5jdENoYW5nZXNPbmx5IDogUXVlcnlGbGFncy5ub25lKTtcbn1cblxuZnVuY3Rpb24gY29udmVydEF0dHJpYnV0ZXNUb0V4cHJlc3Npb25zKGF0dHJpYnV0ZXM6IHtbbmFtZTogc3RyaW5nXTogby5FeHByZXNzaW9ufSk6XG4gICAgby5FeHByZXNzaW9uW10ge1xuICBjb25zdCB2YWx1ZXM6IG8uRXhwcmVzc2lvbltdID0gW107XG4gIGZvciAobGV0IGtleSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhdHRyaWJ1dGVzKSkge1xuICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1trZXldO1xuICAgIHZhbHVlcy5wdXNoKG8ubGl0ZXJhbChrZXkpLCB2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlcztcbn1cblxuLy8gRGVmaW5lIGFuZCB1cGRhdGUgYW55IGNvbnRlbnQgcXVlcmllc1xuZnVuY3Rpb24gY3JlYXRlQ29udGVudFF1ZXJpZXNGdW5jdGlvbihcbiAgICBxdWVyaWVzOiBSM1F1ZXJ5TWV0YWRhdGFbXSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsIG5hbWU/OiBzdHJpbmcpOiBvLkV4cHJlc3Npb24ge1xuICBjb25zdCBjcmVhdGVTdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG4gIGNvbnN0IHVwZGF0ZVN0YXRlbWVudHM6IG8uU3RhdGVtZW50W10gPSBbXTtcbiAgY29uc3QgdGVtcEFsbG9jYXRvciA9IHRlbXBvcmFyeUFsbG9jYXRvcih1cGRhdGVTdGF0ZW1lbnRzLCBURU1QT1JBUllfTkFNRSk7XG5cbiAgZm9yIChjb25zdCBxdWVyeSBvZiBxdWVyaWVzKSB7XG4gICAgLy8gY3JlYXRpb24sIGUuZy4gcjMuY29udGVudFF1ZXJ5KGRpckluZGV4LCBzb21lUHJlZGljYXRlLCB0cnVlLCBudWxsKTtcbiAgICBjcmVhdGVTdGF0ZW1lbnRzLnB1c2goXG4gICAgICAgIG8uaW1wb3J0RXhwcihSMy5jb250ZW50UXVlcnkpXG4gICAgICAgICAgICAuY2FsbEZuKFtvLnZhcmlhYmxlKCdkaXJJbmRleCcpLCAuLi5wcmVwYXJlUXVlcnlQYXJhbXMocXVlcnksIGNvbnN0YW50UG9vbCkgYXMgYW55XSlcbiAgICAgICAgICAgIC50b1N0bXQoKSk7XG5cbiAgICAvLyB1cGRhdGUsIGUuZy4gKHIzLnF1ZXJ5UmVmcmVzaCh0bXAgPSByMy5sb2FkUXVlcnkoKSkgJiYgKGN0eC5zb21lRGlyID0gdG1wKSk7XG4gICAgY29uc3QgdGVtcG9yYXJ5ID0gdGVtcEFsbG9jYXRvcigpO1xuICAgIGNvbnN0IGdldFF1ZXJ5TGlzdCA9IG8uaW1wb3J0RXhwcihSMy5sb2FkUXVlcnkpLmNhbGxGbihbXSk7XG4gICAgY29uc3QgcmVmcmVzaCA9IG8uaW1wb3J0RXhwcihSMy5xdWVyeVJlZnJlc2gpLmNhbGxGbihbdGVtcG9yYXJ5LnNldChnZXRRdWVyeUxpc3QpXSk7XG4gICAgY29uc3QgdXBkYXRlRGlyZWN0aXZlID0gby52YXJpYWJsZShDT05URVhUX05BTUUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wcm9wKHF1ZXJ5LnByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldChxdWVyeS5maXJzdCA/IHRlbXBvcmFyeS5wcm9wKCdmaXJzdCcpIDogdGVtcG9yYXJ5KTtcbiAgICB1cGRhdGVTdGF0ZW1lbnRzLnB1c2gocmVmcmVzaC5hbmQodXBkYXRlRGlyZWN0aXZlKS50b1N0bXQoKSk7XG4gIH1cblxuICBjb25zdCBjb250ZW50UXVlcmllc0ZuTmFtZSA9IG5hbWUgPyBgJHtuYW1lfV9Db250ZW50UXVlcmllc2AgOiBudWxsO1xuICByZXR1cm4gby5mbihcbiAgICAgIFtcbiAgICAgICAgbmV3IG8uRm5QYXJhbShSRU5ERVJfRkxBR1MsIG8uTlVNQkVSX1RZUEUpLCBuZXcgby5GblBhcmFtKENPTlRFWFRfTkFNRSwgbnVsbCksXG4gICAgICAgIG5ldyBvLkZuUGFyYW0oJ2RpckluZGV4JywgbnVsbClcbiAgICAgIF0sXG4gICAgICBbXG4gICAgICAgIHJlbmRlckZsYWdDaGVja0lmU3RtdChjb3JlLlJlbmRlckZsYWdzLkNyZWF0ZSwgY3JlYXRlU3RhdGVtZW50cyksXG4gICAgICAgIHJlbmRlckZsYWdDaGVja0lmU3RtdChjb3JlLlJlbmRlckZsYWdzLlVwZGF0ZSwgdXBkYXRlU3RhdGVtZW50cylcbiAgICAgIF0sXG4gICAgICBvLklORkVSUkVEX1RZUEUsIG51bGwsIGNvbnRlbnRRdWVyaWVzRm5OYW1lKTtcbn1cblxuZnVuY3Rpb24gc3RyaW5nQXNUeXBlKHN0cjogc3RyaW5nKTogby5UeXBlIHtcbiAgcmV0dXJuIG8uZXhwcmVzc2lvblR5cGUoby5saXRlcmFsKHN0cikpO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdNYXBBc1R5cGUobWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfHN0cmluZ1tdfSk6IG8uVHlwZSB7XG4gIGNvbnN0IG1hcFZhbHVlcyA9IE9iamVjdC5rZXlzKG1hcCkubWFwKGtleSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBBcnJheS5pc0FycmF5KG1hcFtrZXldKSA/IG1hcFtrZXldWzBdIDogbWFwW2tleV07XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleSxcbiAgICAgIHZhbHVlOiBvLmxpdGVyYWwodmFsdWUpLFxuICAgICAgcXVvdGVkOiB0cnVlLFxuICAgIH07XG4gIH0pO1xuICByZXR1cm4gby5leHByZXNzaW9uVHlwZShvLmxpdGVyYWxNYXAobWFwVmFsdWVzKSk7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ0FycmF5QXNUeXBlKGFycjogUmVhZG9ubHlBcnJheTxzdHJpbmd8bnVsbD4pOiBvLlR5cGUge1xuICByZXR1cm4gYXJyLmxlbmd0aCA+IDAgPyBvLmV4cHJlc3Npb25UeXBlKG8ubGl0ZXJhbEFycihhcnIubWFwKHZhbHVlID0+IG8ubGl0ZXJhbCh2YWx1ZSkpKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICBvLk5PTkVfVFlQRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZVR5cGVQYXJhbXMobWV0YTogUjNEaXJlY3RpdmVNZXRhZGF0YSk6IG8uVHlwZVtdIHtcbiAgLy8gT24gdGhlIHR5cGUgc2lkZSwgcmVtb3ZlIG5ld2xpbmVzIGZyb20gdGhlIHNlbGVjdG9yIGFzIGl0IHdpbGwgbmVlZCB0byBmaXQgaW50byBhIFR5cGVTY3JpcHRcbiAgLy8gc3RyaW5nIGxpdGVyYWwsIHdoaWNoIG11c3QgYmUgb24gb25lIGxpbmUuXG4gIGNvbnN0IHNlbGVjdG9yRm9yVHlwZSA9IG1ldGEuc2VsZWN0b3IgIT09IG51bGwgPyBtZXRhLnNlbGVjdG9yLnJlcGxhY2UoL1xcbi9nLCAnJykgOiBudWxsO1xuXG4gIHJldHVybiBbXG4gICAgdHlwZVdpdGhQYXJhbWV0ZXJzKG1ldGEudHlwZS50eXBlLCBtZXRhLnR5cGVBcmd1bWVudENvdW50KSxcbiAgICBzZWxlY3RvckZvclR5cGUgIT09IG51bGwgPyBzdHJpbmdBc1R5cGUoc2VsZWN0b3JGb3JUeXBlKSA6IG8uTk9ORV9UWVBFLFxuICAgIG1ldGEuZXhwb3J0QXMgIT09IG51bGwgPyBzdHJpbmdBcnJheUFzVHlwZShtZXRhLmV4cG9ydEFzKSA6IG8uTk9ORV9UWVBFLFxuICAgIHN0cmluZ01hcEFzVHlwZShtZXRhLmlucHV0cyksXG4gICAgc3RyaW5nTWFwQXNUeXBlKG1ldGEub3V0cHV0cyksXG4gICAgc3RyaW5nQXJyYXlBc1R5cGUobWV0YS5xdWVyaWVzLm1hcChxID0+IHEucHJvcGVydHlOYW1lKSksXG4gIF07XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgdHlwZSBzcGVjaWZpY2F0aW9uIGZyb20gdGhlIGRpcmVjdGl2ZSBtZXRhLiBUaGlzIHR5cGUgaXMgaW5zZXJ0ZWQgaW50byAuZC50cyBmaWxlc1xuICogdG8gYmUgY29uc3VtZWQgYnkgdXBzdHJlYW0gY29tcGlsYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlVHlwZShtZXRhOiBSM0RpcmVjdGl2ZU1ldGFkYXRhKTogby5UeXBlIHtcbiAgY29uc3QgdHlwZVBhcmFtcyA9IGNyZWF0ZURpcmVjdGl2ZVR5cGVQYXJhbXMobWV0YSk7XG4gIHJldHVybiBvLmV4cHJlc3Npb25UeXBlKG8uaW1wb3J0RXhwcihSMy5EaXJlY3RpdmVEZWNsYXJhdGlvbiwgdHlwZVBhcmFtcykpO1xufVxuXG4vLyBEZWZpbmUgYW5kIHVwZGF0ZSBhbnkgdmlldyBxdWVyaWVzXG5mdW5jdGlvbiBjcmVhdGVWaWV3UXVlcmllc0Z1bmN0aW9uKFxuICAgIHZpZXdRdWVyaWVzOiBSM1F1ZXJ5TWV0YWRhdGFbXSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsIG5hbWU/OiBzdHJpbmcpOiBvLkV4cHJlc3Npb24ge1xuICBjb25zdCBjcmVhdGVTdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG4gIGNvbnN0IHVwZGF0ZVN0YXRlbWVudHM6IG8uU3RhdGVtZW50W10gPSBbXTtcbiAgY29uc3QgdGVtcEFsbG9jYXRvciA9IHRlbXBvcmFyeUFsbG9jYXRvcih1cGRhdGVTdGF0ZW1lbnRzLCBURU1QT1JBUllfTkFNRSk7XG5cbiAgdmlld1F1ZXJpZXMuZm9yRWFjaCgocXVlcnk6IFIzUXVlcnlNZXRhZGF0YSkgPT4ge1xuICAgIC8vIGNyZWF0aW9uLCBlLmcuIHIzLnZpZXdRdWVyeShzb21lUHJlZGljYXRlLCB0cnVlKTtcbiAgICBjb25zdCBxdWVyeURlZmluaXRpb24gPVxuICAgICAgICBvLmltcG9ydEV4cHIoUjMudmlld1F1ZXJ5KS5jYWxsRm4ocHJlcGFyZVF1ZXJ5UGFyYW1zKHF1ZXJ5LCBjb25zdGFudFBvb2wpKTtcbiAgICBjcmVhdGVTdGF0ZW1lbnRzLnB1c2gocXVlcnlEZWZpbml0aW9uLnRvU3RtdCgpKTtcblxuICAgIC8vIHVwZGF0ZSwgZS5nLiAocjMucXVlcnlSZWZyZXNoKHRtcCA9IHIzLmxvYWRRdWVyeSgpKSAmJiAoY3R4LnNvbWVEaXIgPSB0bXApKTtcbiAgICBjb25zdCB0ZW1wb3JhcnkgPSB0ZW1wQWxsb2NhdG9yKCk7XG4gICAgY29uc3QgZ2V0UXVlcnlMaXN0ID0gby5pbXBvcnRFeHByKFIzLmxvYWRRdWVyeSkuY2FsbEZuKFtdKTtcbiAgICBjb25zdCByZWZyZXNoID0gby5pbXBvcnRFeHByKFIzLnF1ZXJ5UmVmcmVzaCkuY2FsbEZuKFt0ZW1wb3Jhcnkuc2V0KGdldFF1ZXJ5TGlzdCldKTtcbiAgICBjb25zdCB1cGRhdGVEaXJlY3RpdmUgPSBvLnZhcmlhYmxlKENPTlRFWFRfTkFNRSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnByb3AocXVlcnkucHJvcGVydHlOYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KHF1ZXJ5LmZpcnN0ID8gdGVtcG9yYXJ5LnByb3AoJ2ZpcnN0JykgOiB0ZW1wb3JhcnkpO1xuICAgIHVwZGF0ZVN0YXRlbWVudHMucHVzaChyZWZyZXNoLmFuZCh1cGRhdGVEaXJlY3RpdmUpLnRvU3RtdCgpKTtcbiAgfSk7XG5cbiAgY29uc3Qgdmlld1F1ZXJ5Rm5OYW1lID0gbmFtZSA/IGAke25hbWV9X1F1ZXJ5YCA6IG51bGw7XG4gIHJldHVybiBvLmZuKFxuICAgICAgW25ldyBvLkZuUGFyYW0oUkVOREVSX0ZMQUdTLCBvLk5VTUJFUl9UWVBFKSwgbmV3IG8uRm5QYXJhbShDT05URVhUX05BTUUsIG51bGwpXSxcbiAgICAgIFtcbiAgICAgICAgcmVuZGVyRmxhZ0NoZWNrSWZTdG10KGNvcmUuUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjcmVhdGVTdGF0ZW1lbnRzKSxcbiAgICAgICAgcmVuZGVyRmxhZ0NoZWNrSWZTdG10KGNvcmUuUmVuZGVyRmxhZ3MuVXBkYXRlLCB1cGRhdGVTdGF0ZW1lbnRzKVxuICAgICAgXSxcbiAgICAgIG8uSU5GRVJSRURfVFlQRSwgbnVsbCwgdmlld1F1ZXJ5Rm5OYW1lKTtcbn1cblxuLy8gUmV0dXJuIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uIG9yIG51bGwgaWYgb25lIGlzIG5vdCBuZWNlc3NhcnkuXG5mdW5jdGlvbiBjcmVhdGVIb3N0QmluZGluZ3NGdW5jdGlvbihcbiAgICBob3N0QmluZGluZ3NNZXRhZGF0YTogUjNIb3N0TWV0YWRhdGEsIHR5cGVTb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sXG4gICAgYmluZGluZ1BhcnNlcjogQmluZGluZ1BhcnNlciwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsIHNlbGVjdG9yOiBzdHJpbmcsIG5hbWU6IHN0cmluZyxcbiAgICBkZWZpbml0aW9uTWFwOiBEZWZpbml0aW9uTWFwKTogby5FeHByZXNzaW9ufG51bGwge1xuICBjb25zdCBiaW5kaW5nQ29udGV4dCA9IG8udmFyaWFibGUoQ09OVEVYVF9OQU1FKTtcbiAgY29uc3Qgc3R5bGVCdWlsZGVyID0gbmV3IFN0eWxpbmdCdWlsZGVyKGJpbmRpbmdDb250ZXh0KTtcblxuICBjb25zdCB7c3R5bGVBdHRyLCBjbGFzc0F0dHJ9ID0gaG9zdEJpbmRpbmdzTWV0YWRhdGEuc3BlY2lhbEF0dHJpYnV0ZXM7XG4gIGlmIChzdHlsZUF0dHIgIT09IHVuZGVmaW5lZCkge1xuICAgIHN0eWxlQnVpbGRlci5yZWdpc3RlclN0eWxlQXR0cihzdHlsZUF0dHIpO1xuICB9XG4gIGlmIChjbGFzc0F0dHIgIT09IHVuZGVmaW5lZCkge1xuICAgIHN0eWxlQnVpbGRlci5yZWdpc3RlckNsYXNzQXR0cihjbGFzc0F0dHIpO1xuICB9XG5cbiAgY29uc3QgY3JlYXRlU3RhdGVtZW50czogby5TdGF0ZW1lbnRbXSA9IFtdO1xuICBjb25zdCB1cGRhdGVTdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdTb3VyY2VTcGFuID0gdHlwZVNvdXJjZVNwYW47XG5cbiAgLy8gQ2FsY3VsYXRlIGhvc3QgZXZlbnQgYmluZGluZ3NcbiAgY29uc3QgZXZlbnRCaW5kaW5ncyA9IGJpbmRpbmdQYXJzZXIuY3JlYXRlRGlyZWN0aXZlSG9zdEV2ZW50QXN0cyhcbiAgICAgIGhvc3RCaW5kaW5nc01ldGFkYXRhLmxpc3RlbmVycywgaG9zdEJpbmRpbmdTb3VyY2VTcGFuKTtcbiAgaWYgKGV2ZW50QmluZGluZ3MgJiYgZXZlbnRCaW5kaW5ncy5sZW5ndGgpIHtcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBjcmVhdGVIb3N0TGlzdGVuZXJzKGV2ZW50QmluZGluZ3MsIG5hbWUpO1xuICAgIGNyZWF0ZVN0YXRlbWVudHMucHVzaCguLi5saXN0ZW5lcnMpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBob3N0IHByb3BlcnR5IGJpbmRpbmdzXG4gIGNvbnN0IGJpbmRpbmdzID0gYmluZGluZ1BhcnNlci5jcmVhdGVCb3VuZEhvc3RQcm9wZXJ0aWVzKFxuICAgICAgaG9zdEJpbmRpbmdzTWV0YWRhdGEucHJvcGVydGllcywgaG9zdEJpbmRpbmdTb3VyY2VTcGFuKTtcbiAgY29uc3QgYWxsT3RoZXJCaW5kaW5nczogUGFyc2VkUHJvcGVydHlbXSA9IFtdO1xuXG4gIC8vIFdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSB0b3RhbCBhbW91bnQgb2YgYmluZGluZyBzbG90cyByZXF1aXJlZCBieVxuICAvLyBhbGwgdGhlIGluc3RydWN0aW9ucyB0b2dldGhlciBiZWZvcmUgYW55IHZhbHVlIGNvbnZlcnNpb25zIGhhcHBlbi5cbiAgLy8gVmFsdWUgY29udmVyc2lvbnMgbWF5IHJlcXVpcmUgYWRkaXRpb25hbCBzbG90cyBmb3IgaW50ZXJwb2xhdGlvbiBhbmRcbiAgLy8gYmluZGluZ3Mgd2l0aCBwaXBlcy4gVGhlc2UgY2FsY3VsYXRlcyBoYXBwZW4gYWZ0ZXIgdGhpcyBibG9jay5cbiAgbGV0IHRvdGFsSG9zdFZhcnNDb3VudCA9IDA7XG4gIGJpbmRpbmdzICYmIGJpbmRpbmdzLmZvckVhY2goKGJpbmRpbmc6IFBhcnNlZFByb3BlcnR5KSA9PiB7XG4gICAgY29uc3Qgc3R5bGluZ0lucHV0V2FzU2V0ID0gc3R5bGVCdWlsZGVyLnJlZ2lzdGVySW5wdXRCYXNlZE9uTmFtZShcbiAgICAgICAgYmluZGluZy5uYW1lLCBiaW5kaW5nLmV4cHJlc3Npb24sIGhvc3RCaW5kaW5nU291cmNlU3Bhbik7XG4gICAgaWYgKHN0eWxpbmdJbnB1dFdhc1NldCkge1xuICAgICAgdG90YWxIb3N0VmFyc0NvdW50ICs9IE1JTl9TVFlMSU5HX0JJTkRJTkdfU0xPVFNfUkVRVUlSRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFsbE90aGVyQmluZGluZ3MucHVzaChiaW5kaW5nKTtcbiAgICAgIHRvdGFsSG9zdFZhcnNDb3VudCsrO1xuICAgIH1cbiAgfSk7XG5cbiAgbGV0IHZhbHVlQ29udmVydGVyOiBWYWx1ZUNvbnZlcnRlcjtcbiAgY29uc3QgZ2V0VmFsdWVDb252ZXJ0ZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF2YWx1ZUNvbnZlcnRlcikge1xuICAgICAgY29uc3QgaG9zdFZhcnNDb3VudEZuID0gKG51bVNsb3RzOiBudW1iZXIpOiBudW1iZXIgPT4ge1xuICAgICAgICBjb25zdCBvcmlnaW5hbFZhcnNDb3VudCA9IHRvdGFsSG9zdFZhcnNDb3VudDtcbiAgICAgICAgdG90YWxIb3N0VmFyc0NvdW50ICs9IG51bVNsb3RzO1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxWYXJzQ291bnQ7XG4gICAgICB9O1xuICAgICAgdmFsdWVDb252ZXJ0ZXIgPSBuZXcgVmFsdWVDb252ZXJ0ZXIoXG4gICAgICAgICAgY29uc3RhbnRQb29sLFxuICAgICAgICAgICgpID0+IGVycm9yKCdVbmV4cGVjdGVkIG5vZGUnKSwgIC8vIG5ldyBub2RlcyBhcmUgaWxsZWdhbCBoZXJlXG4gICAgICAgICAgaG9zdFZhcnNDb3VudEZuLFxuICAgICAgICAgICgpID0+IGVycm9yKCdVbmV4cGVjdGVkIHBpcGUnKSk7ICAvLyBwaXBlcyBhcmUgaWxsZWdhbCBoZXJlXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZUNvbnZlcnRlcjtcbiAgfTtcblxuICBjb25zdCBwcm9wZXJ0eUJpbmRpbmdzOiBvLkV4cHJlc3Npb25bXVtdID0gW107XG4gIGNvbnN0IGF0dHJpYnV0ZUJpbmRpbmdzOiBvLkV4cHJlc3Npb25bXVtdID0gW107XG4gIGNvbnN0IHN5bnRoZXRpY0hvc3RCaW5kaW5nczogby5FeHByZXNzaW9uW11bXSA9IFtdO1xuICBhbGxPdGhlckJpbmRpbmdzLmZvckVhY2goKGJpbmRpbmc6IFBhcnNlZFByb3BlcnR5KSA9PiB7XG4gICAgLy8gcmVzb2x2ZSBsaXRlcmFsIGFycmF5cyBhbmQgbGl0ZXJhbCBvYmplY3RzXG4gICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nLmV4cHJlc3Npb24udmlzaXQoZ2V0VmFsdWVDb252ZXJ0ZXIoKSk7XG4gICAgY29uc3QgYmluZGluZ0V4cHIgPSBiaW5kaW5nRm4oYmluZGluZ0NvbnRleHQsIHZhbHVlKTtcblxuICAgIGNvbnN0IHtiaW5kaW5nTmFtZSwgaW5zdHJ1Y3Rpb24sIGlzQXR0cmlidXRlfSA9IGdldEJpbmRpbmdOYW1lQW5kSW5zdHJ1Y3Rpb24oYmluZGluZyk7XG5cbiAgICBjb25zdCBzZWN1cml0eUNvbnRleHRzID1cbiAgICAgICAgYmluZGluZ1BhcnNlci5jYWxjUG9zc2libGVTZWN1cml0eUNvbnRleHRzKHNlbGVjdG9yLCBiaW5kaW5nTmFtZSwgaXNBdHRyaWJ1dGUpXG4gICAgICAgICAgICAuZmlsdGVyKGNvbnRleHQgPT4gY29udGV4dCAhPT0gY29yZS5TZWN1cml0eUNvbnRleHQuTk9ORSk7XG5cbiAgICBsZXQgc2FuaXRpemVyRm46IG8uRXh0ZXJuYWxFeHByfG51bGwgPSBudWxsO1xuICAgIGlmIChzZWN1cml0eUNvbnRleHRzLmxlbmd0aCkge1xuICAgICAgaWYgKHNlY3VyaXR5Q29udGV4dHMubGVuZ3RoID09PSAyICYmXG4gICAgICAgICAgc2VjdXJpdHlDb250ZXh0cy5pbmRleE9mKGNvcmUuU2VjdXJpdHlDb250ZXh0LlVSTCkgPiAtMSAmJlxuICAgICAgICAgIHNlY3VyaXR5Q29udGV4dHMuaW5kZXhPZihjb3JlLlNlY3VyaXR5Q29udGV4dC5SRVNPVVJDRV9VUkwpID4gLTEpIHtcbiAgICAgICAgLy8gU3BlY2lhbCBjYXNlIGZvciBzb21lIFVSTCBhdHRyaWJ1dGVzIChzdWNoIGFzIFwic3JjXCIgYW5kIFwiaHJlZlwiKSB0aGF0IG1heSBiZSBhIHBhcnRcbiAgICAgICAgLy8gb2YgZGlmZmVyZW50IHNlY3VyaXR5IGNvbnRleHRzLiBJbiB0aGlzIGNhc2Ugd2UgdXNlIHNwZWNpYWwgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIGFuZFxuICAgICAgICAvLyBzZWxlY3QgdGhlIGFjdHVhbCBzYW5pdGl6ZXIgYXQgcnVudGltZSBiYXNlZCBvbiBhIHRhZyBuYW1lIHRoYXQgaXMgcHJvdmlkZWQgd2hpbGVcbiAgICAgICAgLy8gaW52b2tpbmcgc2FuaXRpemF0aW9uIGZ1bmN0aW9uLlxuICAgICAgICBzYW5pdGl6ZXJGbiA9IG8uaW1wb3J0RXhwcihSMy5zYW5pdGl6ZVVybE9yUmVzb3VyY2VVcmwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2FuaXRpemVyRm4gPSByZXNvbHZlU2FuaXRpemF0aW9uRm4oc2VjdXJpdHlDb250ZXh0c1swXSwgaXNBdHRyaWJ1dGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBpbnN0cnVjdGlvblBhcmFtcyA9IFtvLmxpdGVyYWwoYmluZGluZ05hbWUpLCBiaW5kaW5nRXhwci5jdXJyVmFsRXhwcl07XG4gICAgaWYgKHNhbml0aXplckZuKSB7XG4gICAgICBpbnN0cnVjdGlvblBhcmFtcy5wdXNoKHNhbml0aXplckZuKTtcbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZW1lbnRzLnB1c2goLi4uYmluZGluZ0V4cHIuc3RtdHMpO1xuXG4gICAgaWYgKGluc3RydWN0aW9uID09PSBSMy5ob3N0UHJvcGVydHkpIHtcbiAgICAgIHByb3BlcnR5QmluZGluZ3MucHVzaChpbnN0cnVjdGlvblBhcmFtcyk7XG4gICAgfSBlbHNlIGlmIChpbnN0cnVjdGlvbiA9PT0gUjMuYXR0cmlidXRlKSB7XG4gICAgICBhdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKGluc3RydWN0aW9uUGFyYW1zKTtcbiAgICB9IGVsc2UgaWYgKGluc3RydWN0aW9uID09PSBSMy5zeW50aGV0aWNIb3N0UHJvcGVydHkpIHtcbiAgICAgIHN5bnRoZXRpY0hvc3RCaW5kaW5ncy5wdXNoKGluc3RydWN0aW9uUGFyYW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3RhdGVtZW50cy5wdXNoKG8uaW1wb3J0RXhwcihpbnN0cnVjdGlvbikuY2FsbEZuKGluc3RydWN0aW9uUGFyYW1zKS50b1N0bXQoKSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAocHJvcGVydHlCaW5kaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgdXBkYXRlU3RhdGVtZW50cy5wdXNoKGNoYWluZWRJbnN0cnVjdGlvbihSMy5ob3N0UHJvcGVydHksIHByb3BlcnR5QmluZGluZ3MpLnRvU3RtdCgpKTtcbiAgfVxuXG4gIGlmIChhdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgdXBkYXRlU3RhdGVtZW50cy5wdXNoKGNoYWluZWRJbnN0cnVjdGlvbihSMy5hdHRyaWJ1dGUsIGF0dHJpYnV0ZUJpbmRpbmdzKS50b1N0bXQoKSk7XG4gIH1cblxuICBpZiAoc3ludGhldGljSG9zdEJpbmRpbmdzLmxlbmd0aCA+IDApIHtcbiAgICB1cGRhdGVTdGF0ZW1lbnRzLnB1c2goXG4gICAgICAgIGNoYWluZWRJbnN0cnVjdGlvbihSMy5zeW50aGV0aWNIb3N0UHJvcGVydHksIHN5bnRoZXRpY0hvc3RCaW5kaW5ncykudG9TdG10KCkpO1xuICB9XG5cbiAgLy8gc2luY2Ugd2UncmUgZGVhbGluZyB3aXRoIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBhbmQgYm90aCBoYXZlIGhvc3RCaW5kaW5nXG4gIC8vIGZ1bmN0aW9ucywgd2UgbmVlZCB0byBnZW5lcmF0ZSBhIHNwZWNpYWwgaG9zdEF0dHJzIGluc3RydWN0aW9uIHRoYXQgZGVhbHNcbiAgLy8gd2l0aCBib3RoIHRoZSBhc3NpZ25tZW50IG9mIHN0eWxpbmcgYXMgd2VsbCBhcyBzdGF0aWMgYXR0cmlidXRlcyB0byB0aGUgaG9zdFxuICAvLyBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gYmVsb3cgd2lsbCBpbnN0cnVjdCBhbGwgaW5pdGlhbCBzdHlsaW5nIChzdHlsaW5nXG4gIC8vIHRoYXQgaXMgaW5zaWRlIG9mIGEgaG9zdCBiaW5kaW5nIHdpdGhpbiBhIGRpcmVjdGl2ZS9jb21wb25lbnQpIHRvIGJlIGF0dGFjaGVkXG4gIC8vIHRvIHRoZSBob3N0IGVsZW1lbnQgYWxvbmdzaWRlIGFueSBvZiB0aGUgcHJvdmlkZWQgaG9zdCBhdHRyaWJ1dGVzIHRoYXQgd2VyZVxuICAvLyBjb2xsZWN0ZWQgZWFybGllci5cbiAgY29uc3QgaG9zdEF0dHJzID0gY29udmVydEF0dHJpYnV0ZXNUb0V4cHJlc3Npb25zKGhvc3RCaW5kaW5nc01ldGFkYXRhLmF0dHJpYnV0ZXMpO1xuICBzdHlsZUJ1aWxkZXIuYXNzaWduSG9zdEF0dHJzKGhvc3RBdHRycywgZGVmaW5pdGlvbk1hcCk7XG5cbiAgaWYgKHN0eWxlQnVpbGRlci5oYXNCaW5kaW5ncykge1xuICAgIC8vIGZpbmFsbHkgZWFjaCBiaW5kaW5nIHRoYXQgd2FzIHJlZ2lzdGVyZWQgaW4gdGhlIHN0YXRlbWVudCBhYm92ZSB3aWxsIG5lZWQgdG8gYmUgYWRkZWQgdG9cbiAgICAvLyB0aGUgdXBkYXRlIGJsb2NrIG9mIGEgY29tcG9uZW50L2RpcmVjdGl2ZSB0ZW1wbGF0ZUZuL2hvc3RCaW5kaW5nc0ZuIHNvIHRoYXQgdGhlIGJpbmRpbmdzXG4gICAgLy8gYXJlIGV2YWx1YXRlZCBhbmQgdXBkYXRlZCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgc3R5bGVCdWlsZGVyLmJ1aWxkVXBkYXRlTGV2ZWxJbnN0cnVjdGlvbnMoZ2V0VmFsdWVDb252ZXJ0ZXIoKSkuZm9yRWFjaChpbnN0cnVjdGlvbiA9PiB7XG4gICAgICBpZiAoaW5zdHJ1Y3Rpb24uY2FsbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjYWxsczogby5FeHByZXNzaW9uW11bXSA9IFtdO1xuXG4gICAgICAgIGluc3RydWN0aW9uLmNhbGxzLmZvckVhY2goY2FsbCA9PiB7XG4gICAgICAgICAgLy8gd2Ugc3VidHJhY3QgYSB2YWx1ZSBvZiBgMWAgaGVyZSBiZWNhdXNlIHRoZSBiaW5kaW5nIHNsb3Qgd2FzIGFscmVhZHkgYWxsb2NhdGVkXG4gICAgICAgICAgLy8gYXQgdGhlIHRvcCBvZiB0aGlzIG1ldGhvZCB3aGVuIGFsbCB0aGUgaW5wdXQgYmluZGluZ3Mgd2VyZSBjb3VudGVkLlxuICAgICAgICAgIHRvdGFsSG9zdFZhcnNDb3VudCArPVxuICAgICAgICAgICAgICBNYXRoLm1heChjYWxsLmFsbG9jYXRlQmluZGluZ1Nsb3RzIC0gTUlOX1NUWUxJTkdfQklORElOR19TTE9UU19SRVFVSVJFRCwgMCk7XG4gICAgICAgICAgY2FsbHMucHVzaChjb252ZXJ0U3R5bGluZ0NhbGwoY2FsbCwgYmluZGluZ0NvbnRleHQsIGJpbmRpbmdGbikpO1xuICAgICAgICB9KTtcblxuICAgICAgICB1cGRhdGVTdGF0ZW1lbnRzLnB1c2goY2hhaW5lZEluc3RydWN0aW9uKGluc3RydWN0aW9uLnJlZmVyZW5jZSwgY2FsbHMpLnRvU3RtdCgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0b3RhbEhvc3RWYXJzQ291bnQpIHtcbiAgICBkZWZpbml0aW9uTWFwLnNldCgnaG9zdFZhcnMnLCBvLmxpdGVyYWwodG90YWxIb3N0VmFyc0NvdW50KSk7XG4gIH1cblxuICBpZiAoY3JlYXRlU3RhdGVtZW50cy5sZW5ndGggPiAwIHx8IHVwZGF0ZVN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGhvc3RCaW5kaW5nc0ZuTmFtZSA9IG5hbWUgPyBgJHtuYW1lfV9Ib3N0QmluZGluZ3NgIDogbnVsbDtcbiAgICBjb25zdCBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG4gICAgaWYgKGNyZWF0ZVN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgc3RhdGVtZW50cy5wdXNoKHJlbmRlckZsYWdDaGVja0lmU3RtdChjb3JlLlJlbmRlckZsYWdzLkNyZWF0ZSwgY3JlYXRlU3RhdGVtZW50cykpO1xuICAgIH1cbiAgICBpZiAodXBkYXRlU3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBzdGF0ZW1lbnRzLnB1c2gocmVuZGVyRmxhZ0NoZWNrSWZTdG10KGNvcmUuUmVuZGVyRmxhZ3MuVXBkYXRlLCB1cGRhdGVTdGF0ZW1lbnRzKSk7XG4gICAgfVxuICAgIHJldHVybiBvLmZuKFxuICAgICAgICBbbmV3IG8uRm5QYXJhbShSRU5ERVJfRkxBR1MsIG8uTlVNQkVSX1RZUEUpLCBuZXcgby5GblBhcmFtKENPTlRFWFRfTkFNRSwgbnVsbCldLCBzdGF0ZW1lbnRzLFxuICAgICAgICBvLklORkVSUkVEX1RZUEUsIG51bGwsIGhvc3RCaW5kaW5nc0ZuTmFtZSk7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYmluZGluZ0ZuKGltcGxpY2l0OiBhbnksIHZhbHVlOiBBU1QpIHtcbiAgcmV0dXJuIGNvbnZlcnRQcm9wZXJ0eUJpbmRpbmcoXG4gICAgICBudWxsLCBpbXBsaWNpdCwgdmFsdWUsICdiJywgKCkgPT4gZXJyb3IoJ1VuZXhwZWN0ZWQgaW50ZXJwb2xhdGlvbicpKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN0eWxpbmdDYWxsKFxuICAgIGNhbGw6IFN0eWxpbmdJbnN0cnVjdGlvbkNhbGwsIGJpbmRpbmdDb250ZXh0OiBhbnksIGJpbmRpbmdGbjogRnVuY3Rpb24pIHtcbiAgcmV0dXJuIGNhbGwucGFyYW1zKHZhbHVlID0+IGJpbmRpbmdGbihiaW5kaW5nQ29udGV4dCwgdmFsdWUpLmN1cnJWYWxFeHByKTtcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ05hbWVBbmRJbnN0cnVjdGlvbihiaW5kaW5nOiBQYXJzZWRQcm9wZXJ0eSk6XG4gICAge2JpbmRpbmdOYW1lOiBzdHJpbmcsIGluc3RydWN0aW9uOiBvLkV4dGVybmFsUmVmZXJlbmNlLCBpc0F0dHJpYnV0ZTogYm9vbGVhbn0ge1xuICBsZXQgYmluZGluZ05hbWUgPSBiaW5kaW5nLm5hbWU7XG4gIGxldCBpbnN0cnVjdGlvbiE6IG8uRXh0ZXJuYWxSZWZlcmVuY2U7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgYW4gYXR0ciBiaW5kaW5nIG9yIGEgcHJvcGVydHkgYmluZGluZ1xuICBjb25zdCBhdHRyTWF0Y2hlcyA9IGJpbmRpbmdOYW1lLm1hdGNoKEFUVFJfUkVHRVgpO1xuICBpZiAoYXR0ck1hdGNoZXMpIHtcbiAgICBiaW5kaW5nTmFtZSA9IGF0dHJNYXRjaGVzWzFdO1xuICAgIGluc3RydWN0aW9uID0gUjMuYXR0cmlidXRlO1xuICB9IGVsc2Uge1xuICAgIGlmIChiaW5kaW5nLmlzQW5pbWF0aW9uKSB7XG4gICAgICBiaW5kaW5nTmFtZSA9IHByZXBhcmVTeW50aGV0aWNQcm9wZXJ0eU5hbWUoYmluZGluZ05hbWUpO1xuICAgICAgLy8gaG9zdCBiaW5kaW5ncyB0aGF0IGhhdmUgYSBzeW50aGV0aWMgcHJvcGVydHkgKGUuZy4gQGZvbykgc2hvdWxkIGFsd2F5cyBiZSByZW5kZXJlZFxuICAgICAgLy8gaW4gdGhlIGNvbnRleHQgb2YgdGhlIGNvbXBvbmVudCBhbmQgbm90IHRoZSBwYXJlbnQuIFRoZXJlZm9yZSB0aGVyZSBpcyBhIHNwZWNpYWxcbiAgICAgIC8vIGNvbXBhdGliaWxpdHkgaW5zdHJ1Y3Rpb24gYXZhaWxhYmxlIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICBpbnN0cnVjdGlvbiA9IFIzLnN5bnRoZXRpY0hvc3RQcm9wZXJ0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdHJ1Y3Rpb24gPSBSMy5ob3N0UHJvcGVydHk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtiaW5kaW5nTmFtZSwgaW5zdHJ1Y3Rpb24sIGlzQXR0cmlidXRlOiAhIWF0dHJNYXRjaGVzfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSG9zdExpc3RlbmVycyhldmVudEJpbmRpbmdzOiBQYXJzZWRFdmVudFtdLCBuYW1lPzogc3RyaW5nKTogby5TdGF0ZW1lbnRbXSB7XG4gIGNvbnN0IGxpc3RlbmVyczogby5FeHByZXNzaW9uW11bXSA9IFtdO1xuICBjb25zdCBzeW50aGV0aWNMaXN0ZW5lcnM6IG8uRXhwcmVzc2lvbltdW10gPSBbXTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiBvLlN0YXRlbWVudFtdID0gW107XG5cbiAgZXZlbnRCaW5kaW5ncy5mb3JFYWNoKGJpbmRpbmcgPT4ge1xuICAgIGxldCBiaW5kaW5nTmFtZSA9IGJpbmRpbmcubmFtZSAmJiBzYW5pdGl6ZUlkZW50aWZpZXIoYmluZGluZy5uYW1lKTtcbiAgICBjb25zdCBiaW5kaW5nRm5OYW1lID0gYmluZGluZy50eXBlID09PSBQYXJzZWRFdmVudFR5cGUuQW5pbWF0aW9uID9cbiAgICAgICAgcHJlcGFyZVN5bnRoZXRpY0xpc3RlbmVyRnVuY3Rpb25OYW1lKGJpbmRpbmdOYW1lLCBiaW5kaW5nLnRhcmdldE9yUGhhc2UpIDpcbiAgICAgICAgYmluZGluZ05hbWU7XG4gICAgY29uc3QgaGFuZGxlck5hbWUgPSBuYW1lICYmIGJpbmRpbmdOYW1lID8gYCR7bmFtZX1fJHtiaW5kaW5nRm5OYW1lfV9Ib3N0QmluZGluZ0hhbmRsZXJgIDogbnVsbDtcbiAgICBjb25zdCBwYXJhbXMgPSBwcmVwYXJlRXZlbnRMaXN0ZW5lclBhcmFtZXRlcnMoQm91bmRFdmVudC5mcm9tUGFyc2VkRXZlbnQoYmluZGluZyksIGhhbmRsZXJOYW1lKTtcblxuICAgIGlmIChiaW5kaW5nLnR5cGUgPT0gUGFyc2VkRXZlbnRUeXBlLkFuaW1hdGlvbikge1xuICAgICAgc3ludGhldGljTGlzdGVuZXJzLnB1c2gocGFyYW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdGVuZXJzLnB1c2gocGFyYW1zKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChzeW50aGV0aWNMaXN0ZW5lcnMubGVuZ3RoID4gMCkge1xuICAgIGluc3RydWN0aW9ucy5wdXNoKGNoYWluZWRJbnN0cnVjdGlvbihSMy5zeW50aGV0aWNIb3N0TGlzdGVuZXIsIHN5bnRoZXRpY0xpc3RlbmVycykudG9TdG10KCkpO1xuICB9XG5cbiAgaWYgKGxpc3RlbmVycy5sZW5ndGggPiAwKSB7XG4gICAgaW5zdHJ1Y3Rpb25zLnB1c2goY2hhaW5lZEluc3RydWN0aW9uKFIzLmxpc3RlbmVyLCBsaXN0ZW5lcnMpLnRvU3RtdCgpKTtcbiAgfVxuXG4gIHJldHVybiBpbnN0cnVjdGlvbnM7XG59XG5cblxuY29uc3QgSE9TVF9SRUdfRVhQID0gL14oPzpcXFsoW15cXF1dKylcXF0pfCg/OlxcKChbXlxcKV0rKVxcKSkkLztcbi8vIFJlcHJlc2VudHMgdGhlIGdyb3VwcyBpbiB0aGUgYWJvdmUgcmVnZXguXG5jb25zdCBlbnVtIEhvc3RCaW5kaW5nR3JvdXAge1xuICAvLyBncm91cCAxOiBcInByb3BcIiBmcm9tIFwiW3Byb3BdXCIsIG9yIFwiYXR0ci5yb2xlXCIgZnJvbSBcIlthdHRyLnJvbGVdXCIsIG9yIEBhbmltIGZyb20gW0BhbmltXVxuICBCaW5kaW5nID0gMSxcblxuICAvLyBncm91cCAyOiBcImV2ZW50XCIgZnJvbSBcIihldmVudClcIlxuICBFdmVudCA9IDIsXG59XG5cbi8vIERlZmluZXMgSG9zdCBCaW5kaW5ncyBzdHJ1Y3R1cmUgdGhhdCBjb250YWlucyBhdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIGFuZCBwcm9wZXJ0aWVzLFxuLy8gcGFyc2VkIGZyb20gdGhlIGBob3N0YCBvYmplY3QgZGVmaW5lZCBmb3IgYSBUeXBlLlxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWRIb3N0QmluZGluZ3Mge1xuICBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogby5FeHByZXNzaW9ufTtcbiAgbGlzdGVuZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcbiAgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ307XG4gIHNwZWNpYWxBdHRyaWJ1dGVzOiB7c3R5bGVBdHRyPzogc3RyaW5nOyBjbGFzc0F0dHI/OiBzdHJpbmc7fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSG9zdEJpbmRpbmdzKGhvc3Q6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd8by5FeHByZXNzaW9ufSk6IFBhcnNlZEhvc3RCaW5kaW5ncyB7XG4gIGNvbnN0IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBvLkV4cHJlc3Npb259ID0ge307XG4gIGNvbnN0IGxpc3RlbmVyczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgY29uc3Qgc3BlY2lhbEF0dHJpYnV0ZXM6IHtzdHlsZUF0dHI/OiBzdHJpbmc7IGNsYXNzQXR0cj86IHN0cmluZzt9ID0ge307XG5cbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaG9zdCkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGhvc3Rba2V5XTtcbiAgICBjb25zdCBtYXRjaGVzID0ga2V5Lm1hdGNoKEhPU1RfUkVHX0VYUCk7XG5cbiAgICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSAnY2xhc3MnOlxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBUT0RPKGFseGh1Yik6IG1ha2UgdGhpcyBhIGRpYWdub3N0aWMuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzIGJpbmRpbmcgbXVzdCBiZSBzdHJpbmdgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3BlY2lhbEF0dHJpYnV0ZXMuY2xhc3NBdHRyID0gdmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3N0eWxlJzpcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBtYWtlIHRoaXMgYSBkaWFnbm9zdGljLlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdHlsZSBiaW5kaW5nIG11c3QgYmUgc3RyaW5nYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNwZWNpYWxBdHRyaWJ1dGVzLnN0eWxlQXR0ciA9IHZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSBvLmxpdGVyYWwodmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtYXRjaGVzW0hvc3RCaW5kaW5nR3JvdXAuQmluZGluZ10gIT0gbnVsbCkge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBtYWtlIHRoaXMgYSBkaWFnbm9zdGljLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb3BlcnR5IGJpbmRpbmcgbXVzdCBiZSBzdHJpbmdgKTtcbiAgICAgIH1cbiAgICAgIC8vIHN5bnRoZXRpYyBwcm9wZXJ0aWVzICh0aGUgb25lcyB0aGF0IGhhdmUgYSBgQGAgYXMgYSBwcmVmaXgpXG4gICAgICAvLyBhcmUgc3RpbGwgdHJlYXRlZCB0aGUgc2FtZSBhcyByZWd1bGFyIHByb3BlcnRpZXMuIFRoZXJlZm9yZVxuICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gc3RvcmluZyB0aGVtIGluIGEgc2VwYXJhdGUgbWFwLlxuICAgICAgcHJvcGVydGllc1ttYXRjaGVzW0hvc3RCaW5kaW5nR3JvdXAuQmluZGluZ11dID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChtYXRjaGVzW0hvc3RCaW5kaW5nR3JvdXAuRXZlbnRdICE9IG51bGwpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRPRE8oYWx4aHViKTogbWFrZSB0aGlzIGEgZGlhZ25vc3RpYy5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFdmVudCBiaW5kaW5nIG11c3QgYmUgc3RyaW5nYCk7XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnNbbWF0Y2hlc1tIb3N0QmluZGluZ0dyb3VwLkV2ZW50XV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge2F0dHJpYnV0ZXMsIGxpc3RlbmVycywgcHJvcGVydGllcywgc3BlY2lhbEF0dHJpYnV0ZXN9O1xufVxuXG4vKipcbiAqIFZlcmlmaWVzIGhvc3QgYmluZGluZ3MgYW5kIHJldHVybnMgdGhlIGxpc3Qgb2YgZXJyb3JzIChpZiBhbnkpLiBFbXB0eSBhcnJheSBpbmRpY2F0ZXMgdGhhdCBhXG4gKiBnaXZlbiBzZXQgb2YgaG9zdCBiaW5kaW5ncyBoYXMgbm8gZXJyb3JzLlxuICpcbiAqIEBwYXJhbSBiaW5kaW5ncyBzZXQgb2YgaG9zdCBiaW5kaW5ncyB0byB2ZXJpZnkuXG4gKiBAcGFyYW0gc291cmNlU3BhbiBzb3VyY2Ugc3BhbiB3aGVyZSBob3N0IGJpbmRpbmdzIHdlcmUgZGVmaW5lZC5cbiAqIEByZXR1cm5zIGFycmF5IG9mIGVycm9ycyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBzZXQgb2YgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZlcmlmeUhvc3RCaW5kaW5ncyhcbiAgICBiaW5kaW5nczogUGFyc2VkSG9zdEJpbmRpbmdzLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pOiBQYXJzZUVycm9yW10ge1xuICAvLyBUT0RPOiBhYnN0cmFjdCBvdXQgaG9zdCBiaW5kaW5ncyB2ZXJpZmljYXRpb24gbG9naWMgYW5kIHVzZSBpdCBpbnN0ZWFkIG9mXG4gIC8vIGNyZWF0aW5nIGV2ZW50cyBhbmQgcHJvcGVydGllcyBBU1RzIHRvIGRldGVjdCBlcnJvcnMgKEZXLTk5NilcbiAgY29uc3QgYmluZGluZ1BhcnNlciA9IG1ha2VCaW5kaW5nUGFyc2VyKCk7XG4gIGJpbmRpbmdQYXJzZXIuY3JlYXRlRGlyZWN0aXZlSG9zdEV2ZW50QXN0cyhiaW5kaW5ncy5saXN0ZW5lcnMsIHNvdXJjZVNwYW4pO1xuICBiaW5kaW5nUGFyc2VyLmNyZWF0ZUJvdW5kSG9zdFByb3BlcnRpZXMoYmluZGluZ3MucHJvcGVydGllcywgc291cmNlU3Bhbik7XG4gIHJldHVybiBiaW5kaW5nUGFyc2VyLmVycm9ycztcbn1cblxuZnVuY3Rpb24gY29tcGlsZVN0eWxlcyhzdHlsZXM6IHN0cmluZ1tdLCBzZWxlY3Rvcjogc3RyaW5nLCBob3N0U2VsZWN0b3I6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3Qgc2hhZG93Q3NzID0gbmV3IFNoYWRvd0NzcygpO1xuICByZXR1cm4gc3R5bGVzLm1hcChzdHlsZSA9PiB7XG4gICAgcmV0dXJuIHNoYWRvd0NzcyEuc2hpbUNzc1RleHQoc3R5bGUsIHNlbGVjdG9yLCBob3N0U2VsZWN0b3IpO1xuICB9KTtcbn1cbiJdfQ==