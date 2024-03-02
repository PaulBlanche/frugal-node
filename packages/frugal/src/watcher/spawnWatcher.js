import chalk from "chalk";
import { ChildProcess } from "../utils/ChildProcess.js";
import { FileWatcher } from "../utils/FileWatcher.js";
import { dependencies } from "./dependencies.js";

/** @type {import('./spawnWatcher.ts').spawnWatcher} */
export async function spawnWatcher(entrypoint, options) {
	const watcher = _watcher();
	console.log(`${chalk.blue("DependencyWatcher")} Process started`);

	const childProcess = ChildProcess.spawn(process.execPath, {
		args: [entrypoint],
		...options,
	});

	childProcess.addEventListener("exit", () => {
		console.log(
			`${chalk.blue("DependencyWatcher")} Process finished. Restarting on file change...`,
		);
	});

	childProcess.addEventListener("error", () => {
		console.log(
			`${chalk.blue("DependencyWatcher")} Process failed. Restarting on file change...`,
		);
	});

	childProcess.addEventListener("restart", () => {
		// clear terminal and move back to top
		process.stdout.write("\x1b[2J");
		process.stdout.write("\x1b[H");

		console.log(`${chalk.blue("DependencyWatcher")} File change detected. Restarting!`);
	});

	_listenFsEvents(watcher);

	return childProcess;

	async function _onChange() {
		const watcher = _watcher();

		childProcess?.restart();

		_listenFsEvents(watcher);
	}

	/** @param {import("../utils/FileWatcher.ts").FileWatcher} watcher */
	async function _listenFsEvents(watcher) {
		for await (const event of watcher) {
			if (event.type === "modify") {
				watcher.close();
				break;
			}
		}

		_onChange();
	}

	function _watcher() {
		return FileWatcher.watch(dependencies(entrypoint), { interval: 300 });
	}
}
