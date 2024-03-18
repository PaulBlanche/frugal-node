import type { Config, FrugalConfig } from "../Config.js";
import type { CollectedAssets } from "../page/Assets.ts";
import type { PageDescriptor } from "../page/PageDescriptor.ts";

export type WritableManifest = {
	config: string;
	hash: string;
	assets: CollectedAssets;
	pages: {
		moduleHash: string;
		entrypoint: string;
		outputPath: string;
	}[];
};

export type Manifest = {
	config: Config;
	hash: string;
	assets: CollectedAssets;
	pages: {
		moduleHash: string;
		entrypoint: string;
		outputPath: string;
		descriptor: PageDescriptor;
	}[];
};

export function writeManifest(config: FrugalConfig, manifest: WritableManifest): Promise<void>;

export function loadManifest(config: FrugalConfig): Promise<Manifest>;

export function getManifestPath(config: FrugalConfig): Promise<string>;

export function manifestContent(
	config: { rootDir: string; outDir: string },
	manifest: WritableManifest,
): string;

export class ManifestExecutionError extends Error {}
