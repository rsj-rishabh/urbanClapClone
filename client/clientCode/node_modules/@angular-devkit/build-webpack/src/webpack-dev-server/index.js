"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebpackDevServer = void 0;
const architect_1 = require("@angular-devkit/architect");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_server_1 = __importDefault(require("webpack-dev-server"));
const utils_1 = require("../utils");
function runWebpackDevServer(config, context, options = {}) {
    const createWebpack = (c) => {
        if (options.webpackFactory) {
            const result = options.webpackFactory(c);
            if ((0, rxjs_1.isObservable)(result)) {
                return result;
            }
            else {
                return (0, rxjs_1.of)(result);
            }
        }
        else {
            return (0, rxjs_1.of)((0, webpack_1.default)(c));
        }
    };
    const createWebpackDevServer = (webpack, config) => {
        if (options.webpackDevServerFactory) {
            return new options.webpackDevServerFactory(config, webpack);
        }
        return new webpack_dev_server_1.default(config, webpack);
    };
    const log = options.logging || ((stats, config) => context.logger.info(stats.toString(config.stats)));
    return createWebpack({ ...config, watch: false }).pipe((0, operators_1.switchMap)((webpackCompiler) => new rxjs_1.Observable((obs) => {
        var _a;
        const devServerConfig = options.devServerConfig || config.devServer || {};
        (_a = devServerConfig.host) !== null && _a !== void 0 ? _a : (devServerConfig.host = 'localhost');
        let result;
        webpackCompiler.hooks.done.tap('build-webpack', (stats) => {
            // Log stats.
            log(stats, config);
            obs.next({
                ...result,
                emittedFiles: (0, utils_1.getEmittedFiles)(stats.compilation),
                success: !stats.hasErrors(),
                outputPath: stats.compilation.outputOptions.path,
            });
        });
        const devServer = createWebpackDevServer(webpackCompiler, devServerConfig);
        devServer.startCallback(() => {
            const address = devServer.server.address();
            if (!address) {
                obs.error(new Error(`Dev-server address info is not defined.`));
                return;
            }
            result = {
                success: true,
                port: typeof address === 'string' ? 0 : address.port,
                family: typeof address === 'string' ? '' : address.family,
                address: typeof address === 'string' ? address : address.address,
            };
        });
        // Teardown logic. Close the server when unsubscribed from.
        return () => {
            devServer.stopCallback(() => { });
            webpackCompiler.close(() => { });
        };
    })));
}
exports.runWebpackDevServer = runWebpackDevServer;
exports.default = (0, architect_1.createBuilder)((options, context) => {
    const configPath = (0, path_1.resolve)(context.workspaceRoot, options.webpackConfig);
    return (0, rxjs_1.from)(Promise.resolve().then(() => __importStar(require(configPath)))).pipe((0, operators_1.switchMap)(({ default: config }) => runWebpackDevServer(config, context)));
});
