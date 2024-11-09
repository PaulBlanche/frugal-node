/** @import * as self from "./ModuleWalker.js" */

import * as path from "node:path";
import * as swc from "@swc/core";
import * as fs from "./fs.js";
import * as swcAsserts from "./swcAsserts.js";

const DECODER = new TextDecoder();

/** @type {self.ModuleWalkerCreator} */
export const ModuleWalker = {
	create,
};

/**
 * @param {string} code
 * @param {swc.ParseOptions} options
 * @returns {{ module: swc.Module, offset: number }}
 */
function parse(code, options) {
	const offset = swc.parseSync("").span.end;
	const module = swc.parseSync(code, { ...options, comments: true });

	return {
		module,
		offset,
	};
}

/**
 * @type {self.ModuleWalkerCreator['create']} filePath
 */
async function create(filePath) {
	const codeRaw = await fs.readFile(filePath);
	const code = DECODER.decode(codeRaw);

	const ext = path.extname(filePath);

	const options = getParseOptions(ext);
	const { module, offset } = parse(code, options);

	return {
		get code() {
			return code;
		},
		get options() {
			return options;
		},
		walk,
		getSource,
	};

	/** @type {self.ModuleWalker['walk']} */
	async function walk(walker) {
		/** @type {self.Entry[]} */
		const stack = [{ node: module, type: "enter" }];

		/** @type {self.Entry|undefined} */
		let current = undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
		while ((current = stack.pop()) !== undefined) {
			const node = current.node;

			if (current.type === "enter") {
				const shouldVisitChildren = (await walker.enter(node)) ?? true;

				if (!shouldVisitChildren) {
					continue;
				}

				const children = [];
				for (const key in node) {
					const value = /** @type {any} */ (node)[key];
					if (Array.isArray(value)) {
						for (const child of value) {
							if (swcAsserts.isNode(child)) {
								children.push(child);
							} else if (
								swcAsserts.isArgument(child) &&
								swcAsserts.isNode(child.expression)
							) {
								children.push(child.expression);
							}
						}
					} else if (swcAsserts.isNode(value)) {
						children.push(value);
					} else if (
						swcAsserts.isArgument(value) &&
						swcAsserts.isNode(value.expression)
					) {
						children.push(value.expression);
					}
				}

				stack.push({ type: "exit", node });
				for (const child of children.reverse()) {
					stack.push({ type: "enter", node: child });
				}
			} else {
				await walker.exit?.(node);
			}
		}
	}

	/** @type {self.ModuleWalker['getSource']} */
	function getSource(node) {
		if (!swcAsserts.hasSpan(node)) {
			return undefined;
		}

		const start = node.span.start - offset - 1;
		const end = node.span.end - offset - 1;

		return {
			content: code.substring(start, end),
			start: start,
			end: end,
		};
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
