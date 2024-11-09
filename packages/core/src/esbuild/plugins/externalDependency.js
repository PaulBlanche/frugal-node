/** @import * as self from './externalDependency.js' */

/** @type {self.externalDependency} */
export function externalDependency() {
	return {
		name: "frugal-internal-plugin:externalDependency",
		setup(build) {
			build.onResolve({ filter: /^[^\.\/]/ }, (args) => {
				return {
					path: args.path,
					external: true,
				};
			});
		},
	};
}
