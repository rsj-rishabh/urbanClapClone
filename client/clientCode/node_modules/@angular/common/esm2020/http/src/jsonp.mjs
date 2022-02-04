/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpErrorResponse, HttpEventType, HttpResponse } from './response';
import * as i0 from "@angular/core";
// Every request made through JSONP needs a callback name that's unique across the
// whole page. Each request is assigned an id and the callback name is constructed
// from that. The next id to be assigned is tracked in a global variable here that
// is shared among all applications on the page.
let nextRequestId = 0;
// Error text given when a JSONP script is injected, but doesn't invoke the callback
// passed in its URL.
export const JSONP_ERR_NO_CALLBACK = 'JSONP injected script did not invoke callback.';
// Error text given when a request is passed to the JsonpClientBackend that doesn't
// have a request method JSONP.
export const JSONP_ERR_WRONG_METHOD = 'JSONP requests must use JSONP request method.';
export const JSONP_ERR_WRONG_RESPONSE_TYPE = 'JSONP requests must use Json response type.';
/**
 * DI token/abstract type representing a map of JSONP callbacks.
 *
 * In the browser, this should always be the `window` object.
 *
 *
 */
export class JsonpCallbackContext {
}
/**
 * Processes an `HttpRequest` with the JSONP method,
 * by performing JSONP style requests.
 * @see `HttpHandler`
 * @see `HttpXhrBackend`
 *
 * @publicApi
 */
export class JsonpClientBackend {
    constructor(callbackMap, document) {
        this.callbackMap = callbackMap;
        this.document = document;
        /**
         * A resolved promise that can be used to schedule microtasks in the event handlers.
         */
        this.resolvedPromise = Promise.resolve();
    }
    /**
     * Get the name of the next callback method, by incrementing the global `nextRequestId`.
     */
    nextCallback() {
        return `ng_jsonp_callback_${nextRequestId++}`;
    }
    /**
     * Processes a JSONP request and returns an event stream of the results.
     * @param req The request object.
     * @returns An observable of the response events.
     *
     */
    handle(req) {
        // Firstly, check both the method and response type. If either doesn't match
        // then the request was improperly routed here and cannot be handled.
        if (req.method !== 'JSONP') {
            throw new Error(JSONP_ERR_WRONG_METHOD);
        }
        else if (req.responseType !== 'json') {
            throw new Error(JSONP_ERR_WRONG_RESPONSE_TYPE);
        }
        // Everything else happens inside the Observable boundary.
        return new Observable((observer) => {
            // The first step to make a request is to generate the callback name, and replace the
            // callback placeholder in the URL with the name. Care has to be taken here to ensure
            // a trailing &, if matched, gets inserted back into the URL in the correct place.
            const callback = this.nextCallback();
            const url = req.urlWithParams.replace(/=JSONP_CALLBACK(&|$)/, `=${callback}$1`);
            // Construct the <script> tag and point it at the URL.
            const node = this.document.createElement('script');
            node.src = url;
            // A JSONP request requires waiting for multiple callbacks. These variables
            // are closed over and track state across those callbacks.
            // The response object, if one has been received, or null otherwise.
            let body = null;
            // Whether the response callback has been called.
            let finished = false;
            // Whether the request has been cancelled (and thus any other callbacks)
            // should be ignored.
            let cancelled = false;
            // Set the response callback in this.callbackMap (which will be the window
            // object in the browser. The script being loaded via the <script> tag will
            // eventually call this callback.
            this.callbackMap[callback] = (data) => {
                // Data has been received from the JSONP script. Firstly, delete this callback.
                delete this.callbackMap[callback];
                // Next, make sure the request wasn't cancelled in the meantime.
                if (cancelled) {
                    return;
                }
                // Set state to indicate data was received.
                body = data;
                finished = true;
            };
            // cleanup() is a utility closure that removes the <script> from the page and
            // the response callback from the window. This logic is used in both the
            // success, error, and cancellation paths, so it's extracted out for convenience.
            const cleanup = () => {
                // Remove the <script> tag if it's still on the page.
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
                // Remove the response callback from the callbackMap (window object in the
                // browser).
                delete this.callbackMap[callback];
            };
            // onLoad() is the success callback which runs after the response callback
            // if the JSONP script loads successfully. The event itself is unimportant.
            // If something went wrong, onLoad() may run without the response callback
            // having been invoked.
            const onLoad = (event) => {
                // Do nothing if the request has been cancelled.
                if (cancelled) {
                    return;
                }
                // We wrap it in an extra Promise, to ensure the microtask
                // is scheduled after the loaded endpoint has executed any potential microtask itself,
                // which is not guaranteed in Internet Explorer and EdgeHTML. See issue #39496
                this.resolvedPromise.then(() => {
                    // Cleanup the page.
                    cleanup();
                    // Check whether the response callback has run.
                    if (!finished) {
                        // It hasn't, something went wrong with the request. Return an error via
                        // the Observable error path. All JSONP errors have status 0.
                        observer.error(new HttpErrorResponse({
                            url,
                            status: 0,
                            statusText: 'JSONP Error',
                            error: new Error(JSONP_ERR_NO_CALLBACK),
                        }));
                        return;
                    }
                    // Success. body either contains the response body or null if none was
                    // returned.
                    observer.next(new HttpResponse({
                        body,
                        status: 200 /* Ok */,
                        statusText: 'OK',
                        url,
                    }));
                    // Complete the stream, the response is over.
                    observer.complete();
                });
            };
            // onError() is the error callback, which runs if the script returned generates
            // a Javascript error. It emits the error via the Observable error channel as
            // a HttpErrorResponse.
            const onError = (error) => {
                // If the request was already cancelled, no need to emit anything.
                if (cancelled) {
                    return;
                }
                cleanup();
                // Wrap the error in a HttpErrorResponse.
                observer.error(new HttpErrorResponse({
                    error,
                    status: 0,
                    statusText: 'JSONP Error',
                    url,
                }));
            };
            // Subscribe to both the success (load) and error events on the <script> tag,
            // and add it to the page.
            node.addEventListener('load', onLoad);
            node.addEventListener('error', onError);
            this.document.body.appendChild(node);
            // The request has now been successfully sent.
            observer.next({ type: HttpEventType.Sent });
            // Cancellation handler.
            return () => {
                // Track the cancellation so event listeners won't do anything even if already scheduled.
                cancelled = true;
                // Remove the event listeners so they won't run if the events later fire.
                node.removeEventListener('load', onLoad);
                node.removeEventListener('error', onError);
                // And finally, clean up the page.
                cleanup();
            };
        });
    }
}
JsonpClientBackend.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpClientBackend, deps: [{ token: JsonpCallbackContext }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable });
JsonpClientBackend.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpClientBackend });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpClientBackend, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: JsonpCallbackContext }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
/**
 * Identifies requests with the method JSONP and
 * shifts them to the `JsonpClientBackend`.
 *
 * @see `HttpInterceptor`
 *
 * @publicApi
 */
export class JsonpInterceptor {
    constructor(jsonp) {
        this.jsonp = jsonp;
    }
    /**
     * Identifies and handles a given JSONP request.
     * @param req The outgoing request object to handle.
     * @param next The next interceptor in the chain, or the backend
     * if no interceptors remain in the chain.
     * @returns An observable of the event stream.
     */
    intercept(req, next) {
        if (req.method === 'JSONP') {
            return this.jsonp.handle(req);
        }
        // Fall through for normal HTTP requests.
        return next.handle(req);
    }
}
JsonpInterceptor.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpInterceptor, deps: [{ token: JsonpClientBackend }], target: i0.ɵɵFactoryTarget.Injectable });
JsonpInterceptor.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpInterceptor });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.3", ngImport: i0, type: JsonpInterceptor, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: JsonpClientBackend }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbnAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vaHR0cC9zcmMvanNvbnAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFJMUMsT0FBTyxFQUFDLGlCQUFpQixFQUFhLGFBQWEsRUFBRSxZQUFZLEVBQWlCLE1BQU0sWUFBWSxDQUFDOztBQUdyRyxrRkFBa0Y7QUFDbEYsa0ZBQWtGO0FBQ2xGLGtGQUFrRjtBQUNsRixnREFBZ0Q7QUFDaEQsSUFBSSxhQUFhLEdBQVcsQ0FBQyxDQUFDO0FBRTlCLG9GQUFvRjtBQUNwRixxQkFBcUI7QUFDckIsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsZ0RBQWdELENBQUM7QUFFdEYsbUZBQW1GO0FBQ25GLCtCQUErQjtBQUMvQixNQUFNLENBQUMsTUFBTSxzQkFBc0IsR0FBRywrQ0FBK0MsQ0FBQztBQUN0RixNQUFNLENBQUMsTUFBTSw2QkFBNkIsR0FBRyw2Q0FBNkMsQ0FBQztBQUUzRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLE9BQWdCLG9CQUFvQjtDQUV6QztBQUVEOzs7Ozs7O0dBT0c7QUFFSCxNQUFNLE9BQU8sa0JBQWtCO0lBTTdCLFlBQW9CLFdBQWlDLEVBQTRCLFFBQWE7UUFBMUUsZ0JBQVcsR0FBWCxXQUFXLENBQXNCO1FBQTRCLGFBQVEsR0FBUixRQUFRLENBQUs7UUFMOUY7O1dBRUc7UUFDYyxvQkFBZSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUU0QyxDQUFDO0lBRWxHOztPQUVHO0lBQ0ssWUFBWTtRQUNsQixPQUFPLHFCQUFxQixhQUFhLEVB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R0FBRyxFQUFFO2dCQUNWLHlGQUF5RjtnQkFDekYsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFFakIseUVBQXlFO2dCQUN6RSxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUUzQyxrQ0FBa0M7Z0JBQ2xDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOzswSEEzS1Usa0JBQWtCLGtCQU1JLG9CQUFvQixhQUFVLFFBQVE7OEhBTjVELGtCQUFrQjtzR0FBbEIsa0JBQWtCO2tCQUQ5QixVQUFVOzBEQU93QixvQkFBb0I7MEJBQUcsTUFBTTsyQkFBQyxRQUFROztBQXdLekU7Ozs7Ozs7R0FPRztBQUVILE1BQU0sT0FBTyxnQkFBZ0I7SUFDM0IsWUFBb0IsS0FBeUI7UUFBekIsVUFBSyxHQUFMLEtBQUssQ0FBb0I7SUFBRyxDQUFDO0lBRWpEOzs7Ozs7T0FNRztJQUNILFNBQVMsQ0FBQyxHQUFxQixFQUFFLElBQWlCO1FBQ2hELElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxPQUFPLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUF5QixDQUFDLENBQUM7U0FDckQ7UUFDRCx5Q0FBeUM7UUFDekMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLENBQUM7O3dIQWhCVSxnQkFBZ0Isa0JBQ0Esa0JBQWtCOzRIQURsQyxnQkFBZ0I7c0dBQWhCLGdCQUFnQjtrQkFENUIsVUFBVTswREFFa0Isa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtIdHRwQmFja2VuZCwgSHR0cEhhbmRsZXJ9IGZyb20gJy4vYmFja2VuZCc7XG5pbXBvcnQge0h0dHBSZXF1ZXN0fSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHtIdHRwRXJyb3JSZXNwb25zZSwgSHR0cEV2ZW50LCBIdHRwRXZlbnRUeXBlLCBIdHRwUmVzcG9uc2UsIEh0dHBTdGF0dXNDb2RlfSBmcm9tICcuL3Jlc3BvbnNlJztcblxuXG4vLyBFdmVyeSByZXF1ZXN0IG1hZGUgdGhyb3VnaCBKU09OUCBuZWVkcyBhIGNhbGxiYWNrIG5hbWUgdGhhdCdzIHVuaXF1ZSBhY3Jvc3MgdGhlXG4vLyB3aG9sZSBwYWdlLiBFYWNoIHJlcXVlc3QgaXMgYXNzaWduZWQgYW4gaWQgYW5kIHRoZSBjYWxsYmFjayBuYW1lIGlzIGNvbnN0cnVjdGVkXG4vLyBmcm9tIHRoYXQuIFRoZSBuZXh0IGlkIHRvIGJlIGFzc2lnbmVkIGlzIHRyYWNrZWQgaW4gYSBnbG9iYWwgdmFyaWFibGUgaGVyZSB0aGF0XG4vLyBpcyBzaGFyZWQgYW1vbmcgYWxsIGFwcGxpY2F0aW9ucyBvbiB0aGUgcGFnZS5cbmxldCBuZXh0UmVxdWVzdElkOiBudW1iZXIgPSAwO1xuXG4vLyBFcnJvciB0ZXh0IGdpdmVuIHdoZW4gYSBKU09OUCBzY3JpcHQgaXMgaW5qZWN0ZWQsIGJ1dCBkb2Vzbid0IGludm9rZSB0aGUgY2FsbGJhY2tcbi8vIHBhc3NlZCBpbiBpdHMgVVJMLlxuZXhwb3J0IGNvbnN0IEpTT05QX0VSUl9OT19DQUxMQkFDSyA9ICdKU09OUCBpbmplY3RlZCBzY3JpcHQgZGlkIG5vdCBpbnZva2UgY2FsbGJhY2suJztcblxuLy8gRXJyb3IgdGV4dCBnaXZlbiB3aGVuIGEgcmVxdWVzdCBpcyBwYXNzZWQgdG8gdGhlIEpzb25wQ2xpZW50QmFja2VuZCB0aGF0IGRvZXNuJ3Rcbi8vIGhhdmUgYSByZXF1ZXN0IG1ldGhvZCBKU09OUC5cbmV4cG9ydCBjb25zdCBKU09OUF9FUlJfV1JPTkdfTUVUSE9EID0gJ0pTT05QIHJlcXVlc3RzIG11c3QgdXNlIEpTT05QIHJlcXVlc3QgbWV0aG9kLic7XG5leHBvcnQgY29uc3QgSlNPTlBfRVJSX1dST05HX1JFU1BPTlNFX1RZUEUgPSAnSlNPTlAgcmVxdWVzdHMgbXVzdCB1c2UgSnNvbiByZXNwb25zZSB0eXBlLic7XG5cbi8qKlxuICogREkgdG9rZW4vYWJzdHJhY3QgdHlwZSByZXByZXNlbnRpbmcgYSBtYXAgb2YgSlNPTlAgY2FsbGJhY2tzLlxuICpcbiAqIEluIHRoZSBicm93c2VyLCB0aGlzIHNob3VsZCBhbHdheXMgYmUgdGhlIGB3aW5kb3dgIG9iamVjdC5cbiAqXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSnNvbnBDYWxsYmFja0NvbnRleHQge1xuICBba2V5OiBzdHJpbmddOiAoZGF0YTogYW55KSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhbiBgSHR0cFJlcXVlc3RgIHdpdGggdGhlIEpTT05QIG1ldGhvZCxcbiAqIGJ5IHBlcmZvcm1pbmcgSlNPTlAgc3R5bGUgcmVxdWVzdHMuXG4gKiBAc2VlIGBIdHRwSGFuZGxlcmBcbiAqIEBzZWUgYEh0dHBYaHJCYWNrZW5kYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEpzb25wQ2xpZW50QmFja2VuZCBpbXBsZW1lbnRzIEh0dHBCYWNrZW5kIHtcbiAgLyoqXG4gICAqIEEgcmVzb2x2ZWQgcHJvbWlzZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNjaGVkdWxlIG1pY3JvdGFza3MgaW4gdGhlIGV2ZW50IGhhbmRsZXJzLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSByZXNvbHZlZFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbGxiYWNrTWFwOiBKc29ucENhbGxiYWNrQ29udGV4dCwgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBkb2N1bWVudDogYW55KSB7fVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5hbWUgb2YgdGhlIG5leHQgY2FsbGJhY2sgbWV0aG9kLCBieSBpbmNyZW1lbnRpbmcgdGhlIGdsb2JhbCBgbmV4dFJlcXVlc3RJZGAuXG4gICAqL1xuICBwcml2YXRlIG5leHRDYWxsYmFjaygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgbmdfanNvbnBfY2FsbGJhY2tfJHtuZXh0UmVxdWVzdElkKyt9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYSBKU09OUCByZXF1ZXN0IGFuZCByZXR1cm5zIGFuIGV2ZW50IHN0cmVhbSBvZiB0aGUgcmVzdWx0cy5cbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCBvYmplY3QuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgb2YgdGhlIHJlc3BvbnNlIGV2ZW50cy5cbiAgICpcbiAgICovXG4gIGhhbmRsZShyZXE6IEh0dHBSZXF1ZXN0PG5ldmVyPik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICAvLyBGaXJzdGx5LCBjaGVjayBib3RoIHRoZSBtZXRob2QgYW5kIHJlc3BvbnNlIHR5cGUuIElmIGVpdGhlciBkb2Vzbid0IG1hdGNoXG4gICAgLy8gdGhlbiB0aGUgcmVxdWVzdCB3YXMgaW1wcm9wZXJseSByb3V0ZWQgaGVyZSBhbmQgY2Fubm90IGJlIGhhbmRsZWQuXG4gICAgaWYgKHJlcS5tZXRob2QgIT09ICdKU09OUCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihKU09OUF9FUlJfV1JPTkdfTUVUSE9EKTtcbiAgICB9IGVsc2UgaWYgKHJlcS5yZXNwb25zZVR5cGUgIT09ICdqc29uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEpTT05QX0VSUl9XUk9OR19SRVNQT05TRV9UWVBFKTtcbiAgICB9XG5cbiAgICAvLyBFdmVyeXRoaW5nIGVsc2UgaGFwcGVucyBpbnNpZGUgdGhlIE9ic2VydmFibGUgYm91bmRhcnkuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+Pigob2JzZXJ2ZXI6IE9ic2VydmVyPEh0dHBFdmVudDxhbnk+PikgPT4ge1xuICAgICAgLy8gVGhlIGZpcnN0IHN0ZXAgdG8gbWFrZSBhIHJlcXVlc3QgaXMgdG8gZ2VuZXJhdGUgdGhlIGNhbGxiYWNrIG5hbWUsIGFuZCByZXBsYWNlIHRoZVxuICAgICAgLy8gY2FsbGJhY2sgcGxhY2Vob2xkZXIgaW4gdGhlIFVSTCB3aXRoIHRoZSBuYW1lLiBDYXJlIGhhcyB0byBiZSB0YWtlbiBoZXJlIHRvIGVuc3VyZVxuICAgICAgLy8gYSB0cmFpbGluZyAmLCBpZiBtYXRjaGVkLCBnZXRzIGluc2VydGVkIGJhY2sgaW50byB0aGUgVVJMIGluIHRoZSBjb3JyZWN0IHBsYWNlLlxuICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLm5leHRDYWxsYmFjaygpO1xuICAgICAgY29uc3QgdXJsID0gcmVxLnVybFdpdGhQYXJhbXMucmVwbGFjZSgvPUpTT05QX0NBTExCQUNLKCZ8JCkvLCBgPSR7Y2FsbGJhY2t9JDFgKTtcblxuICAgICAgLy8gQ29uc3RydWN0IHRoZSA8c2NyaXB0PiB0YWcgYW5kIHBvaW50IGl0IGF0IHRoZSBVUkwuXG4gICAgICBjb25zdCBub2RlID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgIG5vZGUuc3JjID0gdXJsO1xuXG4gICAgICAvLyBBIEpTT05QIHJlcXVlc3QgcmVxdWlyZXMgd2FpdGluZyBmb3IgbXVsdGlwbGUgY2FsbGJhY2tzLiBUaGVzZSB2YXJpYWJsZXNcbiAgICAgIC8vIGFyZSBjbG9zZWQgb3ZlciBhbmQgdHJhY2sgc3RhdGUgYWNyb3NzIHRob3NlIGNhbGxiYWNrcy5cblxuICAgICAgLy8gVGhlIHJlc3BvbnNlIG9iamVjdCwgaWYgb25lIGhhcyBiZWVuIHJlY2VpdmVkLCBvciBudWxsIG90aGVyd2lzZS5cbiAgICAgIGxldCBib2R5OiBhbnl8bnVsbCA9IG51bGw7XG5cbiAgICAgIC8vIFdoZXRoZXIgdGhlIHJlc3BvbnNlIGNhbGxiYWNrIGhhcyBiZWVuIGNhbGxlZC5cbiAgICAgIGxldCBmaW5pc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAvLyBXaGV0aGVyIHRoZSByZXF1ZXN0IGhhcyBiZWVuIGNhbmNlbGxlZCAoYW5kIHRodXMgYW55IG90aGVyIGNhbGxiYWNrcylcbiAgICAgIC8vIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgICAgbGV0IGNhbmNlbGxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAvLyBTZXQgdGhlIHJlc3BvbnNlIGNhbGxiYWNrIGluIHRoaXMuY2FsbGJhY2tNYXAgKHdoaWNoIHdpbGwgYmUgdGhlIHdpbmRvd1xuICAgICAgLy8gb2JqZWN0IGluIHRoZSBicm93c2VyLiBUaGUgc2NyaXB0IGJlaW5nIGxvYWRlZCB2aWEgdGhlIDxzY3JpcHQ+IHRhZyB3aWxsXG4gICAgICAvLyBldmVudHVhbGx5IGNhbGwgdGhpcyBjYWxsYmFjay5cbiAgICAgIHRoaXMuY2FsbGJhY2tNYXBbY2FsbGJhY2tdID0gKGRhdGE/OiBhbnkpID0+IHtcbiAgICAgICAgLy8gRGF0YSBoYXMgYmVlbiByZWNlaXZlZCBmcm9tIHRoZSBKU09OUCBzY3JpcHQuIEZpcnN0bHksIGRlbGV0ZSB0aGlzIGNhbGxiYWNrLlxuICAgICAgICBkZWxldGUgdGhpcy5jYWxsYmFja01hcFtjYWxsYmFja107XG5cbiAgICAgICAgLy8gTmV4dCwgbWFrZSBzdXJlIHRoZSByZXF1ZXN0IHdhc24ndCBjYW5jZWxsZWQgaW4gdGhlIG1lYW50aW1lLlxuICAgICAgICBpZiAoY2FuY2VsbGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHN0YXRlIHRvIGluZGljYXRlIGRhdGEgd2FzIHJlY2VpdmVkLlxuICAgICAgICBib2R5ID0gZGF0YTtcbiAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgfTtcblxuICAgICAgLy8gY2xlYW51cCgpIGlzIGEgdXRpbGl0eSBjbG9zdXJlIHRoYXQgcmVtb3ZlcyB0aGUgPHNjcmlwdD4gZnJvbSB0aGUgcGFnZSBhbmRcbiAgICAgIC8vIHRoZSByZXNwb25zZSBjYWxsYmFjayBmcm9tIHRoZSB3aW5kb3cuIFRoaXMgbG9naWMgaXMgdXNlZCBpbiBib3RoIHRoZVxuICAgICAgLy8gc3VjY2VzcywgZXJyb3IsIGFuZCBjYW5jZWxsYXRpb24gcGF0aHMsIHNvIGl0J3MgZXh0cmFjdGVkIG91dCBmb3IgY29udmVuaWVuY2UuXG4gICAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIDxzY3JpcHQ+IHRhZyBpZiBpdCdzIHN0aWxsIG9uIHRoZSBwYWdlLlxuICAgICAgICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZXNwb25zZSBjYWxsYmFjayBmcm9tIHRoZSBjYWxsYmFja01hcCAod2luZG93IG9iamVjdCBpbiB0aGVcbiAgICAgICAgLy8gYnJvd3NlcikuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrTWFwW2NhbGxiYWNrXTtcbiAgICAgIH07XG5cbiAgICAgIC8vIG9uTG9hZCgpIGlzIHRoZSBzdWNjZXNzIGNhbGxiYWNrIHdoaWNoIHJ1bnMgYWZ0ZXIgdGhlIHJlc3BvbnNlIGNhbGxiYWNrXG4gICAgICAvLyBpZiB0aGUgSlNPTlAgc2NyaXB0IGxvYWRzIHN1Y2Nlc3NmdWxseS4gVGhlIGV2ZW50IGl0c2VsZiBpcyB1bmltcG9ydGFudC5cbiAgICAgIC8vIElmIHNvbWV0aGluZyB3ZW50IHdyb25nLCBvbkxvYWQoKSBtYXkgcnVuIHdpdGhvdXQgdGhlIHJlc3BvbnNlIGNhbGxiYWNrXG4gICAgICAvLyBoYXZpbmcgYmVlbiBpbnZva2VkLlxuICAgICAgY29uc3Qgb25Mb2FkID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSByZXF1ZXN0IGhhcyBiZWVuIGNhbmNlbGxlZC5cbiAgICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHdyYXAgaXQgaW4gYW4gZXh0cmEgUHJvbWlzZSwgdG8gZW5zdXJlIHRoZSBtaWNyb3Rhc2tcbiAgICAgICAgLy8gaXMgc2NoZWR1bGVkIGFmdGVyIHRoZSBsb2FkZWQgZW5kcG9pbnQgaGFzIGV4ZWN1dGVkIGFueSBwb3RlbnRpYWwgbWljcm90YXNrIGl0c2VsZixcbiAgICAgICAgLy8gd2hpY2ggaXMgbm90IGd1YXJhbnRlZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIgYW5kIEVkZ2VIVE1MLiBTZWUgaXNzdWUgIzM5NDk2XG4gICAgICAgIHRoaXMucmVzb2x2ZWRQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIENsZWFudXAgdGhlIHBhZ2UuXG4gICAgICAgICAgY2xlYW51cCgpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgcmVzcG9uc2UgY2FsbGJhY2sgaGFzIHJ1bi5cbiAgICAgICAgICBpZiAoIWZpbmlzaGVkKSB7XG4gICAgICAgICAgICAvLyBJdCBoYXNuJ3QsIHNvbWV0aGluZyB3ZW50IHdyb25nIHdpdGggdGhlIHJlcXVlc3QuIFJldHVybiBhbiBlcnJvciB2aWFcbiAgICAgICAgICAgIC8vIHRoZSBPYnNlcnZhYmxlIGVycm9yIHBhdGguIEFsbCBKU09OUCBlcnJvcnMgaGF2ZSBzdGF0dXMgMC5cbiAgICAgICAgICAgIG9ic2VydmVyLmVycm9yKG5ldyBIdHRwRXJyb3JSZXNwb25zZSh7XG4gICAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiAnSlNPTlAgRXJyb3InLFxuICAgICAgICAgICAgICBlcnJvcjogbmV3IEVycm9yKEpTT05QX0VSUl9OT19DQUxMQkFDSyksXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU3VjY2Vzcy4gYm9keSBlaXRoZXIgY29udGFpbnMgdGhlIHJlc3BvbnNlIGJvZHkgb3IgbnVsbCBpZiBub25lIHdhc1xuICAgICAgICAgIC8vIHJldHVybmVkLlxuICAgICAgICAgIG9ic2VydmVyLm5leHQobmV3IEh0dHBSZXNwb25zZSh7XG4gICAgICAgICAgICBib2R5LFxuICAgICAgICAgICAgc3RhdHVzOiBIdHRwU3RhdHVzQ29kZS5PayxcbiAgICAgICAgICAgIHN0YXR1c1RleHQ6ICdPSycsXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgLy8gQ29tcGxldGUgdGhlIHN0cmVhbSwgdGhlIHJlc3BvbnNlIGlzIG92ZXIuXG4gICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBvbkVycm9yKCkgaXMgdGhlIGVycm9yIGNhbGxiYWNrLCB3aGljaCBydW5zIGlmIHRoZSBzY3JpcHQgcmV0dXJuZWQgZ2VuZXJhdGVzXG4gICAgICAvLyBhIEphdmFzY3JpcHQgZXJyb3IuIEl0IGVtaXRzIHRoZSBlcnJvciB2aWEgdGhlIE9ic2VydmFibGUgZXJyb3IgY2hhbm5lbCBhc1xuICAgICAgLy8gYSBIdHRwRXJyb3JSZXNwb25zZS5cbiAgICAgIGNvbnN0IG9uRXJyb3I6IGFueSA9IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHJlcXVlc3Qgd2FzIGFscmVhZHkgY2FuY2VsbGVkLCBubyBuZWVkIHRvIGVtaXQgYW55dGhpbmcuXG4gICAgICAgIGlmIChjYW5jZWxsZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYW51cCgpO1xuXG4gICAgICAgIC8vIFdyYXAgdGhlIGVycm9yIGluIGEgSHR0cEVycm9yUmVzcG9uc2UuXG4gICAgICAgIG9ic2VydmVyLmVycm9yKG5ldyBIdHRwRXJyb3JSZXNwb25zZSh7XG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgIHN0YXR1c1RleHQ6ICdKU09OUCBFcnJvcicsXG4gICAgICAgICAgdXJsLFxuICAgICAgICB9KSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBTdWJzY3JpYmUgdG8gYm90aCB0aGUgc3VjY2VzcyAobG9hZCkgYW5kIGVycm9yIGV2ZW50cyBvbiB0aGUgPHNjcmlwdD4gdGFnLFxuICAgICAgLy8gYW5kIGFkZCBpdCB0byB0aGUgcGFnZS5cbiAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7XG4gICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICB0aGlzLmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSk7XG5cbiAgICAgIC8vIFRoZSByZXF1ZXN0IGhhcyBub3cgYmVlbiBzdWNjZXNzZnVsbHkgc2VudC5cbiAgICAgIG9ic2VydmVyLm5leHQoe3R5cGU6IEh0dHBFdmVudFR5cGUuU2VudH0pO1xuXG4gICAgICAvLyBDYW5jZWxsYXRpb24gaGFuZGxlci5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIC8vIFRyYWNrIHRoZSBjYW5jZWxsYXRpb24gc28gZXZlbnQgbGlzdGVuZXJzIHdvbid0IGRvIGFueXRoaW5nIGV2ZW4gaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAgICAgIGNhbmNlbGxlZCA9IHRydWU7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lcnMgc28gdGhleSB3b24ndCBydW4gaWYgdGhlIGV2ZW50cyBsYXRlciBmaXJlLlxuICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG5cbiAgICAgICAgLy8gQW5kIGZpbmFsbHksIGNsZWFuIHVwIHRoZSBwYWdlLlxuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSWRlbnRpZmllcyByZXF1ZXN0cyB3aXRoIHRoZSBtZXRob2QgSlNPTlAgYW5kXG4gKiBzaGlmdHMgdGhlbSB0byB0aGUgYEpzb25wQ2xpZW50QmFja2VuZGAuXG4gKlxuICogQHNlZSBgSHR0cEludGVyY2VwdG9yYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEpzb25wSW50ZXJjZXB0b3Ige1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGpzb25wOiBKc29ucENsaWVudEJhY2tlbmQpIHt9XG5cbiAgLyoqXG4gICAqIElkZW50aWZpZXMgYW5kIGhhbmRsZXMgYSBnaXZlbiBKU09OUCByZXF1ZXN0LlxuICAgKiBAcGFyYW0gcmVxIFRoZSBvdXRnb2luZyByZXF1ZXN0IG9iamVjdCB0byBoYW5kbGUuXG4gICAqIEBwYXJhbSBuZXh0IFRoZSBuZXh0IGludGVyY2VwdG9yIGluIHRoZSBjaGFpbiwgb3IgdGhlIGJhY2tlbmRcbiAgICogaWYgbm8gaW50ZXJjZXB0b3JzIHJlbWFpbiBpbiB0aGUgY2hhaW4uXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgb2YgdGhlIGV2ZW50IHN0cmVhbS5cbiAgICovXG4gIGludGVyY2VwdChyZXE6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgIGlmIChyZXEubWV0aG9kID09PSAnSlNPTlAnKSB7XG4gICAgICByZXR1cm4gdGhpcy5qc29ucC5oYW5kbGUocmVxIGFzIEh0dHBSZXF1ZXN0PG5ldmVyPik7XG4gICAgfVxuICAgIC8vIEZhbGwgdGhyb3VnaCBmb3Igbm9ybWFsIEhUVFAgcmVxdWVzdHMuXG4gICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcSk7XG4gIH1cbn1cbiJdfQ==