/** @import * as self from "./PageAssets.js" */

/** @type {self.PageAssetsCreator} */
export const PageAssets = {
	create,
};

/** @type {self.PageAssetsCreator['create']} */
function create(assets, entrypoint) {
	return {
		get(type) {
			return assets.filter(
				/** @returns {asset is self.AssetTypes[typeof type]} */ (asset) => {
					if (asset.scope === "global") {
						return asset.type === type;
					}

					if (asset.scope === "page") {
						return asset.type === type && asset.entrypoint === entrypoint;
					}

					return false;
				},
			);
		},
	};
}
