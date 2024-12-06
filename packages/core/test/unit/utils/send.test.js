import * as assert from "node:assert/strict";
import { test } from "node:test";
import * as url from "node:url";
import { waitForPort } from "@frugal-node/test-utils";
import { send } from "../../../src/utils/send.js";
import { serve } from "../../../src/utils/serve.js";

test("unit/send.js: send static file from a directory", async () => {
	await waitForPort({ port: 8001, hostname: "0.0.0.0" });
	const abortController = new AbortController();
	const server = serve(
		async (req) => {
			const response = await send(req, {
				rootDir: url.fileURLToPath(import.meta.resolve("./public")),
				compressionExt: [],
			});
			return response ?? new Response(null, { status: 404 });
		},
		{
			signal: abortController.signal,
			port: 8001,
		},
	);

	await withServer(server, abortController, async () => {
		const responseFoo = await fetch("http://0.0.0.0:8001/foo.txt");
		assert.deepEqual(await responseFoo.text(), "foo");
		const headers = Object.fromEntries(responseFoo.headers.entries());
		assert.deepEqual(headers["content-length"], "3");
		assert.deepEqual(headers["content-type"], "text/plain");
		assert.deepEqual(typeof headers["last-modified"], "string");
		assert.deepEqual(typeof headers["etag"], "string");

		const responseBar = await fetch("http://0.0.0.0:8001/bar.txt");
		assert.deepEqual(responseBar.status, 404);

		const responseDir = await fetch("http://0.0.0.0:8001/dir");
		assert.deepEqual(responseDir.status, 404);

		const responseDirBar = await fetch("http://0.0.0.0:8001/dir/bar.txt");
		assert.deepEqual(await responseDirBar.text(), "bar");
	});
});

test.todo("unit/send.js: send compressed static file from a directory", async () => {
	await waitForPort({ port: 8001, hostname: "0.0.0.0" });
	const abortController = new AbortController();
	const server = serve(
		async (req) => {
			const response = await send(req, {
				rootDir: url.fileURLToPath(import.meta.resolve("./public")),
				compressionExt: ["br", "gz"],
			});
			return response ?? new Response(null, { status: 404 });
		},
		{
			signal: abortController.signal,
			port: 8001,
		},
	);

	await withServer(server, abortController, async () => {
		const responseBrotli = await fetch("http://0.0.0.0:8001/foobr.txt");
		assert.deepEqual(await responseBrotli.text(), "foo");
		const headers = Object.fromEntries(responseBrotli.headers.entries());
		assert.deepEqual(headers["content-type"], "text/plain");
		assert.deepEqual(headers["content-encoding"], "br");

		const responseGzip = await fetch("http://0.0.0.0:8001/foogz.txt");
		assert.deepEqual(await responseGzip.text(), "foo");
		const headers2 = Object.fromEntries(responseGzip.headers.entries());
		assert.deepEqual(headers2["content-type"], "text/plain");
		assert.deepEqual(headers2["content-encoding"], "gzip");

		const responseIdentity = await fetch("http://0.0.0.0:8001/foo.txt");
		assert.deepEqual(await responseIdentity.text(), "foo");
		const headers3 = Object.fromEntries(responseIdentity.headers.entries());
		assert.deepEqual(headers3["content-type"], "text/plain");
		assert.deepEqual(headers3["content-encoding"], undefined);
	});
});

/**
 *
 * @param {{ listening: Promise<{hostname: string; port: number;}>, finished: Promise<void> }} server
 * @param {AbortController} abortController
 * @param {() => void|Promise<void>} callback
 */
async function withServer(server, abortController, callback) {
	try {
		await server.listening;
		await callback();
	} finally {
		abortController.abort();
		await server.finished;
	}
}
