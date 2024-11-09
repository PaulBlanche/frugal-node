/** @import * as self from "./dependencies.js" */

import * as path from "node:path";
import { ModuleWalker } from "./ModuleWalker.js";
import * as swcAsserts from "./swcAsserts.js";

/** @type {self.dependencies} */
export async function dependencies(filePath) {
	/** @type {Map<string, self.Node>} */
	const nodes = new Map();

	await _walk(filePath);

	return [...nodes.keys()];

	/** @param {string} filePath */
	async function _walk(filePath) {
		if (!nodes.has(filePath)) {
			nodes.set(filePath, { filePath, importCount: 1, parsed: false, children: {} });
		}
		const node = /** @type {self.Node} */ (nodes.get(filePath));

		const stack = [node];

		/** @type {self.Node | undefined} */
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
				const node = /** @type {self.Node} */ (nodes.get(dependency));

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
		const walker = await ModuleWalker.create(filePath);

		/** @type {string[]} */
		const specifiers = [];

		await walker.walk({
			enter: (node) => {
				if (swcAsserts.isImportDeclaration(node)) {
					const specifier = node.source.value;

					if (specifier.startsWith("/")) {
						specifiers.push(specifier);
					} else if (specifier.startsWith(".")) {
						specifiers.push(path.resolve(path.dirname(filePath), specifier));
					}
				}
			},
		});

		return specifiers;
	}
}

/**
 * @param {string} ext
 * @returns {{ syntax:"typescript", tsx:boolean}|{syntax:'ecmascript', jsx:boolean}}
 */
function getParseOptions(ext) {
	if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
		return { syntax: "typescript", tsx: ext.endsWith("x") };
	}
	if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
		return { syntax: "ecmascript", jsx: ext.endsWith("x") };
	}

	throw Error(`unparsable file format ${ext}`);
}
