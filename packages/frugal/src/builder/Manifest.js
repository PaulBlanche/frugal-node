import * as path from "node:path";
import { FrugalConfig } from "../Config.js";
import * as fs from "../utils/fs.js";
import * as hash from "../utils/hash.js";
import { log } from "../utils/log.js";
import * as _type from "./_type/Manifest.js";

/** @typedef {_type.WritableManifest} WritableManifest */
/** @typedef {_type.Manifest} Manifest */

/**
 * @param {FrugalConfig} config
 * @param {_type.WritableManifest} manifest
 */
export async function writeManifest(config, manifest) {
	const oldManifestName = await getManifestName(config);
	if (oldManifestName !== undefined) {
		await fs.remove(path.resolve(config.outDir, oldManifestName));
	}

	const content = manifestContent(config, manifest);
	const manifestHash = hash.create().update(content).digest();

	const manifestName = `manifest-${manifestHash}.mjs`;
	await setManifestName(config, manifestName);

	log(`Writing manifest ${manifestName}`, { scope: "Manifest", level: "debug" });

	const filePath = path.resolve(config.outDir, manifestName);
	await fs.writeTextFile(filePath, content);
}

/**
 * @param {FrugalConfig} config
 * @returns {Promise<_type.Manifest>}
 */
export async function loadManifest(config) {
	const name = await getManifestName(config);
	if (name === undefined) {
		throw Error("No manifest found");
	}

	log(`Loading manifest ${name}`, { scope: "Manifest", level: "debug" });

	const manifestPath = path.resolve(config.outDir, name);

	try {
		return await import(manifestPath);
	} catch (/** @type {any} */ error) {
		throw new ManifestExecutionError(
			`Error while loading manifest "${manifestPath}": ${error.message}`,
			{ cause: error },
		);
	}
}

/**
 * @param {FrugalConfig} config
 * @returns {Promise<string | undefined>}
 */
async function getManifestName(config) {
	const manifestNamePath = path.resolve(config.outDir, "manifest");
	try {
		return await fs.readTextFile(manifestNamePath);
	} catch (/** @type {any} */ error) {
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}
}

/**
 * @param {FrugalConfig} config
 * @param {string} name
 */
async function setManifestName(config, name) {
	const manifestNamePath = path.resolve(config.outDir, "manifest");
	await fs.writeTextFile(manifestNamePath, name);
}

/**
 * @param {{ rootDir:string, outDir:string }} config
 * @param {_type.WritableManifest} manifest
 */
export function manifestContent(config, manifest) {
	return `${manifest.pages
		.map((page) => {
			const pagePath = path.resolve(config.rootDir, page.outputPath);
			const importIdentifier = `${path.relative(config.outDir, pagePath)}`;
			return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
		})
		.join("\n")}
    
export const id = ${JSON.stringify(manifest.id)};
export const config = ${JSON.stringify(manifest.config)};
export const assets = ${JSON.stringify(manifest.assets, undefined, 2)};
export const pages = [${manifest.pages
		.map(
			(page) => `{
    "moduleHash": "${page.moduleHash}",
    "entrypoint":"${page.entrypoint}",
    "outputPath": "${page.outputPath}",
    "descriptor": descriptor_${page.moduleHash},
}`,
		)
		.join(",\n")}];
`;
}

class ManifestExecutionError extends Error {}
