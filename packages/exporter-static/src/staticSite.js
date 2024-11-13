/** @import * as self from "./staticSite.js" */

import * as path from "node:path";
import * as fs from "@frugal-node/core/utils/fs";
import { log } from "@frugal-node/core/utils/log";

/** @type {self.staticSite} */
export function staticSite(config = {}) {
	const mode = config.mode ?? "index.html";

	return {
		name: "static-site",
		async export(context) {
			// write added pages
			await Promise.all(
				context.snapshot.added.map(async (entry) => {
					await writeEntry({
						mode,
						config: context.config,
						entry,
						body: await context.snapshot.getBody(entry),
					});
				}),
			);

			// remove evicted pages
			await Promise.all(
				context.snapshot.evicted.map(async (entry) => {
					await deleteEntry({
						mode,
						config: context.config,
						entry,
					});
				}),
			);

			// warn if needed on pages that where already there and not evicted
			context.snapshot.current.map((entry) => {
				if (entry.age === "old") {
					warnEntry({
						mode,
						config: context.config,
						entry,
					});
				}
			});
		},
	};
}

/**
 * @param {self.Entry} entry
 */
async function deleteEntry({ config, entry }) {
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
 * @param {self.Entry} entry
 */
async function writeEntry({ mode, config, entry, body }) {
	warnEntry({ mode, config, entry, body });

	if (body === undefined) {
		return;
	}

	const filePath = path.join(config.publicDir, entry.path, "index.html");
	await fs.ensureFile(filePath);
	await fs.writeTextFile(filePath, body);
}

/**
 * @param {self.Entry} entry
 */
function warnEntry({ mode, entry }) {
	if (mode === "index.html" && entry.headers.length > 0) {
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
