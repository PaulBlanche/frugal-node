import * as _type from "./_type/Assets.js";

/** @typedef {_type.Assets} Assets */
/** @typedef {_type.AssetTypes} AssetTypes */

export class PageAssets {
	/** @type {_type.Assets} */
	#assets;
	/** @type {string} */
	#entrypoint;

	/**
	 * @param {_type.Assets} assets
	 * @param {string} entrypoint
	 */
	constructor(assets, entrypoint) {
		this.#assets = assets;
		this.#entrypoint = entrypoint;
	}

	/**
	 * @template {keyof _type.AssetTypes} TYPE
	 * @param {TYPE} type
	 * @returns {_type.AssetTypes[TYPE][]}
	 */
	get(type) {
		return this.#assets.filter((asset) => {
			if (asset.scope === "global") {
				return asset.type === type;
			}
			if (asset.scope === "page") {
				return asset.type === type && asset.entrypoint === this.#entrypoint;
			}
			return false;
		});
	}
}
