export type Assets = AssetTypes[keyof AssetTypes][];

// biome-ignore lint/suspicious/noEmptyInterface: interface is empty because it will be "merge-extended" in plugin files
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
