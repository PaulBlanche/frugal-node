import chalk from "chalk";
import { ChildProcess } from "../utils/ChildProcess.js";
import { FileWatcher } from "../utils/FileWatcher.js";
import { dependencies } from "./dependencies.js";

/** @type {import('./Watcher.ts').WatcherMaker} */
export const Watcher = {
	create,
};

/** @type {import('./Watcher.ts').WatcherMaker['create']} */
async function create(entrypoint, options) {
	const state = {
		watcher: await _watcher(),
		/** @type {ChildProcess|undefined} */
		process: undefined,
	};

	return {
		spawn() {
			console.log(`${chalk.blue("DependencyWatcher")} Process started`);

			state.process = ChildProcess.spawn(process.execPath, {
				args: [entrypoint],
				...options,
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
		return FileWatcher.watch(await dependencies(entrypoint), { interval: 300 });
	}

	/**
	 * @param {ChildProcess} process
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
	 * @param {ChildProcess} process
	 */
	async function _onChange(process) {
		state.watcher = await _watcher();

		process.restart();

		_listenFsEvents(process);
	}
}
