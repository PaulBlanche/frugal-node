/** @import * as self from "./Watcher.js" */

import chalk from "chalk";
import { FileWatcher } from "../utils/FileWatcher.js";
import { RestartableChildProcess } from "../utils/RestartableChildProcess.js";
import { dependencies } from "../utils/dependencies.js";

/** @type {self.WatcherCreator} */
export const Watcher = {
	create,
};

/** @type {self.WatcherCreator['create']} */
async function create(entrypoint, options) {
	const state = {
		watcher: await _watcher(),
		/** @type {RestartableChildProcess|undefined} */
		process: undefined,
	};

	return {
		spawn() {
			console.log(`${chalk.blue("DependencyWatcher")} Process started`);

			state.process = RestartableChildProcess.spawn(process.execPath, {
				env: options.env,
				args: ["--enable-source-maps", entrypoint, ...(options.args ?? [])],
			});

			state.process.addEventListener("exit", () => {
				state.watcher.close();
				console.log(
					`${chalk.blue(
						"DependencyWatcher",
					)} Process finished. Restarting on file change...`,
				);
			});

			state.process.addEventListener("error", () => {
				console.log(
					`${chalk.blue(
						"DependencyWatcher",
					)} Process failed. Restarting on file change...`,
				);
			});

			state.process.addEventListener("restart", () => {
				// clear terminal and move back to top
				process.stdout.write("\x1b[2J");
				process.stdout.write("\x1b[H");

				console.log(`${chalk.blue("DependencyWatcher")} File change detected. Restarting!`);
			});

			_listenFsEvents(state.process);

			return state.process;
		},

		async dispose() {
			await state.process?.kill("SIGINT");
			await state.watcher.close();
			await state.process?.status;
		},
	};

	async function _watcher() {
		const watched = await Promise.all(
			[entrypoint, ...(options.watch ?? [])].map((module) => dependencies(module)),
		);
		return FileWatcher.watch(watched.flat(), {
			interval: 300,
		});
	}

	/**
	 * @param {RestartableChildProcess} process
	 */
	async function _listenFsEvents(process) {
		for await (const event of state.watcher) {
			if (event.type === "modify") {
				state.watcher.close();
				break;
			}
		}

		_onChange(process);
	}

	/**
	 * @param {RestartableChildProcess} process
	 */
	async function _onChange(process) {
		state.watcher = await _watcher();

		process.restart();

		_listenFsEvents(process);
	}
}
