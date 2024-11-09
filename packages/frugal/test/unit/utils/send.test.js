import * as assert from "node:assert/strict";
import { test } from "node:test";
import * as url from "node:url";
import { waitForPort } from "@frugal-node/test-utils";
import { send } from "../../../src/utils/send.js";
import { serve } from "../../../src/utils/serve.js";

test("unit/send.js: send static file from a directory", async () => {
	await waitForPort({ port: 8001, hostname: "0.0.0.0" });
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
	assert.deepEqual(headers["content-type"], "text/plain");
	assert.deepEqual(typeof headers["last-modified"], "string");
	assert.deepEqual(typeof headers["etag"], "string");

	const responseBar = await fetch("http://0.0.0.0:8001/bar.txt");
	assert.deepEqual(responseBar.status, 404);

	const responseDir = await fetch("http://0.0.0.0:8001/dir");
	assert.deepEqual(responseDir.status, 404);

	const responseDirBar = await fetch("http://0.0.0.0:8001/dir/bar.txt");
	assert.deepEqual(await responseDirBar.text(), "bar");

	abortController.abort();
	await serverPromise;
});
