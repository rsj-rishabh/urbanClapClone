"use strict";
/**
 * Copyright (c) 2015-present, Waysact Pty Ltd
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notNil = exports.findChunks = exports.makePlaceholder = exports.computeIntegrity = exports.placeholderPrefix = exports.normalizePath = exports.getTagSrc = void 0;
const crypto_1 = require("crypto");
const path_1 = require("path");
function getTagSrc(tag) {
    if (!["script", "link"].includes(tag.tagName) || !tag.attributes) {
        return undefined;
    }
    if (typeof tag.attributes.href === "string") {
        return tag.attributes.href;
    }
    if (typeof tag.attributes.src === "string") {
        return tag.attributes.src;
    }
    return undefined;
}
exports.getTagSrc = getTagSrc;
const normalizePath = (p) => p.replace(/\?.*$/, "").split(path_1.sep).join("/");
exports.normalizePath = normalizePath;
exports.placeholderPrefix = "*-*-*-CHUNK-SRI-HASH-";
const computeIntegrity = (hashFuncNames, source) => {
    const result = hashFuncNames
        .map((hashFuncName) => hashFuncName +
        "-" +
        crypto_1.createHash(hashFuncName)
            .update(typeof source === "string" ? Buffer.from(source, "utf-8") : source)
            .digest("base64"))
        .join(" ");
    return result;
};
exports.computeIntegrity = computeIntegrity;
const makePlaceholder = (hashFuncNames, id) => {
    const placeholder = `${exports.placeholderPrefix}${id}`;
    const filler = exports.computeIntegrity(hashFuncNames, placeholder);
    return exports.placeholderPrefix + filler.substring(exports.placeholderPrefix.length);
};
exports.makePlaceholder = makePlaceholder;
function findChunks(chunk) {
    const allChunks = new Set();
    const groupsVisited = new Set();
    function addIfNotExist(set, item) {
        if (set.has(item))
            return true;
        set.add(item);
        return false;
    }
    (function recurseChunk(childChunk) {
        function recurseGroup(group) {
            if (addIfNotExist(groupsVisited, group.id))
                return;
            group.chunks.forEach(recurseChunk);
            group.childrenIterable.forEach(recurseGroup);
        }
        if (addIfNotExist(allChunks, childChunk))
            return;
        Array.from(childChunk.groupsIterable).forEach(recurseGroup);
    })(chunk);
    return allChunks;
}
exports.findChunks = findChunks;
function notNil(value) {
    return value !== null && value !== undefined;
}
exports.notNil = notNil;
//# sourceMappingURL=util.js.map