import * as path from "node:path";
import chalk from "chalk";
import * as lexer from "es-module-lexer";
import * as fileWatcher from "../utils/fileWatcher.js";
import * as fs from "../utils/fs.js";
import * as spawn from "../utils/spawn.js";
import * as _type from "./_type/Watcher.js";

export class DependencyWatcher {
	/** @type {string} */
	#entrypoint;
	/** @type {Omit<spawn.ChildProcessOptions, "args">} */
	#options;
	/** @type {spawn.ChildProcess | undefined} */
	#childProcess;

	/**
	 * @param {string} entrypoint
	 * @param {Omit<spawn.ChildProcessOptions, "args">} options
	 */
	constructor(entrypoint, options) {
		this.#entrypoint = entrypoint;
		this.#options = options;
	}

	async spawn() {
		const watcher = fileWatcher.watch(dependencies(this.#entrypoint), { interval: 300 });

		console.log(`${chalk.blue("DependencyWatcher")} Process started`);

		this.#childProcess = spawn.spawn(process.execPath, {
			args: [this.#entrypoint],
			...this.#options,
		});

		this.#childProcess.addEventListener("exit", () => {
			console.log(
				`${chalk.blue("DependencyWatcher")} Process finished. Restarting on file change...`,
			);
		});

		this.#childProcess.addEventListener("error", () => {
			console.log(
				`${chalk.blue("DependencyWatcher")} Process failed. Restarting on file change...`,
			);
		});

		this.#childProcess.addEventListener("restart", () => {
			// clear terminal and move back to top
			process.stdout.write("\x1b[2J");
			process.stdout.write("\x1b[H");

			console.log(`${chalk.blue("DependencyWatcher")} File change detected. Restarting!`);
		});

		this.#listenFsEvents(watcher);

		return this.#childProcess;
	}

	/** @param {fileWatcher.FileWatcher} watcher */
	async #listenFsEvents(watcher) {
		for await (const event of watcher) {
			if (event.type === "modify") {
				watcher.close();
				break;
			}
		}

		this.#onChange();
	}

	async #onChange() {
		const watcher = fileWatcher.watch(dependencies(this.#entrypoint), { interval: 300 });

		this.#childProcess?.restart();

		this.#listenFsEvents(watcher);
	}
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function dependencies(path) {
	const analyzer = new DependencyAnalyzer(path);
	return analyzer.dependencies;
}

class DependencyAnalyzer {
	/** @type {Map<string, _type.Node>} */
	#nodes;

	/** @param {string} path */
	constructor(path) {
		this.#nodes = new Map();
		this.#walk(path);
	}

	get dependencies() {
		return [...this.#nodes.keys()];
	}

	/** @param {string} filePath */
	async #walk(filePath) {
		if (!this.#nodes.has(filePath)) {
			this.#nodes.set(filePath, { filePath, importCount: 1, parsed: false, children: {} });
		}
		const node = /** @type {_type.Node} */ (this.#nodes.get(filePath));

		const stack = [node];

		/** @type {_type.Node | undefined} */
		let current = undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
		while ((current = stack.pop()) !== undefined) {
			if (current.parsed && this.#nodes.has(current.filePath)) {
				continue;
			}

			const dependencies = await this.#parse(current.filePath);
			current.parsed = true;

			for (const dependency of dependencies) {
				if (!this.#nodes.has(dependency)) {
					this.#nodes.set(dependency, {
						filePath: dependency,
						parsed: false,
						importCount: 0,
						children: {},
					});
				}
				const node = /** @type {_type.Node} */ (this.#nodes.get(dependency));

				if (!(dependency in current.children)) {
					node.importCount += 1;
					current.children[dependency] = true;
					stack.push(node);
				}
			}
		}
	}

	/**
	 * @param {string} filePath
	 * @returns {Promise<string[]>}
	 */
	async #parse(filePath) {
		await lexer.init;

		const [imports] = lexer.parse(await fs.readTextFile(filePath));

		return imports
			.map((entry) => entry.n)
			.filter(/** @returns {name is string} */ (name) => name !== undefined)
			.map((specifier) => {
				if (specifier.startsWith("/")) {
					return specifier;
				}
				if (specifier.startsWith(".")) {
					return path.resolve(path.dirname(filePath), specifier);
				}
			})
			.filter(/** @returns {specifier is string} */ (specifier) => specifier !== undefined);
	}
}
