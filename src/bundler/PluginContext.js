import * as esbuild from "esbuild";
import { FrugalConfig } from "../Config.js";
import * as manifest from "../builder/Manifest.js";
import * as assets from "../page/Assets.js";
import * as assetCollector from "./AssetCollector.js";

export class PluginContext {
	/** @type {assets.Assets} */
	#assets;
	/** @type {FrugalConfig} */
	#config;
	/** @type {boolean} */
	#watch;
	/** @type {manifest.WritableManifest} */
	#manifest;

	/** @param {FrugalConfig} config */
	constructor(config, watch = false) {
		this.#config = config;
		this.#assets = [];
		this.#watch = watch;
		this.#manifest = {
			pages: [],
			id: "",
			config: "",
			assets: [],
		};
	}

	/**
	 * @template {keyof assets.AssetTypes} TYPE
	 * @param {TYPE} type
	 * @param {assets.AssetTypes[TYPE]} asset
	 */
	output(type, asset) {
		this.#assets.push(asset);
	}

	/**
	 * @param {RegExp} filter
	 * @param {esbuild.Metafile} metafile
	 * @returns {assetCollector.Asset[]}
	 */
	collect(filter, metafile) {
		return new assetCollector.AssetCollector(this.#config, metafile).collect(filter);
	}

	/** @param {manifest.WritableManifest} manifest */
	updateManifest(manifest) {
		this.#manifest = manifest;
	}

	get manifest() {
		return this.#manifest;
	}

	get assets() {
		return this.#assets;
	}

	get config() {
		return this.#config;
	}

	get watch() {
		return this.#watch;
	}

	reset() {
		this.#assets = /** @type {any} */ ({ global: {}, page: {} });
	}
}
