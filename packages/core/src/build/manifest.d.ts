import type { Asset } from "../page/PageAssets.js";
import type { PageDescriptor } from "../page/PageDescriptor.js";

export type WritableManifest = {
	hash: string;
	assets: Asset[];
	runtimeConfig: string;
	pages: {
		moduleHash: string;
		entrypoint: string;
		outputPath: string;
	}[];
};

export type Manifest = {
	hash: string;
	assets: Asset[];
	runtimeConfig: string;
	pages: {
		moduleHash: string;
		entrypoint: string;
		descriptor: PageDescriptor;
	}[];
};

type Config = {
	rootDir: string;
	outDir: string;
};

export function writeManifest(config: Config, manifest: WritableManifest): Promise<void>;

export function loadManifest(config: Config): Promise<Manifest>;

export function getManifestPath(config: Config): Promise<string>;

export function manifestContent(
	config: { rootDir: string; outDir: string },
	manifest: WritableManifest,
): string;

export class ManifestExecutionError extends Error {}
