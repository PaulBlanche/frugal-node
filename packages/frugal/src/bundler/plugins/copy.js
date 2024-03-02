import * as fs from "../../utils/fs.js";

/** @type {import('./copy.ts').copy} */
export function copy(config) {
	return {
		name: "frugal-internal:copy",
		setup(build) {
			build.onEnd(async () => {
				for (const entry of config) {
					try {
						await fs.copy(entry.from, entry.to, {
							overwrite: true,
							recursive: entry.recursive,
						});
					} catch (/** @type {any} */ error) {
						if (!entry.forgiveNotFound || !(error instanceof fs.NotFound)) {
							throw error;
						}
					}
				}
			});
		},
	};
}
