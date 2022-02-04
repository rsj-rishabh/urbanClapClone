/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/completion" />
import { AST, LiteralPrimitive, PropertyRead, PropertyWrite, SafePropertyRead, TmplAstNode, TmplAstTemplate, TmplAstTextAttribute } from '@angular/compiler';
import ts from 'typescript';
import { AbsoluteFsPath } from '../../file_system';
import { GlobalCompletion, ShimLocation } from '../api';
import { TemplateData } from './context';
/**
 * Powers autocompletion for a specific component.
 *
 * Internally caches autocompletion results, and must be discarded if the component template or
 * surrounding TS program have changed.
 */
export declare class CompletionEngine {
    private tcb;
    private data;
    private shimPath;
    private componentContext;
    /**
     * Cache of completions for various levels of the template, including the root template (`null`).
     * Memoizes `getTemplateContextCompletions`.
     */
    private templateContextCache;
    private expressionCompletionCache;
    constructor(tcb: ts.Node, data: TemplateData, shimPath: AbsoluteFsPath);
    /**
     * Get global completions within the given template context and AST node.
     *
     * @param context the given template context - either a `TmplAstTemplate` embedded view, or `null`
     *     for the root
     * template context.
     * @param node the given AST node
     */
    getGlobalCompletions(context: TmplAstTemplate | null, node: AST | TmplAstNode): GlobalCompletion | null;
    getExpressionCompletionLocation(expr: PropertyRead | PropertyWrite | SafePropertyRead): ShimLocation | null;
    getLiteralCompletionLocation(expr: LiteralPrimitive | TmplAstTextAttribute): ShimLocation | null;
    /**
     * Get global completions within the given template context - either a `TmplAstTemplate` embedded
     * view, or `null` for the root context.
     */
    private getTemplateContextCompletions;
}
