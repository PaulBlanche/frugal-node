import * as assets from "../../page/Assets.js";
import { PageDescriptor } from "../../page/PageDescriptor.js";

export type WritableManifest = {
	config: string;
	id: string;
	assets: assets.Assets;
	pages: {
		moduleHash: string;
		entrypoint: string;
		outputPath: string;
	}[];
};

export type Manifest = {
	config: string;
	id: string;
	assets: assets.Assets;
	pages: {
		moduleHash: string;
		entrypoint: string;
		descriptor: PageDescriptor;
	}[];
};
