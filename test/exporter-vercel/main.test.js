import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as http from "node:http";
import { test } from "node:test";
import * as url from "node:url";
import { BuildHelper } from "../utils/BuildHelper.js";

process.env.KV_REST_API_URL = "http://0.0.0.0:8001";
process.env.KV_REST_API_TOKEN = "toto";

const helper = await BuildHelper.setup(import.meta.dirname);

test("integration/build/exporter/vercel: building caches page in kv and fetching the page get from cache", async () => {
	const kvServer = createKvServer();
	kvServer.start();

	await helper.build();

	const page11value = JSON.parse(kvServer.memory.get("/page1/1"));
	assert.deepEqual(
		{
			path: page11value.path,
			hash: page11value.hash,
			body: page11value.body,
			status: page11value.status,
		},
		{
			path: "/page1/1",
			hash: "WSX99F",
			body: '{"data":"foo","params":{"id":"1"}}',
			status: 200,
		},
	);
	const page12value = JSON.parse(kvServer.memory.get("/page1/2"));
	assert.deepEqual(
		{
			path: page12value.path,
			hash: page12value.hash,
			body: page12value.body,
			status: page12value.status,
		},
		{
			path: "/page1/2",
			hash: "OHM739",
			body: '{"data":"foo","params":{"id":"2"}}',
			status: 200,
		},
	);

	const vercelLambdaServer = await createVercelLambdaServer();
	vercelLambdaServer.start();

	kvServer.memory.set(
		"/page1/1",
		JSON.stringify({
			path: "/page1/1",
			hash: "WSX99F",
			body: '{"data":"bar","params":{"id":"1"}}',
			headers: [],
			status: 200,
		}),
	);

	const result = await fetch("http://0.0.0.0:8000/page1/1");
	assert.deepEqual(await result.json(), { data: "bar", params: { id: "1" } });

	vercelLambdaServer.close();
	kvServer.close();
});

/** @typedef {['flushall']|['set', string, string]|['get', string]} Operation */

function createKvServer() {
	const DECODER = new TextDecoder();

	const memory = new Map();

	const server = http.createServer((req, res) => {
		/** @type {Uint8Array[]} */
		const bodyParts = [];
		req.on("data", (chunk) => bodyParts.push(chunk));
		req.on("end", () => {
			const bodyRaw = new Uint8Array(
				bodyParts.reduce((size, chunk) => size + chunk.length, 0),
			);
			let index = 0;
			for (const chunk of bodyParts) {
				bodyRaw.set(chunk, index);
				index += chunk.length;
			}
			const body = DECODER.decode(bodyRaw);
			const operation = JSON.parse(body);

			switch (operation[0]) {
				case "flushall": {
					memory.clear();
					res.write(JSON.stringify({ result: "OK" }));
					res.end();

					break;
				}
				case "set": {
					memory.set(operation[1], operation[2]);
					res.write(JSON.stringify({ result: "OK" }));
					res.end();

					break;
				}
				case "get": {
					const data = memory.get(operation[1]);
					res.write(JSON.stringify({ result: data }));
					res.end();

					break;
				}
			}
		});
	});

	return {
		start: () => server.listen({ host: "0.0.0.0", port: 8001 }),
		close: () => server.close(),
		memory,
	};
}

async function createVercelLambdaServer() {
	const lambdaFunctionFile = url.fileURLToPath(
		new URL("project/.vercel/output/functions/index.func/index.js", import.meta.url),
	);
	const cjsLambdaFunctionFile = url.fileURLToPath(
		new URL("project/.vercel/output/functions/index.func/index.cjs", import.meta.url),
	);
	await fs.promises.cp(lambdaFunctionFile, cjsLambdaFunctionFile);
	const hash = String(Date.now());
	const { default: handler } = await import(`${cjsLambdaFunctionFile}#${hash}`);

	const server = http.createServer(handler);

	return {
		start: () => server.listen({ host: "0.0.0.0", port: 8000 }),
		close: () => server.close(),
	};
}
