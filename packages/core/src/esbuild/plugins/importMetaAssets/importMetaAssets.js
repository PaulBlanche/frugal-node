/** @import * as self from "./importMetaAssets.js" */
/** @import { MetaAsset } from "./UrlMetaTransformer.js" */

import * as path from "node:path";
import { ModuleWalker } from "../../../utils/ModuleWalker.js";
import * as fs from "../../../utils/fs.js";
import { log } from "../../../utils/log.js";
import { UrlMetaTransformer } from "./UrlMetaTransformer.js";
import { collectAndReplaceMetaAssets } from "./collectAndReplaceMetaAssets.js";

const FILTER = /^.*\.[tj]sx?$/;

/** @type {self.importMetaAssets} */
export function importMetaAssets(context) {
	return {
		name: "frugal-internal-plugin:importMetaAssets",
		setup(build) {
			/** @type {MetaAsset[]} */
			const collectedAssets = [];

			build.onLoad({ filter: FILTER, namespace: "file" }, async (args) => {
				const walker = await ModuleWalker.create(args.path);
				const transformer = UrlMetaTransformer.create(walker.code);

				const assets = await collectAndReplaceMetaAssets(args.path, walker, transformer);

				for (const asset of assets) {
					log(`Collecting meta asset "${resolveAsset(asset)}"`, {
						level: "debug",
						scope: "importMetaAssets",
					});
					collectedAssets.push(asset);
				}

				return {
					contents: transformer.contents,
					resolveDir: path.dirname(args.path),
					loader:
						walker.options.syntax === "typescript"
							? walker.options.tsx
								? "tsx"
								: "ts"
							: walker.options.jsx
								? "jsx"
								: "js",
					watchFiles: assets.map((asset) => resolveAsset(asset)),
				};
			});

			build.onEnd(async () => {
				for (const asset of collectedAssets) {
					const from = resolveAsset(asset);
					const to = path.resolve(context.buildConfig.buildDir, asset.out);

					await fs.copy(from, to, {
						overwrite: true,
						recursive: false,
					});
				}
			});
		},
	};
}

/**
 * @param {MetaAsset} asset
 */
function resolveAsset(asset) {
	return path.resolve(path.dirname(asset.importer), asset.path);
}
