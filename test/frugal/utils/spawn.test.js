import * as assert from "node:assert/strict";
import * as webStream from "node:stream/web";
import { mock, test } from "node:test";
import { spawn } from "../../../packages/frugal/src/utils/spawn.js";

test("unit/frugal/utils/spawn.js: spawn a subprocess piping stdout", async () => {
	const childProcess = spawn(process.execPath, {
		args: ["--eval", 'console.log("foo"); console.error("bar"); console.log("baz");'],
	});

	/** @type {string[]} */
	const stdout = [];
	pipeStreamToBuffer(childProcess.stdout, stdout);

	/** @type {string[]} */
	const stderr = [];
	pipeStreamToBuffer(childProcess.stderr, stderr);

	assert.deepEqual(await childProcess.status, { success: true, code: 0, signal: undefined });
	assert.deepEqual(stdout.join(""), "foo\nbaz\n");
	assert.deepEqual(stderr.join(""), "bar\n");
});

test("unit/frugal/utils/spawn.js: restartable", async () => {
	const restartListenerSpy = mock.fn(() => {});
	const exitListenerSpy = mock.fn(() => {});

	const childProcess = spawn(process.execPath, {
		args: [
			"--eval",
			"(async () => { console.log('start'); await new Promise((res) => setTimeout(res, 500)); console.log('done'); })();",
		],
	});

	childProcess.addEventListener("restart", restartListenerSpy);
	childProcess.addEventListener("exit", exitListenerSpy);
	childProcess.addEventListener("error", console.log);

	/** @type {string[]} */
	const stdout = [];
	pipeStreamToBuffer(childProcess.stdout, stdout);

	assert.deepEqual(restartListenerSpy.mock.calls.length, 0);
	assert.deepEqual(exitListenerSpy.mock.calls.length, 0);

	await new Promise((res) => setTimeout(res, 100));

	await childProcess.restart();

	assert.deepEqual(restartListenerSpy.mock.calls.length, 1);
	assert.deepEqual(exitListenerSpy.mock.calls.length, 0);

	assert.deepEqual(await childProcess.status, { success: true, code: 0, signal: undefined });
	assert.deepEqual(stdout, ["start\n", "start\n", "done\n"]);

	assert.deepEqual(restartListenerSpy.mock.calls.length, 1);
	assert.deepEqual(exitListenerSpy.mock.calls.length, 1);
});

test("unit/frugal/utils/spawn.js: flood stdio", async () => {
	const childProcess = spawn(process.execPath, {
		args: ["--eval", "console.log('foo'.repeat(1000000))"],
	});

	/** @type {string[]} */
	const stdout = [];
	pipeStreamToBuffer(childProcess.stdout, stdout);

	await childProcess.status;

	assert.deepEqual(await childProcess.status, { success: true, code: 0, signal: undefined });
	assert.deepEqual(stdout.join(""), `${"foo".repeat(1000000)}\n`);
});

/**
 *
 * @param {webStream.ReadableStream<Uint8Array>} stream
 * @param {string[]} buffer
 */
function pipeStreamToBuffer(stream, buffer) {
	(async () => {
		for await (const chunk of stream.pipeThrough(new webStream.TextDecoderStream())) {
			buffer.push(chunk);
		}
	})();
}
