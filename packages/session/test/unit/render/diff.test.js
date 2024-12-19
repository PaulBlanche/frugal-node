import * as assert from "node:assert/strict";
import { test } from "node:test";
import { jsdom } from "@frugal-node/test-utils";
import { JSDOM } from "jsdom";
import { diff } from "../../../src/page/render/diff.js";

test("unit/session/diff: diff noop", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>title</h1></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 0, // preserve node (body)
	});

	cleanup();
});

test("unit/session/diff: diff on text node", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>edited</h1></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 5, // update node (h1)
				children: [
					{
						type: 4, // update text
						text: "edited",
					},
				],
				attributes: [],
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff on comment node", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1><!--foo--></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>title</h1><!--bar--></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 0, // preserve node (h1)
			},
			{
				type: 3, // replace node (comment)
				node: nextDocument.querySelector("h1")?.nextSibling,
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff on node name", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h2>title</h2></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 3, // replace node (comment)
				node: nextDocument.querySelector("h2"),
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff on node attributes", () => {
	const cleanup = jsdom.setup(
		new JSDOM(
			"<html><body><h1 removed='removed' removedbool updated='old'>title</h1></body></html>",
		),
	);

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1 updated='new' added='added' addedbool>title</h1></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 5, // update node (h1)
				children: [
					{
						type: 0, // preserve text
					},
				],
				attributes: [
					{
						name: "removed",
						type: 6,
					},
					{
						name: "removedbool",
						type: 6,
					},
					{
						name: "updated",
						type: 7,
						value: "new",
					},
					{
						name: "added",
						type: 7,
						value: "added",
					},
				],
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff added node", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>title</h1><h2>foo</h2></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 0, // preserve node (h1)
			},
			{
				type: 2, // append node (h2)
				node: nextDocument.querySelector("h2"),
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff removed node", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1><h2>foo</h2></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>title</h1></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 0, // preserve node (h1)
			},
			{
				type: 1, // remove node (h2)
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: diff node replace by string", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><body><h1>title</h1></body></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><body>baba</body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 5, // update node (body)
		children: [
			{
				type: 3, // replace node (h1)
				node: nextDocument.body.childNodes[0],
			},
		],
		attributes: [],
	});

	cleanup();
});

test("unit/session/diff: no diff pragma", () => {
	const cleanup = jsdom.setup(
		new JSDOM(
			"<html><body><h1>title</h1><!--start-no-diff--><div><p>foo</p></div><!--end-no-diff--></body></html>",
		),
	);

	const nextDocument = new DOMParser().parseFromString(
		"<html><body><h1>title</h1><!--start-no-diff--><div><p>bar</p></div><!--end-no-diff--></body></html>",
		"text/html",
	);

	const patch = diff(document.body, nextDocument.body);
	assert.deepEqual(patch, {
		type: 0, // preserve node (body)
	});

	cleanup();
});

test("unit/session/diff: no diff head", () => {
	const cleanup = jsdom.setup(new JSDOM("<html><head><title>foo</title></head></html>"));

	const nextDocument = new DOMParser().parseFromString(
		"<html><head><title>foo</title></head></html>",
		"text/html",
	);

	const patch = diff(document.head, nextDocument.head);
	assert.deepEqual(patch, {
		type: 0, // preserve node (head)
	});

	cleanup();
});

test("unit/session/diff: diff head", () => {
	const cleanup = jsdom.setup(
		new JSDOM(
			"<html><head><title>foo</title><meta name='update' content='old'/><meta name='delete' value='delete'/><link href='preserved' rel='preserved'/><link href='removed' rel='removed'/><script>foo</script></head></html>",
		),
	);

	const nextDocument = new DOMParser().parseFromString(
		"<html><head><meta charset='utf-8'/><title>bar</title><meta name='update' content='new'/><meta name='add' value='add'/><link href='preserved' rel='preserved'/><link href='added' rel='added'/><script>bar</script></head></html>",
		"text/html",
	);

	const patch = diff(document.head, nextDocument.head);

	console.log(nextDocument.querySelector("meta[charset]"));

	assert.deepEqual(patch, {
		type: 5, // update node (head)
		attributes: [],
		children: [
			{
				type: 5, // update node (title)
				attributes: [],
				children: [{ type: 4, text: "bar" }],
			},
			{
				type: 5, // update node (meta[name='update'])
				children: [],
				attributes: [{ type: 7, name: "content", value: "new" }],
			},
			{
				type: 1, // delete node (meta[name='delete'])
			},
			{
				type: 0, // preserve node (link[href='preserved'])
			},
			{
				type: 1, // delete node (link[href='removed'])
			},
			{
				type: 1, // delete node (script)
			},
			{
				type: 2, // append node (meta[charset])
				node: nextDocument.querySelector("meta[charset]")?.cloneNode(true),
			},
			{
				type: 2, // append node (meta[name="add"])
				node: nextDocument.querySelector("meta[name='add']")?.cloneNode(true),
			},
			{
				type: 2, // append node (link[href="added"])
				node: nextDocument.querySelector("link[href='added']")?.cloneNode(true),
			},
			{
				type: 2, // append node (script)
				node: nextDocument.querySelector("script")?.cloneNode(true),
			},
		],
	});

	cleanup();
});
