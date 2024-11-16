/** @import * as self from "./googleFonts.js" */

import * as path from "node:path";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";
import { log } from "@frugal-node/core/utils/log";

const GOOGLE_FONT_STYLESHEET_RESOLVE_REGEXP = /^https?:\/\/fonts\.googleapis\.com/;
const GOOGLE_FONT_STYLESHEET_LOAD_REGEXP = /^\/googlefonts-.*\.css$/;
const GOOGLE_FONT_FILE_REGEXP = /^\/\/fonts.gstatic.com\//;
const LOCAL_FONT_FILE_REGEXP = /^\/fonts\/.*$/;

/** @type {self.googleFonts} */
export function googleFonts({ type = /** @type {const}*/ ("local") } = {}) {
	const external = externalFonts();
	const local = localFonts();
	return {
		name: "googleFonts",
		setup(build, context) {
			build.onResolve(
				{
					filter: GOOGLE_FONT_STYLESHEET_RESOLVE_REGEXP,
				},
				(args) => {
					const name = Hash.create().update(args.path).digest().toString();

					return {
						path: `/googlefonts-${name}.css`,
						namespace: "googlefonts",
						pluginData: { url: args.path },
					};
				},
			);

			if (type === "external") {
				external.setup(build, context);
			}

			if (type === "local") {
				local.setup(build, context);
			}
		},
	};
}

/**
 * @returns {import("@frugal-node/core/plugin").Plugin}
 */
function externalFonts() {
	return {
		name: "external-fonts",
		setup(build) {
			build.onLoad(
				{
					filter: GOOGLE_FONT_STYLESHEET_LOAD_REGEXP,
					namespace: "googlefonts",
				},
				async (args) => {
					const url = args.pluginData.url;
					if (!url) {
						return;
					}

					const css = await fetchFontStylesheet(url);

					return { contents: css, loader: "css" };
				},
			);

			build.onResolve(
				{
					filter: GOOGLE_FONT_FILE_REGEXP,
					namespace: "https",
				},
				() => {
					return { external: true };
				},
			);
		},
	};
}

/**
 * @returns {import("@frugal-node/core/plugin").Plugin}
 */
function localFonts() {
	return {
		name: "local-fonts",
		setup(build, context) {
			build.onLoad(
				{
					filter: GOOGLE_FONT_STYLESHEET_LOAD_REGEXP,
					namespace: "googlefonts",
				},
				async (args) => {
					const url = args.pluginData.url;
					if (!url) {
						return;
					}

					let css = await fetchFontStylesheet(url);

					const fontUrlRegexp = /src\s*:\s*url\((.*?)\)/g;
					/** @type {string[]} */
					const externalFontUrls = [];
					/** @type {RegExpExecArray|null} */
					let matched = null;
					// biome-ignore lint/suspicious/noAssignInExpressions: legitimate for regexp.exec
					while ((matched = fontUrlRegexp.exec(css)) !== null) {
						externalFontUrls.push(matched[1]);
					}

					for (const [index, externalFontUrl] of externalFontUrls.entries()) {
						const name = Hash.create().update(externalFontUrl).digest().toString();
						const ext = path.extname(externalFontUrl);

						const fontPath = path.resolve(
							context.buildConfig.cacheDir,
							`googleFonts/${name}${ext}`,
						);

						try {
							await fs.ensureDir(path.dirname(fontPath));
							const file = await fs.createWritableStream(fontPath, {
								createNew: true,
							});
							try {
								log(`Loading font ${index} of ${externalFontUrls.length - 1}`, {
									scope: "frugal:googleFonts",
									level: "debug",
								});
								const response = await fetch(externalFontUrl);
								await response.body?.pipeTo(file);
							} catch (error) {
								throw fs.mapError(error);
							}
						} catch (error) {
							if (!(error instanceof fs.AlreadyExists)) {
								throw error;
							}
						}

						const fontDestPath = path.resolve(
							context.buildConfig.publicDir,
							`fonts/${name}${ext}`,
						);
						await fs.ensureDir(path.dirname(fontDestPath));
						try {
							await fs.copy(fontPath, fontDestPath);
						} catch (error) {
							if (!(error instanceof fs.AlreadyExists)) {
								throw error;
							}
						}

						css = css.replace(externalFontUrl, `/fonts/${name}${ext}`);
					}

					return { contents: css, loader: "css" };
				},
			);

			build.onResolve({ filter: LOCAL_FONT_FILE_REGEXP }, () => {
				return { external: true };
			});
		},
	};
}

/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchFontStylesheet(url) {
	const response = await fetch(url, {
		headers: {
			"user-agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
		},
	});

	return await response.text();
}
