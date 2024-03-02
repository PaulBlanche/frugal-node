import { AssetCollector } from "./AssetCollector.js";

/** @type {import('./PluginContext.ts').PluginContextMaker} */
export const PluginContext = {
	create,
};

/** @type {import('./PluginContext.ts').PluginContextMaker['create']} */
function create(config, watch = false) {
	const state = {
		/** @type {import("../page/Assets.js").CollectedAssets} */
		assets: [],
		hash: "",
		config: "",
		/** @type {import("../builder/manifest.js").WritableManifest['pages']} */
		pages: [],
	};

	return {
		get manifest() {
			return {
				assets: state.assets,
				hash: state.hash,
				config: state.config,
				pages: state.pages,
			};
		},

		get config() {
			return config;
		},

		get watch() {
			return watch;
		},

		output(_, asset) {
			state.assets.push(asset);
		},

		collect(filter, metafile) {
			return AssetCollector.create(config.global, metafile).collect(filter);
		},

		updateManifest({ hash, config, pages }) {
			state.hash = hash;
			state.config = config;
			state.pages = pages;
		},

		reset() {
			state.hash = "";
			state.config = "";
			state.pages = [];
			state.assets = [];
		},
	};
}
