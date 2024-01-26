import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import * as test from "node:test";
import * as url from "node:url";
import { UPDATE_TEST_SNAPSHOT_ENV } from "../../scripts/test.js";
import * as jsonValue from "../../src/utils/jsonValue.js";

/** @typedef {Parameters<Exclude<Parameters<typeof test.test>[0], undefined>>[0]} TestContext */

/**
 * @param {string} moduleUrl
 * @returns {Promise<Snapshot>}
 */
export async function init(moduleUrl) {
	const testFilePath = url.fileURLToPath(moduleUrl);
	const snapshotPath = path.resolve(
		path.dirname(testFilePath),
		"__snapshot__",
		`${path.basename(testFilePath)}.json`,
	);

	const snapshot = new Snapshot(snapshotPath, await load(snapshotPath));

	if (isUpdating()) {
		process.addListener("beforeExit", async () => {
			if (!snapshot.saved) {
				await snapshot.save();
			}
		});
	}

	return snapshot;
}

class Snapshot {
	/** @type {string} */
	#path;
	/** @type {Map<string, { name: string; value: jsonValue.HashableJsonValue }>} */
	#entries;
	/** @type {Map<string, { count: number; context: TestContext }>} */
	#states;
	/** @type {boolean} */
	#saved;

	/**
	 * @param {string} path
	 * @param {Map<string, { name: string; value: jsonValue.HashableJsonValue }>} [entries]
	 */
	constructor(path, entries = new Map()) {
		this.#path = path;
		this.#entries = entries;
		this.#states = new Map();
		this.#saved = false;
	}

	get saved() {
		return this.#saved;
	}

	async save() {
		const snapshot = JSON.stringify(
			Object.fromEntries(
				Array.from(this.#entries.entries())
					.filter(([_, { name }]) => {
						return this.#states.get(name)?.context !== undefined;
					})
					.map(([name, entry]) => {
						return [name, entry];
					}),
			),
			null,
			2,
		);

		console.log(`saving snapshot "${this.#path}".`);

		await fs.promises.mkdir(path.dirname(this.#path), { recursive: true });
		await fs.promises.writeFile(this.#path, snapshot, { encoding: "utf-8" });
		this.#saved = true;
	}

	/**
	 * @param {TestContext} context
	 * @param {jsonValue.JsonValue} actual
	 * @param {string | Error} [message]
	 */
	assert(context, actual, message) {
		const name = context.name;
		const state = this.#states.get(name);

		if (state && state.context !== context) {
			throw Error(
				`Snapshot override : Two different tests using snapshot share the same name "${context.name}".`,
			);
		}

		const count = state?.count ?? 1;

		this.#states.set(name, { count: count + 1, context });

		const hashableActual = jsonValue.hashableJsonValue(actual);
		const entryName = `${name}:${count}`;

		if (isUpdating()) {
			this.#entries.set(entryName, { name, value: hashableActual });
		}

		const expected = this.#entries.get(entryName);

		if (expected === undefined) {
			throw Error(
				`No snapshot found for "snapshot.assert" number "${count}" in test "${context.name}". Try updating snapshots first.`,
			);
		}

		assert.deepEqual(hashableActual, expected.value, message);
	}
}

/**
 * @param {string} path
 * @returns {Promise<Map<string, { name: string; value: jsonValue.HashableJsonValue }>>}
 */
async function load(path) {
	try {
		const data = await fs.promises.readFile(path, { encoding: "utf-8" });
		return new Map(
			Object.entries(JSON.parse(data)).map(([name, value]) => {
				return [name, value];
			}),
		);
	} catch (/** @type {any} */ error) {
		if (error.code === "ENOENT") {
			return new Map();
		}
		throw error;
	}
}

function isUpdating() {
	return process.env[UPDATE_TEST_SNAPSHOT_ENV] !== undefined;
}
