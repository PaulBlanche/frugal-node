import * as child_process from "node:child_process";
import * as path from "node:path";

export class WatchHelper {
	/** @type {child_process.ChildProcessWithoutNullStreams|undefined} */
	#process;
	/** @type {string} */
	#dirname;

	/** @param {string} dirname  */
	constructor(dirname) {
		this.#dirname = dirname;
	}

	watch() {
		this.#process = child_process.spawn(
			process.execPath,
			[path.resolve(this.#dirname, "project/watch.js")],
			{
				stdio: "pipe",
				env: {
					FORCE_COLOR: "0",
				},
			},
		);

		/*this.#process.stderr.on("data", (chunk) => {
			console.log(new TextDecoder().decode(chunk).trim());
		});
		this.#process.stdout.on("data", (chunk) => {
			console.log(new TextDecoder().decode(chunk).trim());
		});*/
	}

	async awaitNextBuild() {
		return new Promise((res) => {
			/** @type {(chunk: any) => void} */
			const listener = (chunk) => {
				const messageLines = new TextDecoder().decode(chunk).split("\n");
				//messageLines.forEach((line) => console.log(line));
				if (
					messageLines.some((line) =>
						line.includes("WatchProcess > Ended watch mode build"),
					)
				) {
					res(undefined);
					this.#process?.stdout.removeListener("data", listener);
				}
			};
			this.#process?.stdout.addListener("data", listener);
		});
	}

	kill() {
		if (this.#process) {
			this.#process.kill("SIGINT");
		}
	}
}
