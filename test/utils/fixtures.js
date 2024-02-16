import * as fs from "node:fs";
import * as path from "node:path";

import * as frugal from "../../packages/frugal/exports/index.js";

/** @param {string} dirname */
export async function setupFixtures(dirname) {
	const base = path.join(dirname, "project/");
	try {
		await fs.promises.rm(base, { recursive: true });
	} catch {}

	await fs.promises.mkdir(base, { recursive: true });

	const fixtures = path.join(dirname, "fixtures/");

	for await (const entry of await fs.promises.opendir(fixtures)) {
		await fs.promises.cp(path.join(fixtures, entry.name), path.join(base, entry.name), {
			recursive: true,
		});
	}
}

/**
 * @param {string} dirname
 * @returns {Promise<frugal.Config>}
 */
export async function loadFixtureConfig(dirname) {
	const hash = String(Date.now());
	const { config } = await import(path.resolve(dirname, `project/frugal.config.js#${hash}`));
	return config;
}
