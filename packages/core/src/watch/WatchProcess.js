/** @import { RestartableChildProcess } from "../utils/RestartableChildProcess.js" */
/** @import * as self from "./WatchProcess.js" */

import * as process from "node:process";
import * as webStream from "node:stream/web";
import chalk from "chalk";
import { log } from "../utils/log.js";
import * as readableStream from "../utils/readableStream.js";
import { Watcher } from "./Watcher.js";

/** @type {self.WatchProcessCreator} */
export const WatchProcess = {
	create,
};

/** @type {self.WatchProcessCreator['create']} */
function create() {
	const state = {
		/** @type {self.Listener[]} */
		listeners: [],
		/** @type {Watcher|undefined} */
		watcher: undefined,
		/** @type {RestartableChildProcess | undefined} */
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

		async spawn({ entrypoint, args, watch }) {
			if (state.process !== undefined) {
				throw Error("process was already spawned");
			}

			state.watcher = await Watcher.create(entrypoint, {
				watch,
				env: {
					FORCE_COLOR: String(chalk.level),
					...process.env,
					FRUGAL_WATCH_PROCESS_CHILD: "1",
				},
				args,
			});
			const spawnedProcess = state.watcher.spawn();
			state.process = spawnedProcess;

			spawnedProcess.status.then(() => {
				if (state.process?.pid === spawnedProcess.pid) {
					state.process = undefined;
				}
			});

			_listenProcess(spawnedProcess);
		},

		async kill() {
			await state.watcher?.dispose();
			await state.process?.status;
		},
	};

	/**
	 * @param {self.EventType} type
	 */
	function _emit(type) {
		for (const listener of state.listeners) {
			listener(type);
		}
	}

	/**
	 * @param {RestartableChildProcess} process
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
						log("Starting watch mode build", {
							scope: "WatchProcess",
							level: "info",
						});
						break;
					}
					case "build:end": {
						_emit("build:end");
						log("Ended watch mode build", {
							scope: "WatchProcess",
							level: "info",
						});
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
