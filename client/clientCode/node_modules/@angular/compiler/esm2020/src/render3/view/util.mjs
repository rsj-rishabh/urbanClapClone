/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../output/output_ast';
import { splitAtColon } from '../../util';
import * as t from '../r3_ast';
import { Identifiers as R3 } from '../r3_identifiers';
import { isI18nAttribute } from './i18n/util';
/**
 * Checks whether an object key contains potentially unsafe chars, thus the key should be wrapped in
 * quotes. Note: we do not wrap all keys into quotes, as it may have impact on minification and may
 * bot work in some cases when object keys are mangled by minifier.
 *
 * TODO(FW-1136): this is a temporary solution, we need to come up with a better way of working with
 * inputs that contain potentially unsafe chars.
 */
const UNSAFE_OBJECT_KEY_NAME_REGEXP = /[-.]/;
/** Name of the temporary to use during data binding */
export const TEMPORARY_NAME = '_t';
/** Name of the context parameter passed into a template function */
export const CONTEXT_NAME = 'ctx';
/** Name of the RenderFlag passed into a template function */
export const RENDER_FLAGS = 'rf';
/** The prefix reference variables */
export const REFERENCE_PREFIX = '_r';
/** The name of the implicit context reference */
export const IMPLICIT_REFERENCE = '$implicit';
/** Non bindable attribute name **/
export const NON_BINDABLE_ATTR = 'ngNonBindable';
/** Name for the variable keeping track of the context returned by `ɵɵrestoreView`. */
export const RESTORED_VIEW_CONTEXT_NAME = 'restoredCtx';
/**
 * Creates an allocator for a temporary variable.
 *
 * A variable declaration is added to the statements the first time the allocator is invoked.
 */
export function temporaryAllocator(statements, name) {
    let temp = null;
    return () => {
        if (!temp) {
            statements.push(new o.DeclareVarStmt(TEMPORARY_NAME, undefined, o.DYNAMIC_TYPE));
            temp = o.variable(name);
        }
        return temp;
    };
}
export function invalid(arg) {
    throw new Error(`Invalid state: Visitor ${this.constructor.name} doesn't handle ${arg.constructor.name}`);
}
export function asLiteral(value) {
    if (Array.isArray(value)) {
        return o.literalArr(value.map(asLiteral));
    }
    return o.literal(value, o.INFERRED_TYPE);
}
export function conditionallyCreateMapObjectLiteral(keys, keepDeclared) {
    if (Object.getOwnPropertyNames(keys).length > 0) {
        return mapToExpression(keys, keepDeclared);
    }
    return null;
}
function mapToExpression(map, keepDeclared) {
    return o.literalMap(Object.getOwnPropertyNames(map).map(key => {
        // canonical syntax: `dirProp: publicProp`
        // if there is no `:`, use dirProp = elProp
        const value = map[key];
        let declaredName;
        let publicName;
        let minifiedName;
        let needsDeclaredName;
        if (Array.isArray(value)) {
            [publicName, declaredName] = value;
            minifiedName = key;
            needsDeclaredName = publicName !== declaredName;
        }
        else {
            [declaredName, publicName] = splitAtColon(key, [key, value]);
            minifiedName = declaredName;
            // Only include the declared name if extracted from the key, i.e. the key contains a colon.
            // Otherwise the declared name should be omitted even if it is different from the public name,
            // as it may have already been minified.
            needsDeclaredName = publicName !== declaredName && key.includes(':');
        }
        return {
            key: minifiedName,
            // put quotes around keys that contain potentially unsafe characters
            quoted: UNSAFE_OBJECT_KEY_NAME_REGEXP.test(minifiedName),
            value: (keepDeclared && needsDeclaredName) ?
                o.literalArr([asLiteral(publicName), asLiteral(declaredName)]) :
                asLiteral(publicName)
        };
    }));
}
/**
 *  Remove trailing null nodes as they are implied.
 */
export function trimTrailingNulls(parameters) {
    while (o.isNull(parameters[parameters.length - 1])) {
        parameters.pop();
    }
    return parameters;
}
export function getQueryPredicate(query, constantPool) {
    if (Array.isArray(query.predicate)) {
        let predicate = [];
        query.predicate.forEach((selector) => {
            // Each item in predicates array may contain strings with comma-separated refs
            // (for ex. 'ref, ref1, ..., refN'), thus we extract individual refs and store them
            // as separate array entities
            const selectors = selector.split(',').map(token => o.literal(token.trim()));
            predicate.push(...selectors);
        });
        return constantPool.getConstLiteral(o.literalArr(predicate), true);
    }
    else {
        // The original predicate may have been wrapped in a `forwardRef()` call.
        switch (query.predicate.forwardRef) {
            case 0 /* None */:
            case 2 /* Unwrapped */:
                return query.predicate.expression;
            case 1 /* Wrapped */:
                return o.importExpr(R3.resolveForwardRef).callFn([query.predicate.expression]);
        }
    }
}
/**
 * A representation for an object literal used during codegen of definition objects. The generic
 * type `T` allows to reference a documented type of the generated structure, such that the
 * property names that are set can be resolved to their documented declaration.
 */
export class DefinitionMap {
    constructor() {
        this.values = [];
    }
    set(key, value) {
        if (value) {
            this.values.push({ key: key, value, quoted: false });
        }
    }
    toLiteralMap() {
        return o.literalMap(this.values);
    }
}
/**
 * Extract a map of properties to values for a given element or template node, which can be used
 * by the directive matching machinery.
 *
 * @param elOrTpl the element or template in question
 * @return an object set up for directive matching. For attributes on the element/template, this
 * object maps a property name to its (static) value. For any bindings, this map simply maps the
 * property name to an empty string.
 */
export function getAttrsForDirectiveMatching(elOrTpl) {
    const attributesMap = {};
    if (elOrTpl instanceof t.Template && elOrTpl.tagName !== 'ng-template') {
        elOrTpl.templateAttrs.forEach(a => attributesMap[a.name] = '');
    }
    else {
        elOrTpl.attributes.forEach(a => {
            if (!isI18nAttribute(a.name)) {
                attributesMap[a.name] = a.value;
            }
        });
        elOrTpl.inputs.forEach(i => {
            attributesMap[i.name] = '';
        });
        elOrTpl.outputs.forEach(o => {
            attributesMap[o.name] = '';
        });
    }
    return attributesMap;
}
/** Returns a call expression to a chained instruction, e.g. `property(params[0])(params[1])`. */
export function chainedInstruction(reference, calls, span) {
    let expression = o.importExpr(reference, null, span);
    if (calls.length > 0) {
        for (let i = 0; i < calls.length; i++) {
            expression = expression.callFn(calls[i], span);
        }
    }
    else {
        // Add a blank invocation, in case the `calls` array is empty.
        expression = expression.callFn([], span);
    }
    return expression;
}
/**
 * Gets the number of arguments expected to be passed to a generated instruction in the case of
 * interpolation instructions.
 * @param interpolation An interpolation ast
 */
export function getInterpolationArgsLength(interpolation) {
    const { expressions, strings } = interpolation;
    if (expressions.length === 1 && strings.length === 2 && strings[0] === '' && strings[1] === '') {
        // If the interpolation has one interpolated value, but the prefix and suffix are both empty
        // strings, we only pass one argument, to a special instruction like `propertyInterpolate` or
        // `textInterpolate`.
        return 1;
    }
    else {
        return expressions.length + strings.length;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3ZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEtBQUssQ0FBQyxNQUFNLHlCQUF5QixDQUFDO0FBRTdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDeEMsT0FBTyxLQUFLLENBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0IsT0FBTyxFQUFDLFdBQVcsSUFBSSxFQUFFLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUlwRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRzVDOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLDZCQUE2QixHQUFHLE1BQU0sQ0FBQztBQUU3Qyx1REFBdUQ7QUFDdkQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQztBQUVuQyxvRUFBb0U7QUFDcEUsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQztBQUVsQyw2REFBNkQ7QUFDN0QsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQztBQUVqQyxxQ0FBcUM7QUFDckMsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBRXJDLGlEQUFpRDtBQUNqRCxNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUM7QUFFOUMsbUNBQW1DO0FBQ25DLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQztBQUVqRCxzRkFBc0Y7QUFDdEYsTUFBTSxDQUFDLE1BQU0sMEJBQTBCLEdBQUcsYUFBYSxDQUFDO0FBRXhEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsVUFBeUIsRUFBRSxJQUFZO0lBQ3hFLElBQUksSUFBSSxHQUF1QixJQUFJLENBQUM7SUFDcEMsT0FBTyxHQUFHLEVBQUU7UUFDVixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNqRixJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUdELE1BQU0sVUFBVSxPQUFPLENBQXFCLEdBQW9DO0lBQzlFLE1BQU0sSUFBSSxLQUFLLENBQ1gsMEJBQTBCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQVU7SUFDbEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsTUFBTSxVQUFVLG1DQUFtQyxDQUMvQyxJQUFzQyxFQUFFLFlBQXNCO0lBQ2hFLElBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDL0MsT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQzVDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQ3BCLEdBQXFDLEVBQUUsWUFBc0I7SUFDL0QsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDNUQsMENBQTBDO1FBQzFDLDJDQUEyQztRQUMzQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsSUFBSSxZQUFvQixDQUFDO1FBQ3pCLElBQUksVUFBa0IsQ0FBQztRQUN2QixJQUFJLFlBQW9CLENBQUM7UUFDekIsSUFBSSxpQkFBMEIsQ0FBQztRQUMvQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ25DLFlBQVksR0FBRyxHQUFHLENBQUM7WUFDbkIsaUJBQWlCLEdBQUcsVUFBVSxLQUFLLFlBQVksQ0FBQztTQUNqRDthQUFNO1lBQ0wsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUcsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzdELFlBQVksR0FBRyxZQUFZLENBQUM7WUFDNUIsMkZBQTJGO1lBQzNGLDhGQUE4RjtZQUM5Rix3Q0FBd0M7WUFDeEMsaUJBQWlCLEdBQUcsVUFBVSxLQUFLLFlBQVksSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RFO1FBQ0QsT0FBTztZQUNMLEdBQUcsRUFBRSxZQUFZO1lBQ2pCLG9FQUFvRTtZQUNwRSxNQUFNLEVBQUUsNkJBQTZCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN4RCxLQUFLLEVBQUUsQ0FBQyxZQUFZLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEUsU0FBUyxDQUFDLFVBQVUsQ0FBQztTQUMxQixDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxVQUEwQjtJQUMxRCxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNsRCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDbEI7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixLQUFzQixFQUFFLFlBQTBCO0lBQ3BELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDbEMsSUFBSSxTQUFTLEdBQW1CLEVBQUUsQ0FBQztRQUNuQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQWdCLEVBQVEsRUFBRTtZQUNqRCw4RUFBOEU7WUFDOUUsbUZBQW1GO1lBQ25GLDZCQUE2QjtZQUM3QixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNwRTtTQUFNO1FBQ0wseUVBQXlFO1FBQ3pFLFFBQVEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUU7WUFDbEMsa0JBQTZCO1lBQzdCO2dCQUNFLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDcEM7Z0JBQ0UsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUNsRjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUExQjtRQUNFLFdBQU0sR0FBMEQsRUFBRSxDQUFDO0lBV3JFLENBQUM7SUFUQyxHQUFHLENBQUMsR0FBWSxFQUFFLEtBQXdCO1FBQ3hDLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUUsR0FBYSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztTQUM5RDtJQUNILENBQUM7SUFFRCxZQUFZO1FBQ1YsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxPQUNVO0lBQ3JELE1BQU0sYUFBYSxHQUE2QixFQUFFLENBQUM7SUFHbkQsSUFBSSxPQUFPLFlBQVksQ0FBQyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLGFBQWEsRUFBRTtRQUN0RSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDaEU7U0FBTTtRQUNMLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QixhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7YUFDakM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3pCLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDMUIsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxpR0FBaUc7QUFDakcsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixTQUE4QixFQUFFLEtBQXVCLEVBQUUsSUFBMkI7SUFDdEYsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBaUIsQ0FBQztJQUVyRSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoRDtLQUNGO1NBQU07UUFDTCw4REFBOEQ7UUFDOUQsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzFDO0lBRUQsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsYUFBNEI7SUFDckUsTUFBTSxFQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUMsR0FBRyxhQUFhLENBQUM7SUFDN0MsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDOUYsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RixxQkFBcUI7UUFDckIsT0FBTyxDQUFDLENBQUM7S0FDVjtTQUFNO1FBQ0wsT0FBTyxXQUFXLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7S0FDNUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29uc3RhbnRQb29sfSBmcm9tICcuLi8uLi9jb25zdGFudF9wb29sJztcbmltcG9ydCB7SW50ZXJwb2xhdGlvbn0gZnJvbSAnLi4vLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtQYXJzZVNvdXJjZVNwYW59IGZyb20gJy4uLy4uL3BhcnNlX3V0aWwnO1xuaW1wb3J0IHtzcGxpdEF0Q29sb259IGZyb20gJy4uLy4uL3V0aWwnO1xuaW1wb3J0ICogYXMgdCBmcm9tICcuLi9yM19hc3QnO1xuaW1wb3J0IHtJZGVudGlmaWVycyBhcyBSM30gZnJvbSAnLi4vcjNfaWRlbnRpZmllcnMnO1xuaW1wb3J0IHtGb3J3YXJkUmVmSGFuZGxpbmd9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge1IzUXVlcnlNZXRhZGF0YX0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtpc0kxOG5BdHRyaWJ1dGV9IGZyb20gJy4vaTE4bi91dGlsJztcblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGFuIG9iamVjdCBrZXkgY29udGFpbnMgcG90ZW50aWFsbHkgdW5zYWZlIGNoYXJzLCB0aHVzIHRoZSBrZXkgc2hvdWxkIGJlIHdyYXBwZWQgaW5cbiAqIHF1b3Rlcy4gTm90ZTogd2UgZG8gbm90IHdyYXAgYWxsIGtleXMgaW50byBxdW90ZXMsIGFzIGl0IG1heSBoYXZlIGltcGFjdCBvbiBtaW5pZmljYXRpb24gYW5kIG1heVxuICogYm90IHdvcmsgaW4gc29tZSBjYXNlcyB3aGVuIG9iamVjdCBrZXlzIGFyZSBtYW5nbGVkIGJ5IG1pbmlmaWVyLlxuICpcbiAqIFRPRE8oRlctMTEzNik6IHRoaXMgaXMgYSB0ZW1wb3Jhcnkgc29sdXRpb24sIHdlIG5lZWQgdG8gY29tZSB1cCB3aXRoIGEgYmV0dGVyIHdheSBvZiB3b3JraW5nIHdpdGhcbiAqIGlucHV0cyB0aGF0IGNvbnRhaW4gcG90ZW50aWFsbHkgdW5zYWZlIGNoYXJzLlxuICovXG5jb25zdCBVTlNBRkVfT0JKRUNUX0tFWV9OQU1FX1JFR0VYUCA9IC9bLS5dLztcblxuLyoqIE5hbWUgb2YgdGhlIHRlbXBvcmFyeSB0byB1c2UgZHVyaW5nIGRhdGEgYmluZGluZyAqL1xuZXhwb3J0IGNvbnN0IFRFTVBPUkFSWV9OQU1FID0gJ190JztcblxuLyoqIE5hbWUgb2YgdGhlIGNvbnRleHQgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gKi9cbmV4cG9ydCBjb25zdCBDT05URVhUX05BTUUgPSAnY3R4JztcblxuLyoqIE5hbWUgb2YgdGhlIFJlbmRlckZsYWcgcGFzc2VkIGludG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiAqL1xuZXhwb3J0IGNvbnN0IFJFTkRFUl9GTEFHUyA9ICdyZic7XG5cbi8qKiBUaGUgcHJlZml4IHJlZmVyZW5jZSB2YXJpYWJsZXMgKi9cbmV4cG9ydCBjb25zdCBSRUZFUkVOQ0VfUFJFRklYID0gJ19yJztcblxuLyoqIFRoZSBuYW1lIG9mIHRoZSBpbXBsaWNpdCBjb250ZXh0IHJlZmVyZW5jZSAqL1xuZXhwb3J0IGNvbnN0IElNUExJQ0lUX1JFRkVSRU5DRSA9ICckaW1wbGljaXQnO1xuXG4vKiogTm9uIGJpbmRhYmxlIGF0dHJpYnV0ZSBuYW1lICoqL1xuZXhwb3J0IGNvbnN0IE5PTl9CSU5EQUJMRV9BVFRSID0gJ25nTm9uQmluZGFibGUnO1xuXG4vKiogTmFtZSBmb3IgdGhlIHZhcmlhYmxlIGtlZXBpbmcgdHJhY2sgb2YgdGhlIGNvbnRleHQgcmV0dXJuZWQgYnkgYMm1ybVyZXN0b3JlVmlld2AuICovXG5leHBvcnQgY29uc3QgUkVTVE9SRURfVklFV19DT05URVhUX05BTUUgPSAncmVzdG9yZWRDdHgnO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYWxsb2NhdG9yIGZvciBhIHRlbXBvcmFyeSB2YXJpYWJsZS5cbiAqXG4gKiBBIHZhcmlhYmxlIGRlY2xhcmF0aW9uIGlzIGFkZGVkIHRvIHRoZSBzdGF0ZW1lbnRzIHRoZSBmaXJzdCB0aW1lIHRoZSBhbGxvY2F0b3IgaXMgaW52b2tlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBvcmFyeUFsbG9jYXRvcihzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdLCBuYW1lOiBzdHJpbmcpOiAoKSA9PiBvLlJlYWRWYXJFeHByIHtcbiAgbGV0IHRlbXA6IG8uUmVhZFZhckV4cHJ8bnVsbCA9IG51bGw7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgaWYgKCF0ZW1wKSB7XG4gICAgICBzdGF0ZW1lbnRzLnB1c2gobmV3IG8uRGVjbGFyZVZhclN0bXQoVEVNUE9SQVJZX05BTUUsIHVuZGVmaW5lZCwgby5EWU5BTUlDX1RZUEUpKTtcbiAgICAgIHRlbXAgPSBvLnZhcmlhYmxlKG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcDtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZDxUPih0aGlzOiB0LlZpc2l0b3IsIGFyZzogby5FeHByZXNzaW9ufG8uU3RhdGVtZW50fHQuTm9kZSk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgc3RhdGU6IFZpc2l0b3IgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGFuZGxlICR7YXJnLmNvbnN0cnVjdG9yLm5hbWV9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc0xpdGVyYWwodmFsdWU6IGFueSk6IG8uRXhwcmVzc2lvbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBvLmxpdGVyYWxBcnIodmFsdWUubWFwKGFzTGl0ZXJhbCkpO1xuICB9XG4gIHJldHVybiBvLmxpdGVyYWwodmFsdWUsIG8uSU5GRVJSRURfVFlQRSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25kaXRpb25hbGx5Q3JlYXRlTWFwT2JqZWN0TGl0ZXJhbChcbiAgICBrZXlzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfHN0cmluZ1tdfSwga2VlcERlY2xhcmVkPzogYm9vbGVhbik6IG8uRXhwcmVzc2lvbnxudWxsIHtcbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGtleXMpLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gbWFwVG9FeHByZXNzaW9uKGtleXMsIGtlZXBEZWNsYXJlZCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG1hcFRvRXhwcmVzc2lvbihcbiAgICBtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd8c3RyaW5nW119LCBrZWVwRGVjbGFyZWQ/OiBib29sZWFuKTogby5FeHByZXNzaW9uIHtcbiAgcmV0dXJuIG8ubGl0ZXJhbE1hcChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtYXApLm1hcChrZXkgPT4ge1xuICAgIC8vIGNhbm9uaWNhbCBzeW50YXg6IGBkaXJQcm9wOiBwdWJsaWNQcm9wYFxuICAgIC8vIGlmIHRoZXJlIGlzIG5vIGA6YCwgdXNlIGRpclByb3AgPSBlbFByb3BcbiAgICBjb25zdCB2YWx1ZSA9IG1hcFtrZXldO1xuICAgIGxldCBkZWNsYXJlZE5hbWU6IHN0cmluZztcbiAgICBsZXQgcHVibGljTmFtZTogc3RyaW5nO1xuICAgIGxldCBtaW5pZmllZE5hbWU6IHN0cmluZztcbiAgICBsZXQgbmVlZHNEZWNsYXJlZE5hbWU6IGJvb2xlYW47XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBbcHVibGljTmFtZSwgZGVjbGFyZWROYW1lXSA9IHZhbHVlO1xuICAgICAgbWluaWZpZWROYW1lID0ga2V5O1xuICAgICAgbmVlZHNEZWNsYXJlZE5hbWUgPSBwdWJsaWNOYW1lICE9PSBkZWNsYXJlZE5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIFtkZWNsYXJlZE5hbWUsIHB1YmxpY05hbWVdID0gc3BsaXRBdENvbG9uKGtleSwgW2tleSwgdmFsdWVdKTtcbiAgICAgIG1pbmlmaWVkTmFtZSA9IGRlY2xhcmVkTmFtZTtcbiAgICAgIC8vIE9ubHkgaW5jbHVkZSB0aGUgZGVjbGFyZWQgbmFtZSBpZiBleHRyYWN0ZWQgZnJvbSB0aGUga2V5LCBpLmUuIHRoZSBrZXkgY29udGFpbnMgYSBjb2xvbi5cbiAgICAgIC8vIE90aGVyd2lzZSB0aGUgZGVjbGFyZWQgbmFtZSBzaG91bGQgYmUgb21pdHRlZCBldmVuIGlmIGl0IGlzIGRpZmZlcmVudCBmcm9tIHRoZSBwdWJsaWMgbmFtZSxcbiAgICAgIC8vIGFzIGl0IG1heSBoYXZlIGFscmVhZHkgYmVlbiBtaW5pZmllZC5cbiAgICAgIG5lZWRzRGVjbGFyZWROYW1lID0gcHVibGljTmFtZSAhPT0gZGVjbGFyZWROYW1lICYmIGtleS5pbmNsdWRlcygnOicpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBtaW5pZmllZE5hbWUsXG4gICAgICAvLyBwdXQgcXVvdGVzIGFyb3VuZCBrZXlzIHRoYXQgY29udGFpbiBwb3RlbnRpYWxseSB1bnNhZmUgY2hhcmFjdGVyc1xuICAgICAgcXVvdGVkOiBVTlNBRkVfT0JKRUNUX0tFWV9OQU1FX1JFR0VYUC50ZXN0KG1pbmlmaWVkTmFtZSksXG4gICAgICB2YWx1ZTogKGtlZXBEZWNsYXJlZCAmJiBuZWVkc0RlY2xhcmVkTmFtZSkgP1xuICAgICAgICAgIG8ubGl0ZXJhbEFycihbYXNMaXRlcmFsKHB1YmxpY05hbWUpLCBhc0xpdGVyYWwoZGVjbGFyZWROYW1lKV0pIDpcbiAgICAgICAgICBhc0xpdGVyYWwocHVibGljTmFtZSlcbiAgICB9O1xuICB9KSk7XG59XG5cbi8qKlxuICogIFJlbW92ZSB0cmFpbGluZyBudWxsIG5vZGVzIGFzIHRoZXkgYXJlIGltcGxpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOdWxscyhwYXJhbWV0ZXJzOiBvLkV4cHJlc3Npb25bXSk6IG8uRXhwcmVzc2lvbltdIHtcbiAgd2hpbGUgKG8uaXNOdWxsKHBhcmFtZXRlcnNbcGFyYW1ldGVycy5sZW5ndGggLSAxXSkpIHtcbiAgICBwYXJhbWV0ZXJzLnBvcCgpO1xuICB9XG4gIHJldHVybiBwYXJhbWV0ZXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UXVlcnlQcmVkaWNhdGUoXG4gICAgcXVlcnk6IFIzUXVlcnlNZXRhZGF0YSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wpOiBvLkV4cHJlc3Npb24ge1xuICBpZiAoQXJyYXkuaXNBcnJheShxdWVyeS5wcmVkaWNhdGUpKSB7XG4gICAgbGV0IHByZWRpY2F0ZTogby5FeHByZXNzaW9uW10gPSBbXTtcbiAgICBxdWVyeS5wcmVkaWNhdGUuZm9yRWFjaCgoc2VsZWN0b3I6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgLy8gRWFjaCBpdGVtIGluIHByZWRpY2F0ZXMgYXJyYXkgbWF5IGNvbnRhaW4gc3RyaW5ncyB3aXRoIGNvbW1hLXNlcGFyYXRlZCByZWZzXG4gICAgICAvLyAoZm9yIGV4LiAncmVmLCByZWYxLCAuLi4sIHJlZk4nKSwgdGh1cyB3ZSBleHRyYWN0IGluZGl2aWR1YWwgcmVmcyBhbmQgc3RvcmUgdGhlbVxuICAgICAgLy8gYXMgc2VwYXJhdGUgYXJyYXkgZW50aXRpZXNcbiAgICAgIGNvbnN0IHNlbGVjdG9ycyA9IHNlbGVjdG9yLnNwbGl0KCcsJykubWFwKHRva2VuID0+IG8ubGl0ZXJhbCh0b2tlbi50cmltKCkpKTtcbiAgICAgIHByZWRpY2F0ZS5wdXNoKC4uLnNlbGVjdG9ycyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnN0YW50UG9vbC5nZXRDb25zdExpdGVyYWwoby5saXRlcmFsQXJyKHByZWRpY2F0ZSksIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBvcmlnaW5hbCBwcmVkaWNhdGUgbWF5IGhhdmUgYmVlbiB3cmFwcGVkIGluIGEgYGZvcndhcmRSZWYoKWAgY2FsbC5cbiAgICBzd2l0Y2ggKHF1ZXJ5LnByZWRpY2F0ZS5mb3J3YXJkUmVmKSB7XG4gICAgICBjYXNlIEZvcndhcmRSZWZIYW5kbGluZy5Ob25lOlxuICAgICAgY2FzZSBGb3J3YXJkUmVmSGFuZGxpbmcuVW53cmFwcGVkOlxuICAgICAgICByZXR1cm4gcXVlcnkucHJlZGljYXRlLmV4cHJlc3Npb247XG4gICAgICBjYXNlIEZvcndhcmRSZWZIYW5kbGluZy5XcmFwcGVkOlxuICAgICAgICByZXR1cm4gby5pbXBvcnRFeHByKFIzLnJlc29sdmVGb3J3YXJkUmVmKS5jYWxsRm4oW3F1ZXJ5LnByZWRpY2F0ZS5leHByZXNzaW9uXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBmb3IgYW4gb2JqZWN0IGxpdGVyYWwgdXNlZCBkdXJpbmcgY29kZWdlbiBvZiBkZWZpbml0aW9uIG9iamVjdHMuIFRoZSBnZW5lcmljXG4gKiB0eXBlIGBUYCBhbGxvd3MgdG8gcmVmZXJlbmNlIGEgZG9jdW1lbnRlZCB0eXBlIG9mIHRoZSBnZW5lcmF0ZWQgc3RydWN0dXJlLCBzdWNoIHRoYXQgdGhlXG4gKiBwcm9wZXJ0eSBuYW1lcyB0aGF0IGFyZSBzZXQgY2FuIGJlIHJlc29sdmVkIHRvIHRoZWlyIGRvY3VtZW50ZWQgZGVjbGFyYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWZpbml0aW9uTWFwPFQgPSBhbnk+IHtcbiAgdmFsdWVzOiB7a2V5OiBzdHJpbmcsIHF1b3RlZDogYm9vbGVhbiwgdmFsdWU6IG8uRXhwcmVzc2lvbn1bXSA9IFtdO1xuXG4gIHNldChrZXk6IGtleW9mIFQsIHZhbHVlOiBvLkV4cHJlc3Npb258bnVsbCk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdGhpcy52YWx1ZXMucHVzaCh7a2V5OiBrZXkgYXMgc3RyaW5nLCB2YWx1ZSwgcXVvdGVkOiBmYWxzZX0pO1xuICAgIH1cbiAgfVxuXG4gIHRvTGl0ZXJhbE1hcCgpOiBvLkxpdGVyYWxNYXBFeHByIHtcbiAgICByZXR1cm4gby5saXRlcmFsTWFwKHRoaXMudmFsdWVzKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYSBtYXAgb2YgcHJvcGVydGllcyB0byB2YWx1ZXMgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciB0ZW1wbGF0ZSBub2RlLCB3aGljaCBjYW4gYmUgdXNlZFxuICogYnkgdGhlIGRpcmVjdGl2ZSBtYXRjaGluZyBtYWNoaW5lcnkuXG4gKlxuICogQHBhcmFtIGVsT3JUcGwgdGhlIGVsZW1lbnQgb3IgdGVtcGxhdGUgaW4gcXVlc3Rpb25cbiAqIEByZXR1cm4gYW4gb2JqZWN0IHNldCB1cCBmb3IgZGlyZWN0aXZlIG1hdGNoaW5nLiBGb3IgYXR0cmlidXRlcyBvbiB0aGUgZWxlbWVudC90ZW1wbGF0ZSwgdGhpc1xuICogb2JqZWN0IG1hcHMgYSBwcm9wZXJ0eSBuYW1lIHRvIGl0cyAoc3RhdGljKSB2YWx1ZS4gRm9yIGFueSBiaW5kaW5ncywgdGhpcyBtYXAgc2ltcGx5IG1hcHMgdGhlXG4gKiBwcm9wZXJ0eSBuYW1lIHRvIGFuIGVtcHR5IHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEF0dHJzRm9yRGlyZWN0aXZlTWF0Y2hpbmcoZWxPclRwbDogdC5FbGVtZW50fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5UZW1wbGF0ZSk6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXNNYXA6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG5cbiAgaWYgKGVsT3JUcGwgaW5zdGFuY2VvZiB0LlRlbXBsYXRlICYmIGVsT3JUcGwudGFnTmFtZSAhPT0gJ25nLXRlbXBsYXRlJykge1xuICAgIGVsT3JUcGwudGVtcGxhdGVBdHRycy5mb3JFYWNoKGEgPT4gYXR0cmlidXRlc01hcFthLm5hbWVdID0gJycpO1xuICB9IGVsc2Uge1xuICAgIGVsT3JUcGwuYXR0cmlidXRlcy5mb3JFYWNoKGEgPT4ge1xuICAgICAgaWYgKCFpc0kxOG5BdHRyaWJ1dGUoYS5uYW1lKSkge1xuICAgICAgICBhdHRyaWJ1dGVzTWFwW2EubmFtZV0gPSBhLnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZWxPclRwbC5pbnB1dHMuZm9yRWFjaChpID0+IHtcbiAgICAgIGF0dHJpYnV0ZXNNYXBbaS5uYW1lXSA9ICcnO1xuICAgIH0pO1xuICAgIGVsT3JUcGwub3V0cHV0cy5mb3JFYWNoKG8gPT4ge1xuICAgICAgYXR0cmlidXRlc01hcFtvLm5hbWVdID0gJyc7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlc01hcDtcbn1cblxuLyoqIFJldHVybnMgYSBjYWxsIGV4cHJlc3Npb24gdG8gYSBjaGFpbmVkIGluc3RydWN0aW9uLCBlLmcuIGBwcm9wZXJ0eShwYXJhbXNbMF0pKHBhcmFtc1sxXSlgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYWluZWRJbnN0cnVjdGlvbihcbiAgICByZWZlcmVuY2U6IG8uRXh0ZXJuYWxSZWZlcmVuY2UsIGNhbGxzOiBvLkV4cHJlc3Npb25bXVtdLCBzcGFuPzogUGFyc2VTb3VyY2VTcGFufG51bGwpIHtcbiAgbGV0IGV4cHJlc3Npb24gPSBvLmltcG9ydEV4cHIocmVmZXJlbmNlLCBudWxsLCBzcGFuKSBhcyBvLkV4cHJlc3Npb247XG5cbiAgaWYgKGNhbGxzLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBleHByZXNzaW9uID0gZXhwcmVzc2lvbi5jYWxsRm4oY2FsbHNbaV0sIHNwYW4pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBBZGQgYSBibGFuayBpbnZvY2F0aW9uLCBpbiBjYXNlIHRoZSBgY2FsbHNgIGFycmF5IGlzIGVtcHR5LlxuICAgIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLmNhbGxGbihbXSwgc3Bhbik7XG4gIH1cblxuICByZXR1cm4gZXhwcmVzc2lvbjtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgYXJndW1lbnRzIGV4cGVjdGVkIHRvIGJlIHBhc3NlZCB0byBhIGdlbmVyYXRlZCBpbnN0cnVjdGlvbiBpbiB0aGUgY2FzZSBvZlxuICogaW50ZXJwb2xhdGlvbiBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiBBbiBpbnRlcnBvbGF0aW9uIGFzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW50ZXJwb2xhdGlvbkFyZ3NMZW5ndGgoaW50ZXJwb2xhdGlvbjogSW50ZXJwb2xhdGlvbikge1xuICBjb25zdCB7ZXhwcmVzc2lvbnMsIHN0cmluZ3N9ID0gaW50ZXJwb2xhdGlvbjtcbiAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSAmJiBzdHJpbmdzLmxlbmd0aCA9PT0gMiAmJiBzdHJpbmdzWzBdID09PSAnJyAmJiBzdHJpbmdzWzFdID09PSAnJykge1xuICAgIC8vIElmIHRoZSBpbnRlcnBvbGF0aW9uIGhhcyBvbmUgaW50ZXJwb2xhdGVkIHZhbHVlLCBidXQgdGhlIHByZWZpeCBhbmQgc3VmZml4IGFyZSBib3RoIGVtcHR5XG4gICAgLy8gc3RyaW5ncywgd2Ugb25seSBwYXNzIG9uZSBhcmd1bWVudCwgdG8gYSBzcGVjaWFsIGluc3RydWN0aW9uIGxpa2UgYHByb3BlcnR5SW50ZXJwb2xhdGVgIG9yXG4gICAgLy8gYHRleHRJbnRlcnBvbGF0ZWAuXG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cHJlc3Npb25zLmxlbmd0aCArIHN0cmluZ3MubGVuZ3RoO1xuICB9XG59XG4iXX0=