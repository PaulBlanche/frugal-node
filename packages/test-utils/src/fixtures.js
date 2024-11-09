/** @import { BuildConfig } from "../../frugal/src/BuildConfig.js" */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * @param {string} dirname
 * @returns {Promise<BuildConfig>}
 */
export async function setup(dirname) {
	await setupFixtures(dirname);
	return loadFixtureConfig(dirname);
}

/** @param {string} dirname */
async function setupFixtures(dirname) {
	const base = path.join(dirname, "project/");
	try {
		await fs.promises.rm(base, { recursive: true });
	} catch {
		// don't care 'bout no errors
	}

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
 * @returns {Promise<BuildConfig>}
 */
async function loadFixtureConfig(dirname) {
	const hash = String(Date.now());
	const { default: config } = await import(
		path.resolve(dirname, `project/frugal.build.js#${hash}`)
	);
	return config;
}
