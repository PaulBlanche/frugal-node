/** @import * as self from "./copy.js" */

import * as fs from "../../utils/fs.js";

/** @type {self.copy} */
export function copy(config) {
	return {
		name: "frugal-internal-plugin:copy",
		setup(build) {
			build.onEnd(async () => {
				const promises = [];

				for (const entry of config) {
					const copyPromise = (async () => {
						try {
							await fs.copy(entry.from, entry.to, {
								overwrite: true,
								recursive: entry.recursive,
							});
						} catch (/** @type {any} */ error) {
							if (!(entry.forgiveNotFound && error instanceof fs.NotFound)) {
								throw error;
							}
						}
					})();

					promises.push(copyPromise);
				}

				await Promise.all(promises);
			});
		},
	};
}
