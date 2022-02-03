/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Host, Input, Optional, TemplateRef, ViewContainerRef, ɵRuntimeError as RuntimeError } from '@angular/core';
import * as i0 from "@angular/core";
export class SwitchView {
    constructor(_viewContainerRef, _templateRef) {
        this._viewContainerRef = _viewContainerRef;
        this._templateRef = _templateRef;
        this._created = false;
    }
    create() {
        this._created = true;
        this._viewContainerRef.createEmbeddedView(this._templateRef);
    }
    destroy() {
        this._created = false;
        this._viewContainerRef.clear();
    }
    enforceState(created) {
        if (created && !this._created) {
            this.create();
        }
        else if (!created && this._created) {
            this.destroy();
        }
    }
}
/**
 * @ngModule CommonModule
 *
 * @description
 * The `[ngSwitch]` directive on a container specifies an expression to match against.
 * The expressions to match are provided by `ngSwitchCase` directives on views within the container.
 * - Every view that matches is rendered.
 * - If there are no matches, a view with the `ngSwitchDefault` directive is rendered.
 * - Elements within the `[NgSwitch]` statement but outside of any `NgSwitchCase`
 * or `ngSwitchDefault` directive are preserved at the location.
 *
 * @usageNotes
 * Define a container element for the directive, and specify the switch expression
 * to match against as an attribute:
 *
 * ```
 * <container-element [ngSwitch]="switch_expression">
 * ```
 *
 * Within the container, `*ngSwitchCase` statements specify the match expressions
 * as attributes. Include `*ngSwitchDefault` as the final case.
 *
 * ```
 * <container-element [ngSwitch]="switch_expression">
 *    <some-element *ngSwitchCase="match_expression_1">...</some-element>
 * ...
 *    <some-element *ngSwitchDefault>...</some-element>
 * </container-element>
 * ```
 *
 * ### Usage Examples
 *
 * The following example shows how to use more than one case to display the same view:
 *
 * ```
 * <container-element [ngSwitch]="switch_expression">
 *   <!-- the same view can be shown in more than one case -->
 *   <some-element *ngSwitchCase="match_expression_1">...</some-element>
 *   <some-element *ngSwitchCase="match_expression_2">...</some-element>
 *   <some-other-element *ngSwitchCase="match_expression_3">...</some-other-element>
 *   <!--default case when there are no matches -->
 *   <some-element *ngSwitchDefault>...</some-element>
 * </container-element>
 * ```
 *
 * The following example shows how cases can be nested:
 * ```
 * <container-element [ngSwitch]="switch_expression">
 *       <some-element *ngSwitchCase="match_expression_1">...</some-element>
 *       <some-element *ngSwitchCase="match_expression_2">...</some-element>
 *       <some-other-element *ngSwitchCase="match_expression_3">...</some-other-element>
 *       <ng-container *ngSwitchCase="match_expression_3">
 *         <!-- use a ng-container to group multiple root nodes -->
 *         <inner-element></inner-element>
 *         <inner-other-element></inner-other-element>
 *       </ng-container>
 *       <some-element *ngSwitchDefault>...</some-element>
 *     </container-element>
 * ```
 *
 * @publicApi
 * @see `NgSwitchCase`
 * @see `NgSwitchDefault`
 * @see [Structural Directives](guide/structural-directives)
 *
 */
export class NgSwitch {
    constructor() {
        this._defaultUsed = false;
        this._caseCount = 0;
        this._lastCaseCheckIndex = 0;
        this._lastCasesMatched = false;
    }
    set ngSwitch(newValue) {
        this._ngSwitch = newValue;
        if (this._caseCount === 0) {
            this._updateDefaultCases(true);
        }
    }
    /** @internal */
    _addCase() {
        return this._caseCount++;
    }
    /** @internal */
    _addDefault(view) {
        if (!this._defaultViews) {
            this._defaultViews = [];
        }
        this._defaultViews.push(view);
    }
    /** @internal */
    _matchCase(value) {
        const matched = value == this._ngSwitch;
        this._lastCasesMatched = this._lastCasesMatched || matched;
        this._lastCaseCheckIndex++;
        if (this._lastCaseCheckIndex === this._caseCount) {
            this._updateDefaultCases(!this._lastCasesMatched);
            this._lastCaseCheckIndex = 0;
            this._lastCasesMatched = false;
        }
        return matched;
    }
    _updateDefaultCases(useDefault) {
        if (this._defaultViews && useDefault !== this._defaultUsed) {
            this._defaultUsed = useDefault;
            for (let i = 0; i < this._defaultViews.length; i++) {
                const defaultView = this._defaultViews[i];
                defaultView.enforceState(useDefault);
            }
        }
    }
}
NgSwitch.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitch, deps: [], target: i0.ɵɵFactoryTarget.Directive });
NgSwitch.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.3", type: NgSwitch, selector: "[ngSwitch]", inputs: { ngSwitch: "ngSwitch" }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitch, decorators: [{
            type: Directive,
            args: [{ selector: '[ngSwitch]' }]
        }], propDecorators: { ngSwitch: [{
                type: Input
            }] } });
/**
 * @ngModule CommonModule
 *
 * @description
 * Provides a switch case expression to match against an enclosing `ngSwitch` expression.
 * When the expressions match, the given `NgSwitchCase` template is rendered.
 * If multiple match expressions match the switch expression value, all of them are displayed.
 *
 * @usageNotes
 *
 * Within a switch container, `*ngSwitchCase` statements specify the match expressions
 * as attributes. Include `*ngSwitchDefault` as the final case.
 *
 * ```
 * <container-element [ngSwitch]="switch_expression">
 *   <some-element *ngSwitchCase="match_expression_1">...</some-element>
 *   ...
 *   <some-element *ngSwitchDefault>...</some-element>
 * </container-element>
 * ```
 *
 * Each switch-case statement contains an in-line HTML template or template reference
 * that defines the subtree to be selected if the value of the match expression
 * matches the value of the switch expression.
 *
 * Unlike JavaScript, which uses strict equality, Angular uses loose equality.
 * This means that the empty string, `""` matches 0.
 *
 * @publicApi
 * @see `NgSwitch`
 * @see `NgSwitchDefault`
 *
 */
export class NgSwitchCase {
    constructor(viewContainer, templateRef, ngSwitch) {
        this.ngSwitch = ngSwitch;
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && !ngSwitch) {
            throwNgSwitchProviderNotFoundError('ngSwitchCase', 'NgSwitchCase');
        }
        ngSwitch._addCase();
        this._view = new SwitchView(viewContainer, templateRef);
    }
    /**
     * Performs case matching. For internal use only.
     */
    ngDoCheck() {
        this._view.enforceState(this.ngSwitch._matchCase(this.ngSwitchCase));
    }
}
NgSwitchCase.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitchCase, deps: [{ token: i0.ViewContainerRef }, { token: i0.TemplateRef }, { token: NgSwitch, host: true, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
NgSwitchCase.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.3", type: NgSwitchCase, selector: "[ngSwitchCase]", inputs: { ngSwitchCase: "ngSwitchCase" }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitchCase, decorators: [{
            type: Directive,
            args: [{ selector: '[ngSwitchCase]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.TemplateRef }, { type: NgSwitch, decorators: [{
                    type: Optional
                }, {
                    type: Host
                }] }]; }, propDecorators: { ngSwitchCase: [{
                type: Input
            }] } });
/**
 * @ngModule CommonModule
 *
 * @description
 *
 * Creates a view that is rendered when no `NgSwitchCase` expressions
 * match the `NgSwitch` expression.
 * This statement should be the final case in an `NgSwitch`.
 *
 * @publicApi
 * @see `NgSwitch`
 * @see `NgSwitchCase`
 *
 */
export class NgSwitchDefault {
    constructor(viewContainer, templateRef, ngSwitch) {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && !ngSwitch) {
            throwNgSwitchProviderNotFoundError('ngSwitchDefault', 'NgSwitchDefault');
        }
        ngSwitch._addDefault(new SwitchView(viewContainer, templateRef));
    }
}
NgSwitchDefault.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitchDefault, deps: [{ token: i0.ViewContainerRef }, { token: i0.TemplateRef }, { token: NgSwitch, host: true, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
NgSwitchDefault.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.3", type: NgSwitchDefault, selector: "[ngSwitchDefault]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: NgSwitchDefault, decorators: [{
            type: Directive,
            args: [{ selector: '[ngSwitchDefault]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.TemplateRef }, { type: NgSwitch, decorators: [{
                    type: Optional
                }, {
                    type: Host
                }] }]; } });
function throwNgSwitchProviderNotFoundError(attrName, directiveName) {
    throw new RuntimeError(2000 /* PARENT_NG_SWITCH_NOT_FOUND */, `An element with the "${attrName}" attribute ` +
        `(matching the "${directiveName}" directive) must be located inside an element with the "ngSwitch" attribute ` +
        `(matching "NgSwitch" directive)`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfc3dpdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9kaXJlY3RpdmVzL25nX3N3aXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFXLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLElBQUksWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUl0SSxNQUFNLE9BQU8sVUFBVTtJQUdyQixZQUNZLGlCQUFtQyxFQUFVLFlBQWlDO1FBQTlFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBcUI7UUFIbEYsYUFBUSxHQUFHLEtBQUssQ0FBQztJQUdvRSxDQUFDO0lBRTlGLE1BQU07UUFDSixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxZQUFZLENBQUMsT0FBZ0I7UUFDM0IsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQzdCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO2FBQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjtJQUNILENBQUM7Q0FDRjtBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWlFRztBQUVILE1BQU0sT0FBTyxRQUFRO0lBRHJCO1FBSVUsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFDckIsZUFBVSxHQUFHLENBQUMsQ0FBQztRQUNmLHdCQUFtQixHQUFHLENBQUMsQ0FBQztRQUN4QixzQkFBaUIsR0FBRyxLQUFLLENBQUM7S0E4Q25DO0lBM0NDLElBQ0ksUUFBUSxDQUFDLFFBQWE7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEM7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLFdBQVcsQ0FBQyxJQUFnQjtRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztTQUN6QjtRQUNELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsVUFBVSxDQUFDLEtBQVU7UUFDbkIsTUFBTSxPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDeEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUM7UUFDM0QsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNoRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7U0FDaEM7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8sbUJBQW1CLENBQUMsVUFBbUI7UUFDN0MsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzFELElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDO1lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDbEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUN0QztTQUNGO0lBQ0gsQ0FBQzs7Z0hBbkRVLFFBQVE7b0dBQVIsUUFBUTtzR0FBUixRQUFRO2tCQURwQixTQUFTO21CQUFDLEVBQUMsUUFBUSxFQUFFLFlBQVksRUFBQzs4QkFXN0IsUUFBUTtzQkFEWCxLQUFLOztBQTZDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQ0c7QUFFSCxNQUFNLE9BQU8sWUFBWTtJQU92QixZQUNJLGFBQStCLEVBQUUsV0FBZ0MsRUFDckMsUUFBa0I7UUFBbEIsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNoRCxJQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2hFLGtDQUFrQyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUNwRTtRQUVELFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQzs7b0hBdkJVLFlBQVksNkVBU21CLFFBQVE7d0dBVHZDLFlBQVk7c0dBQVosWUFBWTtrQkFEeEIsU0FBUzttQkFBQyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQzttSEFVSyxRQUFROzBCQUE3QyxRQUFROzswQkFBSSxJQUFJOzRDQUpaLFlBQVk7c0JBQXBCLEtBQUs7O0FBcUJSOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFFSCxNQUFNLE9BQU8sZUFBZTtJQUMxQixZQUNJLGFBQStCLEVBQUUsV0FBZ0MsRUFDN0MsUUFBa0I7UUFDeEMsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNoRSxrQ0FBa0MsQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQzFFO1FBRUQsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNuRSxDQUFDOzt1SEFUVSxlQUFlLDZFQUdRLFFBQVE7MkdBSC9CLGVBQWU7c0dBQWYsZUFBZTtrQkFEM0IsU0FBUzttQkFBQyxFQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBQzttSEFJTixRQUFROzBCQUFyQyxRQUFROzswQkFBSSxJQUFJOztBQVN2QixTQUFTLGtDQUFrQyxDQUFDLFFBQWdCLEVBQUUsYUFBcUI7SUFDakYsTUFBTSxJQUFJLFlBQVksd0NBRWxCLHdCQUF3QixRQUFRLGNBQWM7UUFDMUMsa0JBQ0ksYUFBYSwrRUFBK0U7UUFDaEcsaUNBQWlDLENBQUMsQ0FBQztBQUM3QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBEb0NoZWNrLCBIb3N0LCBJbnB1dCwgT3B0aW9uYWwsIFRlbXBsYXRlUmVmLCBWaWV3Q29udGFpbmVyUmVmLCDJtVJ1bnRpbWVFcnJvciBhcyBSdW50aW1lRXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hWaWV3IHtcbiAgcHJpdmF0ZSBfY3JlYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZiwgcHJpdmF0ZSBfdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPE9iamVjdD4pIHt9XG5cbiAgY3JlYXRlKCk6IHZvaWQge1xuICAgIHRoaXMuX2NyZWF0ZWQgPSB0cnVlO1xuICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuX3RlbXBsYXRlUmVmKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fY3JlYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY2xlYXIoKTtcbiAgfVxuXG4gIGVuZm9yY2VTdGF0ZShjcmVhdGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGNyZWF0ZWQgJiYgIXRoaXMuX2NyZWF0ZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlKCk7XG4gICAgfSBlbHNlIGlmICghY3JlYXRlZCAmJiB0aGlzLl9jcmVhdGVkKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGUgYFtuZ1N3aXRjaF1gIGRpcmVjdGl2ZSBvbiBhIGNvbnRhaW5lciBzcGVjaWZpZXMgYW4gZXhwcmVzc2lvbiB0byBtYXRjaCBhZ2FpbnN0LlxuICogVGhlIGV4cHJlc3Npb25zIHRvIG1hdGNoIGFyZSBwcm92aWRlZCBieSBgbmdTd2l0Y2hDYXNlYCBkaXJlY3RpdmVzIG9uIHZpZXdzIHdpdGhpbiB0aGUgY29udGFpbmVyLlxuICogLSBFdmVyeSB2aWV3IHRoYXQgbWF0Y2hlcyBpcyByZW5kZXJlZC5cbiAqIC0gSWYgdGhlcmUgYXJlIG5vIG1hdGNoZXMsIGEgdmlldyB3aXRoIHRoZSBgbmdTd2l0Y2hEZWZhdWx0YCBkaXJlY3RpdmUgaXMgcmVuZGVyZWQuXG4gKiAtIEVsZW1lbnRzIHdpdGhpbiB0aGUgYFtOZ1N3aXRjaF1gIHN0YXRlbWVudCBidXQgb3V0c2lkZSBvZiBhbnkgYE5nU3dpdGNoQ2FzZWBcbiAqIG9yIGBuZ1N3aXRjaERlZmF1bHRgIGRpcmVjdGl2ZSBhcmUgcHJlc2VydmVkIGF0IHRoZSBsb2NhdGlvbi5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogRGVmaW5lIGEgY29udGFpbmVyIGVsZW1lbnQgZm9yIHRoZSBkaXJlY3RpdmUsIGFuZCBzcGVjaWZ5IHRoZSBzd2l0Y2ggZXhwcmVzc2lvblxuICogdG8gbWF0Y2ggYWdhaW5zdCBhcyBhbiBhdHRyaWJ1dGU6XG4gKlxuICogYGBgXG4gKiA8Y29udGFpbmVyLWVsZW1lbnQgW25nU3dpdGNoXT1cInN3aXRjaF9leHByZXNzaW9uXCI+XG4gKiBgYGBcbiAqXG4gKiBXaXRoaW4gdGhlIGNvbnRhaW5lciwgYCpuZ1N3aXRjaENhc2VgIHN0YXRlbWVudHMgc3BlY2lmeSB0aGUgbWF0Y2ggZXhwcmVzc2lvbnNcbiAqIGFzIGF0dHJpYnV0ZXMuIEluY2x1ZGUgYCpuZ1N3aXRjaERlZmF1bHRgIGFzIHRoZSBmaW5hbCBjYXNlLlxuICpcbiAqIGBgYFxuICogPGNvbnRhaW5lci1lbGVtZW50IFtuZ1N3aXRjaF09XCJzd2l0Y2hfZXhwcmVzc2lvblwiPlxuICogICAgPHNvbWUtZWxlbWVudCAqbmdTd2l0Y2hDYXNlPVwibWF0Y2hfZXhwcmVzc2lvbl8xXCI+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKiAuLi5cbiAqICAgIDxzb21lLWVsZW1lbnQgKm5nU3dpdGNoRGVmYXVsdD4uLi48L3NvbWUtZWxlbWVudD5cbiAqIDwvY29udGFpbmVyLWVsZW1lbnQ+XG4gKiBgYGBcbiAqXG4gKiAjIyMgVXNhZ2UgRXhhbXBsZXNcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIHVzZSBtb3JlIHRoYW4gb25lIGNhc2UgdG8gZGlzcGxheSB0aGUgc2FtZSB2aWV3OlxuICpcbiAqIGBgYFxuICogPGNvbnRhaW5lci1lbGVtZW50IFtuZ1N3aXRjaF09XCJzd2l0Y2hfZXhwcmVzc2lvblwiPlxuICogICA8IS0tIHRoZSBzYW1lIHZpZXcgY2FuIGJlIHNob3duIGluIG1vcmUgdGhhbiBvbmUgY2FzZSAtLT5cbiAqICAgPHNvbWUtZWxlbWVudCAqbmdTd2l0Y2hDYXNlPVwibWF0Y2hfZXhwcmVzc2lvbl8xXCI+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKiAgIDxzb21lLWVsZW1lbnQgKm5nU3dpdGNoQ2FzZT1cIm1hdGNoX2V4cHJlc3Npb25fMlwiPi4uLjwvc29tZS1lbGVtZW50PlxuICogICA8c29tZS1vdGhlci1lbGVtZW50ICpuZ1N3aXRjaENhc2U9XCJtYXRjaF9leHByZXNzaW9uXzNcIj4uLi48L3NvbWUtb3RoZXItZWxlbWVudD5cbiAqICAgPCEtLWRlZmF1bHQgY2FzZSB3aGVuIHRoZXJlIGFyZSBubyBtYXRjaGVzIC0tPlxuICogICA8c29tZS1lbGVtZW50ICpuZ1N3aXRjaERlZmF1bHQ+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKiA8L2NvbnRhaW5lci1lbGVtZW50PlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIHNob3dzIGhvdyBjYXNlcyBjYW4gYmUgbmVzdGVkOlxuICogYGBgXG4gKiA8Y29udGFpbmVyLWVsZW1lbnQgW25nU3dpdGNoXT1cInN3aXRjaF9leHByZXNzaW9uXCI+XG4gKiAgICAgICA8c29tZS1lbGVtZW50ICpuZ1N3aXRjaENhc2U9XCJtYXRjaF9leHByZXNzaW9uXzFcIj4uLi48L3NvbWUtZWxlbWVudD5cbiAqICAgICAgIDxzb21lLWVsZW1lbnQgKm5nU3dpdGNoQ2FzZT1cIm1hdGNoX2V4cHJlc3Npb25fMlwiPi4uLjwvc29tZS1lbGVtZW50PlxuICogICAgICAgPHNvbWUtb3RoZXItZWxlbWVudCAqbmdTd2l0Y2hDYXNlPVwibWF0Y2hfZXhwcmVzc2lvbl8zXCI+Li4uPC9zb21lLW90aGVyLWVsZW1lbnQ+XG4gKiAgICAgICA8bmctY29udGFpbmVyICpuZ1N3aXRjaENhc2U9XCJtYXRjaF9leHByZXNzaW9uXzNcIj5cbiAqICAgICAgICAgPCEtLSB1c2UgYSBuZy1jb250YWluZXIgdG8gZ3JvdXAgbXVsdGlwbGUgcm9vdCBub2RlcyAtLT5cbiAqICAgICAgICAgPGlubmVyLWVsZW1lbnQ+PC9pbm5lci1lbGVtZW50PlxuICogICAgICAgICA8aW5uZXItb3RoZXItZWxlbWVudD48L2lubmVyLW90aGVyLWVsZW1lbnQ+XG4gKiAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAqICAgICAgIDxzb21lLWVsZW1lbnQgKm5nU3dpdGNoRGVmYXVsdD4uLi48L3NvbWUtZWxlbWVudD5cbiAqICAgICA8L2NvbnRhaW5lci1lbGVtZW50PlxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICogQHNlZSBgTmdTd2l0Y2hDYXNlYFxuICogQHNlZSBgTmdTd2l0Y2hEZWZhdWx0YFxuICogQHNlZSBbU3RydWN0dXJhbCBEaXJlY3RpdmVzXShndWlkZS9zdHJ1Y3R1cmFsLWRpcmVjdGl2ZXMpXG4gKlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tuZ1N3aXRjaF0nfSlcbmV4cG9ydCBjbGFzcyBOZ1N3aXRjaCB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9kZWZhdWx0Vmlld3MhOiBTd2l0Y2hWaWV3W107XG4gIHByaXZhdGUgX2RlZmF1bHRVc2VkID0gZmFsc2U7XG4gIHByaXZhdGUgX2Nhc2VDb3VudCA9IDA7XG4gIHByaXZhdGUgX2xhc3RDYXNlQ2hlY2tJbmRleCA9IDA7XG4gIHByaXZhdGUgX2xhc3RDYXNlc01hdGNoZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbmdTd2l0Y2g6IGFueTtcblxuICBASW5wdXQoKVxuICBzZXQgbmdTd2l0Y2gobmV3VmFsdWU6IGFueSkge1xuICAgIHRoaXMuX25nU3dpdGNoID0gbmV3VmFsdWU7XG4gICAgaWYgKHRoaXMuX2Nhc2VDb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5fdXBkYXRlRGVmYXVsdENhc2VzKHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FkZENhc2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fY2FzZUNvdW50Kys7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hZGREZWZhdWx0KHZpZXc6IFN3aXRjaFZpZXcpIHtcbiAgICBpZiAoIXRoaXMuX2RlZmF1bHRWaWV3cykge1xuICAgICAgdGhpcy5fZGVmYXVsdFZpZXdzID0gW107XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHRWaWV3cy5wdXNoKHZpZXcpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbWF0Y2hDYXNlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgICBjb25zdCBtYXRjaGVkID0gdmFsdWUgPT0gdGhpcy5fbmdTd2l0Y2g7XG4gICAgdGhpcy5fbGFzdENhc2VzTWF0Y2hlZCA9IHRoaXMuX2xhc3RDYXNlc01hdGNoZWQgfHwgbWF0Y2hlZDtcbiAgICB0aGlzLl9sYXN0Q2FzZUNoZWNrSW5kZXgrKztcbiAgICBpZiAodGhpcy5fbGFzdENhc2VDaGVja0luZGV4ID09PSB0aGlzLl9jYXNlQ291bnQpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZURlZmF1bHRDYXNlcyghdGhpcy5fbGFzdENhc2VzTWF0Y2hlZCk7XG4gICAgICB0aGlzLl9sYXN0Q2FzZUNoZWNrSW5kZXggPSAwO1xuICAgICAgdGhpcy5fbGFzdENhc2VzTWF0Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlZDtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZURlZmF1bHRDYXNlcyh1c2VEZWZhdWx0OiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX2RlZmF1bHRWaWV3cyAmJiB1c2VEZWZhdWx0ICE9PSB0aGlzLl9kZWZhdWx0VXNlZCkge1xuICAgICAgdGhpcy5fZGVmYXVsdFVzZWQgPSB1c2VEZWZhdWx0O1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9kZWZhdWx0Vmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZpZXcgPSB0aGlzLl9kZWZhdWx0Vmlld3NbaV07XG4gICAgICAgIGRlZmF1bHRWaWV3LmVuZm9yY2VTdGF0ZSh1c2VEZWZhdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBQcm92aWRlcyBhIHN3aXRjaCBjYXNlIGV4cHJlc3Npb24gdG8gbWF0Y2ggYWdhaW5zdCBhbiBlbmNsb3NpbmcgYG5nU3dpdGNoYCBleHByZXNzaW9uLlxuICogV2hlbiB0aGUgZXhwcmVzc2lvbnMgbWF0Y2gsIHRoZSBnaXZlbiBgTmdTd2l0Y2hDYXNlYCB0ZW1wbGF0ZSBpcyByZW5kZXJlZC5cbiAqIElmIG11bHRpcGxlIG1hdGNoIGV4cHJlc3Npb25zIG1hdGNoIHRoZSBzd2l0Y2ggZXhwcmVzc2lvbiB2YWx1ZSwgYWxsIG9mIHRoZW0gYXJlIGRpc3BsYXllZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFdpdGhpbiBhIHN3aXRjaCBjb250YWluZXIsIGAqbmdTd2l0Y2hDYXNlYCBzdGF0ZW1lbnRzIHNwZWNpZnkgdGhlIG1hdGNoIGV4cHJlc3Npb25zXG4gKiBhcyBhdHRyaWJ1dGVzLiBJbmNsdWRlIGAqbmdTd2l0Y2hEZWZhdWx0YCBhcyB0aGUgZmluYWwgY2FzZS5cbiAqXG4gKiBgYGBcbiAqIDxjb250YWluZXItZWxlbWVudCBbbmdTd2l0Y2hdPVwic3dpdGNoX2V4cHJlc3Npb25cIj5cbiAqICAgPHNvbWUtZWxlbWVudCAqbmdTd2l0Y2hDYXNlPVwibWF0Y2hfZXhwcmVzc2lvbl8xXCI+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKiAgIC4uLlxuICogICA8c29tZS1lbGVtZW50ICpuZ1N3aXRjaERlZmF1bHQ+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKiA8L2NvbnRhaW5lci1lbGVtZW50PlxuICogYGBgXG4gKlxuICogRWFjaCBzd2l0Y2gtY2FzZSBzdGF0ZW1lbnQgY29udGFpbnMgYW4gaW4tbGluZSBIVE1MIHRlbXBsYXRlIG9yIHRlbXBsYXRlIHJlZmVyZW5jZVxuICogdGhhdCBkZWZpbmVzIHRoZSBzdWJ0cmVlIHRvIGJlIHNlbGVjdGVkIGlmIHRoZSB2YWx1ZSBvZiB0aGUgbWF0Y2ggZXhwcmVzc2lvblxuICogbWF0Y2hlcyB0aGUgdmFsdWUgb2YgdGhlIHN3aXRjaCBleHByZXNzaW9uLlxuICpcbiAqIFVubGlrZSBKYXZhU2NyaXB0LCB3aGljaCB1c2VzIHN0cmljdCBlcXVhbGl0eSwgQW5ndWxhciB1c2VzIGxvb3NlIGVxdWFsaXR5LlxuICogVGhpcyBtZWFucyB0aGF0IHRoZSBlbXB0eSBzdHJpbmcsIGBcIlwiYCBtYXRjaGVzIDAuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQHNlZSBgTmdTd2l0Y2hgXG4gKiBAc2VlIGBOZ1N3aXRjaERlZmF1bHRgXG4gKlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tuZ1N3aXRjaENhc2VdJ30pXG5leHBvcnQgY2xhc3MgTmdTd2l0Y2hDYXNlIGltcGxlbWVudHMgRG9DaGVjayB7XG4gIHByaXZhdGUgX3ZpZXc6IFN3aXRjaFZpZXc7XG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIEhUTUwgdGVtcGxhdGUgdG8gYmUgc2VsZWN0ZWQgb24gbWF0Y2guXG4gICAqL1xuICBASW5wdXQoKSBuZ1N3aXRjaENhc2U6IGFueTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxPYmplY3Q+LFxuICAgICAgQE9wdGlvbmFsKCkgQEhvc3QoKSBwcml2YXRlIG5nU3dpdGNoOiBOZ1N3aXRjaCkge1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiAhbmdTd2l0Y2gpIHtcbiAgICAgIHRocm93TmdTd2l0Y2hQcm92aWRlck5vdEZvdW5kRXJyb3IoJ25nU3dpdGNoQ2FzZScsICdOZ1N3aXRjaENhc2UnKTtcbiAgICB9XG5cbiAgICBuZ1N3aXRjaC5fYWRkQ2FzZSgpO1xuICAgIHRoaXMuX3ZpZXcgPSBuZXcgU3dpdGNoVmlldyh2aWV3Q29udGFpbmVyLCB0ZW1wbGF0ZVJlZik7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgY2FzZSBtYXRjaGluZy4gRm9yIGludGVybmFsIHVzZSBvbmx5LlxuICAgKi9cbiAgbmdEb0NoZWNrKCkge1xuICAgIHRoaXMuX3ZpZXcuZW5mb3JjZVN0YXRlKHRoaXMubmdTd2l0Y2guX21hdGNoQ2FzZSh0aGlzLm5nU3dpdGNoQ2FzZSkpO1xuICB9XG59XG5cbi8qKlxuICogQG5nTW9kdWxlIENvbW1vbk1vZHVsZVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIENyZWF0ZXMgYSB2aWV3IHRoYXQgaXMgcmVuZGVyZWQgd2hlbiBubyBgTmdTd2l0Y2hDYXNlYCBleHByZXNzaW9uc1xuICogbWF0Y2ggdGhlIGBOZ1N3aXRjaGAgZXhwcmVzc2lvbi5cbiAqIFRoaXMgc3RhdGVtZW50IHNob3VsZCBiZSB0aGUgZmluYWwgY2FzZSBpbiBhbiBgTmdTd2l0Y2hgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUgYE5nU3dpdGNoYFxuICogQHNlZSBgTmdTd2l0Y2hDYXNlYFxuICpcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbbmdTd2l0Y2hEZWZhdWx0XSd9KVxuZXhwb3J0IGNsYXNzIE5nU3dpdGNoRGVmYXVsdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPE9iamVjdD4sXG4gICAgICBAT3B0aW9uYWwoKSBASG9zdCgpIG5nU3dpdGNoOiBOZ1N3aXRjaCkge1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiAhbmdTd2l0Y2gpIHtcbiAgICAgIHRocm93TmdTd2l0Y2hQcm92aWRlck5vdEZvdW5kRXJyb3IoJ25nU3dpdGNoRGVmYXVsdCcsICdOZ1N3aXRjaERlZmF1bHQnKTtcbiAgICB9XG5cbiAgICBuZ1N3aXRjaC5fYWRkRGVmYXVsdChuZXcgU3dpdGNoVmlldyh2aWV3Q29udGFpbmVyLCB0ZW1wbGF0ZVJlZikpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRocm93TmdTd2l0Y2hQcm92aWRlck5vdEZvdW5kRXJyb3IoYXR0ck5hbWU6IHN0cmluZywgZGlyZWN0aXZlTmFtZTogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5QQVJFTlRfTkdfU1dJVENIX05PVF9GT1VORCxcbiAgICAgIGBBbiBlbGVtZW50IHdpdGggdGhlIFwiJHthdHRyTmFtZX1cIiBhdHRyaWJ1dGUgYCArXG4gICAgICAgICAgYChtYXRjaGluZyB0aGUgXCIke1xuICAgICAgICAgICAgICBkaXJlY3RpdmVOYW1lfVwiIGRpcmVjdGl2ZSkgbXVzdCBiZSBsb2NhdGVkIGluc2lkZSBhbiBlbGVtZW50IHdpdGggdGhlIFwibmdTd2l0Y2hcIiBhdHRyaWJ1dGUgYCArXG4gICAgICAgICAgYChtYXRjaGluZyBcIk5nU3dpdGNoXCIgZGlyZWN0aXZlKWApO1xufVxuIl19