import * as swc from "@swc/core";
import * as fs from "../../../utils/fs.js";
import * as utils from "./utils.js";

const DECODER = new TextDecoder();

/** @type {import('./ModuleWalker.ts').ModuleWalkerMaker} */
export const ModuleWalker = {
	create,
};

/**
 * @type {import('./ModuleWalker.ts').ModuleWalkerMaker['create']} filePath
 */
async function create(filePath) {
	const codeRaw = await fs.readFile(filePath);
	const code = DECODER.decode(codeRaw);
	const module = await swc.parse(code, {
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
	 *
	 * @param {import('@swc/core').Node} node
	 * @returns {import('./ModuleWalker.ts').Source | undefined}
	 */
	function getSource(node) {
		if (!utils.hasSpan(node)) {
			return undefined;
		}

		const beforeSourceView = new DataView(
			codeRaw.buffer,
			0,
			node.span.start - module.span.start,
		);

		const sourceView = new DataView(
			codeRaw.buffer,
			node.span.start - module.span.start,
			node.span.end - node.span.start,
		);

		const beforeSource = DECODER.decode(beforeSourceView);

		const source = DECODER.decode(sourceView);

		const start = beforeSource.length;
		const stop = start + source.length;

		return {
			content: source,
			start,
			stop,
		};
	}
}
