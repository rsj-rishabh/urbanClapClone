var charToInteger = {};
var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
for (var i = 0; i < chars.length; i++) {
    charToInteger[chars.charCodeAt(i)] = i;
}
function decode(mappings) {
    var decoded = [];
    var line = [];
    var segment = [
        0,
        0,
        0,
        0,
        0,
    ];
    var j = 0;
    for (var i = 0, shift = 0, value = 0; i < mappings.length; i++) {
        var c = mappings.charCodeAt(i);
        if (c === 44) { // ","
            segmentify(line, segment, j);
            j = 0;
        }
        else if (c === 59) { // ";"
            segmentify(line, segment, j);
            j = 0;
            decoded.push(line);
            line = [];
            segment[0] = 0;
        }
        else {
            var integer = charToInteger[c];
            if (integer === undefined) {
                throw new Error('Invalid character (' + String.fromCharCode(c) + ')');
            }
            var hasContinuationBit = integer & 32;
            integer &= 31;
            value += integer << shift;
            if (hasContinuationBit) {
                shift += 5;
            }
            else {
                var shouldNegate = value & 1;
                value >>>= 1;
                if (shouldNegate) {
                    value = value === 0 ? -0x80000000 : -value;
                }
                segment[j] += value;
                j++;
                value = shift = 0; // reset
            }
        }
    }
    segmentify(line, segment, j);
    decoded.push(line);
    return decoded;
}
function segmentify(line, segment, j) {
    // This looks ugly, but we're creating specialized arrays with a specific
    // length. This is much faster than creating a new array (which v8 expands to
    // a capacity of 17 after pushing the first item), or slicing out a subarray
    // (which is slow). Length 4 is assumed to be the most frequent, followed by
    // length 5 (since not everything will have an associated name), followed by
    // length 1 (it's probably rare for a source substring to not have an
    // associated segment data).
    if (j === 4)
        line.push([segment[0], segment[1], segment[2], segment[3]]);
    else if (j === 5)
        line.push([segment[0], segment[1], segment[2], segment[3], segment[4]]);
    else if (j === 1)
        line.push([segment[0]]);
}
function encode(decoded) {
    var sourceFileIndex = 0; // second field
    var sourceCodeLine = 0; // third field
    var sourceCodeColumn = 0; // fourth field
    var nameIndex = 0; // fifth field
    var mappings = '';
    for (var i = 0; i < decoded.length; i++) {
        var line = decoded[i];
        if (i > 0)
            mappings += ';';
        if (line.length === 0)
            continue;
        var generatedCodeColumn = 0; // first field
        var lineMappings = [];
        for (var _i = 0, line_1 = line; _i < line_1.length; _i++) {
            var segment = line_1[_i];
            var segmentMappings = encodeInteger(segment[0] - generatedCodeColumn);
            generatedCodeColumn = segment[0];
            if (segment.length > 1) {
                segmentMappings +=
                    encodeInteger(segment[1] - sourceFileIndex) +
                        encodeInteger(segment[2] - sourceCodeLine) +
                        encodeInteger(segment[3] - sourceCodeColumn);
                sourceFileIndex = segment[1];
                sourceCodeLine = segment[2];
                sourceCodeColumn = segment[3];
            }
            if (segment.length === 5) {
                segmentMappings += encodeInteger(segment[4] - nameIndex);
                nameIndex = segment[4];
            }
            lineMappings.push(segmentMappings);
        }
        mappings += lineMappings.join(',');
    }
    return mappings;
}
function encodeInteger(num) {
    var result = '';
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        var clamped = num & 31;
        num >>>= 5;
        if (num > 0) {
            clamped |= 32;
        }
        result += chars[clamped];
    } while (num > 0);
    return result;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Creates a brand new (prototype-less) object with the enumerable-own
 * properties of `target`. Any enumerable-own properties from `source` which
 * are not present on `target` will be copied as well.
 */
function defaults(target, source) {
    return Object.assign(Object.create(null), source, target);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Decodes an input sourcemap into a `DecodedSourceMap` sourcemap object.
 *
 * Valid input maps include a `DecodedSourceMap`, a `RawSourceMap`, or JSON
 * representations of either type.
 */
function decodeSourceMap(map) {
    if (typeof map === 'string') {
        map = JSON.parse(map);
    }
    let { mappings } = map;
    if (typeof mappings === 'string') {
        mappings = sortMappings(decode(mappings), true);
    }
    else {
        // Clone the Line so that we can sort it. We don't want to mutate an array
        // that we don't own directly.
        mappings = sortMappings(mappings, false);
    }
    return defaults({ mappings }, map);
}
function firstUnsortedSegmentLine(mappings) {
    for (let i = 0; i < mappings.length; i++) {
        const segments = mappings[i];
        for (let j = 1; j < segments.length; j++) {
            if (segments[j][0] < segments[j - 1][0]) {
                return i;
            }
        }
    }
    return mappings.length;
}
function sortMappings(mappings, owned) {
    const unosrtedIndex = firstUnsortedSegmentLine(mappings);
    if (unosrtedIndex === mappings.length)
        return mappings;
    if (!owned)
        mappings = mappings.slice();
    for (let i = unosrtedIndex; i < mappings.length; i++) {
        mappings[i] = sortSegments(mappings[i], owned);
    }
    return mappings;
}
function sortSegments(segments, owned) {
    if (!owned)
        segments = segments.slice();
    return segments.sort(segmentComparator);
}
function segmentComparator(a, b) {
    return a[0] - b[0];
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A "leaf" node in the sourcemap tree, representing an original, unmodified
 * source file. Recursive segment tracing ends at the `OriginalSource`.
 */
class OriginalSource {
    constructor(filename, content) {
        this.filename = filename;
        this.content = content;
    }
    /**
     * Tracing a `SourceMapSegment` ends when we get to an `OriginalSource`,
     * meaning this line/column location originated from this source file.
     */
    traceSegment(line, column, name) {
        return { column, line, name, source: this };
    }
}

/* istanbul ignore next */
const Url = (typeof URL !== 'undefined' ? URL : require('url').URL);
// Matches "..", which must be preceeded by "/" or the start of the string, and
// must be followed by a "/". We do not eat the following "/", so that the next
// iteration can match on it.
const parentRegex = /(^|\/)\.\.(?=\/|$)/g;
function isAbsoluteUrl(url) {
    try {
        return !!new Url(url);
    }
    catch (e) {
        return false;
    }
}
/**
 * Creates a directory name that is guaranteed to not be in `str`.
 */
function uniqInStr(str) {
    let uniq = String(Math.random()).slice(2);
    while (str.indexOf(uniq) > -1) {
        /* istanbul ignore next */
        uniq += uniq;
    }
    return uniq;
}
/**
 * Removes the filename from the path (everything trailing the last "/"). This
 * is only safe to call on a path, never call with an absolute or protocol
 * relative URL.
 */
function stripPathFilename(path) {
    path = normalizePath(path);
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}
/**
 * Normalizes a protocol-relative URL, but keeps it protocol relative by
 * stripping out the protocl before returning it.
 */
function normalizeProtocolRelative(input, absoluteBase) {
    const { href, protocol } = new Url(input, absoluteBase);
    return href.slice(protocol.length);
}
/**
 * Normalizes a simple path (one that has no ".."s, or is absolute so ".."s can
 * be normalized absolutely).
 */
function normalizeSimplePath(input) {
    const { href } = new Url(input, 'https://foo.com/');
    return href.slice('https://foo.com/'.length);
}
/**
 * Normalizes a path, ensuring that excess ".."s are preserved for relative
 * paths in the output.
 *
 * If the input is absolute, this will return an absolutey normalized path, but
 * it will not have a leading "/".
 *
 * If the input has a leading "..", the output will have a leading "..".
 *
 * If the input has a leading ".", the output will not have a leading "."
 * unless there are too many ".."s, in which case there will be a leading "..".
 */
function normalizePath(input) {
    // If there are no ".."s, we can treat this as if it were an absolute path.
    // The return won't be an absolute path, so it's easy.
    if (!parentRegex.test(input))
        return normalizeSimplePath(input);
    // We already found one "..". Let's see how many there are.
    let total = 1;
    while (parentRegex.test(input))
        total++;
    // If there are ".."s, we need to prefix the the path with the same number of
    // unique directories. This is to ensure that we "remember" how many parent
    // directories we are accessing. Eg, "../../.." must keep 3, and "foo/../.."
    // must keep 1.
    const uniqDirectory = `z${uniqInStr(input)}/`;
    // uniqDirectory is just a "z", followed by numbers, followed by a "/". So
    // generating a runtime regex from it is safe. We'll use this search regex to
    // strip out our uniq directory names and insert any needed ".."s.
    const search = new RegExp(`^(?:${uniqDirectory})*`);
    // Now we can resolve the total path. If there are excess ".."s, they will
    // eliminate one or more of the unique directories we prefix with.
    const relative = normalizeSimplePath(uniqDirectory.repeat(total) + input);
    // We can now count the number of unique directories that were eliminated. If
    // there were 3, and 1 was eliminated, we know we only need to add 1 "..". If
    // 2 were eliminated, we need to insert 2 ".."s. If all 3 were eliminated,
    // then we need 3, etc. This replace is guranteed to match (it may match 0 or
    // more times), and we can count the total match to see how many were eliminated.
    return relative.replace(search, (all) => {
        const leftover = all.length / uniqDirectory.length;
        return '../'.repeat(total - leftover);
    });
}
/**
 * Attempts to resolve `input` URL relative to `base`.
 */
function resolve(input, base) {
    if (!base)
        base = '';
    // Absolute URLs are very easy to resolve right.
    if (isAbsoluteUrl(input))
        return new Url(input).href;
    if (base) {
        // Absolute URLs are easy...
        if (isAbsoluteUrl(base))
            return new Url(input, base).href;
        // If base is protocol relative, we'll resolve with it but keep the result
        // protocol relative.
        if (base.startsWith('//'))
            return normalizeProtocolRelative(input, `https:${base}`);
    }
    // Normalize input, but keep it protocol relative. We know base doesn't supply
    // a protocol, because that would have been handled above.
    if (input.startsWith('//'))
        return normalizeProtocolRelative(input, 'https://foo.com/');
    // We now know that base (if there is one) and input are paths. We've handled
    // both absolute and protocol-relative variations above.
    // Absolute paths don't need any special handling, because they cannot have
    // extra "." or ".."s. That'll all be stripped away. Input takes priority here,
    // because if input is an absolute path, base path won't affect it in any way.
    if (input.startsWith('/'))
        return '/' + normalizeSimplePath(input);
    // Since input and base are paths, we need to join them to do any further
    // processing. Paths are joined at the directory level, so we need to remove
    // the base's filename before joining. We also know that input does not have a
    // leading slash, and that the stripped base will have a trailing slash if
    // there are any directories (or it'll be empty).
    const joined = stripPathFilename(base) + input;
    // If base is an absolute path, then input will be relative to it.
    if (base.startsWith('/'))
        return '/' + normalizeSimplePath(joined);
    // We now know both base (if there is one) and input are relative paths.
    const relative = normalizePath(joined);
    // If base started with a leading ".", or there is no base and input started
    // with a ".", then we need to ensure that the relative path starts with a
    // ".". We don't know if relative starts with a "..", though, so check before
    // prepending.
    if ((base || input).startsWith('.') && !relative.startsWith('.')) {
        return './' + relative;
    }
    return relative;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function resolve$1(input, base) {
    // The base is always treated as a directory, if it's not empty.
    // https://github.com/mozilla/source-map/blob/8cb3ee57/lib/util.js#L327
    // https://github.com/chromium/chromium/blob/da4adbb3/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js#L400-L401
    if (base && !base.endsWith('/'))
        base += '/';
    return resolve(input, base);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A binary search implementation that returns the index if a match is found,
 * or the negated index of where the `needle` should be inserted.
 *
 * The `comparator` callback receives both the `item` under comparison and the
 * needle we are searching for. It must return `0` if the `item` is a match,
 * any negative number if `item` is too small (and we must search after it), or
 * any positive number if the `item` is too large (and we must search before
 * it).
 *
 * If no match is found, a negated index of where to insert the `needle` is
 * returned. This negated index is guaranteed to be less than 0. To insert an
 * item, negate it (again) and splice:
 *
 * ```js
 * const array = [1, 3];
 * const needle = 2;
 * const index = binarySearch(array, needle, (item, needle) => item - needle);
 *
 * assert.equal(index, -2);
 * assert.equal(~index, 1);
 * array.splice(~index, 0, needle);
 * assert.deepEqual(array, [1, 2, 3]);
 * ```
 */
function binarySearch(haystack, needle, comparator, low, high) {
    low = Math.max(low, 0);
    while (low <= high) {
        const mid = low + ((high - low) >> 1);
        const cmp = comparator(haystack[mid], needle);
        if (cmp === 0) {
            return mid;
        }
        if (cmp < 0) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    return ~low;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * FastStringArray acts like a `Set` (allowing only one occurrence of a string
 * `key`), but provides the index of the `key` in the backing array.
 *
 * This is designed to allow synchronizing a second array with the contents of
 * the backing array, like how `sourcesContent[i]` is the source content
 * associated with `source[i]`, and there are never duplicates.
 */
class FastStringArray {
    constructor() {
        this.indexes = Object.create(null);
        this.array = [];
    }
    /**
     * Puts `key` into the backing array, if it is not already present. Returns
     * the index of the `key` in the backing array.
     */
    put(key) {
        const { array, indexes } = this;
        // The key may or may not be present. If it is present, it's a number.
        let index = indexes[key];
        // If it's not yet present, we need to insert it and track the index in the
        // indexes.
        if (index === undefined) {
            index = indexes[key] = array.length;
            array.push(key);
        }
        return index;
    }
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * SourceMapTree represents a single sourcemap, with the ability to trace
 * mappings into its child nodes (which may themselves be SourceMapTrees).
 */
class SourceMapTree {
    constructor(map, sources) {
        this.map = map;
        this.sources = sources;
        this.lastLine = 0;
        this.lastColumn = 0;
        this.lastIndex = 0;
    }
    /**
     * traceMappings is only called on the root level SourceMapTree, and begins
     * the process of resolving each mapping in terms of the original source
     * files.
     */
    traceMappings() {
        const mappings = [];
        const names = new FastStringArray();
        const sources = new FastStringArray();
        const sourcesContent = [];
        const { mappings: rootMappings, names: rootNames } = this.map;
        for (let i = 0; i < rootMappings.length; i++) {
            const segments = rootMappings[i];
            const tracedSegments = [];
            let lastTraced = undefined;
            for (let j = 0; j < segments.length; j++) {
                const segment = segments[j];
                // 1-length segments only move the current generated column, there's no
                // source information to gather from it.
                if (segment.length === 1)
                    continue;
                const source = this.sources[segment[1]];
                const traced = source.traceSegment(segment[2], segment[3], segment.length === 5 ? rootNames[segment[4]] : '');
                if (!traced)
                    continue;
                // So we traced a segment down into its original source file. Now push a
                // new segment pointing to this location.
                const { column, line, name } = traced;
                const { content, filename } = traced.source;
                // Store the source location, and ensure we keep sourcesContent up to
                // date with the sources array.
                const sourceIndex = sources.put(filename);
                sourcesContent[sourceIndex] = content;
                if (lastTraced &&
                    lastTraced[1] === sourceIndex &&
                    lastTraced[2] === line &&
                    lastTraced[3] === column) {
                    // This is a duplicate mapping pointing at the exact same starting point in the source file.
                    // It doesn't provide any new information, and only bloats the sourcemap.
                    continue;
                }
                // This looks like unnecessary duplication, but it noticeably increases
                // performance. If we were to push the nameIndex onto length-4 array, v8
                // would internally allocate 22 slots! That's 68 wasted bytes! Array
                // literals have the same capacity as their length, saving memory.
                if (name) {
                    lastTraced = [segment[0], sourceIndex, line, column, names.put(name)];
                }
                else {
                    lastTraced = [segment[0], sourceIndex, line, column];
                }
                tracedSegments.push(lastTraced);
            }
            mappings.push(tracedSegments);
        }
        // TODO: Make all sources relative to the sourceRoot.
        return defaults({
            mappings,
            names: names.array,
            sources: sources.array,
            sourcesContent,
        }, this.map);
    }
    /**
     * traceSegment is only called on children SourceMapTrees. It recurses down
     * into its own child SourceMapTrees, until we find the original source map.
     */
    traceSegment(line, column, name) {
        const { mappings, names } = this.map;
        // It's common for parent sourcemaps to have pointers to lines that have no
        // mapping (like a "//# sourceMappingURL=") at the end of the child file.
        if (line >= mappings.length)
            return null;
        const segments = mappings[line];
        if (segments.length === 0)
            return null;
        let low = 0;
        let high = segments.length - 1;
        if (line === this.lastLine) {
            if (column >= this.lastColumn) {
                low = this.lastIndex;
            }
            else {
                high = this.lastIndex;
            }
        }
        let index = binarySearch(segments, column, segmentComparator$1, low, high);
        this.lastLine = line;
        this.lastColumn = column;
        if (index === -1) {
            this.lastIndex = index;
            return null; // we come before any mapped segment
        }
        // If we can't find a segment that lines up to this column, we use the
        // segment before.
        if (index < 0) {
            index = ~index - 1;
        }
        this.lastIndex = index;
        const segment = segments[index];
        // 1-length segments only move the current generated column, there's no
        // source information to gather from it.
        if (segment.length === 1)
            return null;
        const source = this.sources[segment[1]];
        // So now we can recurse down, until we hit the original source file.
        return source.traceSegment(segment[2], segment[3], 
        // A child map's recorded name for this segment takes precedence over the
        // parent's mapped name. Imagine a mangler changing the name over, etc.
        segment.length === 5 ? names[segment[4]] : name);
    }
}
function segmentComparator$1(segment, column) {
    return segment[0] - column;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Removes the filename from a path.
 */
function stripFilename(path) {
    if (!path)
        return '';
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function asArray(value) {
    if (Array.isArray(value))
        return value;
    return [value];
}
/**
 * Recursively builds a tree structure out of sourcemap files, with each node
 * being either an `OriginalSource` "leaf" or a `SourceMapTree` composed of
 * `OriginalSource`s and `SourceMapTree`s.
 *
 * Every sourcemap is composed of a collection of source files and mappings
 * into locations of those source files. When we generate a `SourceMapTree` for
 * the sourcemap, we attempt to load each source file's own sourcemap. If it
 * does not have an associated sourcemap, it is considered an original,
 * unmodified source file.
 */
function buildSourceMapTree(input, loader, relativeRoot) {
    const maps = asArray(input).map(decodeSourceMap);
    const map = maps.pop();
    for (let i = 0; i < maps.length; i++) {
        if (maps[i].sources.length > 1) {
            throw new Error(`Transformation map ${i} must have exactly one source file.\n` +
                'Did you specify these with the most recent transformation maps first?');
        }
    }
    const { sourceRoot, sources, sourcesContent } = map;
    const children = sources.map((sourceFile, i) => {
        // Each source file is loaded relative to the sourcemap's own sourceRoot,
        // which is itself relative to the sourcemap's parent.
        const uri = resolve$1(sourceFile || '', resolve$1(sourceRoot || '', stripFilename(relativeRoot)));
        // Use the provided loader callback to retrieve the file's sourcemap.
        // TODO: We should eventually support async loading of sourcemap files.
        const sourceMap = loader(uri);
        // If there is no sourcemap, then it is an unmodified source file.
        if (!sourceMap) {
            // The source file's actual contents must be included in the sourcemap
            // (done when generating the sourcemap) for it to be included as a
            // sourceContent in the output sourcemap.
            const sourceContent = sourcesContent ? sourcesContent[i] : null;
            return new OriginalSource(uri, sourceContent);
        }
        // Else, it's a real sourcemap, and we need to recurse into it to load its
        // source files.
        return buildSourceMapTree(decodeSourceMap(sourceMap), loader, uri);
    });
    let tree = new SourceMapTree(map, children);
    for (let i = maps.length - 1; i >= 0; i--) {
        tree = new SourceMapTree(maps[i], [tree]);
    }
    return tree;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A SourceMap v3 compatible sourcemap, which only includes fields that were
 * provided to it.
 */
class SourceMap {
    constructor(map, options) {
        this.version = 3; // SourceMap spec says this should be first.
        if ('file' in map)
            this.file = map.file;
        this.mappings = options.decodedMappings ? map.mappings : encode(map.mappings);
        this.names = map.names;
        // TODO: We first need to make all source URIs relative to the sourceRoot
        // before we can support a sourceRoot.
        // if ('sourceRoot' in map) this.sourceRoot = map.sourceRoot;
        this.sources = map.sources;
        if (!options.excludeContent && 'sourcesContent' in map) {
            this.sourcesContent = map.sourcesContent;
        }
    }
    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Traces through all the mappings in the root sourcemap, through the sources
 * (and their sourcemaps), all the way back to the original source location.
 *
 * `loader` will be called every time we encounter a source file. If it returns
 * a sourcemap, we will recurse into that sourcemap to continue the trace. If
 * it returns a falsey value, that source file is treated as an original,
 * unmodified source file.
 *
 * Pass `excludeContent` to exclude any self-containing source file content
 * from the output sourcemap.
 *
 * Pass `decodedMappings` to receive a SourceMap with decoded (instead of
 * VLQ encoded) mappings.
 */
function remapping(input, loader, options) {
    const opts = typeof options === 'object' ? options : { excludeContent: !!options, decodedMappings: false };
    const graph = buildSourceMapTree(input, loader);
    return new SourceMap(graph.traceMappings(), opts);
}

export default remapping;
//# sourceMappingURL=remapping.mjs.map
