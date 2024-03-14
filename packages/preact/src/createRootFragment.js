// from https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
/**
 * A Preact 11+ implementation of the `replaceNode` parameter from Preact 10.
 *
 * This creates a "Persistent Fragment" (a fake DOM element) containing one or more
 * DOM nodes, which can then be passed as the `parent` argument to Preact's `render()` method.
 * @param {Node & { __k?: unknown }} parent
 * @param {Node|Node[]} replaceNode
 */
export function createRootFragment(parent, replaceNode) {
	const range = /**@type {Node[]}*/ ([]).concat(replaceNode);

	const s = range[range.length - 1].nextSibling;

	/**
	 * @param {Node} c
	 * @param {Node} r
	 */
	function insert(c, r) {
		if (r && r.parentNode === parent) {
			parent.insertBefore(c, r);
		} else if (s && s.parentNode === parent) {
			parent.insertBefore(c, s);
		}
	}

	return /** @type {DocumentFragment} */ /** @type {DocumentFragment} */ (
		/** @type {unknown} */ (
			// biome-ignore lint/suspicious/noAssignInExpressions: as taken from the gist
			(parent.__k = {
				nodeType: 1,
				parentNode: parent,
				firstChild: range[0],
				childNodes: range,
				insertBefore: insert,
				appendChild: insert,
				removeChild: /** @param {Node} c*/ (c) => {
					parent.removeChild(c);
				},
			})
		)
	);
}
