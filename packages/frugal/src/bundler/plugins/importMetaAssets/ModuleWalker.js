import * as swc from "@swc/core";
import * as fs from "../../../utils/fs.js";
import * as utils from "./utils.js";

const DECODER = new TextDecoder();

/** @type {import('./ModuleWalker.ts').ModuleWalkerMaker} */
export const ModuleWalker = {
	create,
};

let offset = 0;

/**
 * @param {string} code
 * @param {import('@swc/core').ParseOptions} options
 * @returns {{ module: import('@swc/core').Module, offset: number }}
 */
function parse(code, options) {
	// we need parsing to be sync, because somewhere during the parsing, the
	// spans of the node are attributed, and there is a race condition : calling
	// `parse(file1); parse(file2)` does not garantee that file1 will get its
	// span before file2 and watching the order `parse` finishes does not
	// garantee the same order either. Only parsing files one at a time does.
	const module = swc.parseSync(code, { ...options, comments: true });

	const currentOffset = offset;

	offset += code.length + 1;

	return {
		module,
		offset: currentOffset,
	};
}

/**
 * @type {import('./ModuleWalker.ts').ModuleWalkerMaker['create']} filePath
 */
async function create(filePath) {
	const codeRaw = await fs.readFile(filePath);
	const code = DECODER.decode(codeRaw);

	const { module, offset } = parse(code, {
		syntax: "typescript",
	});

	return {
		get code() {
			return code;
		},
		walk,
	};

	/** @type {import('./ModuleWalker.ts').ModuleWalker['walk']} */
	async function walk(walker) {
		/** @type {import('./ModuleWalker.ts').Entry[]} */
		const stack = [{ node: module, type: "enter" }];

		/** @type {import('./ModuleWalker.ts').Entry|undefined} */
		let current = undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
		while ((current = stack.pop()) !== undefined) {
			const node = current.node;

			if (current.type === "enter") {
				const shouldVisitChildren =
					(await walker.enter(node, () => getSource(node))) ?? true;

				if (!shouldVisitChildren) {
					continue;
				}

				const children = [];
				for (const key in node) {
					const value = /** @type {any} */ (node)[key];
					if (Array.isArray(value)) {
						for (const child of value) {
							if (utils.isNode(child)) {
								children.push(child);
							} else if (utils.isArgument(child) && utils.isNode(child.expression)) {
								children.push(child.expression);
							}
						}
					} else if (utils.isNode(value)) {
						children.push(value);
					} else if (utils.isArgument(value) && utils.isNode(value.expression)) {
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

	/**
	 * @param {import('@swc/core').Node} node
	 * @returns {import('./ModuleWalker.ts').Source | undefined}
	 */
	function getSource(node) {
		if (!utils.hasSpan(node)) {
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
