// biome-ignore lint/suspicious/noEmptyInterface: empty for extension in third-party modules
export interface AssetTypes {}

export type GlobalAsset<TYPE = string, EXTRA = unknown> = {
	type: TYPE;
	scope: "global";
} & EXTRA;

export type PageAsset<TYPE = string, EXTRA = unknown> = {
	type: TYPE;
	scope: "page";
	entrypoint: string;
} & EXTRA;

export interface PageAssets {
	get<TYPE extends keyof AssetTypes>(type: TYPE): AssetTypes[TYPE][];
}

export type Asset = GlobalAsset | PageAsset;

interface PageAssetsCreator {
	create(assets: Asset[], entrypoint: string): PageAssets;
}

export let PageAssets: PageAssetsCreator;
