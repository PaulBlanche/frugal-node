import * as path from "node:path";
import * as lexer from "es-module-lexer";
import * as fs from "../utils/fs.js";

/** @type {import('./dependencies.ts').dependencies} */
export async function dependencies(filePath) {
	/** @type {Map<string, import('./dependencies.ts').Node>} */
	const nodes = new Map();

	await _walk(filePath);

	return [...nodes.keys()];

	/** @param {string} filePath */
	async function _walk(filePath) {
		if (!nodes.has(filePath)) {
			nodes.set(filePath, { filePath, importCount: 1, parsed: false, children: {} });
		}
		const node = /** @type {import('./dependencies.ts').Node} */ (nodes.get(filePath));

		const stack = [node];

		/** @type {import('./dependencies.ts').Node | undefined} */
		let current = undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
		while ((current = stack.pop()) !== undefined) {
			if (current.parsed && nodes.has(current.filePath)) {
				continue;
			}

			const dependencies = await _parse(current.filePath);
			current.parsed = true;

			for (const dependency of dependencies) {
				if (!nodes.has(dependency)) {
					nodes.set(dependency, {
						filePath: dependency,
						parsed: false,
						importCount: 0,
						children: {},
					});
				}
				const node = /** @type {import('./dependencies.ts').Node} */ (
					nodes.get(dependency)
				);

				if (!(dependency in current.children)) {
					node.importCount += 1;
					current.children[dependency] = true;
					stack.push(node);
				}
			}
		}
	}

	/**
	 * @param {string} filePath
	 * @returns {Promise<string[]>}
	 */
	async function _parse(filePath) {
		await lexer.init;

		const [imports] = lexer.parse(await fs.readTextFile(filePath));

		return imports
			.map((entry) => entry.n)
			.filter(/** @returns {name is string} */ (name) => name !== undefined)
			.map((specifier) => {
				if (specifier.startsWith("/")) {
					return specifier;
				}
				if (specifier.startsWith(".")) {
					return path.resolve(path.dirname(filePath), specifier);
				}
			})
			.filter(/** @returns {specifier is string} */ (specifier) => specifier !== undefined);
	}
}
