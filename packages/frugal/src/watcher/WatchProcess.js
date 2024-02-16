import * as process from "node:process";
import * as webStream from "node:stream/web";
import chalk from "chalk";
import { log } from "../utils/log.js";
import * as readableStream from "../utils/readableStream.js";
import * as spawn from "../utils/spawn.js";
import * as watcher from "./DependencyWatcher.js";
import * as _type from "./_type/WatchProcess.js";

/** @typedef {_type.Listener} Listener */
/** @typedef {_type.EventType} EventType */

export class WatchProcess {
	/** @type {watcher.DependencyWatcher} */
	#watcher;
	/** @type {spawn.ChildProcess | undefined} */
	#process;
	/** @type {_type.Listener[]} */
	#listeners;
	/** @type {webStream.ReadableStream<string> | undefined} */
	#processOutputLineStream;

	constructor() {
		this.#listeners = [];

		log("Setup watch process process", {
			scope: "WatchProcess",
			level: "debug",
		});

		this.#watcher = new watcher.DependencyWatcher(process.argv[1], {
			env: {
				FRUGAL_WATCH_PROCESS_CHILD: "1",
				FORCE_COLOR: String(chalk.level),
			},
		});
	}

	/** @param {_type.Listener} listener */
	addEventListener(listener) {
		this.#listeners.push(listener);
	}

	/**
	 *
	 * @param {_type.EventType} type
	 */
	#emit(type) {
		for (const listener of this.#listeners) {
			listener(type);
		}
	}

	async spawn() {
		this.#process = await this.#watcher.spawn();
		const pid = this.#process.pid;
		this.#process.status.then(() => {
			if (this.#process?.pid === pid) {
				this.#process = undefined;
			}
		});
		this.#listenProcess(this.#process);
	}

	async kill() {
		this.#process?.kill("SIGINT");
		await this.#process?.status;
	}

	/** @param {spawn.ChildProcess} process */
	async #listenProcess(process) {
		this.#processOutputLineStream = readableStream
			.mergeReadableStreams(process.stdout, process.stderr)
			.pipeThrough(new webStream.TextDecoderStream())
			.pipeThrough(new readableStream.TextLineStream());

		for await (const line of this.#processOutputLineStream) {
			const trimedLine = line.trim();
			if (trimedLine.length === 0) {
				continue;
			}

			try {
				const data = JSON.parse(trimedLine);
				switch (data.type) {
					case "suspend": {
						this.#emit("suspend");
						break;
					}
					case "reload": {
						this.#emit("reload");
						break;
					}
					default:
						console.log(line);
				}
			} catch {
				console.log(line);
			}
		}
	}
}
