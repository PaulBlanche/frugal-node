import events from "node:events";
import * as chokidar from "chokidar";
import * as asyncIterator from "../asyncIterator.js";
import * as _type from "./_type/fs.js";

export class FileWatcher {
	/** @type {chokidar.FSWatcher} */
	#watcher;
	/** @type {number} */
	#interval;
	/** @type {Promise<void>} */
	#readyPromise;

	/**
	 * @param {string[]} paths
	 * @param {_type.WatchOptions} [options]
	 */
	constructor(paths, { interval = 300 } = {}) {
		this.#watcher = chokidar.watch(paths, { ignoreInitial: true });
		this.#interval = interval;
		this.#readyPromise = new Promise((res) => {
			this.#watcher.on("ready", () => {
				res();
			});
		});
	}

	get ready() {
		return this.#readyPromise;
	}

	close() {
		this.#watcher.close();
	}

	/** @returns {AsyncIterator<_type.FsEvent>} */
	[Symbol.asyncIterator]() {
		return this.#asyncIterator();
	}

	async *#asyncIterator() {
		const chokidarAsyncIterator =
			/** @type {AsyncIterable<["add" | "addDir" | "change" | "unlink" | "unlinkDir", string]>} */ (
				events.on(this.#watcher, "all")
			);

		for await (const events of asyncIterator.debounce(chokidarAsyncIterator, this.#interval)) {
			/** @type {Partial<Record<_type.FsEvent["type"], string[]>>} */
			const combinedEvents = {};

			for (const [type, path] of events) {
				const standardType = this.#mapEventType(type);
				combinedEvents[standardType] = combinedEvents[standardType] ?? [];
				combinedEvents[standardType]?.push(path);
				combinedEvents["any"] = combinedEvents["any"] ?? [];
				combinedEvents["any"]?.push(path);
			}

			for (const [type, paths] of Object.entries(combinedEvents)) {
				yield/** @type {_type.FsEvent} */ ({ type, paths });
			}
		}
	}

	/**
	 * @param {"add" | "addDir" | "change" | "unlink" | "unlinkDir"} type
	 * @returns {_type.FsEvent["type"]}
	 */
	#mapEventType(type) {
		switch (type) {
			case "add": {
				return "create";
			}
			case "addDir": {
				return "create";
			}
			case "change": {
				return "modify";
			}
			case "unlink": {
				return "remove";
			}
			case "unlinkDir": {
				return "remove";
			}
		}
	}
}
