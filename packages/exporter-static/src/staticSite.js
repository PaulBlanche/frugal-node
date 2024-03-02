import * as path from "node:path";
import { Snapshot } from "frugal-node/exporter";
import * as fs from "frugal-node/utils/fs";
import { log } from "frugal-node/utils/log";

/** @type {import('./staticSite.ts').staticSite} */
export function staticSite(config = {}) {
	const mode = config.mode ?? "index.html";

	return {
		name: "static-site",
		async export(context) {
			const cacheSnapshot = await Snapshot.load({ dir: context.config.buildCacheDir });

			await Promise.all(
				cacheSnapshot.added.map(
					async (entry) =>
						await writeEntry(
							mode,
							context.config,
							entry,
							await cacheSnapshot.read(entry),
						),
				),
			);
			await Promise.all(
				cacheSnapshot.evicted.map(
					async (entry) => await deleteEntry(context.config, entry),
				),
			);
			cacheSnapshot.current.map((entry) => entry.age === "old" && warnEntry(mode, entry));
		},
	};
}

/**
 * @param {import("frugal-node/config").FrugalConfig} config
 * @param {import("frugal-node/exporter").CacheEntry} entry
 */
async function deleteEntry(config, entry) {
	const filePath = path.join(config.publicDir, entry.path, "index.html");

	try {
		await fs.remove(filePath);
	} catch (error) {
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}
}

/**
 * @param {import("./staticSite.ts").StaticSiteMode} mode
 * @param {import("frugal-node/config").FrugalConfig} config
 * @param {import("frugal-node/exporter").CacheEntry} entry
 * @param {string | undefined} doc
 */
async function writeEntry(mode, config, entry, doc) {
	warnEntry(mode, entry);

	if (doc === undefined) {
		return;
	}

	const filePath = path.join(config.publicDir, entry.path, "index.html");
	await fs.ensureFile(filePath);
	await fs.writeTextFile(filePath, doc);
}

/**
 * @param {import("./staticSite.ts").StaticSiteMode} mode
 * @param {import("frugal-node/exporter").CacheEntry} entry
 */
async function warnEntry(mode, entry) {
	if (mode === "index.html" && entry.headers.length !== 0) {
		log(
			`Custom headers (in response on path "${entry.path}") are not handled by "index.html" mode`,
			{
				level: "warning",
				scope: "exporter:static-site",
			},
		);
	}
	if (mode === "index.html" && entry.status !== undefined && entry.status !== 200) {
		log(
			`Custom status (in response on path "${entry.path}") are not handled by "index.html" mode`,
			{
				level: "warning",
				scope: "exporter:static-site",
			},
		);
	}
}
