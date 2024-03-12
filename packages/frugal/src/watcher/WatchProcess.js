import * as process from "node:process";
import * as webStream from "node:stream/web";
import chalk from "chalk";
import { log } from "../utils/log.js";
import * as readableStream from "../utils/readableStream.js";
import { Watcher } from "./Watcher.js";

/** @type {import('./WatchProcess.ts').create} */
export function create() {
	const state = {
		/** @type {import('./WatchProcess.ts').Listener[]} */
		listeners: [],
		/** @type {Watcher|undefined} */
		watcher: undefined,
		/** @type {import("../utils/ChildProcess.ts").ChildProcess | undefined} */
		process: undefined,
	};

	log("Setup watch process", {
		scope: "WatchProcess",
		level: "debug",
	});

	return {
		addEventListener(listener) {
			state.listeners.push(listener);
		},

		async spawn() {
			if (state.process !== undefined) {
				throw Error("process was already spawned");
			}

			state.watcher = await Watcher.create(process.argv[1], {
				env: {
					FRUGAL_WATCH_PROCESS_CHILD: "1",
					FORCE_COLOR: String(chalk.level),
				},
			});
			state.process = state.watcher.spawn();

			const pid = state.process.pid;

			state.process.status.then(() => {
				if (state.process?.pid === pid) {
					state.process = undefined;
				}
			});

			_listenProcess(state.process);
		},

		async kill() {
			await state.watcher?.dispose();
			await state.process?.status;
		},
	};

	/**
	 * @param {import('./WatchProcess.ts').EventType} type
	 */
	function _emit(type) {
		for (const listener of state.listeners) {
			listener(type);
		}
	}

	/**
	 * @param {import("../utils/ChildProcess.ts").ChildProcess} process
	 */
	async function _listenProcess(process) {
		const processOutputLineStream = readableStream
			.mergeReadableStreams(process.stdout, process.stderr)
			.pipeThrough(new webStream.TextDecoderStream())
			.pipeThrough(new readableStream.TextLineStream());

		for await (const line of processOutputLineStream) {
			const trimedLine = line.trim();
			if (trimedLine.length === 0) {
				continue;
			}

			try {
				const data = JSON.parse(trimedLine);
				switch (data.type) {
					case "build:start": {
						_emit("build:start");
						break;
					}
					case "build:end": {
						_emit("build:end");
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
