import * as path from "node:path";

/** @type {import('./AssetCollector.ts').AssetCollectorMaker} */
export const AssetCollector = {
	create,
};

/** @type {import('./AssetCollector.ts').AssetCollectorMaker['create']} */
function create(config, metafile) {
	return {
		collect(filter) {
			/** @type {import("./AssetCollector.ts").Asset[]} */
			const assets = [];

			const inputs = metafile.inputs;

			const outputEntryPoints = _getOutputEntryPoints();

			for (const outputEntryPoint of outputEntryPoints) {
				const visited = new Set();
				const stack = [outputEntryPoint.entryPoint];

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
							entrypoint: outputEntryPoint.entryPoint,
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
		},
	};

	/** @returns {import("./AssetCollector.ts").OutputEntryPoint[]} */
	function _getOutputEntryPoints() {
		const outputs = metafile.outputs;

		const outputEntryPoints = [];

		for (const [outputPath, output] of Object.entries(outputs)) {
			const entryPoint = output.entryPoint;
			if (entryPoint === undefined) {
				continue;
			}

			outputEntryPoints.push({ ...output, entryPoint, path: outputPath });
		}

		return outputEntryPoints;
	}
}
