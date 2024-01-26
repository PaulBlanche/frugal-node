import { PageAssets } from "../../page/Assets.js";

export type BuildConfig = {
	resolve: (path: string) => string;
	configHash: string;
	assets: PageAssets;
};
