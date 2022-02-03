/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * This file is a port of shadowCSS from webcomponents.js to TypeScript.
 *
 * Please make sure to keep to edits in sync with the source file.
 *
 * Source:
 * https://github.com/webcomponents/webcomponentsjs/blob/4efecd7e0e/src/ShadowCSS/ShadowCSS.js
 *
 * The original file level comment is reproduced below
 */
/*
  This is a limited shim for ShadowDOM css styling.
  https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles

  The intention here is to support only the styling features which can be
  relatively simply implemented. The goal is to allow users to avoid the
  most obvious pitfalls and do so without compromising performance significantly.
  For ShadowDOM styling that's not covered here, a set of best practices
  can be provided that should allow users to accomplish more complex styling.

  The following is a list of specific ShadowDOM styling features and a brief
  discussion of the approach used to shim.

  Shimmed features:

  * :host, :host-context: ShadowDOM allows styling of the shadowRoot's host
  element using the :host rule. To shim this feature, the :host styles are
  reformatted and prefixed with a given scope name and promoted to a
  document level stylesheet.
  For example, given a scope name of .foo, a rule like this:

    :host {
        background: red;
      }
    }

  becomes:

    .foo {
      background: red;
    }

  * encapsulation: Styles defined within ShadowDOM, apply only to
  dom inside the ShadowDOM. Polymer uses one of two techniques to implement
  this feature.

  By default, rules are prefixed with the host element tag name
  as a descendant selector. This ensures styling does not leak out of the 'top'
  of the element's ShadowDOM. For example,

  div {
      font-weight: bold;
    }

  becomes:

  x-foo div {
      font-weight: bold;
    }

  becomes:


  Alternatively, if WebComponents.ShadowCSS.strictStyling is set to true then
  selectors are scoped by adding an attribute selector suffix to each
  simple selector that contains the host element tag name. Each element
  in the element's ShadowDOM template is also given the scope attribute.
  Thus, these rules match only elements that have the scope attribute.
  For example, given a scope name of x-foo, a rule like this:

    div {
      font-weight: bold;
    }

  becomes:

    div[x-foo] {
      font-weight: bold;
    }

  Note that elements that are dynamically added to a scope must have the scope
  selector added to them manually.

  * upper/lower bound encapsulation: Styles which are defined outside a
  shadowRoot should not cross the ShadowDOM boundary and should not apply
  inside a shadowRoot.

  This styling behavior is not emulated. Some possible ways to do this that
  were rejected due to complexity and/or performance concerns include: (1) reset
  every possible property for every possible selector for a given scope name;
  (2) re-implement css in javascript.

  As an alternative, users should make sure to use selectors
  specific to the scope in which they are working.

  * ::distributed: This behavior is not emulated. It's often not necessary
  to style the contents of a specific insertion point and instead, descendants
  of the host element can be styled selectively. Users can also create an
  extra node around an insertion point and style that node's contents
  via descendent selectors. For example, with a shadowRoot like this:

    <style>
      ::content(div) {
        background: red;
      }
    </style>
    <content></content>

  could become:

    <style>
      / *@polyfill .content-container div * /
      ::content(div) {
        background: red;
      }
    </style>
    <div class="content-container">
      <content></content>
    </div>

  Note the use of @polyfill in the comment above a ShadowDOM specific style
  declaration. This is a directive to the styling shim to use the selector
  in comments in lieu of the next selector when running under polyfill.
*/
export class ShadowCss {
    constructor() {
        this.strictStyling = true;
    }
    /*
     * Shim some cssText with the given selector. Returns cssText that can
     * be included in the document via WebComponents.ShadowCSS.addCssToDocument(css).
     *
     * When strictStyling is true:
     * - selector is the attribute added to all elements inside the host,
     * - hostSelector is the attribute added to the host itself.
     */
    shimCssText(cssText, selector, hostSelector = '') {
        const commentsWithHash = extractCommentsWithHash(cssText);
        cssText = stripComments(cssText);
        cssText = this._insertDirectives(cssText);
        const scopedCssText = this._scopeCssText(cssText, selector, hostSelector);
        return [scopedCssText, ...commentsWithHash].join('\n');
    }
    _insertDirectives(cssText) {
        cssText = this._insertPolyfillDirectivesInCssText(cssText);
        return this._insertPolyfillRulesInCssText(cssText);
    }
    /*
     * Process styles to convert native ShadowDOM rules that will trip
     * up the css parser; we rely on decorating the stylesheet with inert rules.
     *
     * For example, we convert this rule:
     *
     * polyfill-next-selector { content: ':host menu-item'; }
     * ::content menu-item {
     *
     * to this:
     *
     * scopeName menu-item {
     *
     **/
    _insertPolyfillDirectivesInCssText(cssText) {
        // Difference with webcomponents.js: does not handle comments
        return cssText.replace(_cssContentNextSelectorRe, function (...m) {
            return m[2] + '{';
        });
    }
    /*
     * Process styles to add rules which will only apply under the polyfill
     *
     * For example, we convert this rule:
     *
     * polyfill-rule {
     *   content: ':host menu-item';
     * ...
     * }
     *
     * to this:
     *
     * scopeName menu-item {...}
     *
     **/
    _insertPolyfillRulesInCssText(cssText) {
        // Difference with webcomponents.js: does not handle comments
        return cssText.replace(_cssContentRuleRe, (...m) => {
            const rule = m[0].replace(m[1], '').replace(m[2], '');
            return m[4] + rule;
        });
    }
    /* Ensure styles are scoped. Pseudo-scoping takes a rule like:
     *
     *  .foo {... }
     *
     *  and converts this to
     *
     *  scopeName .foo { ... }
     */
    _scopeCssText(cssText, scopeSelector, hostSelector) {
        const unscopedRules = this._extractUnscopedRulesFromCssText(cssText);
        // replace :host and :host-context -shadowcsshost and -shadowcsshost respectively
        cssText = this._insertPolyfillHostInCssText(cssText);
        cssText = this._convertColonHost(cssText);
        cssText = this._convertColonHostContext(cssText);
        cssText = this._convertShadowDOMSelectors(cssText);
        if (scopeSelector) {
            cssText = this._scopeSelectors(cssText, scopeSelector, hostSelector);
        }
        cssText = cssText + '\n' + unscopedRules;
        return cssText.trim();
    }
    /*
     * Process styles to add rules which will only apply under the polyfill
     * and do not process via CSSOM. (CSSOM is destructive to rules on rare
     * occasions, e.g. -webkit-calc on Safari.)
     * For example, we convert this rule:
     *
     * @polyfill-unscoped-rule {
     *   content: 'menu-item';
     * ... }
     *
     * to this:
     *
     * menu-item {...}
     *
     **/
    _extractUnscopedRulesFromCssText(cssText) {
        // Difference with webcomponents.js: does not handle comments
        let r = '';
        let m;
        _cssContentUnscopedRuleRe.lastIndex = 0;
        while ((m = _cssContentUnscopedRuleRe.exec(cssText)) !== null) {
            const rule = m[0].replace(m[2], '').replace(m[1], m[4]);
            r += rule + '\n\n';
        }
        return r;
    }
    /*
     * convert a rule like :host(.foo) > .bar { }
     *
     * to
     *
     * .foo<scopeName> > .bar
     */
    _convertColonHost(cssText) {
        return cssText.replace(_cssColonHostRe, (_, hostSelectors, otherSelectors) => {
            if (hostSelectors) {
                const convertedSelectors = [];
                const hostSelectorArray = hostSelectors.split(',').map(p => p.trim());
                for (const hostSelector of hostSelectorArray) {
                    if (!hostSelector)
                        break;
                    const convertedSelector = _polyfillHostNoCombinator + hostSelector.replace(_polyfillHost, '') + otherSelectors;
                    convertedSelectors.push(convertedSelector);
                }
                return convertedSelectors.join(',');
            }
            else {
                return _polyfillHostNoCombinator + otherSelectors;
            }
        });
    }
    /*
     * convert a rule like :host-context(.foo) > .bar { }
     *
     * to
     *
     * .foo<scopeName> > .bar, .foo <scopeName> > .bar { }
     *
     * and
     *
     * :host-context(.foo:host) .bar { ... }
     *
     * to
     *
     * .foo<scopeName> .bar { ... }
     */
    _convertColonHostContext(cssText) {
        return cssText.replace(_cssColonHostContextReGlobal, selectorText => {
            // We have captured a selector that contains a `:host-context` rule.
            // For backward compatibility `:host-context` may contain a comma separated list of selectors.
            // Each context selector group will contain a list of host-context selectors that must match
            // an ancestor of the host.
            // (Normally `contextSelectorGroups` will only contain a single array of context selectors.)
            const contextSelectorGroups = [[]];
            // There may be more than `:host-context` in this selector so `selectorText` could look like:
            // `:host-context(.one):host-context(.two)`.
            // Execute `_cssColonHostContextRe` over and over until we have extracted all the
            // `:host-context` selectors from this selector.
            let match;
            while (match = _cssColonHostContextRe.exec(selectorText)) {
                // `match` = [':host-context(<selectors>)<rest>', <selectors>, <rest>]
                // The `<selectors>` could actually be a comma separated list: `:host-context(.one, .two)`.
                const newContextSelectors = (match[1] ?? '').trim().split(',').map(m => m.trim()).filter(m => m !== '');
                // We must duplicate the current selector group for each of these new selectors.
                // For example if the current groups are:
                // ```
                // [
                //   ['a', 'b', 'c'],
                //   ['x', 'y', 'z'],
                // ]
                // ```
                // And we have a new set of comma separated selectors: `:host-context(m,n)` then the new
                // groups are:
                // ```
                // [
                //   ['a', 'b', 'c', 'm'],
                //   ['x', 'y', 'z', 'm'],
                //   ['a', 'b', 'c', 'n'],
                //   ['x', 'y', 'z', 'n'],
                // ]
                // ```
                const contextSelectorGroupsLength = contextSelectorGroups.length;
                repeatGroups(contextSelectorGroups, newContextSelectors.length);
                for (let i = 0; i < newContextSelectors.length; i++) {
                    for (let j = 0; j < contextSelectorGroupsLength; j++) {
                        contextSelectorGroups[j + (i * contextSelectorGroupsLength)].push(newContextSelectors[i]);
                    }
                }
                // Update the `selectorText` and see repeat to see if there are more `:host-context`s.
                selectorText = match[2];
            }
            // The context selectors now must be combined with each other to capture all the possible
            // selectors that `:host-context` can match. See `combineHostContextSelectors()` for more
            // info about how this is done.
            return contextSelectorGroups
                .map(contextSelectors => combineHostContextSelectors(contextSelectors, selectorText))
                .join(', ');
        });
    }
    /*
     * Convert combinators like ::shadow and pseudo-elements like ::content
     * by replacing with space.
     */
    _convertShadowDOMSelectors(cssText) {
        return _shadowDOMSelectorsRe.reduce((result, pattern) => result.replace(pattern, ' '), cssText);
    }
    // change a selector like 'div' to 'name div'
    _scopeSelectors(cssText, scopeSelector, hostSelector) {
        return processRules(cssText, (rule) => {
            let selector = rule.selector;
            let content = rule.content;
            if (rule.selector[0] !== '@') {
                selector =
                    this._scopeSelector(rule.selector, scopeSelector, hostSelector, this.strictStyling);
            }
            else if (rule.selector.startsWith('@media') || rule.selector.startsWith('@supports') ||
                rule.selector.startsWith('@document')) {
                content = this._scopeSelectors(rule.content, scopeSelector, hostSelector);
            }
            else if (rule.selector.startsWith('@font-face') || rule.selector.startsWith('@page')) {
                content = this._stripScopingSelectors(rule.content);
            }
            return new CssRule(selector, content);
        });
    }
    /**
     * Handle a css text that is within a rule that should not contain scope selectors by simply
     * removing them! An example of such a rule is `@font-face`.
     *
     * `@font-face` rules cannot contain nested selectors. Nor can they be nested under a selector.
     * Normally this would be a syntax error by the author of the styles. But in some rare cases, such
     * as importing styles from a library, and applying `:host ::ng-deep` to the imported styles, we
     * can end up with broken css if the imported styles happen to contain @font-face rules.
     *
     * For example:
     *
     * ```
     * :host ::ng-deep {
     *   import 'some/lib/containing/font-face';
     * }
     *
     * Similar logic applies to `@page` rules which can contain a particular set of properties,
     * as well as some specific at-rules. Since they can't be encapsulated, we have to strip
     * any scoping selectors from them. For more information: https://www.w3.org/TR/css-page-3
     * ```
     */
    _stripScopingSelectors(cssText) {
        return processRules(cssText, rule => {
            const selector = rule.selector.replace(_shadowDeepSelectors, ' ')
                .replace(_polyfillHostNoCombinatorRe, ' ');
            return new CssRule(selector, rule.content);
        });
    }
    _scopeSelector(selector, scopeSelector, hostSelector, strict) {
        return selector.split(',')
            .map(part => part.trim().split(_shadowDeepSelectors))
            .map((deepParts) => {
            const [shallowPart, ...otherParts] = deepParts;
            const applyScope = (shallowPart) => {
                if (this._selectorNeedsScoping(shallowPart, scopeSelector)) {
                    return strict ?
                        this._applyStrictSelectorScope(shallowPart, scopeSelector, hostSelector) :
                        this._applySelectorScope(shallowPart, scopeSelector, hostSelector);
                }
                else {
                    return shallowPart;
                }
            };
            return [applyScope(shallowPart), ...otherParts].join(' ');
        })
            .join(', ');
    }
    _selectorNeedsScoping(selector, scopeSelector) {
        const re = this._makeScopeMatcher(scopeSelector);
        return !re.test(selector);
    }
    _makeScopeMatcher(scopeSelector) {
        const lre = /\[/g;
        const rre = /\]/g;
        scopeSelector = scopeSelector.replace(lre, '\\[').replace(rre, '\\]');
        return new RegExp('^(' + scopeSelector + ')' + _selectorReSuffix, 'm');
    }
    _applySelectorScope(selector, scopeSelector, hostSelector) {
        // Difference from webcomponents.js: scopeSelector could not be an array
        return this._applySimpleSelectorScope(selector, scopeSelector, hostSelector);
    }
    // scope via name and [is=name]
    _applySimpleSelectorScope(selector, scopeSelector, hostSelector) {
        // In Android browser, the lastIndex is not reset when the regex is used in String.replace()
        _polyfillHostRe.lastIndex = 0;
        if (_polyfillHostRe.test(selector)) {
            const replaceBy = this.strictStyling ? `[${hostSelector}]` : scopeSelector;
            return selector
                .replace(_polyfillHostNoCombinatorRe, (hnc, selector) => {
                return selector.replace(/([^:]*)(:*)(.*)/, (_, before, colon, after) => {
                    return before + replaceBy + colon + after;
                });
            })
                .replace(_polyfillHostRe, replaceBy + ' ');
        }
        return scopeSelector + ' ' + selector;
    }
    // return a selector with [name] suffix on each simple selector
    // e.g. .foo.bar > .zot becomes .foo[name].bar[name] > .zot[name]  /** @internal */
    _applyStrictSelectorScope(selector, scopeSelector, hostSelector) {
        const isRe = /\[is=([^\]]*)\]/g;
        scopeSelector = scopeSelector.replace(isRe, (_, ...parts) => parts[0]);
        const attrName = '[' + scopeSelector + ']';
        const _scopeSelectorPart = (p) => {
            let scopedP = p.trim();
            if (!scopedP) {
                return '';
            }
            if (p.indexOf(_polyfillHostNoCombinator) > -1) {
                scopedP = this._applySimpleSelectorScope(p, scopeSelector, hostSelector);
            }
            else {
                // remove :host since it should be unnecessary
                const t = p.replace(_polyfillHostRe, '');
                if (t.length > 0) {
                    const matches = t.match(/([^:]*)(:*)(.*)/);
                    if (matches) {
                        scopedP = matches[1] + attrName + matches[2] + matches[3];
                    }
                }
            }
            return scopedP;
        };
        const safeContent = new SafeSelector(selector);
        selector = safeContent.content();
        let scopedSelector = '';
        let startIndex = 0;
        let res;
        const sep = /( |>|\+|~(?!=))\s*/g;
        // If a selector appears before :host it should not be shimmed as it
        // matches on ancestor elements and not on elements in the host's shadow
        // `:host-context(div)` is transformed to
        // `-shadowcsshost-no-combinatordiv, div -shadowcsshost-no-combinator`
        // the `div` is not part of the component in the 2nd selectors and should not be scoped.
        // Historically `component-tag:host` was matching the component so we also want to preserve
        // this behavior to avoid breaking legacy apps (it should not match).
        // The behavior should be:
        // - `tag:host` -> `tag[h]` (this is to avoid breaking legacy apps, should not match anything)
        // - `tag :host` -> `tag [h]` (`tag` is not scoped because it's considered part of a
        //   `:host-context(tag)`)
        const hasHost = selector.indexOf(_polyfillHostNoCombinator) > -1;
        // Only scope parts after the first `-shadowcsshost-no-combinator` when it is present
        let shouldScope = !hasHost;
        while ((res = sep.exec(selector)) !== null) {
            const separator = res[1];
            const part = selector.slice(startIndex, res.index).trim();
            shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
            const scopedPart = shouldScope ? _scopeSelectorPart(part) : part;
            scopedSelector += `${scopedPart} ${separator} `;
            startIndex = sep.lastIndex;
        }
        const part = selector.substring(startIndex);
        shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
        scopedSelector += shouldScope ? _scopeSelectorPart(part) : part;
        // replace the placeholders with their original values
        return safeContent.restore(scopedSelector);
    }
    _insertPolyfillHostInCssText(selector) {
        return selector.replace(_colonHostContextRe, _polyfillHostContext)
            .replace(_colonHostRe, _polyfillHost);
    }
}
class SafeSelector {
    constructor(selector) {
        this.placeholders = [];
        this.index = 0;
        // Replaces attribute selectors with placeholders.
        // The WS in [attr="va lue"] would otherwise be interpreted as a selector separator.
        selector = this._escapeRegexMatches(selector, /(\[[^\]]*\])/g);
        // CSS allows for certain special characters to be used in selectors if they're escaped.
        // E.g. `.foo:blue` won't match a class called `foo:blue`, because the colon denotes a
        // pseudo-class, but writing `.foo\:blue` will match, because the colon was escaped.
        // Replace all escape sequences (`\` followed by a character) with a placeholder so
        // that our handling of pseudo-selectors doesn't mess with them.
        selector = this._escapeRegexMatches(selector, /(\\.)/g);
        // Replaces the expression in `:nth-child(2n + 1)` with a placeholder.
        // WS and "+" would otherwise be interpreted as selector separators.
        this._content = selector.replace(/(:nth-[-\w]+)(\([^)]+\))/g, (_, pseudo, exp) => {
            const replaceBy = `__ph-${this.index}__`;
            this.placeholders.push(exp);
            this.index++;
            return pseudo + replaceBy;
        });
    }
    restore(content) {
        return content.replace(/__ph-(\d+)__/g, (_ph, index) => this.placeholders[+index]);
    }
    content() {
        return this._content;
    }
    /**
     * Replaces all of the substrings that match a regex within a
     * special string (e.g. `__ph-0__`, `__ph-1__`, etc).
     */
    _escapeRegexMatches(content, pattern) {
        return content.replace(pattern, (_, keep) => {
            const replaceBy = `__ph-${this.index}__`;
            this.placeholders.push(keep);
            this.index++;
            return replaceBy;
        });
    }
}
const _cssContentNextSelectorRe = /polyfill-next-selector[^}]*content:[\s]*?(['"])(.*?)\1[;\s]*}([^{]*?){/gim;
const _cssContentRuleRe = /(polyfill-rule)[^}]*(content:[\s]*(['"])(.*?)\3)[;\s]*[^}]*}/gim;
const _cssContentUnscopedRuleRe = /(polyfill-unscoped-rule)[^}]*(content:[\s]*(['"])(.*?)\3)[;\s]*[^}]*}/gim;
const _polyfillHost = '-shadowcsshost';
// note: :host-context pre-processed to -shadowcsshostcontext.
const _polyfillHostContext = '-shadowcsscontext';
const _parenSuffix = '(?:\\((' +
    '(?:\\([^)(]*\\)|[^)(]*)+?' +
    ')\\))?([^,{]*)';
const _cssColonHostRe = new RegExp(_polyfillHost + _parenSuffix, 'gim');
const _cssColonHostContextReGlobal = new RegExp(_polyfillHostContext + _parenSuffix, 'gim');
const _cssColonHostContextRe = new RegExp(_polyfillHostContext + _parenSuffix, 'im');
const _polyfillHostNoCombinator = _polyfillHost + '-no-combinator';
const _polyfillHostNoCombinatorRe = /-shadowcsshost-no-combinator([^\s]*)/;
const _shadowDOMSelectorsRe = [
    /::shadow/g,
    /::content/g,
    // Deprecated selectors
    /\/shadow-deep\//g,
    /\/shadow\//g,
];
// The deep combinator is deprecated in the CSS spec
// Support for `>>>`, `deep`, `::ng-deep` is then also deprecated and will be removed in the future.
// see https://github.com/angular/angular/pull/17677
const _shadowDeepSelectors = /(?:>>>)|(?:\/deep\/)|(?:::ng-deep)/g;
const _selectorReSuffix = '([>\\s~+[.,{:][\\s\\S]*)?$';
const _polyfillHostRe = /-shadowcsshost/gim;
const _colonHostRe = /:host/gim;
const _colonHostContextRe = /:host-context/gim;
const _commentRe = /\/\*[\s\S]*?\*\//g;
function stripComments(input) {
    return input.replace(_commentRe, '');
}
const _commentWithHashRe = /\/\*\s*#\s*source(Mapping)?URL=[\s\S]+?\*\//g;
function extractCommentsWithHash(input) {
    return input.match(_commentWithHashRe) || [];
}
const BLOCK_PLACEHOLDER = '%BLOCK%';
const QUOTE_PLACEHOLDER = '%QUOTED%';
const _ruleRe = /(\s*)([^;\{\}]+?)(\s*)((?:{%BLOCK%}?\s*;?)|(?:\s*;))/g;
const _quotedRe = /%QUOTED%/g;
const CONTENT_PAIRS = new Map([['{', '}']]);
const QUOTE_PAIRS = new Map([[`"`, `"`], [`'`, `'`]]);
export class CssRule {
    constructor(selector, content) {
        this.selector = selector;
        this.content = content;
    }
}
export function processRules(input, ruleCallback) {
    const inputWithEscapedQuotes = escapeBlocks(input, QUOTE_PAIRS, QUOTE_PLACEHOLDER);
    const inputWithEscapedBlocks = escapeBlocks(inputWithEscapedQuotes.escapedString, CONTENT_PAIRS, BLOCK_PLACEHOLDER);
    let nextBlockIndex = 0;
    let nextQuoteIndex = 0;
    return inputWithEscapedBlocks.escapedString
        .replace(_ruleRe, (...m) => {
        const selector = m[2];
        let content = '';
        let suffix = m[4];
        let contentPrefix = '';
        if (suffix && suffix.startsWith('{' + BLOCK_PLACEHOLDER)) {
            content = inputWithEscapedBlocks.blocks[nextBlockIndex++];
            suffix = suffix.substring(BLOCK_PLACEHOLDER.length + 1);
            contentPrefix = '{';
        }
        const rule = ruleCallback(new CssRule(selector, content));
        return `${m[1]}${rule.selector}${m[3]}${contentPrefix}${rule.content}${suffix}`;
    })
        .replace(_quotedRe, () => inputWithEscapedQuotes.blocks[nextQuoteIndex++]);
}
class StringWithEscapedBlocks {
    constructor(escapedString, blocks) {
        this.escapedString = escapedString;
        this.blocks = blocks;
    }
}
function escapeBlocks(input, charPairs, placeholder) {
    const resultParts = [];
    const escapedBlocks = [];
    let openCharCount = 0;
    let nonBlockStartIndex = 0;
    let blockStartIndex = -1;
    let openChar;
    let closeChar;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '\\') {
            i++;
        }
        else if (char === closeChar) {
            openCharCount--;
            if (openCharCount === 0) {
                escapedBlocks.push(input.substring(blockStartIndex, i));
                resultParts.push(placeholder);
                nonBlockStartIndex = i;
                blockStartIndex = -1;
                openChar = closeChar = undefined;
            }
        }
        else if (char === openChar) {
            openCharCount++;
        }
        else if (openCharCount === 0 && charPairs.has(char)) {
            openChar = char;
            closeChar = charPairs.get(char);
            openCharCount = 1;
            blockStartIndex = i + 1;
            resultParts.push(input.substring(nonBlockStartIndex, blockStartIndex));
        }
    }
    if (blockStartIndex !== -1) {
        escapedBlocks.push(input.substring(blockStartIndex));
        resultParts.push(placeholder);
    }
    else {
        resultParts.push(input.substring(nonBlockStartIndex));
    }
    return new StringWithEscapedBlocks(resultParts.join(''), escapedBlocks);
}
/**
 * Combine the `contextSelectors` with the `hostMarker` and the `otherSelectors`
 * to create a selector that matches the same as `:host-context()`.
 *
 * Given a single context selector `A` we need to output selectors that match on the host and as an
 * ancestor of the host:
 *
 * ```
 * A <hostMarker>, A<hostMarker> {}
 * ```
 *
 * When there is more than one context selector we also have to create combinations of those
 * selectors with each other. For example if there are `A` and `B` selectors the output is:
 *
 * ```
 * AB<hostMarker>, AB <hostMarker>, A B<hostMarker>,
 * B A<hostMarker>, A B <hostMarker>, B A <hostMarker> {}
 * ```
 *
 * And so on...
 *
 * @param hostMarker the string that selects the host element.
 * @param contextSelectors an array of context selectors that will be combined.
 * @param otherSelectors the rest of the selectors that are not context selectors.
 */
function combineHostContextSelectors(contextSelectors, otherSelectors) {
    const hostMarker = _polyfillHostNoCombinator;
    _polyfillHostRe.lastIndex = 0; // reset the regex to ensure we get an accurate test
    const otherSelectorsHasHost = _polyfillHostRe.test(otherSelectors);
    // If there are no context selectors then just output a host marker
    if (contextSelectors.length === 0) {
        return hostMarker + otherSelectors;
    }
    const combined = [contextSelectors.pop() || ''];
    while (contextSelectors.length > 0) {
        const length = combined.length;
        const contextSelector = contextSelectors.pop();
        for (let i = 0; i < length; i++) {
            const previousSelectors = combined[i];
            // Add the new selector as a descendant of the previous selectors
            combined[length * 2 + i] = previousSelectors + ' ' + contextSelector;
            // Add the new selector as an ancestor of the previous selectors
            combined[length + i] = contextSelector + ' ' + previousSelectors;
            // Add the new selector to act on the same element as the previous selectors
            combined[i] = contextSelector + previousSelectors;
        }
    }
    // Finally connect the selector to the `hostMarker`s: either acting directly on the host
    // (A<hostMarker>) or as an ancestor (A <hostMarker>).
    return combined
        .map(s => otherSelectorsHasHost ?
        `${s}${otherSelectors}` :
        `${s}${hostMarker}${otherSelectors}, ${s} ${hostMarker}${otherSelectors}`)
        .join(',');
}
/**
 * Mutate the given `groups` array so that there are `multiples` clones of the original array
 * stored.
 *
 * For example `repeatGroups([a, b], 3)` will result in `[a, b, a, b, a, b]` - but importantly the
 * newly added groups will be clones of the original.
 *
 * @param groups An array of groups of strings that will be repeated. This array is mutated
 *     in-place.
 * @param multiples The number of times the current groups should appear.
 */
export function repeatGroups(groups, multiples) {
    const length = groups.length;
    for (let i = 1; i < multiples; i++) {
        for (let j = 0; j < length; j++) {
            groups[j + (i * length)] = groups[j].slice(0);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZG93X2Nzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9zaGFkb3dfY3NzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7R0FTRztBQUVIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWlIRTtBQUVGLE1BQU0sT0FBTyxTQUFTO0lBQXRCO1FBQ0Usa0JBQWEsR0FBWSxJQUFJLENBQUM7SUE0WmhDLENBQUM7SUExWkM7Ozs7Ozs7T0FPRztJQUNILFdBQVcsQ0FBQyxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxlQUF1QixFQUFFO1FBQ3RFLE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUQsT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTFDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMxRSxPQUFPLENBQUMsYUFBYSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVPLGlCQUFpQixDQUFDLE9BQWU7UUFDdkMsT0FBTyxHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzRCxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7UUFhSTtJQUNJLGtDQUFrQyxD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cUIsQ0FBQyxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxHQUFHLGNBQWMsRUFBRSxDQUFDLENBQUM7UUFDekIsR0FBRyxDQUFDLEdBQUcsVUFBVSxHQUFHLGNBQWMsS0FBSyxDQUFDLElBQUksVUFBVSxHQUFHLGNBQWMsRUFBRSxDQUFDO1NBQ2pGLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBa0IsRUFBRSxTQUFpQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvQztLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgZmlsZSBpcyBhIHBvcnQgb2Ygc2hhZG93Q1NTIGZyb20gd2ViY29tcG9uZW50cy5qcyB0byBUeXBlU2NyaXB0LlxuICpcbiAqIFBsZWFzZSBtYWtlIHN1cmUgdG8ga2VlcCB0byBlZGl0cyBpbiBzeW5jIHdpdGggdGhlIHNvdXJjZSBmaWxlLlxuICpcbiAqIFNvdXJjZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJjb21wb25lbnRzL3dlYmNvbXBvbmVudHNqcy9ibG9iLzRlZmVjZDdlMGUvc3JjL1NoYWRvd0NTUy9TaGFkb3dDU1MuanNcbiAqXG4gKiBUaGUgb3JpZ2luYWwgZmlsZSBsZXZlbCBjb21tZW50IGlzIHJlcHJvZHVjZWQgYmVsb3dcbiAqL1xuXG4vKlxuICBUaGlzIGlzIGEgbGltaXRlZCBzaGltIGZvciBTaGFkb3dET00gY3NzIHN0eWxpbmcuXG4gIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvd2ViY29tcG9uZW50cy9yYXctZmlsZS90aXAvc3BlYy9zaGFkb3cvaW5kZXguaHRtbCNzdHlsZXNcblxuICBUaGUgaW50ZW50aW9uIGhlcmUgaXMgdG8gc3VwcG9ydCBvbmx5IHRoZSBzdHlsaW5nIGZlYXR1cmVzIHdoaWNoIGNhbiBiZVxuICByZWxhdGl2ZWx5IHNpbXBseSBpbXBsZW1lbnRlZC4gVGhlIGdvYWwgaXMgdG8gYWxsb3cgdXNlcnMgdG8gYXZvaWQgdGhlXG4gIG1vc3Qgb2J2aW91cyBwaXRmYWxscyBhbmQgZG8gc28gd2l0aG91dCBjb21wcm9taXNpbmcgcGVyZm9ybWFuY2Ugc2lnbmlmaWNhbnRseS5cbiAgRm9yIFNoYWRvd0RPTSBzdHlsaW5nIHRoYXQncyBub3QgY292ZXJlZCBoZXJlLCBhIHNldCBvZiBiZXN0IHByYWN0aWNlc1xuICBjYW4gYmUgcHJvdmlkZWQgdGhhdCBzaG91bGQgYWxsb3cgdXNlcnMgdG8gYWNjb21wbGlzaCBtb3JlIGNvbXBsZXggc3R5bGluZy5cblxuICBUaGUgZm9sbG93aW5nIGlzIGEgbGlzdCBvZiBzcGVjaWZpYyBTaGFkb3dET00gc3R5bGluZyBmZWF0dXJlcyBhbmQgYSBicmllZlxuICBkaXNjdXNzaW9uIG9mIHRoZSBhcHByb2FjaCB1c2VkIHRvIHNoaW0uXG5cbiAgU2hpbW1lZCBmZWF0dXJlczpcblxuICAqIDpob3N0LCA6aG9zdC1jb250ZXh0OiBTaGFkb3dET00gYWxsb3dzIHN0eWxpbmcgb2YgdGhlIHNoYWRvd1Jvb3QncyBob3N0XG4gIGVsZW1lbnQgdXNpbmcgdGhlIDpob3N0IHJ1bGUuIFRvIHNoaW0gdGhpcyBmZWF0dXJlLCB0aGUgOmhvc3Qgc3R5bGVzIGFyZVxuICByZWZvcm1hdHRlZCBhbmQgcHJlZml4ZWQgd2l0aCBhIGdpdmVuIHNjb3BlIG5hbWUgYW5kIHByb21vdGVkIHRvIGFcbiAgZG9jdW1lbnQgbGV2ZWwgc3R5bGVzaGVldC5cbiAgRm9yIGV4YW1wbGUsIGdpdmVuIGEgc2NvcGUgbmFtZSBvZiAuZm9vLCBhIHJ1bGUgbGlrZSB0aGlzOlxuXG4gICAgOmhvc3Qge1xuICAgICAgICBiYWNrZ3JvdW5kOiByZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gIGJlY29tZXM6XG5cbiAgICAuZm9vIHtcbiAgICAgIGJhY2tncm91bmQ6IHJlZDtcbiAgICB9XG5cbiAgKiBlbmNhcHN1bGF0aW9uOiBTdHlsZXMgZGVmaW5lZCB3aXRoaW4gU2hhZG93RE9NLCBhcHBseSBvbmx5IHRvXG4gIGRvbSBpbnNpZGUgdGhlIFNoYWRvd0RPTS4gUG9seW1lciB1c2VzIG9uZSBvZiB0d28gdGVjaG5pcXVlcyB0byBpbXBsZW1lbnRcbiAgdGhpcyBmZWF0dXJlLlxuXG4gIEJ5IGRlZmF1bHQsIHJ1bGVzIGFyZSBwcmVmaXhlZCB3aXRoIHRoZSBob3N0IGVsZW1lbnQgdGFnIG5hbWVcbiAgYXMgYSBkZXNjZW5kYW50IHNlbGVjdG9yLiBUaGlzIGVuc3VyZXMgc3R5bGluZyBkb2VzIG5vdCBsZWFrIG91dCBvZiB0aGUgJ3RvcCdcbiAgb2YgdGhlIGVsZW1lbnQncyBTaGFkb3dET00uIEZvciBleGFtcGxlLFxuXG4gIGRpdiB7XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICB9XG5cbiAgYmVjb21lczpcblxuICB4LWZvbyBkaXYge1xuICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgfVxuXG4gIGJlY29tZXM6XG5cblxuICBBbHRlcm5hdGl2ZWx5LCBpZiBXZWJDb21wb25lbnRzLlNoYWRvd0NTUy5zdHJpY3RTdHlsaW5nIGlzIHNldCB0byB0cnVlIHRoZW5cbiAgc2VsZWN0b3JzIGFyZSBzY29wZWQgYnkgYWRkaW5nIGFuIGF0dHJpYnV0ZSBzZWxlY3RvciBzdWZmaXggdG8gZWFjaFxuICBzaW1wbGUgc2VsZWN0b3IgdGhhdCBjb250YWlucyB0aGUgaG9zdCBlbGVtZW50IHRhZyBuYW1lLiBFYWNoIGVsZW1lbnRcbiAgaW4gdGhlIGVsZW1lbnQncyBTaGFkb3dET00gdGVtcGxhdGUgaXMgYWxzbyBnaXZlbiB0aGUgc2NvcGUgYXR0cmlidXRlLlxuICBUaHVzLCB0aGVzZSBydWxlcyBtYXRjaCBvbmx5IGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgc2NvcGUgYXR0cmlidXRlLlxuICBGb3IgZXhhbXBsZSwgZ2l2ZW4gYSBzY29wZSBuYW1lIG9mIHgtZm9vLCBhIHJ1bGUgbGlrZSB0aGlzOlxuXG4gICAgZGl2IHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgIH1cblxuICBiZWNvbWVzOlxuXG4gICAgZGl2W3gtZm9vXSB7XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICB9XG5cbiAgTm90ZSB0aGF0IGVsZW1lbnRzIHRoYXQgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHRvIGEgc2NvcGUgbXVzdCBoYXZlIHRoZSBzY29wZVxuICBzZWxlY3RvciBhZGRlZCB0byB0aGVtIG1hbnVhbGx5LlxuXG4gICogdXBwZXIvbG93ZXIgYm91bmQgZW5jYXBzdWxhdGlvbjogU3R5bGVzIHdoaWNoIGFyZSBkZWZpbmVkIG91dHNpZGUgYVxuICBzaGFkb3dSb290IHNob3VsZCBub3QgY3Jvc3MgdGhlIFNoYWRvd0RPTSBib3VuZGFyeSBhbmQgc2hvdWxkIG5vdCBhcHBseVxuICBpbnNpZGUgYSBzaGFkb3dSb290LlxuXG4gIFRoaXMgc3R5bGluZyBiZWhhdmlvciBpcyBub3QgZW11bGF0ZWQuIFNvbWUgcG9zc2libGUgd2F5cyB0byBkbyB0aGlzIHRoYXRcbiAgd2VyZSByZWplY3RlZCBkdWUgdG8gY29tcGxleGl0eSBhbmQvb3IgcGVyZm9ybWFuY2UgY29uY2VybnMgaW5jbHVkZTogKDEpIHJlc2V0XG4gIGV2ZXJ5IHBvc3NpYmxlIHByb3BlcnR5IGZvciBldmVyeSBwb3NzaWJsZSBzZWxlY3RvciBmb3IgYSBnaXZlbiBzY29wZSBuYW1lO1xuICAoMikgcmUtaW1wbGVtZW50IGNzcyBpbiBqYXZhc2NyaXB0LlxuXG4gIEFzIGFuIGFsdGVybmF0aXZlLCB1c2VycyBzaG91bGQgbWFrZSBzdXJlIHRvIHVzZSBzZWxlY3RvcnNcbiAgc3BlY2lmaWMgdG8gdGhlIHNjb3BlIGluIHdoaWNoIHRoZXkgYXJlIHdvcmtpbmcuXG5cbiAgKiA6OmRpc3RyaWJ1dGVkOiBUaGlzIGJlaGF2aW9yIGlzIG5vdCBlbXVsYXRlZC4gSXQncyBvZnRlbiBub3QgbmVjZXNzYXJ5XG4gIHRvIHN0eWxlIHRoZSBjb250ZW50cyBvZiBhIHNwZWNpZmljIGluc2VydGlvbiBwb2ludCBhbmQgaW5zdGVhZCwgZGVzY2VuZGFudHNcbiAgb2YgdGhlIGhvc3QgZWxlbWVudCBjYW4gYmUgc3R5bGVkIHNlbGVjdGl2ZWx5LiBVc2VycyBjYW4gYWxzbyBjcmVhdGUgYW5cbiAgZXh0cmEgbm9kZSBhcm91bmQgYW4gaW5zZXJ0aW9uIHBvaW50IGFuZCBzdHlsZSB0aGF0IG5vZGUncyBjb250ZW50c1xuICB2aWEgZGVzY2VuZGVudCBzZWxlY3RvcnMuIEZvciBleGFtcGxlLCB3aXRoIGEgc2hhZG93Um9vdCBsaWtlIHRoaXM6XG5cbiAgICA8c3R5bGU+XG4gICAgICA6OmNvbnRlbnQoZGl2KSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlZDtcbiAgICAgIH1cbiAgICA8L3N0eWxlPlxuICAgIDxjb250ZW50PjwvY29udGVudD5cblxuICBjb3VsZCBiZWNvbWU6XG5cbiAgICA8c3R5bGU+XG4gICAgICAvICpAcG9seWZpbGwgLmNvbnRlbnQtY29udGFpbmVyIGRpdiAqIC9cbiAgICAgIDo6Y29udGVudChkaXYpIHtcbiAgICAgICAgYmFja2dyb3VuZDogcmVkO1xuICAgICAgfVxuICAgIDwvc3R5bGU+XG4gICAgPGRpdiBjbGFzcz1cImNvbnRlbnQtY29udGFpbmVyXCI+XG4gICAgICA8Y29udGVudD48L2NvbnRlbnQ+XG4gICAgPC9kaXY+XG5cbiAgTm90ZSB0aGUgdXNlIG9mIEBwb2x5ZmlsbCBpbiB0aGUgY29tbWVudCBhYm92ZSBhIFNoYWRvd0RPTSBzcGVjaWZpYyBzdHlsZVxuICBkZWNsYXJhdGlvbi4gVGhpcyBpcyBhIGRpcmVjdGl2ZSB0byB0aGUgc3R5bGluZyBzaGltIHRvIHVzZSB0aGUgc2VsZWN0b3JcbiAgaW4gY29tbWVudHMgaW4gbGlldSBvZiB0aGUgbmV4dCBzZWxlY3RvciB3aGVuIHJ1bm5pbmcgdW5kZXIgcG9seWZpbGwuXG4qL1xuXG5leHBvcnQgY2xhc3MgU2hhZG93Q3NzIHtcbiAgc3RyaWN0U3R5bGluZzogYm9vbGVhbiA9IHRydWU7XG5cbiAgLypcbiAgICogU2hpbSBzb21lIGNzc1RleHQgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IuIFJldHVybnMgY3NzVGV4dCB0aGF0IGNhblxuICAgKiBiZSBpbmNsdWRlZCBpbiB0aGUgZG9jdW1lbnQgdmlhIFdlYkNvbXBvbmVudHMuU2hhZG93Q1NTLmFkZENzc1RvRG9jdW1lbnQoY3NzKS5cbiAgICpcbiAgICogV2hlbiBzdHJpY3RTdHlsaW5nIGlzIHRydWU6XG4gICAqIC0gc2VsZWN0b3IgaXMgdGhlIGF0dHJpYnV0ZSBhZGRlZCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIHRoZSBob3N0LFxuICAgKiAtIGhvc3RTZWxlY3RvciBpcyB0aGUgYXR0cmlidXRlIGFkZGVkIHRvIHRoZSBob3N0IGl0c2VsZi5cbiAgICovXG4gIHNoaW1Dc3NUZXh0KGNzc1RleHQ6IHN0cmluZywgc2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcgPSAnJyk6IHN0cmluZyB7XG4gICAgY29uc3QgY29tbWVudHNXaXRoSGFzaCA9IGV4dHJhY3RDb21tZW50c1dpdGhIYXNoKGNzc1RleHQpO1xuICAgIGNzc1RleHQgPSBzdHJpcENvbW1lbnRzKGNzc1RleHQpO1xuICAgIGNzc1RleHQgPSB0aGlzLl9pbnNlcnREaXJlY3RpdmVzKGNzc1RleHQpO1xuXG4gICAgY29uc3Qgc2NvcGVkQ3NzVGV4dCA9IHRoaXMuX3Njb3BlQ3NzVGV4dChjc3NUZXh0LCBzZWxlY3RvciwgaG9zdFNlbGVjdG9yKTtcbiAgICByZXR1cm4gW3Njb3BlZENzc1RleHQsIC4uLmNvbW1lbnRzV2l0aEhhc2hdLmpvaW4oJ1xcbicpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5zZXJ0RGlyZWN0aXZlcyhjc3NUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNzc1RleHQgPSB0aGlzLl9pbnNlcnRQb2x5ZmlsbERpcmVjdGl2ZXNJbkNzc1RleHQoY3NzVGV4dCk7XG4gICAgcmV0dXJuIHRoaXMuX2luc2VydFBvbHlmaWxsUnVsZXNJbkNzc1RleHQoY3NzVGV4dCk7XG4gIH1cblxuICAvKlxuICAgKiBQcm9jZXNzIHN0eWxlcyB0byBjb252ZXJ0IG5hdGl2ZSBTaGFkb3dET00gcnVsZXMgdGhhdCB3aWxsIHRyaXBcbiAgICogdXAgdGhlIGNzcyBwYXJzZXI7IHdlIHJlbHkgb24gZGVjb3JhdGluZyB0aGUgc3R5bGVzaGVldCB3aXRoIGluZXJ0IHJ1bGVzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgd2UgY29udmVydCB0aGlzIHJ1bGU6XG4gICAqXG4gICAqIHBvbHlmaWxsLW5leHQtc2VsZWN0b3IgeyBjb250ZW50OiAnOmhvc3QgbWVudS1pdGVtJzsgfVxuICAgKiA6OmNvbnRlbnQgbWVudS1pdGVtIHtcbiAgICpcbiAgICogdG8gdGhpczpcbiAgICpcbiAgICogc2NvcGVOYW1lIG1lbnUtaXRlbSB7XG4gICAqXG4gICAqKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0UG9seWZpbGxEaXJlY3RpdmVzSW5Dc3NUZXh0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gRGlmZmVyZW5jZSB3aXRoIHdlYmNvbXBvbmVudHMuanM6IGRvZXMgbm90IGhhbmRsZSBjb21tZW50c1xuICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UoX2Nzc0NvbnRlbnROZXh0U2VsZWN0b3JSZSwgZnVuY3Rpb24oLi4ubTogc3RyaW5nW10pIHtcbiAgICAgIHJldHVybiBtWzJdICsgJ3snO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogUHJvY2VzcyBzdHlsZXMgdG8gYWRkIHJ1bGVzIHdoaWNoIHdpbGwgb25seSBhcHBseSB1bmRlciB0aGUgcG9seWZpbGxcbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIHdlIGNvbnZlcnQgdGhpcyBydWxlOlxuICAgKlxuICAgKiBwb2x5ZmlsbC1ydWxlIHtcbiAgICogICBjb250ZW50OiAnOmhvc3QgbWVudS1pdGVtJztcbiAgICogLi4uXG4gICAqIH1cbiAgICpcbiAgICogdG8gdGhpczpcbiAgICpcbiAgICogc2NvcGVOYW1lIG1lbnUtaXRlbSB7Li4ufVxuICAgKlxuICAgKiovXG4gIHByaXZhdGUgX2luc2VydFBvbHlmaWxsUnVsZXNJbkNzc1RleHQoY3NzVGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyBEaWZmZXJlbmNlIHdpdGggd2ViY29tcG9uZW50cy5qczogZG9lcyBub3QgaGFuZGxlIGNvbW1lbnRzXG4gICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShfY3NzQ29udGVudFJ1bGVSZSwgKC4uLm06IHN0cmluZ1tdKSA9PiB7XG4gICAgICBjb25zdCBydWxlID0gbVswXS5yZXBsYWNlKG1bMV0sICcnKS5yZXBsYWNlKG1bMl0sICcnKTtcbiAgICAgIHJldHVybiBtWzRdICsgcnVsZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qIEVuc3VyZSBzdHlsZXMgYXJlIHNjb3BlZC4gUHNldWRvLXNjb3BpbmcgdGFrZXMgYSBydWxlIGxpa2U6XG4gICAqXG4gICAqICAuZm9vIHsuLi4gfVxuICAgKlxuICAgKiAgYW5kIGNvbnZlcnRzIHRoaXMgdG9cbiAgICpcbiAgICogIHNjb3BlTmFtZSAuZm9vIHsgLi4uIH1cbiAgICovXG4gIHByaXZhdGUgX3Njb3BlQ3NzVGV4dChjc3NUZXh0OiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHVuc2NvcGVkUnVsZXMgPSB0aGlzLl9leHRyYWN0VW5zY29wZWRSdWxlc0Zyb21Dc3NUZXh0KGNzc1RleHQpO1xuICAgIC8vIHJlcGxhY2UgOmhvc3QgYW5kIDpob3N0LWNvbnRleHQgLXNoYWRvd2Nzc2hvc3QgYW5kIC1zaGFkb3djc3Nob3N0IHJlc3BlY3RpdmVseVxuICAgIGNzc1RleHQgPSB0aGlzLl9pbnNlcnRQb2x5ZmlsbEhvc3RJbkNzc1RleHQoY3NzVGV4dCk7XG4gICAgY3NzVGV4dCA9IHRoaXMuX2NvbnZlcnRDb2xvbkhvc3QoY3NzVGV4dCk7XG4gICAgY3NzVGV4dCA9IHRoaXMuX2NvbnZlcnRDb2xvbkhvc3RDb250ZXh0KGNzc1RleHQpO1xuICAgIGNzc1RleHQgPSB0aGlzLl9jb252ZXJ0U2hhZG93RE9NU2VsZWN0b3JzKGNzc1RleHQpO1xuICAgIGlmIChzY29wZVNlbGVjdG9yKSB7XG4gICAgICBjc3NUZXh0ID0gdGhpcy5fc2NvcGVTZWxlY3RvcnMoY3NzVGV4dCwgc2NvcGVTZWxlY3RvciwgaG9zdFNlbGVjdG9yKTtcbiAgICB9XG4gICAgY3NzVGV4dCA9IGNzc1RleHQgKyAnXFxuJyArIHVuc2NvcGVkUnVsZXM7XG4gICAgcmV0dXJuIGNzc1RleHQudHJpbSgpO1xuICB9XG5cbiAgLypcbiAgICogUHJvY2VzcyBzdHlsZXMgdG8gYWRkIHJ1bGVzIHdoaWNoIHdpbGwgb25seSBhcHBseSB1bmRlciB0aGUgcG9seWZpbGxcbiAgICogYW5kIGRvIG5vdCBwcm9jZXNzIHZpYSBDU1NPTS4gKENTU09NIGlzIGRlc3RydWN0aXZlIHRvIHJ1bGVzIG9uIHJhcmVcbiAgICogb2NjYXNpb25zLCBlLmcuIC13ZWJraXQtY2FsYyBvbiBTYWZhcmkuKVxuICAgKiBGb3IgZXhhbXBsZSwgd2UgY29udmVydCB0aGlzIHJ1bGU6XG4gICAqXG4gICAqIEBwb2x5ZmlsbC11bnNjb3BlZC1ydWxlIHtcbiAgICogICBjb250ZW50OiAnbWVudS1pdGVtJztcbiAgICogLi4uIH1cbiAgICpcbiAgICogdG8gdGhpczpcbiAgICpcbiAgICogbWVudS1pdGVtIHsuLi59XG4gICAqXG4gICAqKi9cbiAgcHJpdmF0ZSBfZXh0cmFjdFVuc2NvcGVkUnVsZXNGcm9tQ3NzVGV4dChjc3NUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIERpZmZlcmVuY2Ugd2l0aCB3ZWJjb21wb25lbnRzLmpzOiBkb2VzIG5vdCBoYW5kbGUgY29tbWVudHNcbiAgICBsZXQgciA9ICcnO1xuICAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXl8bnVsbDtcbiAgICBfY3NzQ29udGVudFVuc2NvcGVkUnVsZVJlLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gX2Nzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZS5leGVjKGNzc1RleHQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcnVsZSA9IG1bMF0ucmVwbGFjZShtWzJdLCAnJykucmVwbGFjZShtWzFdLCBtWzRdKTtcbiAgICAgIHIgKz0gcnVsZSArICdcXG5cXG4nO1xuICAgIH1cbiAgICByZXR1cm4gcjtcbiAgfVxuXG4gIC8qXG4gICAqIGNvbnZlcnQgYSBydWxlIGxpa2UgOmhvc3QoLmZvbykgPiAuYmFyIHsgfVxuICAgKlxuICAgKiB0b1xuICAgKlxuICAgKiAuZm9vPHNjb3BlTmFtZT4gPiAuYmFyXG4gICAqL1xuICBwcml2YXRlIF9jb252ZXJ0Q29sb25Ib3N0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShfY3NzQ29sb25Ib3N0UmUsIChfLCBob3N0U2VsZWN0b3JzOiBzdHJpbmcsIG90aGVyU2VsZWN0b3JzOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChob3N0U2VsZWN0b3JzKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZFNlbGVjdG9yczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgaG9zdFNlbGVjdG9yQXJyYXkgPSBob3N0U2VsZWN0b3JzLnNwbGl0KCcsJykubWFwKHAgPT4gcC50cmltKCkpO1xuICAgICAgICBmb3IgKGNvbnN0IGhvc3RTZWxlY3RvciBvZiBob3N0U2VsZWN0b3JBcnJheSkge1xuICAgICAgICAgIGlmICghaG9zdFNlbGVjdG9yKSBicmVhaztcbiAgICAgICAgICBjb25zdCBjb252ZXJ0ZWRTZWxlY3RvciA9XG4gICAgICAgICAgICAgIF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IgKyBob3N0U2VsZWN0b3IucmVwbGFjZShfcG9seWZpbGxIb3N0LCAnJykgKyBvdGhlclNlbGVjdG9ycztcbiAgICAgICAgICBjb252ZXJ0ZWRTZWxlY3RvcnMucHVzaChjb252ZXJ0ZWRTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlZFNlbGVjdG9ycy5qb2luKCcsJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvciArIG90aGVyU2VsZWN0b3JzO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogY29udmVydCBhIHJ1bGUgbGlrZSA6aG9zdC1jb250ZXh0KC5mb28pID4gLmJhciB7IH1cbiAgICpcbiAgICogdG9cbiAgICpcbiAgICogLmZvbzxzY29wZU5hbWU+ID4gLmJhciwgLmZvbyA8c2NvcGVOYW1lPiA+IC5iYXIgeyB9XG4gICAqXG4gICAqIGFuZFxuICAgKlxuICAgKiA6aG9zdC1jb250ZXh0KC5mb286aG9zdCkgLmJhciB7IC4uLiB9XG4gICAqXG4gICAqIHRvXG4gICAqXG4gICAqIC5mb288c2NvcGVOYW1lPiAuYmFyIHsgLi4uIH1cbiAgICovXG4gIHByaXZhdGUgX2NvbnZlcnRDb2xvbkhvc3RDb250ZXh0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShfY3NzQ29sb25Ib3N0Q29udGV4dFJlR2xvYmFsLCBzZWxlY3RvclRleHQgPT4ge1xuICAgICAgLy8gV2UgaGF2ZSBjYXB0dXJlZCBhIHNlbGVjdG9yIHRoYXQgY29udGFpbnMgYSBgOmhvc3QtY29udGV4dGAgcnVsZS5cblxuICAgICAgLy8gRm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgYDpob3N0LWNvbnRleHRgIG1heSBjb250YWluIGEgY29tbWEgc2VwYXJhdGVkIGxpc3Qgb2Ygc2VsZWN0b3JzLlxuICAgICAgLy8gRWFjaCBjb250ZXh0IHNlbGVjdG9yIGdyb3VwIHdpbGwgY29udGFpbiBhIGxpc3Qgb2YgaG9zdC1jb250ZXh0IHNlbGVjdG9ycyB0aGF0IG11c3QgbWF0Y2hcbiAgICAgIC8vIGFuIGFuY2VzdG9yIG9mIHRoZSBob3N0LlxuICAgICAgLy8gKE5vcm1hbGx5IGBjb250ZXh0U2VsZWN0b3JHcm91cHNgIHdpbGwgb25seSBjb250YWluIGEgc2luZ2xlIGFycmF5IG9mIGNvbnRleHQgc2VsZWN0b3JzLilcbiAgICAgIGNvbnN0IGNvbnRleHRTZWxlY3Rvckdyb3Vwczogc3RyaW5nW11bXSA9IFtbXV07XG5cbiAgICAgIC8vIFRoZXJlIG1heSBiZSBtb3JlIHRoYW4gYDpob3N0LWNvbnRleHRgIGluIHRoaXMgc2VsZWN0b3Igc28gYHNlbGVjdG9yVGV4dGAgY291bGQgbG9vayBsaWtlOlxuICAgICAgLy8gYDpob3N0LWNvbnRleHQoLm9uZSk6aG9zdC1jb250ZXh0KC50d28pYC5cbiAgICAgIC8vIEV4ZWN1dGUgYF9jc3NDb2xvbkhvc3RDb250ZXh0UmVgIG92ZXIgYW5kIG92ZXIgdW50aWwgd2UgaGF2ZSBleHRyYWN0ZWQgYWxsIHRoZVxuICAgICAgLy8gYDpob3N0LWNvbnRleHRgIHNlbGVjdG9ycyBmcm9tIHRoaXMgc2VsZWN0b3IuXG4gICAgICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXl8bnVsbDtcbiAgICAgIHdoaWxlIChtYXRjaCA9IF9jc3NDb2xvbkhvc3RDb250ZXh0UmUuZXhlYyhzZWxlY3RvclRleHQpKSB7XG4gICAgICAgIC8vIGBtYXRjaGAgPSBbJzpob3N0LWNvbnRleHQoPHNlbGVjdG9ycz4pPHJlc3Q+JywgPHNlbGVjdG9ycz4sIDxyZXN0Pl1cblxuICAgICAgICAvLyBUaGUgYDxzZWxlY3RvcnM+YCBjb3VsZCBhY3R1YWxseSBiZSBhIGNvbW1hIHNlcGFyYXRlZCBsaXN0OiBgOmhvc3QtY29udGV4dCgub25lLCAudHdvKWAuXG4gICAgICAgIGNvbnN0IG5ld0NvbnRleHRTZWxlY3RvcnMgPVxuICAgICAgICAgICAgKG1hdGNoWzFdID8/ICcnKS50cmltKCkuc3BsaXQoJywnKS5tYXAobSA9PiBtLnRyaW0oKSkuZmlsdGVyKG0gPT4gbSAhPT0gJycpO1xuXG4gICAgICAgIC8vIFdlIG11c3QgZHVwbGljYXRlIHRoZSBjdXJyZW50IHNlbGVjdG9yIGdyb3VwIGZvciBlYWNoIG9mIHRoZXNlIG5ldyBzZWxlY3RvcnMuXG4gICAgICAgIC8vIEZvciBleGFtcGxlIGlmIHRoZSBjdXJyZW50IGdyb3VwcyBhcmU6XG4gICAgICAgIC8vIGBgYFxuICAgICAgICAvLyBbXG4gICAgICAgIC8vICAgWydhJywgJ2InLCAnYyddLFxuICAgICAgICAvLyAgIFsneCcsICd5JywgJ3onXSxcbiAgICAgICAgLy8gXVxuICAgICAgICAvLyBgYGBcbiAgICAgICAgLy8gQW5kIHdlIGhhdmUgYSBuZXcgc2V0IG9mIGNvbW1hIHNlcGFyYXRlZCBzZWxlY3RvcnM6IGA6aG9zdC1jb250ZXh0KG0sbilgIHRoZW4gdGhlIG5ld1xuICAgICAgICAvLyBncm91cHMgYXJlOlxuICAgICAgICAvLyBgYGBcbiAgICAgICAgLy8gW1xuICAgICAgICAvLyAgIFsnYScsICdiJywgJ2MnLCAnbSddLFxuICAgICAgICAvLyAgIFsneCcsICd5JywgJ3onLCAnbSddLFxuICAgICAgICAvLyAgIFsnYScsICdiJywgJ2MnLCAnbiddLFxuICAgICAgICAvLyAgIFsneCcsICd5JywgJ3onLCAnbiddLFxuICAgICAgICAvLyBdXG4gICAgICAgIC8vIGBgYFxuICAgICAgICBjb25zdCBjb250ZXh0U2VsZWN0b3JHcm91cHNMZW5ndGggPSBjb250ZXh0U2VsZWN0b3JHcm91cHMubGVuZ3RoO1xuICAgICAgICByZXBlYXRHcm91cHMoY29udGV4dFNlbGVjdG9yR3JvdXBzLCBuZXdDb250ZXh0U2VsZWN0b3JzLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3Q29udGV4dFNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGV4dFNlbGVjdG9yR3JvdXBzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnRleHRTZWxlY3Rvckdyb3Vwc1tqICsgKGkgKiBjb250ZXh0U2VsZWN0b3JHcm91cHNMZW5ndGgpXS5wdXNoKFxuICAgICAgICAgICAgICAgIG5ld0NvbnRleHRTZWxlY3RvcnNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgYHNlbGVjdG9yVGV4dGAgYW5kIHNlZSByZXBlYXQgdG8gc2VlIGlmIHRoZXJlIGFyZSBtb3JlIGA6aG9zdC1jb250ZXh0YHMuXG4gICAgICAgIHNlbGVjdG9yVGV4dCA9IG1hdGNoWzJdO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgY29udGV4dCBzZWxlY3RvcnMgbm93IG11c3QgYmUgY29tYmluZWQgd2l0aCBlYWNoIG90aGVyIHRvIGNhcHR1cmUgYWxsIHRoZSBwb3NzaWJsZVxuICAgICAgLy8gc2VsZWN0b3JzIHRoYXQgYDpob3N0LWNvbnRleHRgIGNhbiBtYXRjaC4gU2VlIGBjb21iaW5lSG9zdENvbnRleHRTZWxlY3RvcnMoKWAgZm9yIG1vcmVcbiAgICAgIC8vIGluZm8gYWJvdXQgaG93IHRoaXMgaXMgZG9uZS5cbiAgICAgIHJldHVybiBjb250ZXh0U2VsZWN0b3JHcm91cHNcbiAgICAgICAgICAubWFwKGNvbnRleHRTZWxlY3RvcnMgPT4gY29tYmluZUhvc3RDb250ZXh0U2VsZWN0b3JzKGNvbnRleHRTZWxlY3RvcnMsIHNlbGVjdG9yVGV4dCkpXG4gICAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKlxuICAgKiBDb252ZXJ0IGNvbWJpbmF0b3JzIGxpa2UgOjpzaGFkb3cgYW5kIHBzZXVkby1lbGVtZW50cyBsaWtlIDo6Y29udGVudFxuICAgKiBieSByZXBsYWNpbmcgd2l0aCBzcGFjZS5cbiAgICovXG4gIHByaXZhdGUgX2NvbnZlcnRTaGFkb3dET01TZWxlY3RvcnMoY3NzVGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gX3NoYWRvd0RPTVNlbGVjdG9yc1JlLnJlZHVjZSgocmVzdWx0LCBwYXR0ZXJuKSA9PiByZXN1bHQucmVwbGFjZShwYXR0ZXJuLCAnICcpLCBjc3NUZXh0KTtcbiAgfVxuXG4gIC8vIGNoYW5nZSBhIHNlbGVjdG9yIGxpa2UgJ2RpdicgdG8gJ25hbWUgZGl2J1xuICBwcml2YXRlIF9zY29wZVNlbGVjdG9ycyhjc3NUZXh0OiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwcm9jZXNzUnVsZXMoY3NzVGV4dCwgKHJ1bGU6IENzc1J1bGUpID0+IHtcbiAgICAgIGxldCBzZWxlY3RvciA9IHJ1bGUuc2VsZWN0b3I7XG4gICAgICBsZXQgY29udGVudCA9IHJ1bGUuY29udGVudDtcbiAgICAgIGlmIChydWxlLnNlbGVjdG9yWzBdICE9PSAnQCcpIHtcbiAgICAgICAgc2VsZWN0b3IgPVxuICAgICAgICAgICAgdGhpcy5fc2NvcGVTZWxlY3RvcihydWxlLnNlbGVjdG9yLCBzY29wZVNlbGVjdG9yLCBob3N0U2VsZWN0b3IsIHRoaXMuc3RyaWN0U3R5bGluZyk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQG1lZGlhJykgfHwgcnVsZS5zZWxlY3Rvci5zdGFydHNXaXRoKCdAc3VwcG9ydHMnKSB8fFxuICAgICAgICAgIHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQGRvY3VtZW50JykpIHtcbiAgICAgICAgY29udGVudCA9IHRoaXMuX3Njb3BlU2VsZWN0b3JzKHJ1bGUuY29udGVudCwgc2NvcGVTZWxlY3RvciwgaG9zdFNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAocnVsZS5zZWxlY3Rvci5zdGFydHNXaXRoKCdAZm9udC1mYWNlJykgfHwgcnVsZS5zZWxlY3Rvci5zdGFydHNXaXRoKCdAcGFnZScpKSB7XG4gICAgICAgIGNvbnRlbnQgPSB0aGlzLl9zdHJpcFNjb3BpbmdTZWxlY3RvcnMocnVsZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ3NzUnVsZShzZWxlY3RvciwgY29udGVudCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGEgY3NzIHRleHQgdGhhdCBpcyB3aXRoaW4gYSBydWxlIHRoYXQgc2hvdWxkIG5vdCBjb250YWluIHNjb3BlIHNlbGVjdG9ycyBieSBzaW1wbHlcbiAgICogcmVtb3ZpbmcgdGhlbSEgQW4gZXhhbXBsZSBvZiBzdWNoIGEgcnVsZSBpcyBgQGZvbnQtZmFjZWAuXG4gICAqXG4gICAqIGBAZm9udC1mYWNlYCBydWxlcyBjYW5ub3QgY29udGFpbiBuZXN0ZWQgc2VsZWN0b3JzLiBOb3IgY2FuIHRoZXkgYmUgbmVzdGVkIHVuZGVyIGEgc2VsZWN0b3IuXG4gICAqIE5vcm1hbGx5IHRoaXMgd291bGQgYmUgYSBzeW50YXggZXJyb3IgYnkgdGhlIGF1dGhvciBvZiB0aGUgc3R5bGVzLiBCdXQgaW4gc29tZSByYXJlIGNhc2VzLCBzdWNoXG4gICAqIGFzIGltcG9ydGluZyBzdHlsZXMgZnJvbSBhIGxpYnJhcnksIGFuZCBhcHBseWluZyBgOmhvc3QgOjpuZy1kZWVwYCB0byB0aGUgaW1wb3J0ZWQgc3R5bGVzLCB3ZVxuICAgKiBjYW4gZW5kIHVwIHdpdGggYnJva2VuIGNzcyBpZiB0aGUgaW1wb3J0ZWQgc3R5bGVzIGhhcHBlbiB0byBjb250YWluIEBmb250LWZhY2UgcnVsZXMuXG4gICAqXG4gICAqIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiBgYGBcbiAgICogOmhvc3QgOjpuZy1kZWVwIHtcbiAgICogICBpbXBvcnQgJ3NvbWUvbGliL2NvbnRhaW5pbmcvZm9udC1mYWNlJztcbiAgICogfVxuICAgKlxuICAgKiBTaW1pbGFyIGxvZ2ljIGFwcGxpZXMgdG8gYEBwYWdlYCBydWxlcyB3aGljaCBjYW4gY29udGFpbiBhIHBhcnRpY3VsYXIgc2V0IG9mIHByb3BlcnRpZXMsXG4gICAqIGFzIHdlbGwgYXMgc29tZSBzcGVjaWZpYyBhdC1ydWxlcy4gU2luY2UgdGhleSBjYW4ndCBiZSBlbmNhcHN1bGF0ZWQsIHdlIGhhdmUgdG8gc3RyaXBcbiAgICogYW55IHNjb3Bpbmcgc2VsZWN0b3JzIGZyb20gdGhlbS4gRm9yIG1vcmUgaW5mb3JtYXRpb246IGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3MtcGFnZS0zXG4gICAqIGBgYFxuICAgKi9cbiAgcHJpdmF0ZSBfc3RyaXBTY29waW5nU2VsZWN0b3JzKGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByb2Nlc3NSdWxlcyhjc3NUZXh0LCBydWxlID0+IHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcnVsZS5zZWxlY3Rvci5yZXBsYWNlKF9zaGFkb3dEZWVwU2VsZWN0b3JzLCAnICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yUmUsICcgJyk7XG4gICAgICByZXR1cm4gbmV3IENzc1J1bGUoc2VsZWN0b3IsIHJ1bGUuY29udGVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9zY29wZVNlbGVjdG9yKFxuICAgICAgc2VsZWN0b3I6IHN0cmluZywgc2NvcGVTZWxlY3Rvcjogc3RyaW5nLCBob3N0U2VsZWN0b3I6IHN0cmluZywgc3RyaWN0OiBib29sZWFuKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0b3Iuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHBhcnQgPT4gcGFydC50cmltKCkuc3BsaXQoX3NoYWRvd0RlZXBTZWxlY3RvcnMpKVxuICAgICAgICAubWFwKChkZWVwUGFydHMpID0+IHtcbiAgICAgICAgICBjb25zdCBbc2hhbGxvd1BhcnQsIC4uLm90aGVyUGFydHNdID0gZGVlcFBhcnRzO1xuICAgICAgICAgIGNvbnN0IGFwcGx5U2NvcGUgPSAoc2hhbGxvd1BhcnQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdG9yTmVlZHNTY29waW5nKHNoYWxsb3dQYXJ0LCBzY29wZVNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc3RyaWN0ID9cbiAgICAgICAgICAgICAgICAgIHRoaXMuX2FwcGx5U3RyaWN0U2VsZWN0b3JTY29wZShzaGFsbG93UGFydCwgc2NvcGVTZWxlY3RvciwgaG9zdFNlbGVjdG9yKSA6XG4gICAgICAgICAgICAgICAgICB0aGlzLl9hcHBseVNlbGVjdG9yU2NvcGUoc2hhbGxvd1BhcnQsIHNjb3BlU2VsZWN0b3IsIGhvc3RTZWxlY3Rvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gc2hhbGxvd1BhcnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gW2FwcGx5U2NvcGUoc2hhbGxvd1BhcnQpLCAuLi5vdGhlclBhcnRzXS5qb2luKCcgJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCcsICcpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2VsZWN0b3JOZWVkc1Njb3Bpbmcoc2VsZWN0b3I6IHN0cmluZywgc2NvcGVTZWxlY3Rvcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmUgPSB0aGlzLl9tYWtlU2NvcGVNYXRjaGVyKHNjb3BlU2VsZWN0b3IpO1xuICAgIHJldHVybiAhcmUudGVzdChzZWxlY3Rvcik7XG4gIH1cblxuICBwcml2YXRlIF9tYWtlU2NvcGVNYXRjaGVyKHNjb3BlU2VsZWN0b3I6IHN0cmluZyk6IFJlZ0V4cCB7XG4gICAgY29uc3QgbHJlID0gL1xcWy9nO1xuICAgIGNvbnN0IHJyZSA9IC9cXF0vZztcbiAgICBzY29wZVNlbGVjdG9yID0gc2NvcGVTZWxlY3Rvci5yZXBsYWNlKGxyZSwgJ1xcXFxbJykucmVwbGFjZShycmUsICdcXFxcXScpO1xuICAgIHJldHVybiBuZXcgUmVnRXhwKCdeKCcgKyBzY29wZVNlbGVjdG9yICsgJyknICsgX3NlbGVjdG9yUmVTdWZmaXgsICdtJyk7XG4gIH1cblxuICBwcml2YXRlIF9hcHBseVNlbGVjdG9yU2NvcGUoc2VsZWN0b3I6IHN0cmluZywgc2NvcGVTZWxlY3Rvcjogc3RyaW5nLCBob3N0U2VsZWN0b3I6IHN0cmluZyk6XG4gICAgICBzdHJpbmcge1xuICAgIC8vIERpZmZlcmVuY2UgZnJvbSB3ZWJjb21wb25lbnRzLmpzOiBzY29wZVNlbGVjdG9yIGNvdWxkIG5vdCBiZSBhbiBhcnJheVxuICAgIHJldHVybiB0aGlzLl9hcHBseVNpbXBsZVNlbGVjdG9yU2NvcGUoc2VsZWN0b3IsIHNjb3BlU2VsZWN0b3IsIGhvc3RTZWxlY3Rvcik7XG4gIH1cblxuICAvLyBzY29wZSB2aWEgbmFtZSBhbmQgW2lzPW5hbWVdXG4gIHByaXZhdGUgX2FwcGx5U2ltcGxlU2VsZWN0b3JTY29wZShzZWxlY3Rvcjogc3RyaW5nLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcsIGhvc3RTZWxlY3Rvcjogc3RyaW5nKTpcbiAgICAgIHN0cmluZyB7XG4gICAgLy8gSW4gQW5kcm9pZCBicm93c2VyLCB0aGUgbGFzdEluZGV4IGlzIG5vdCByZXNldCB3aGVuIHRoZSByZWdleCBpcyB1c2VkIGluIFN0cmluZy5yZXBsYWNlKClcbiAgICBfcG9seWZpbGxIb3N0UmUubGFzdEluZGV4ID0gMDtcbiAgICBpZiAoX3BvbHlmaWxsSG9zdFJlLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgICBjb25zdCByZXBsYWNlQnkgPSB0aGlzLnN0cmljdFN0eWxpbmcgPyBgWyR7aG9zdFNlbGVjdG9yfV1gIDogc2NvcGVTZWxlY3RvcjtcbiAgICAgIHJldHVybiBzZWxlY3RvclxuICAgICAgICAgIC5yZXBsYWNlKFxuICAgICAgICAgICAgICBfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yUmUsXG4gICAgICAgICAgICAgIChobmMsIHNlbGVjdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIC8oW146XSopKDoqKSguKikvLFxuICAgICAgICAgICAgICAgICAgICAoXzogc3RyaW5nLCBiZWZvcmU6IHN0cmluZywgY29sb246IHN0cmluZywgYWZ0ZXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiZWZvcmUgKyByZXBsYWNlQnkgKyBjb2xvbiArIGFmdGVyO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAucmVwbGFjZShfcG9seWZpbGxIb3N0UmUsIHJlcGxhY2VCeSArICcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjb3BlU2VsZWN0b3IgKyAnICcgKyBzZWxlY3RvcjtcbiAgfVxuXG4gIC8vIHJldHVybiBhIHNlbGVjdG9yIHdpdGggW25hbWVdIHN1ZmZpeCBvbiBlYWNoIHNpbXBsZSBzZWxlY3RvclxuICAvLyBlLmcuIC5mb28uYmFyID4gLnpvdCBiZWNvbWVzIC5mb29bbmFtZV0uYmFyW25hbWVdID4gLnpvdFtuYW1lXSAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9hcHBseVN0cmljdFNlbGVjdG9yU2NvcGUoc2VsZWN0b3I6IHN0cmluZywgc2NvcGVTZWxlY3Rvcjogc3RyaW5nLCBob3N0U2VsZWN0b3I6IHN0cmluZyk6XG4gICAgICBzdHJpbmcge1xuICAgIGNvbnN0IGlzUmUgPSAvXFxbaXM9KFteXFxdXSopXFxdL2c7XG4gICAgc2NvcGVTZWxlY3RvciA9IHNjb3BlU2VsZWN0b3IucmVwbGFjZShpc1JlLCAoXzogc3RyaW5nLCAuLi5wYXJ0czogc3RyaW5nW10pID0+IHBhcnRzWzBdKTtcblxuICAgIGNvbnN0IGF0dHJOYW1lID0gJ1snICsgc2NvcGVTZWxlY3RvciArICddJztcblxuICAgIGNvbnN0IF9zY29wZVNlbGVjdG9yUGFydCA9IChwOiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBzY29wZWRQID0gcC50cmltKCk7XG5cbiAgICAgIGlmICghc2NvcGVkUCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIGlmIChwLmluZGV4T2YoX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvcikgPiAtMSkge1xuICAgICAgICBzY29wZWRQID0gdGhpcy5fYXBwbHlTaW1wbGVTZWxlY3RvclNjb3BlKHAsIHNjb3BlU2VsZWN0b3IsIGhvc3RTZWxlY3Rvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyByZW1vdmUgOmhvc3Qgc2luY2UgaXQgc2hvdWxkIGJlIHVubmVjZXNzYXJ5XG4gICAgICAgIGNvbnN0IHQgPSBwLnJlcGxhY2UoX3BvbHlmaWxsSG9zdFJlLCAnJyk7XG4gICAgICAgIGlmICh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBtYXRjaGVzID0gdC5tYXRjaCgvKFteOl0qKSg6KikoLiopLyk7XG4gICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgIHNjb3BlZFAgPSBtYXRjaGVzWzFdICsgYXR0ck5hbWUgKyBtYXRjaGVzWzJdICsgbWF0Y2hlc1szXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjb3BlZFA7XG4gICAgfTtcblxuICAgIGNvbnN0IHNhZmVDb250ZW50ID0gbmV3IFNhZmVTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgc2VsZWN0b3IgPSBzYWZlQ29udGVudC5jb250ZW50KCk7XG5cbiAgICBsZXQgc2NvcGVkU2VsZWN0b3IgPSAnJztcbiAgICBsZXQgc3RhcnRJbmRleCA9IDA7XG4gICAgbGV0IHJlczogUmVnRXhwRXhlY0FycmF5fG51bGw7XG4gICAgY29uc3Qgc2VwID0gLyggfD58XFwrfH4oPyE9KSlcXHMqL2c7XG5cbiAgICAvLyBJZiBhIHNlbGVjdG9yIGFwcGVhcnMgYmVmb3JlIDpob3N0IGl0IHNob3VsZCBub3QgYmUgc2hpbW1lZCBhcyBpdFxuICAgIC8vIG1hdGNoZXMgb24gYW5jZXN0b3IgZWxlbWVudHMgYW5kIG5vdCBvbiBlbGVtZW50cyBpbiB0aGUgaG9zdCdzIHNoYWRvd1xuICAgIC8vIGA6aG9zdC1jb250ZXh0KGRpdilgIGlzIHRyYW5zZm9ybWVkIHRvXG4gICAgLy8gYC1zaGFkb3djc3Nob3N0LW5vLWNvbWJpbmF0b3JkaXYsIGRpdiAtc2hhZG93Y3NzaG9zdC1uby1jb21iaW5hdG9yYFxuICAgIC8vIHRoZSBgZGl2YCBpcyBub3QgcGFydCBvZiB0aGUgY29tcG9uZW50IGluIHRoZSAybmQgc2VsZWN0b3JzIGFuZCBzaG91bGQgbm90IGJlIHNjb3BlZC5cbiAgICAvLyBIaXN0b3JpY2FsbHkgYGNvbXBvbmVudC10YWc6aG9zdGAgd2FzIG1hdGNoaW5nIHRoZSBjb21wb25lbnQgc28gd2UgYWxzbyB3YW50IHRvIHByZXNlcnZlXG4gICAgLy8gdGhpcyBiZWhhdmlvciB0byBhdm9pZCBicmVha2luZyBsZWdhY3kgYXBwcyAoaXQgc2hvdWxkIG5vdCBtYXRjaCkuXG4gICAgLy8gVGhlIGJlaGF2aW9yIHNob3VsZCBiZTpcbiAgICAvLyAtIGB0YWc6aG9zdGAgLT4gYHRhZ1toXWAgKHRoaXMgaXMgdG8gYXZvaWQgYnJlYWtpbmcgbGVnYWN5IGFwcHMsIHNob3VsZCBub3QgbWF0Y2ggYW55dGhpbmcpXG4gICAgLy8gLSBgdGFnIDpob3N0YCAtPiBgdGFnIFtoXWAgKGB0YWdgIGlzIG5vdCBzY29wZWQgYmVjYXVzZSBpdCdzIGNvbnNpZGVyZWQgcGFydCBvZiBhXG4gICAgLy8gICBgOmhvc3QtY29udGV4dCh0YWcpYClcbiAgICBjb25zdCBoYXNIb3N0ID0gc2VsZWN0b3IuaW5kZXhPZihfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yKSA+IC0xO1xuICAgIC8vIE9ubHkgc2NvcGUgcGFydHMgYWZ0ZXIgdGhlIGZpcnN0IGAtc2hhZG93Y3NzaG9zdC1uby1jb21iaW5hdG9yYCB3aGVuIGl0IGlzIHByZXNlbnRcbiAgICBsZXQgc2hvdWxkU2NvcGUgPSAhaGFzSG9zdDtcblxuICAgIHdoaWxlICgocmVzID0gc2VwLmV4ZWMoc2VsZWN0b3IpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2VwYXJhdG9yID0gcmVzWzFdO1xuICAgICAgY29uc3QgcGFydCA9IHNlbGVjdG9yLnNsaWNlKHN0YXJ0SW5kZXgsIHJlcy5pbmRleCkudHJpbSgpO1xuICAgICAgc2hvdWxkU2NvcGUgPSBzaG91bGRTY29wZSB8fCBwYXJ0LmluZGV4T2YoX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvcikgPiAtMTtcbiAgICAgIGNvbnN0IHNjb3BlZFBhcnQgPSBzaG91bGRTY29wZSA/IF9zY29wZVNlbGVjdG9yUGFydChwYXJ0KSA6IHBhcnQ7XG4gICAgICBzY29wZWRTZWxlY3RvciArPSBgJHtzY29wZWRQYXJ0fSAke3NlcGFyYXRvcn0gYDtcbiAgICAgIHN0YXJ0SW5kZXggPSBzZXAubGFzdEluZGV4O1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnQgPSBzZWxlY3Rvci5zdWJzdHJpbmcoc3RhcnRJbmRleCk7XG4gICAgc2hvdWxkU2NvcGUgPSBzaG91bGRTY29wZSB8fCBwYXJ0LmluZGV4T2YoX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvcikgPiAtMTtcbiAgICBzY29wZWRTZWxlY3RvciArPSBzaG91bGRTY29wZSA/IF9zY29wZVNlbGVjdG9yUGFydChwYXJ0KSA6IHBhcnQ7XG5cbiAgICAvLyByZXBsYWNlIHRoZSBwbGFjZWhvbGRlcnMgd2l0aCB0aGVpciBvcmlnaW5hbCB2YWx1ZXNcbiAgICByZXR1cm4gc2FmZUNvbnRlbnQucmVzdG9yZShzY29wZWRTZWxlY3Rvcik7XG4gIH1cblxuICBwcml2YXRlIF9pbnNlcnRQb2x5ZmlsbEhvc3RJbkNzc1RleHQoc2VsZWN0b3I6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UoX2NvbG9uSG9zdENvbnRleHRSZSwgX3BvbHlmaWxsSG9zdENvbnRleHQpXG4gICAgICAgIC5yZXBsYWNlKF9jb2xvbkhvc3RSZSwgX3BvbHlmaWxsSG9zdCk7XG4gIH1cbn1cblxuY2xhc3MgU2FmZVNlbGVjdG9yIHtcbiAgcHJpdmF0ZSBwbGFjZWhvbGRlcnM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgaW5kZXggPSAwO1xuICBwcml2YXRlIF9jb250ZW50OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2VsZWN0b3I6IHN0cmluZykge1xuICAgIC8vIFJlcGxhY2VzIGF0dHJpYnV0ZSBzZWxlY3RvcnMgd2l0aCBwbGFjZWhvbGRlcnMuXG4gICAgLy8gVGhlIFdTIGluIFthdHRyPVwidmEgbHVlXCJdIHdvdWxkIG90aGVyd2lzZSBiZSBpbnRlcnByZXRlZCBhcyBhIHNlbGVjdG9yIHNlcGFyYXRvci5cbiAgICBzZWxlY3RvciA9IHRoaXMuX2VzY2FwZVJlZ2V4TWF0Y2hlcyhzZWxlY3RvciwgLyhcXFtbXlxcXV0qXFxdKS9nKTtcblxuICAgIC8vIENTUyBhbGxvd3MgZm9yIGNlcnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzIHRvIGJlIHVzZWQgaW4gc2VsZWN0b3JzIGlmIHRoZXkncmUgZXNjYXBlZC5cbiAgICAvLyBFLmcuIGAuZm9vOmJsdWVgIHdvbid0IG1hdGNoIGEgY2xhc3MgY2FsbGVkIGBmb286Ymx1ZWAsIGJlY2F1c2UgdGhlIGNvbG9uIGRlbm90ZXMgYVxuICAgIC8vIHBzZXVkby1jbGFzcywgYnV0IHdyaXRpbmcgYC5mb29cXDpibHVlYCB3aWxsIG1hdGNoLCBiZWNhdXNlIHRoZSBjb2xvbiB3YXMgZXNjYXBlZC5cbiAgICAvLyBSZXBsYWNlIGFsbCBlc2NhcGUgc2VxdWVuY2VzIChgXFxgIGZvbGxvd2VkIGJ5IGEgY2hhcmFjdGVyKSB3aXRoIGEgcGxhY2Vob2xkZXIgc29cbiAgICAvLyB0aGF0IG91ciBoYW5kbGluZyBvZiBwc2V1ZG8tc2VsZWN0b3JzIGRvZXNuJ3QgbWVzcyB3aXRoIHRoZW0uXG4gICAgc2VsZWN0b3IgPSB0aGlzLl9lc2NhcGVSZWdleE1hdGNoZXMoc2VsZWN0b3IsIC8oXFxcXC4pL2cpO1xuXG4gICAgLy8gUmVwbGFjZXMgdGhlIGV4cHJlc3Npb24gaW4gYDpudGgtY2hpbGQoMm4gKyAxKWAgd2l0aCBhIHBsYWNlaG9sZGVyLlxuICAgIC8vIFdTIGFuZCBcIitcIiB3b3VsZCBvdGhlcndpc2UgYmUgaW50ZXJwcmV0ZWQgYXMgc2VsZWN0b3Igc2VwYXJhdG9ycy5cbiAgICB0aGlzLl9jb250ZW50ID0gc2VsZWN0b3IucmVwbGFjZSgvKDpudGgtWy1cXHddKykoXFwoW14pXStcXCkpL2csIChfLCBwc2V1ZG8sIGV4cCkgPT4ge1xuICAgICAgY29uc3QgcmVwbGFjZUJ5ID0gYF9fcGgtJHt0aGlzLmluZGV4fV9fYDtcbiAgICAgIHRoaXMucGxhY2Vob2xkZXJzLnB1c2goZXhwKTtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHJldHVybiBwc2V1ZG8gKyByZXBsYWNlQnk7XG4gICAgfSk7XG4gIH1cblxuICByZXN0b3JlKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvX19waC0oXFxkKylfXy9nLCAoX3BoLCBpbmRleCkgPT4gdGhpcy5wbGFjZWhvbGRlcnNbK2luZGV4XSk7XG4gIH1cblxuICBjb250ZW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnQ7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgYWxsIG9mIHRoZSBzdWJzdHJpbmdzIHRoYXQgbWF0Y2ggYSByZWdleCB3aXRoaW4gYVxuICAgKiBzcGVjaWFsIHN0cmluZyAoZS5nLiBgX19waC0wX19gLCBgX19waC0xX19gLCBldGMpLlxuICAgKi9cbiAgcHJpdmF0ZSBfZXNjYXBlUmVnZXhNYXRjaGVzKGNvbnRlbnQ6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogc3RyaW5nIHtcbiAgICByZXR1cm4gY29udGVudC5yZXBsYWNlKHBhdHRlcm4sIChfLCBrZWVwKSA9PiB7XG4gICAgICBjb25zdCByZXBsYWNlQnkgPSBgX19waC0ke3RoaXMuaW5kZXh9X19gO1xuICAgICAgdGhpcy5wbGFjZWhvbGRlcnMucHVzaChrZWVwKTtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHJldHVybiByZXBsYWNlQnk7XG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgX2Nzc0NvbnRlbnROZXh0U2VsZWN0b3JSZSA9XG4gICAgL3BvbHlmaWxsLW5leHQtc2VsZWN0b3JbXn1dKmNvbnRlbnQ6W1xcc10qPyhbJ1wiXSkoLio/KVxcMVs7XFxzXSp9KFtee10qPyl7L2dpbTtcbmNvbnN0IF9jc3NDb250ZW50UnVsZVJlID0gLyhwb2x5ZmlsbC1ydWxlKVtefV0qKGNvbnRlbnQ6W1xcc10qKFsnXCJdKSguKj8pXFwzKVs7XFxzXSpbXn1dKn0vZ2ltO1xuY29uc3QgX2Nzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZSA9XG4gICAgLyhwb2x5ZmlsbC11bnNjb3BlZC1ydWxlKVtefV0qKGNvbnRlbnQ6W1xcc10qKFsnXCJdKSguKj8pXFwzKVs7XFxzXSpbXn1dKn0vZ2ltO1xuY29uc3QgX3BvbHlmaWxsSG9zdCA9ICctc2hhZG93Y3NzaG9zdCc7XG4vLyBub3RlOiA6aG9zdC1jb250ZXh0IHByZS1wcm9jZXNzZWQgdG8gLXNoYWRvd2Nzc2hvc3Rjb250ZXh0LlxuY29uc3QgX3BvbHlmaWxsSG9zdENvbnRleHQgPSAnLXNoYWRvd2Nzc2NvbnRleHQnO1xuY29uc3QgX3BhcmVuU3VmZml4ID0gJyg/OlxcXFwoKCcgK1xuICAgICcoPzpcXFxcKFteKShdKlxcXFwpfFteKShdKikrPycgK1xuICAgICcpXFxcXCkpPyhbXix7XSopJztcbmNvbnN0IF9jc3NDb2xvbkhvc3RSZSA9IG5ldyBSZWdFeHAoX3BvbHlmaWxsSG9zdCArIF9wYXJlblN1ZmZpeCwgJ2dpbScpO1xuY29uc3QgX2Nzc0NvbG9uSG9zdENvbnRleHRSZUdsb2JhbCA9IG5ldyBSZWdFeHAoX3BvbHlmaWxsSG9zdENvbnRleHQgKyBfcGFyZW5TdWZmaXgsICdnaW0nKTtcbmNvbnN0IF9jc3NDb2xvbkhvc3RDb250ZXh0UmUgPSBuZXcgUmVnRXhwKF9wb2x5ZmlsbEhvc3RDb250ZXh0ICsgX3BhcmVuU3VmZml4LCAnaW0nKTtcbmNvbnN0IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IgPSBfcG9seWZpbGxIb3N0ICsgJy1uby1jb21iaW5hdG9yJztcbmNvbnN0IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3JSZSA9IC8tc2hhZG93Y3NzaG9zdC1uby1jb21iaW5hdG9yKFteXFxzXSopLztcbmNvbnN0IF9zaGFkb3dET01TZWxlY3RvcnNSZSA9IFtcbiAgLzo6c2hhZG93L2csXG4gIC86OmNvbnRlbnQvZyxcbiAgLy8gRGVwcmVjYXRlZCBzZWxlY3RvcnNcbiAgL1xcL3NoYWRvdy1kZWVwXFwvL2csXG4gIC9cXC9zaGFkb3dcXC8vZyxcbl07XG5cbi8vIFRoZSBkZWVwIGNvbWJpbmF0b3IgaXMgZGVwcmVjYXRlZCBpbiB0aGUgQ1NTIHNwZWNcbi8vIFN1cHBvcnQgZm9yIGA+Pj5gLCBgZGVlcGAsIGA6Om5nLWRlZXBgIGlzIHRoZW4gYWxzbyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIGZ1dHVyZS5cbi8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMTc2NzdcbmNvbnN0IF9zaGFkb3dEZWVwU2VsZWN0b3JzID0gLyg/Oj4+Pil8KD86XFwvZGVlcFxcLyl8KD86OjpuZy1kZWVwKS9nO1xuY29uc3QgX3NlbGVjdG9yUmVTdWZmaXggPSAnKFs+XFxcXHN+K1suLHs6XVtcXFxcc1xcXFxTXSopPyQnO1xuY29uc3QgX3BvbHlmaWxsSG9zdFJlID0gLy1zaGFkb3djc3Nob3N0L2dpbTtcbmNvbnN0IF9jb2xvbkhvc3RSZSA9IC86aG9zdC9naW07XG5jb25zdCBfY29sb25Ib3N0Q29udGV4dFJlID0gLzpob3N0LWNvbnRleHQvZ2ltO1xuXG5jb25zdCBfY29tbWVudFJlID0gL1xcL1xcKltcXHNcXFNdKj9cXCpcXC8vZztcblxuZnVuY3Rpb24gc3RyaXBDb21tZW50cyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoX2NvbW1lbnRSZSwgJycpO1xufVxuXG5jb25zdCBfY29tbWVudFdpdGhIYXNoUmUgPSAvXFwvXFwqXFxzKiNcXHMqc291cmNlKE1hcHBpbmcpP1VSTD1bXFxzXFxTXSs/XFwqXFwvL2c7XG5cbmZ1bmN0aW9uIGV4dHJhY3RDb21tZW50c1dpdGhIYXNoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBpbnB1dC5tYXRjaChfY29tbWVudFdpdGhIYXNoUmUpIHx8IFtdO1xufVxuXG5jb25zdCBCTE9DS19QTEFDRUhPTERFUiA9ICclQkxPQ0slJztcbmNvbnN0IFFVT1RFX1BMQUNFSE9MREVSID0gJyVRVU9URUQlJztcbmNvbnN0IF9ydWxlUmUgPSAvKFxccyopKFteO1xce1xcfV0rPykoXFxzKikoKD86eyVCTE9DSyV9P1xccyo7Pyl8KD86XFxzKjspKS9nO1xuY29uc3QgX3F1b3RlZFJlID0gLyVRVU9URUQlL2c7XG5jb25zdCBDT05URU5UX1BBSVJTID0gbmV3IE1hcChbWyd7JywgJ30nXV0pO1xuY29uc3QgUVVPVEVfUEFJUlMgPSBuZXcgTWFwKFtbYFwiYCwgYFwiYF0sIFtgJ2AsIGAnYF1dKTtcblxuZXhwb3J0IGNsYXNzIENzc1J1bGUge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgc2VsZWN0b3I6IHN0cmluZywgcHVibGljIGNvbnRlbnQ6IHN0cmluZykge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NSdWxlcyhpbnB1dDogc3RyaW5nLCBydWxlQ2FsbGJhY2s6IChydWxlOiBDc3NSdWxlKSA9PiBDc3NSdWxlKTogc3RyaW5nIHtcbiAgY29uc3QgaW5wdXRXaXRoRXNjYXBlZFF1b3RlcyA9IGVzY2FwZUJsb2NrcyhpbnB1dCwgUVVPVEVfUEFJUlMsIFFVT1RFX1BMQUNFSE9MREVSKTtcbiAgY29uc3QgaW5wdXRXaXRoRXNjYXBlZEJsb2NrcyA9XG4gICAgICBlc2NhcGVCbG9ja3MoaW5wdXRXaXRoRXNjYXBlZFF1b3Rlcy5lc2NhcGVkU3RyaW5nLCBDT05URU5UX1BBSVJTLCBCTE9DS19QTEFDRUhPTERFUik7XG4gIGxldCBuZXh0QmxvY2tJbmRleCA9IDA7XG4gIGxldCBuZXh0UXVvdGVJbmRleCA9IDA7XG4gIHJldHVybiBpbnB1dFdpdGhFc2NhcGVkQmxvY2tzLmVzY2FwZWRTdHJpbmdcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAgIF9ydWxlUmUsXG4gICAgICAgICAgKC4uLm06IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RvciA9IG1bMl07XG4gICAgICAgICAgICBsZXQgY29udGVudCA9ICcnO1xuICAgICAgICAgICAgbGV0IHN1ZmZpeCA9IG1bNF07XG4gICAgICAgICAgICBsZXQgY29udGVudFByZWZpeCA9ICcnO1xuICAgICAgICAgICAgaWYgKHN1ZmZpeCAmJiBzdWZmaXguc3RhcnRzV2l0aCgneycgKyBCTE9DS19QTEFDRUhPTERFUikpIHtcbiAgICAgICAgICAgICAgY29udGVudCA9IGlucHV0V2l0aEVzY2FwZWRCbG9ja3MuYmxvY2tzW25leHRCbG9ja0luZGV4KytdO1xuICAgICAgICAgICAgICBzdWZmaXggPSBzdWZmaXguc3Vic3RyaW5nKEJMT0NLX1BMQUNFSE9MREVSLmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgICBjb250ZW50UHJlZml4ID0gJ3snO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHJ1bGVDYWxsYmFjayhuZXcgQ3NzUnVsZShzZWxlY3RvciwgY29udGVudCkpO1xuICAgICAgICAgICAgcmV0dXJuIGAke21bMV19JHtydWxlLnNlbGVjdG9yfSR7bVszXX0ke2NvbnRlbnRQcmVmaXh9JHtydWxlLmNvbnRlbnR9JHtzdWZmaXh9YDtcbiAgICAgICAgICB9KVxuICAgICAgLnJlcGxhY2UoX3F1b3RlZFJlLCAoKSA9PiBpbnB1dFdpdGhFc2NhcGVkUXVvdGVzLmJsb2Nrc1tuZXh0UXVvdGVJbmRleCsrXSk7XG59XG5cbmNsYXNzIFN0cmluZ1dpdGhFc2NhcGVkQmxvY2tzIHtcbiAgY29uc3RydWN0b3IocHVibGljIGVzY2FwZWRTdHJpbmc6IHN0cmluZywgcHVibGljIGJsb2Nrczogc3RyaW5nW10pIHt9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUJsb2NrcyhcbiAgICBpbnB1dDogc3RyaW5nLCBjaGFyUGFpcnM6IE1hcDxzdHJpbmcsIHN0cmluZz4sIHBsYWNlaG9sZGVyOiBzdHJpbmcpOiBTdHJpbmdXaXRoRXNjYXBlZEJsb2NrcyB7XG4gIGNvbnN0IHJlc3VsdFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBlc2NhcGVkQmxvY2tzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgb3BlbkNoYXJDb3VudCA9IDA7XG4gIGxldCBub25CbG9ja1N0YXJ0SW5kZXggPSAwO1xuICBsZXQgYmxvY2tTdGFydEluZGV4ID0gLTE7XG4gIGxldCBvcGVuQ2hhcjogc3RyaW5nfHVuZGVmaW5lZDtcbiAgbGV0IGNsb3NlQ2hhcjogc3RyaW5nfHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoYXIgPSBpbnB1dFtpXTtcbiAgICBpZiAoY2hhciA9PT0gJ1xcXFwnKSB7XG4gICAgICBpKys7XG4gICAgfSBlbHNlIGlmIChjaGFyID09PSBjbG9zZUNoYXIpIHtcbiAgICAgIG9wZW5DaGFyQ291bnQtLTtcbiAgICAgIGlmIChvcGVuQ2hhckNvdW50ID09PSAwKSB7XG4gICAgICAgIGVzY2FwZWRCbG9ja3MucHVzaChpbnB1dC5zdWJzdHJpbmcoYmxvY2tTdGFydEluZGV4LCBpKSk7XG4gICAgICAgIHJlc3VsdFBhcnRzLnB1c2gocGxhY2Vob2xkZXIpO1xuICAgICAgICBub25CbG9ja1N0YXJ0SW5kZXggPSBpO1xuICAgICAgICBibG9ja1N0YXJ0SW5kZXggPSAtMTtcbiAgICAgICAgb3BlbkNoYXIgPSBjbG9zZUNoYXIgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaGFyID09PSBvcGVuQ2hhcikge1xuICAgICAgb3BlbkNoYXJDb3VudCsrO1xuICAgIH0gZWxzZSBpZiAob3BlbkNoYXJDb3VudCA9PT0gMCAmJiBjaGFyUGFpcnMuaGFzKGNoYXIpKSB7XG4gICAgICBvcGVuQ2hhciA9IGNoYXI7XG4gICAgICBjbG9zZUNoYXIgPSBjaGFyUGFpcnMuZ2V0KGNoYXIpO1xuICAgICAgb3BlbkNoYXJDb3VudCA9IDE7XG4gICAgICBibG9ja1N0YXJ0SW5kZXggPSBpICsgMTtcbiAgICAgIHJlc3VsdFBhcnRzLnB1c2goaW5wdXQuc3Vic3RyaW5nKG5vbkJsb2NrU3RhcnRJbmRleCwgYmxvY2tTdGFydEluZGV4KSk7XG4gICAgfVxuICB9XG4gIGlmIChibG9ja1N0YXJ0SW5kZXggIT09IC0xKSB7XG4gICAgZXNjYXBlZEJsb2Nrcy5wdXNoKGlucHV0LnN1YnN0cmluZyhibG9ja1N0YXJ0SW5kZXgpKTtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKHBsYWNlaG9sZGVyKTtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKGlucHV0LnN1YnN0cmluZyhub25CbG9ja1N0YXJ0SW5kZXgpKTtcbiAgfVxuICByZXR1cm4gbmV3IFN0cmluZ1dpdGhFc2NhcGVkQmxvY2tzKHJlc3VsdFBhcnRzLmpvaW4oJycpLCBlc2NhcGVkQmxvY2tzKTtcbn1cblxuLyoqXG4gKiBDb21iaW5lIHRoZSBgY29udGV4dFNlbGVjdG9yc2Agd2l0aCB0aGUgYGhvc3RNYXJrZXJgIGFuZCB0aGUgYG90aGVyU2VsZWN0b3JzYFxuICogdG8gY3JlYXRlIGEgc2VsZWN0b3IgdGhhdCBtYXRjaGVzIHRoZSBzYW1lIGFzIGA6aG9zdC1jb250ZXh0KClgLlxuICpcbiAqIEdpdmVuIGEgc2luZ2xlIGNvbnRleHQgc2VsZWN0b3IgYEFgIHdlIG5lZWQgdG8gb3V0cHV0IHNlbGVjdG9ycyB0aGF0IG1hdGNoIG9uIHRoZSBob3N0IGFuZCBhcyBhblxuICogYW5jZXN0b3Igb2YgdGhlIGhvc3Q6XG4gKlxuICogYGBgXG4gKiBBIDxob3N0TWFya2VyPiwgQTxob3N0TWFya2VyPiB7fVxuICogYGBgXG4gKlxuICogV2hlbiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIGNvbnRleHQgc2VsZWN0b3Igd2UgYWxzbyBoYXZlIHRvIGNyZWF0ZSBjb21iaW5hdGlvbnMgb2YgdGhvc2VcbiAqIHNlbGVjdG9ycyB3aXRoIGVhY2ggb3RoZXIuIEZvciBleGFtcGxlIGlmIHRoZXJlIGFyZSBgQWAgYW5kIGBCYCBzZWxlY3RvcnMgdGhlIG91dHB1dCBpczpcbiAqXG4gKiBgYGBcbiAqIEFCPGhvc3RNYXJrZXI+LCBBQiA8aG9zdE1hcmtlcj4sIEEgQjxob3N0TWFya2VyPixcbiAqIEIgQTxob3N0TWFya2VyPiwgQSBCIDxob3N0TWFya2VyPiwgQiBBIDxob3N0TWFya2VyPiB7fVxuICogYGBgXG4gKlxuICogQW5kIHNvIG9uLi4uXG4gKlxuICogQHBhcmFtIGhvc3RNYXJrZXIgdGhlIHN0cmluZyB0aGF0IHNlbGVjdHMgdGhlIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBjb250ZXh0U2VsZWN0b3JzIGFuIGFycmF5IG9mIGNvbnRleHQgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSBjb21iaW5lZC5cbiAqIEBwYXJhbSBvdGhlclNlbGVjdG9ycyB0aGUgcmVzdCBvZiB0aGUgc2VsZWN0b3JzIHRoYXQgYXJlIG5vdCBjb250ZXh0IHNlbGVjdG9ycy5cbiAqL1xuZnVuY3Rpb24gY29tYmluZUhvc3RDb250ZXh0U2VsZWN0b3JzKGNvbnRleHRTZWxlY3RvcnM6IHN0cmluZ1tdLCBvdGhlclNlbGVjdG9yczogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdE1hcmtlciA9IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3I7XG4gIF9wb2x5ZmlsbEhvc3RSZS5sYXN0SW5kZXggPSAwOyAgLy8gcmVzZXQgdGhlIHJlZ2V4IHRvIGVuc3VyZSB3ZSBnZXQgYW4gYWNjdXJhdGUgdGVzdFxuICBjb25zdCBvdGhlclNlbGVjdG9yc0hhc0hvc3QgPSBfcG9seWZpbGxIb3N0UmUudGVzdChvdGhlclNlbGVjdG9ycyk7XG5cbiAgLy8gSWYgdGhlcmUgYXJlIG5vIGNvbnRleHQgc2VsZWN0b3JzIHRoZW4ganVzdCBvdXRwdXQgYSBob3N0IG1hcmtlclxuICBpZiAoY29udGV4dFNlbGVjdG9ycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gaG9zdE1hcmtlciArIG90aGVyU2VsZWN0b3JzO1xuICB9XG5cbiAgY29uc3QgY29tYmluZWQ6IHN0cmluZ1tdID0gW2NvbnRleHRTZWxlY3RvcnMucG9wKCkgfHwgJyddO1xuICB3aGlsZSAoY29udGV4dFNlbGVjdG9ycy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gY29tYmluZWQubGVuZ3RoO1xuICAgIGNvbnN0IGNvbnRleHRTZWxlY3RvciA9IGNvbnRleHRTZWxlY3RvcnMucG9wKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJldmlvdXNTZWxlY3RvcnMgPSBjb21iaW5lZFtpXTtcbiAgICAgIC8vIEFkZCB0aGUgbmV3IHNlbGVjdG9yIGFzIGEgZGVzY2VuZGFudCBvZiB0aGUgcHJldmlvdXMgc2VsZWN0b3JzXG4gICAgICBjb21iaW5lZFtsZW5ndGggKiAyICsgaV0gPSBwcmV2aW91c1NlbGVjdG9ycyArICcgJyArIGNvbnRleHRTZWxlY3RvcjtcbiAgICAgIC8vIEFkZCB0aGUgbmV3IHNlbGVjdG9yIGFzIGFuIGFuY2VzdG9yIG9mIHRoZSBwcmV2aW91cyBzZWxlY3RvcnNcbiAgICAgIGNvbWJpbmVkW2xlbmd0aCArIGldID0gY29udGV4dFNlbGVjdG9yICsgJyAnICsgcHJldmlvdXNTZWxlY3RvcnM7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBzZWxlY3RvciB0byBhY3Qgb24gdGhlIHNhbWUgZWxlbWVudCBhcyB0aGUgcHJldmlvdXMgc2VsZWN0b3JzXG4gICAgICBjb21iaW5lZFtpXSA9IGNvbnRleHRTZWxlY3RvciArIHByZXZpb3VzU2VsZWN0b3JzO1xuICAgIH1cbiAgfVxuICAvLyBGaW5hbGx5IGNvbm5lY3QgdGhlIHNlbGVjdG9yIHRvIHRoZSBgaG9zdE1hcmtlcmBzOiBlaXRoZXIgYWN0aW5nIGRpcmVjdGx5IG9uIHRoZSBob3N0XG4gIC8vIChBPGhvc3RNYXJrZXI+KSBvciBhcyBhbiBhbmNlc3RvciAoQSA8aG9zdE1hcmtlcj4pLlxuICByZXR1cm4gY29tYmluZWRcbiAgICAgIC5tYXAoXG4gICAgICAgICAgcyA9PiBvdGhlclNlbGVjdG9yc0hhc0hvc3QgP1xuICAgICAgICAgICAgICBgJHtzfSR7b3RoZXJTZWxlY3RvcnN9YCA6XG4gICAgICAgICAgICAgIGAke3N9JHtob3N0TWFya2VyfSR7b3RoZXJTZWxlY3RvcnN9LCAke3N9ICR7aG9zdE1hcmtlcn0ke290aGVyU2VsZWN0b3JzfWApXG4gICAgICAuam9pbignLCcpO1xufVxuXG4vKipcbiAqIE11dGF0ZSB0aGUgZ2l2ZW4gYGdyb3Vwc2AgYXJyYXkgc28gdGhhdCB0aGVyZSBhcmUgYG11bHRpcGxlc2AgY2xvbmVzIG9mIHRoZSBvcmlnaW5hbCBhcnJheVxuICogc3RvcmVkLlxuICpcbiAqIEZvciBleGFtcGxlIGByZXBlYXRHcm91cHMoW2EsIGJdLCAzKWAgd2lsbCByZXN1bHQgaW4gYFthLCBiLCBhLCBiLCBhLCBiXWAgLSBidXQgaW1wb3J0YW50bHkgdGhlXG4gKiBuZXdseSBhZGRlZCBncm91cHMgd2lsbCBiZSBjbG9uZXMgb2YgdGhlIG9yaWdpbmFsLlxuICpcbiAqIEBwYXJhbSBncm91cHMgQW4gYXJyYXkgb2YgZ3JvdXBzIG9mIHN0cmluZ3MgdGhhdCB3aWxsIGJlIHJlcGVhdGVkLiBUaGlzIGFycmF5IGlzIG11dGF0ZWRcbiAqICAgICBpbi1wbGFjZS5cbiAqIEBwYXJhbSBtdWx0aXBsZXMgVGhlIG51bWJlciBvZiB0aW1lcyB0aGUgY3VycmVudCBncm91cHMgc2hvdWxkIGFwcGVhci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdEdyb3Vwcyhncm91cHM6IHN0cmluZ1tdW10sIG11bHRpcGxlczogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxlbmd0aCA9IGdyb3Vwcy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbXVsdGlwbGVzOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxlbmd0aDsgaisrKSB7XG4gICAgICBncm91cHNbaiArIChpICogbGVuZ3RoKV0gPSBncm91cHNbal0uc2xpY2UoMCk7XG4gICAgfVxuICB9XG59XG4iXX0=