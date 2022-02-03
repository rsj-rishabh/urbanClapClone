#!/usr/bin/env node

      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
      const __ESM_IMPORT_META_URL__ = import.meta.url;
    
import {
  parseCommandLineOptions
} from "../chunk-7UHLQOIO.js";
import {
  mainNgcc
} from "../chunk-K5FPDA5B.js";
import "../chunk-BPCUCINV.js";
import "../chunk-ZLL7BXGD.js";
import "../chunk-CKZCKW5B.js";
import "../chunk-L23I4NJT.js";
import "../chunk-XXMNTCYN.js";
import "../chunk-JTYUTYS2.js";
import "../chunk-RDTZZXLZ.js";
import "../chunk-VUEDWBJP.js";
import "../chunk-RGGJJ7ZZ.js";
import "../chunk-J6CW3T62.js";
import "../chunk-WQ3TNYTD.js";

// bazel-out/darwin-fastbuild/bin/packages/compiler-cli/ngcc/main-ngcc.mjs
process.title = "ngcc";
var startTime = Date.now();
var options = parseCommandLineOptions(process.argv.slice(2));
(async () => {
  try {
    await mainNgcc(options);
    if (options.logger) {
      const duration = Math.round((Date.now() - startTime) / 1e3);
      options.logger.debug(`Run ngcc in ${duration}s.`);
    }
    process.exitCode = 0;
  } catch (e) {
    console.error(e.stack || e.message);
    process.exit(typeof e.code === "number" ? e.code : 1);
  }
})();
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=main-ngcc.js.map
