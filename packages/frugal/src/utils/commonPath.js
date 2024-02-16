import * as path from "node:path";
import commonPathPrefix from "common-path-prefix";

/**
 * @param {string[]} paths
 * @returns {string}
 */
export function commonPath(paths) {
	if (paths.length === 1) {
		return path.dirname(paths[0]);
	}

	return commonPathPrefix(paths);
}
