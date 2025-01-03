import * as assert from "node:assert/strict";
import { ReadableStream } from "node:stream/web";
import { test } from "node:test";
import { waitForPort } from "@frugal-node/test-utils";
import { serve } from "../../../src/utils/serve.js";

test("unit/serve.js: input to the handler the request from the client and serve back the response", async () => {
	await waitForPort({ port: 8001, hostname: "0.0.0.0" });

	const abortController = new AbortController();
	const serverPromise = serve(
		async (request) => {
			assert.deepEqual(await request.text(), "ping");
			assert.deepEqual(request.method, "POST");
			assert.deepEqual(Object.fromEntries(request.headers.entries())["foo"], "bar, bar2");
			return new Response("pong", {
				headers: [
					["baz", "quux"],
					["baz", "quux2"],
				],
				status: 305,
			});
		},
		{
			hostname: "0.0.0.0",
			port: 8001,
			signal: abortController.signal,
		},
	);

	const response = await fetch("http://0.0.0.0:8001/any/url", {
		body: "ping",
		headers: [
			["foo", "bar"],
			["foo", "bar2"],
		],
		method: "POST",
	});

	assert.deepEqual(await response.text(), "pong");
	assert.deepEqual(Object.fromEntries(response.headers.entries())["baz"], "quux, quux2");
	assert.deepEqual(response.status, 305);

	abortController.abort();
	await serverPromise;
});

test("unit/serve.js: can recieve and answer with ReadableStream", async () => {
	await waitForPort({ port: 8001, hostname: "0.0.0.0" });

	const abortController = new AbortController();
	const serverPromise = serve(
		async (request) => {
			if (request.body === null) {
				assert.fail("body should contain a readable stream");
			}
			/** @type {string[]} */
			const chunks = [];
			for await (const chunk of /** @type {ReadableStream<Uint8Array>}*/ (request.body)) {
				chunks.push(new TextDecoder().decode(chunk));
			}
			assert.deepEqual(chunks, ["pi", "ng"]);
			// @ts-expect-error: no types for `ReadableStream.from` but the method exists
			return new Response(ReadableStream.from(["po", "ng"]));
		},
		{
			hostname: "0.0.0.0",
			port: 8001,
			signal: abortController.signal,
		},
	);

	const response = await fetch("http://0.0.0.0:8001/any/url", {
		// @ts-expect-error: no types for `ReadableStream.from` but the method exists
		body: ReadableStream.from(["pi", "ng"]),
		method: "POST",
		duplex: "half",
	});

	if (response.body === null) {
		assert.fail("body should contain a readable stream");
	}
	/** @type {string[]} */
	const chunks = [];
	for await (const chunk of /** @type {ReadableStream<Uint8Array>}*/ (response.body)) {
		chunks.push(new TextDecoder().decode(chunk));
	}
	assert.deepEqual(chunks, ["pong"]);

	abortController.abort();
	await serverPromise;
});
