import { test } from "node:test";
import { init } from "../../utils/snapshot.js";

import { config, log } from "../../../packages/frugal/src/utils/log.js";

const snapshot = await init(import.meta.url);

test("unit/frugal/utils/log.js: default config", (context) => {
	context.mock.timers.enable();

	/** @type {any[]} */
	const logs = [];
	const restoreLog = mockLogToMemory(logs);

	logTest((delay) => context.mock.timers.tick(delay));

	restoreLog();

	snapshot.assert(context, logs);
});

test("unit/frugal/utils/log.js: custom config", (context) => {
	context.mock.timers.enable();

	/** @type {any[]} */
	const logs = [];
	const restoreLog = mockLogToMemory(logs);

	config({
		level: "error",
		scopes: {
			b: "verbose",
		},
	});

	logTest((delay) => context.mock.timers.tick(delay));

	restoreLog();

	snapshot.assert(context, logs);
});

/** @param {(delay: number) => void} wait */
function logTest(wait) {
	log("default");
	wait(2000);
	log(() => "lazy message");
	wait(2000);
	log("error", { scope: "a", level: "error" });
	wait(2000);
	log(
		mockStack(new Error("true error, default level", { cause: mockStack(new Error("cause")) })),
		{ scope: "a" },
	);
	wait(2000);
	log(mockStack(new Error("true error, custom level", { cause: "cause" })), {
		scope: "a",
		level: "info",
	});
	wait(2000);
	log(withoutStack(new Error("error without stack")), { scope: "a", level: "info" });
	wait(2000);
	log("warning", { scope: "a", level: "warning" });
	wait(2000);
	log("info", { scope: "a", level: "info" });
	wait(2000);
	log("debug", { scope: "a", level: "debug" });
	wait(2000);
	log("verbose", { scope: "a", level: "verbose" });
	wait(2000);
	log("unknown", { scope: "a", level: /** @type {any} */ ("unknown") });
	wait(2000);
	log("silent", { scope: "a", level: /** @type {any} */ ("silent") });

	log("error", { scope: "b", level: "error" });
	wait(2000);
	log("warning", { scope: "b", level: "warning" });
	wait(2000);
	log("info", { scope: "b", level: "info" });
	wait(2000);
	log("debug", { scope: "b", level: "debug" });
	wait(2000);
	log("verbose", { scope: "b", level: "verbose" });
}

/**
 * @param {Error} error
 * @returns {Error}
 */
function mockStack(error) {
	error.stack = `${error.message}\n[mocked error stack]`;
	return error;
}

/**
 * @param {Error} error
 * @returns {Error}
 */
function withoutStack(error) {
	error.stack = undefined;
	return error;
}

/** @param {any[]} memory */
function mockLogToMemory(memory) {
	const initialLog = console.log;
	console.log = (...params) => memory.push(params);

	return () => {
		console.log = initialLog;
	};
}
