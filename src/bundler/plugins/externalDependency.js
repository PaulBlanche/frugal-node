import * as esbuild from "esbuild";

/** @returns {esbuild.Plugin} */
export function externalDependency() {
	return {
		name: "frugal-internal:externalDependency",
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
