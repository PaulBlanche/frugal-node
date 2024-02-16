import * as child_process from "node:child_process";
import * as stream from "node:stream";
import * as streamWeb from "node:stream/web";
import * as _type from "./_type/spawn.js";

/** @typedef {_type.ChildProcessOptions} ChildProcessOptions */
/** @typedef {_type.ChildProcess} ChildProcess */

/**
 * @param {string} command
 * @param {_type.ChildProcessOptions} options
 * @returns {_type.ChildProcess}
 */
export function spawn(command, options) {
	return new _ChildProcess(command, options);
}

/** @implements {_type.ChildProcess} */
class _ChildProcess {
	/** @type {{ command: string; options?: _type.ChildProcessOptions }} */
	#parameters;
	/** @type {child_process.ChildProcess} */
	#childProcess;
	/** @type {Promise<_type.ChildProcessStatus>} */
	#status;
	/** @type {boolean} */
	#exited;
	/** @type {_type.stdioStream} */
	#stderr;
	/** @type {_type.stdioStream} */
	#stdout;
	/** @type {boolean} */
	#isRestarting;
	/** @type {{ exit: _type.ExitListener[], error: _type.ErrorListener[], restart: _type.RestartListener[] }} */
	#listeners;

	/**
	 * @param {string} command
	 * @param {_type.ChildProcessOptions} [options]
	 */
	constructor(command, options) {
		this.#parameters = { command, options };
		this.#isRestarting = true;
		const { status, childProcess, exited } = this.#spawn();
		this.#childProcess = childProcess;
		this.#exited = exited;
		this.#status = status;
		this.#listeners = { exit: [], error: [], restart: [] };

		this.#stderr = /** @type {_type.stdioStream} */ ({
			streamReadable: childProcess.stderr,
		});
		this.#stderr.stream = new streamWeb.ReadableStream({
			start: (controller) => {
				this.#stderr.controller = controller;
			},
			pull: () => {
				this.#stderr.streamReadable?.resume();
			},
		});
		pipeStdio(this.#stderr);

		this.#stdout = /** @type {_type.stdioStream} */ ({
			streamReadable: childProcess.stdout,
		});
		this.#stdout.stream = new streamWeb.ReadableStream({
			start: (controller) => {
				this.#stdout.controller = controller;
			},
			pull: () => {
				this.#stdout.streamReadable?.resume();
			},
		});
		pipeStdio(this.#stdout);
	}

	get status() {
		return this.#status;
	}

	get stderr() {
		return this.#stderr.stream;
	}

	get stdout() {
		return this.#stdout.stream;
	}

	get pid() {
		return this.#childProcess.pid;
	}

	/**
	 * @template {keyof _type.Listeners} TYPE
	 * @param {TYPE} type
	 * @param {_type.Listeners[TYPE]} listener
	 * @returns {void}
	 */
	addEventListener(type, listener) {
		this.#listeners[type].push(/** @type {any} */ (listener));
	}

	#spawn() {
		const childProcess = child_process.spawn(
			this.#parameters.command,
			this.#parameters.options?.args,
			{
				env: this.#parameters.options?.env,
				stdio: "pipe",
			},
		);

		childProcess.on("exit", (code, signal) => {
			if (!this.#isRestarting) {
				for (const listener of this.#listeners["exit"]) {
					listener(code, signal);
				}
			}
		});

		childProcess.on("error", (error) => {
			for (const listener of this.#listeners["error"]) {
				listener(error);
			}
		});

		const status = new Promise((res, rej) => {
			childProcess.on("exit", (code, signal) => {
				this.#exited = true;
				res({
					success: code === 0,
					code: code ?? undefined,
					signal: signal ?? undefined,
				});
			});
		});

		this.#isRestarting = false;

		return { childProcess, status, exited: false };
	}

	/** @param {NodeJS.Signals} [signal] */
	kill(signal) {
		this.#kill(signal);
		this.#stdout.stream.cancel();
		this.#stderr.stream.cancel();
	}

	/** @param {NodeJS.Signals} [signal] */
	#kill(signal) {
		this.#stderr.streamReadable?.removeAllListeners();
		this.#stdout.streamReadable?.removeAllListeners();

		if (!this.#exited) {
			this.#childProcess.kill(signal);
		}
	}

	async restart() {
		this.#isRestarting = true;
		this.#kill("SIGINT");

		for (const listener of this.#listeners["restart"]) {
			listener();
		}

		await this.status;

		const { status, childProcess, exited } = this.#spawn();

		this.#childProcess = childProcess;
		this.#exited = exited;
		this.#status = status;
		this.#stderr.streamReadable = /** @type {stream.Readable} */ (childProcess.stderr);
		this.#stdout.streamReadable = /** @type {stream.Readable} */ (childProcess.stdout);
		pipeStdio(this.#stdout);
		pipeStdio(this.#stderr);
	}
}

/** @param {_type.stdioStream} stream */
function pipeStdio(stream) {
	stream.streamReadable?.on("data", (chunk) => {
		stream.controller?.enqueue(new Uint8Array(chunk));

		const desiredSize = stream.controller?.desiredSize ?? 0;
		if (desiredSize <= 0) {
			stream.streamReadable?.pause();
		}
	});

	stream.streamReadable?.on("error", (error) => {
		stream.controller?.error(error);
	});
}
