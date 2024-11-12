/** @import * as self from "./RestartableChildProcess.js" */

import * as child_process from "node:child_process";
import * as streamWeb from "node:stream/web";

/** @type {self.RestartableChildProcessCreator} */
export const RestartableChildProcess = {
	spawn,
};

/** @type {self.RestartableChildProcessCreator['spawn']} */
export function spawn(command, options) {
	/** @type {self.StdioStream} */
	const stderr = {};
	stderr.stream = new streamWeb.ReadableStream({
		start: (controller) => {
			stderr.controller = controller;
		},
		pull: () => {
			stderr.streamReadable?.resume();
		},
	});

	/** @type {self.StdioStream} */
	const stdout = {};
	stdout.stream = new streamWeb.ReadableStream({
		start: (controller) => {
			stdout.controller = controller;
		},
		pull: () => {
			stdout.streamReadable?.resume();
		},
	});

	const state = {
		isRestarting: false,
		/** @type {self.Listeners} */
		listeners: { exit: [], error: [], restart: [] },
		exited: false,
		/** @type {any} */
		process: undefined,
	};

	state.process = _spawn();

	return {
		get status() {
			return state.process.status;
		},
		get stderr() {
			return stderr.stream;
		},
		get stdout() {
			return stdout.stream;
		},
		get pid() {
			return state.process.spawned.pid;
		},

		addEventListener(type, listener) {
			state.listeners[type].push(/** @type {any} */ (listener));
		},

		async kill(signal) {
			_kill(signal);
			try {
				await stdout.stream.cancel();
				await stderr.stream.cancel();
			} catch {
				// don't care 'bout no errors
			}
		},

		async restart() {
			state.isRestarting = true;
			_kill("SIGINT");

			for (const listener of state.listeners["restart"]) {
				listener();
			}

			await this.status;

			state.process = _spawn();
			state.exited = false;
		},
	};

	/** @param {NodeJS.Signals} [signal] */
	function _kill(signal) {
		if (!state.exited) {
			state.process.spawned.kill(signal);
			state.process.spawned.on("exit", () => {
				stderr.streamReadable?.removeAllListeners();
				stdout.streamReadable?.removeAllListeners();
			});
		}
	}

	function _spawn() {
		const spawned = child_process.spawn(command, options?.args, {
			env: options?.env,
			stdio: "pipe",
		});

		spawned.on("exit", (code, signal) => {
			if (!state.isRestarting) {
				for (const listener of state.listeners["exit"]) {
					listener(code, signal);
				}
			}
		});

		spawned.on("error", (error) => {
			for (const listener of state.listeners["error"]) {
				listener(error);
			}
		});

		const status = new Promise((res, rej) => {
			spawned.on("exit", (code, signal) => {
				state.exited = true;
				res({
					success: code === 0,
					code: code ?? undefined,
					signal: signal ?? undefined,
				});
			});
		});

		state.isRestarting = false;

		stdout.streamReadable = spawned.stdout;
		spawned.stdout.on("data", (chunk) => {
			stdout.controller?.enqueue(new Uint8Array(chunk));

			const desiredSize = stdout.controller?.desiredSize ?? 0;
			if (desiredSize <= 0) {
				stdout.streamReadable?.pause();
			}
		});

		stdout.streamReadable?.on("error", (error) => {
			stdout.controller?.error(error);
		});

		stderr.streamReadable = spawned.stderr;
		spawned.stderr.on("data", (chunk) => {
			stderr.controller?.enqueue(new Uint8Array(chunk));

			const desiredSize = stderr.controller?.desiredSize ?? 0;
			if (desiredSize <= 0) {
				stderr.streamReadable?.pause();
			}
		});

		stderr.streamReadable?.on("error", (error) => {
			stderr.controller?.error(error);
		});

		return { spawned, status };
	}
}
