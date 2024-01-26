import { FrugalConfig } from "../../Config.js";
import * as cache from "../../builder/Cache.js";
import * as fs from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import * as path from "../../utils/path.js";
import * as exporter from "../Exporter.js";
import * as _type from "./_type/staticSite.js";

/**
 * @param {_type.StaticSiteConfig} config
 * @returns {exporter.Exporter}
 */
export function staticSite({ mode }) {
	return {
		name: "static-site",
		async export(context) {
			const cacheSnapshot = await cache.snapshot({ dir: context.config.buildCacheDir });

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

			// TODO:write nginx/apache config
		},
	};
}

/**
 * @param {FrugalConfig} config
 * @param {cache.SnapshotEntry} entry
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
 * @param {_type.StaticSiteMode} mode
 * @param {FrugalConfig} config
 * @param {cache.SnapshotEntry} entry
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
 * @param {_type.StaticSiteMode} mode
 * @param {cache.SnapshotEntry} entry
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
