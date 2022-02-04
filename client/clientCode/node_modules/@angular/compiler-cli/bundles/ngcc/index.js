
      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
      const __ESM_IMPORT_META_URL__ = import.meta.url;
    
import {
  mainNgcc
} from "../chunk-K5FPDA5B.js";
import "../chunk-BPCUCINV.js";
import {
  clearTsConfigCache
} from "../chunk-ZLL7BXGD.js";
import "../chunk-CKZCKW5B.js";
import "../chunk-L23I4NJT.js";
import "../chunk-XXMNTCYN.js";
import {
  ConsoleLogger,
  LogLevel
} from "../chunk-JTYUTYS2.js";
import "../chunk-RDTZZXLZ.js";
import "../chunk-VUEDWBJP.js";
import {
  NodeJSFileSystem,
  setFileSystem
} from "../chunk-RGGJJ7ZZ.js";
import "../chunk-J6CW3T62.js";
import "../chunk-WQ3TNYTD.js";

// bazel-out/darwin-fastbuild/bin/packages/compiler-cli/ngcc/index.mjs
import { dirname, join } from "path";
import { fileURLToPath } from "url";
function process(options) {
  setFileSystem(new NodeJSFileSystem());
  return mainNgcc(options);
}
var containingDirPath = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(__ESM_IMPORT_META_URL__));
var ngccMainFilePath = join(containingDirPath, "./main-ngcc.js");
export {
  ConsoleLogger,
  LogLevel,
  clearTsConfigCache,
  containingDirPath,
  ngccMainFilePath,
  process
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=index.js.map
