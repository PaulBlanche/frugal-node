/** @import * as self from "./commonPath.js" */

import * as path from "node:path";
import commonPathPrefix from "common-path-prefix";

/** @type {self.commonPath} */
export function commonPath(paths) {
	if (paths.length === 1) {
		return path.dirname(paths[0]);
	}

	return commonPathPrefix(paths);
}
