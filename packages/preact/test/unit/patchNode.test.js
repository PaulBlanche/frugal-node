import * as assert from "node:assert/strict";

import { test } from "node:test";
import { withDom } from "@frugal-node/test-utils/src/jsdom.js";
import { patchNode } from "../../src/patchNode.js";
import { resetRenderingIsland, setRenderingIsland } from "../../src/preactOptions.js";

await test("unit/patchNode: childNodes with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<span>c</span>
		<!--frugal-slot:start:0:0-->
		<span>d</span>
		<span>e</span>
		<!--frugal-slot:end:0:0-->
		<span>f</span>
		<span>g</span>
		<!--frugal-island:end:0-->
		<span>h</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		const realRootChildNodes = root.childNodes;

		patchNode();
		resetRenderingIsland();

		assert.strictEqual(root.childNodes.length, realRootChildNodes.length);

		for (let i = 0; i < root.childNodes.length; i++) {
			assert.strictEqual(root.childNodes[i], realRootChildNodes[i]);
		}
	});
});

await test("unit/patchNode: childNodes with render and no island or slots", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<span>b</span>
		<span>c</span>
		<span>d</span>
		<span>e</span>
		<span>f</span>
		<span>g</span>
		<span>h</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		const realRootChildNodes = root.childNodes;

		patchNode();

		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.childNodes.length, realRootChildNodes.length);

		for (let i = 0; i < root.childNodes.length; i++) {
			assert.strictEqual(root.childNodes[i], realRootChildNodes[i]);
		}

		resetRenderingIsland();
	});
});

await test("unit/patchNode: childNodes with render and island without slots", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<span>c</span>
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		const realRootChildNodes = root.childNodes;

		patchNode();

		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.childNodes.length, 5);
		assert.strictEqual(realRootChildNodes.length, 13);

		assert.strictEqual(root.childNodes[0], realRootChildNodes[4]);
		assert.strictEqual(root.childNodes[1], realRootChildNodes[5]);
		assert.strictEqual(root.childNodes[2], realRootChildNodes[6]);
		assert.strictEqual(root.childNodes[3], realRootChildNodes[7]);
		assert.strictEqual(root.childNodes[4], realRootChildNodes[8]);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: childNodes with render and multiple slots", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-slot:start:0:1-->
		<span>e</span>
		<!--frugal-slot:end:0:1-->
		<span>f</span>
		<!--frugal-slot:start:0:2--><!--frugal-slot:end:0:2-->
		<!--frugal-island:end:0-->
		<span>g</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		const realRootChildNodes = root.childNodes;

		patchNode();

		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.childNodes.length, 13);
		assert.strictEqual(realRootChildNodes.length, 30);

		assert.strictEqual(root.childNodes[0], realRootChildNodes[4]);
		assert.strictEqual(root.childNodes[1], realRootChildNodes[5]);
		assert.strictEqual(root.childNodes[2], realRootChildNodes[6]);

		assert.strictEqual(/** @type {any}*/ (root.childNodes[3]).localName, "frugal-slot-0-0");

		assert.strictEqual(root.childNodes[4], realRootChildNodes[12]);
		assert.strictEqual(root.childNodes[5], realRootChildNodes[13]);
		assert.strictEqual(root.childNodes[6], realRootChildNodes[14]);

		assert.strictEqual(/** @type {any}*/ (root.childNodes[7]).localName, "frugal-slot-0-1");

		assert.strictEqual(root.childNodes[8], realRootChildNodes[20]);
		assert.strictEqual(root.childNodes[9], realRootChildNodes[21]);
		assert.strictEqual(root.childNodes[10], realRootChildNodes[22]);

		assert.strictEqual(/** @type {any}*/ (root.childNodes[11]).localName, "frugal-slot-0-2");

		assert.strictEqual(root.childNodes[12], realRootChildNodes[25]);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: childNodes with render and multiple islands", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<!--frugal-island:end:0-->
		<span>d</span>
		<!--frugal-island:start:1-->
		<span>e</span>
		<!--frugal-slot:start:1:0-->
		<span>f</span>
		<!--frugal-slot:end:1:0-->
		<!--frugal-island:end:1-->
		<span>g</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		const realRootChildNodes = root.childNodes;

		patchNode();

		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.childNodes.length, 5);
		assert.strictEqual(realRootChildNodes.length, 31);

		assert.strictEqual(root.childNodes[0], realRootChildNodes[4]);
		assert.strictEqual(root.childNodes[1], realRootChildNodes[5]);
		assert.strictEqual(root.childNodes[2], realRootChildNodes[6]);

		assert.strictEqual(/** @type {any}*/ (root.childNodes[3]).localName, "frugal-slot-0-0");

		assert.strictEqual(root.childNodes[4], realRootChildNodes[12]);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: parentNode with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		for (const child of root.childNodes) {
			assert.strictEqual(child.parentNode, root);
		}
	});
});

await test("unit/patchNode: parentNode with render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		for (const child of root.childNodes) {
			assert.strictEqual(child.parentNode, root);
		}

		resetRenderingIsland();
	});
});

await test("unit/patchNode: nextSibling with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		for (let i = 0; i < root.childNodes.length; i++) {
			assert.strictEqual(root.childNodes[i].nextSibling, root.childNodes[i + 1] ?? null);
		}
	});
});

await test("unit/patchNode: nextSibling with render and no slots", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<span>c</span>
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		for (let i = 0; i < root.childNodes.length; i++) {
			assert.strictEqual(root.childNodes[i].nextSibling, root.childNodes[i + 1] ?? null);
		}

		resetRenderingIsland();
	});
});

await test("unit/patchNode: nextSibling with render and with slots", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-stot:start:0:0-->
		<span>c</span>
		<!--frugal-stot:end:0:0-->
		<span>d</span>
		<!--frugal-stot:start:0:0-->
		<span>e</span>
		<!--frugal-stot:end:0:0--><!--frugal-island:end:0-->
		<span>e</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		for (let i = 0; i < root.childNodes.length; i++) {
			assert.strictEqual(root.childNodes[i].nextSibling, root.childNodes[i + 1] ?? null);
		}

		resetRenderingIsland();
	});
});

await test("unit/patchNode: firstChild with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<!--frugal-island:end:0-->
		<span>d</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		assert.strictEqual(root.firstChild, root.childNodes[0]);
	});
});

await test("unit/patchNode: firstChild with render and island", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-island:end:0-->
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.firstChild, root.childNodes[0]);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: firstChild with render and island and slot as firstChild", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		assert.strictEqual(root.firstChild, root.childNodes[0]);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: removeNode with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>e</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		root.removeChild(root.childNodes[17]);
		root.removeChild(root.childNodes[9]);
		root.removeChild(root.childNodes[2]);
		root.removeChild(root.childNodes[1]);

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		
	</div>`,
		);
	});
});

await test("unit/patchNode: removeNode with render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>e</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		root.removeChild(root.childNodes[5]);
		root.removeChild(root.childNodes[3]);
		root.removeChild(root.childNodes[2]);

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		
		<!--frugal-island:end:0-->
		<span>e</span>
	</div>`,
		);
	});
});

await test("unit/patchNode: insertBefore with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>e</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		for (let i = root.childNodes.length - 1; i >= 0; i--) {
			root.insertBefore(document.createElement(`insert-before-${i}`), root.childNodes[i]);
		}

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment"><insert-before-0></insert-before-0>
		<insert-before-1></insert-before-1><span>a</span><insert-before-2></insert-before-2>
		<insert-before-3></insert-before-3><!--frugal-island:start:0--><insert-before-4></insert-before-4>
		<insert-before-5></insert-before-5><span>b</span><insert-before-6></insert-before-6>
		<insert-before-7></insert-before-7><!--frugal-slot:start:0:0--><insert-before-8></insert-before-8>
		<insert-before-9></insert-before-9><span>c</span><insert-before-10></insert-before-10>
		<insert-before-11></insert-before-11><!--frugal-slot:end:0:0--><insert-before-12></insert-before-12>
		<insert-before-13></insert-before-13><span>d</span><insert-before-14></insert-before-14>
		<insert-before-15></insert-before-15><!--frugal-island:end:0--><insert-before-16></insert-before-16>
		<insert-before-17></insert-before-17><span>e</span><insert-before-18></insert-before-18>
	</div>`,
		);
	});
});

await test("unit/patchNode: insertBefore with render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0-->
		<span>c</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		for (let i = root.childNodes.length - 1; i >= 0; i--) {
			root.insertBefore(document.createElement(`insert-before-${i}`), root.childNodes[i]);
		}

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0--><insert-before-0></insert-before-0>
		<insert-before-1></insert-before-1><span>a</span><insert-before-2></insert-before-2>
		<insert-before-3></insert-before-3><!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0--><insert-before-4></insert-before-4>
		<insert-before-5></insert-before-5><span>c</span><insert-before-6></insert-before-6>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>`,
		);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: insertBefore a slot that was removed", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0-->
		<span>c</span>
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		root.removeChild(root.childNodes[3]);

		root.insertBefore(document.createElement("frugal-slot-0-0"), root.childNodes[6]);

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		
		<span>c</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0--><span>d</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>`,
		);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: appendChild with no render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>e</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		resetRenderingIsland();

		root.appendChild(document.createElement("appended"));

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>b</span>
		<!--frugal-slot:start:0:0-->
		<span>c</span>
		<!--frugal-slot:end:0:0-->
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>e</span>
	<appended></appended></div>`,
		);
	});
});

await test("unit/patchNode: appendChild with render", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0-->
		<span>c</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		root.appendChild(document.createElement("appended"));

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0-->
		<span>c</span>
		<appended></appended><!--frugal-island:end:0-->
		<span>b</span>
	</div>`,
		);

		resetRenderingIsland();
	});
});

await test("unit/patchNode: appendChild a slot that was removed", async () => {
	const html = `<!DOCTYPE html>
<body>
	<div id='fragment'>
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0-->
		<span>c</span>
		<span>d</span>
		<!--frugal-island:end:0-->
		<span>b</span>
	</div>
</body>
`;

	await withDom(html, (dom) => {
		const root = /** @type {HTMLElement} */ (document.getElementById("fragment"));

		patchNode();
		setRenderingIsland("0", /** @type {any}*/ ({}));

		root.removeChild(root.childNodes[3]);

		root.appendChild(document.createElement("frugal-slot-0-0"));

		assert.strictEqual(
			root.outerHTML,
			`<div id="fragment">
		<span>a</span>
		<!--frugal-island:start:0-->
		<span>a</span>
		
		<span>c</span>
		<span>d</span>
		<!--frugal-slot:start:0:0-->
		<span>b</span>
		<!--frugal-slot:end:0:0--><!--frugal-island:end:0-->
		<span>b</span>
	</div>`,
		);

		resetRenderingIsland();
	});
});
