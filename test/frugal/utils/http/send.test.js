import * as assert from "node:assert/strict";
import { test } from "node:test";
import * as url from "node:url";
import { send } from "../../../../packages/frugal/src/utils/send.js";
import { serve } from "../../../../packages/frugal/src/utils/serve.js";

test("unit/frugal/utils/http/send.js: send static file from a directory", async () => {
	const abortController = new AbortController();
	const serverPromise = serve(
		(req) =>
			send(req, {
				rootDir: url.fileURLToPath(import.meta.resolve("./public")),
			}),
		{
			signal: abortController.signal,
			port: 8001,
		},
	);

	const responseFoo = await fetch("http://0.0.0.0:8001/foo.txt");
	assert.deepEqual(await responseFoo.text(), "foo");
	const headers = Object.fromEntries(responseFoo.headers.entries());
	assert.deepEqual(headers["content-length"], "3");
	assert.deepEqual(headers["content-type"], "text/plain; charset=utf-8");
	assert.deepEqual(typeof headers["last-modified"], "string");
	assert.deepEqual(typeof headers["etag"], "string");

	const responseBar = await fetch("http://0.0.0.0:8001/bar.txt");
	assert.deepEqual(responseBar.status, 404);

	const responseDir = await fetch("http://0.0.0.0:8001/dir");
	assert.deepEqual(responseDir.status, 404);

	abortController.abort();
	await serverPromise;
});
