/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export interface EmittedFiles {
    id?: string;
    name?: string;
    file: string;
    initial: boolean;
    asset?: boolean;
    extension: string;
}
export declare function getEmittedFiles(compilation: import('webpack').Compilation): EmittedFiles[];
