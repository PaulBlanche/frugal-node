/** @type {import('./Assets.ts').Maker} */
export const Assets = {
	create,
};

/** @type {import('./Assets.ts').Maker['create']} */
export function create(assets, entrypoint) {
	return {
		get(type) {
			return assets.filter(
				/** @returns {asset is import('./Assets.ts').AssetTypes[typeof type]} */ (
					asset,
				) => {
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
