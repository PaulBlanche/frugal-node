import * as _path from "node:path";
import * as _url from "node:url";
import commonPath from "common-path-prefix";

/**
 * @param {string[]} paths
 * @returns {string}
 */
export function common(paths) {
	if (paths.length === 1) {
		return _path.dirname(paths[0]);
	}

	return commonPath(paths);
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
export function relative(from, to) {
	return _path.relative(from, to);
}

/**
 * @param {string[]} segments
 * @returns {string}
 */
export function resolve(...segments) {
	return _path.resolve(...segments);
}

/**
 * @param {string[]} segments
 * @returns {string}
 */
export function join(...segments) {
	return _path.join(...segments);
}

/**
 * @param {string} path
 * @returns {string}
 */
export function dirname(path) {
	return _path.dirname(path);
}

/**
 * @param {string} path
 * @param {string} [suffix]
 * @returns {string}
 */
export function basename(path, suffix) {
	return _path.basename(path, suffix);
}

/**
 * @param {string} path
 * @returns {string}
 */
export function extname(path) {
	return _path.extname(path);
}

/**
 * @param {string | URL} url
 * @returns {string}
 */
export function fromFileUrl(url) {
	return _url.fileURLToPath(url);
}
