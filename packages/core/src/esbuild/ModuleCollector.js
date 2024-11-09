/** @import * as self from "./ModuleCollector.js" */

import * as path from "node:path";

/** @type {self.ModuleCollectorCreator} */
export const ModuleCollector = {
	create,
};

/** @type {self.ModuleCollectorCreator['create']} */
function create(config, metafile) {
	return {
		collect,
	};

	/** @type {self.ModuleCollector['collect']} */
	function collect(filter) {
		/** @type {self.CollectedModule[]} */
		const assets = [];

		const inputs = metafile.inputs;

		const entrypoints = _getOutputEntrypoints();

		for (const entrypoint of entrypoints) {
			const visited = new Set();
			const stack = [entrypoint];

			/** @type {string | undefined} */
			let current = undefined;
			// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
			while ((current = stack.pop()) !== undefined) {
				if (visited.has(current)) {
					continue;
				}
				visited.add(current);

				if (filter.test(current)) {
					assets.push({
						entrypoint: entrypoint,
						path: path.resolve(config.rootDir, current),
					});
				}

				const input = inputs[current];

				for (const imported of input.imports) {
					if (imported.external) {
						continue;
					}

					stack.push(imported.path);
				}
			}
		}

		return assets.reverse();
	}

	/** @returns {string[]} */
	function _getOutputEntrypoints() {
		const outputs = metafile.outputs;

		const outputEntrypoints = [];

		for (const output of Object.values(outputs)) {
			const entrypoint = output.entryPoint;
			if (entrypoint === undefined) {
				continue;
			}

			outputEntrypoints.push(entrypoint);
		}

		return outputEntrypoints;
	}
}
