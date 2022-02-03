/**
 * @license Angular v13.1.3
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */

import { Compiler } from '@angular/core';
import { CompilerFactory } from '@angular/core';
import { CompilerOptions } from '@angular/core';
import { PlatformRef } from '@angular/core';
import { Provider } from '@angular/core';
import { StaticProvider } from '@angular/core';
import { Version } from '@angular/core';

/**
 * @publicApi
 *
 * @deprecated
 * Ivy JIT mode doesn't require accessing this symbol.
 * See [JIT API changes due to ViewEngine deprecation](guide/deprecations#jit-api-changes) for
 * additional context.
 */
export declare class JitCompilerFactory implements CompilerFactory {
    private _defaultOptions;
    createCompiler(options?: CompilerOptions[]): Compiler;
}

/**
 * @publicApi
 */
export declare const platformBrowserDynamic: (extraProviders?: StaticProvider[] | undefined) => PlatformRef;

/**
 * @publicApi
 */
export declare const RESOURCE_CACHE_PROVIDER: Provider[];

/**
 * @publicApi
 */
export declare const VERSION: Version;

/**
 * @publicApi
 */
export declare const ɵINTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS: StaticProvider[];

/**
 * A platform that included corePlatform and the compiler.
 *
 * @publicApi
 */
export declare const ɵplatformCoreDynamic: (extraProviders?: StaticProvider[] | undefined) => PlatformRef;

export { }
