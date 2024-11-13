/** @import * as self from './externalDependency.js' */

const FILTER = /^[^\.\/]/;

/** @type {self.externalDependency} */
export function externalDependency() {
	return {
		name: "frugal-internal-plugin:externalDependency",
		setup(build) {
			build.onResolve({ filter: FILTER }, (args) => {
				return {
					path: args.path,
					external: true,
				};
			});
		},
	};
}
