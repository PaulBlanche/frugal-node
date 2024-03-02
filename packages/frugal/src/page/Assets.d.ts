export type CollectedAssets = AssetTypes[keyof AssetTypes][];

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface AssetTypes {}

export type BaseGlobalAsset<TYPE> = {
	type: TYPE;
	scope: "global";
};

export type BasePageAsset<TYPE> = {
	type: TYPE;
	scope: "page";
	entrypoint: string;
};

export interface Assets {
	get<TYPE extends keyof AssetTypes>(type: TYPE): AssetTypes[TYPE][];
}

interface AssetsMaker {
	create(assets: CollectedAssets, entrypoint: string): Assets;
}

export const Assets: AssetsMaker;
