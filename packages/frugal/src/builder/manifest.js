import * as path from "node:path";
import { Hash } from "../utils/Hash.js";
import * as fs from "../utils/fs.js";
import { log } from "../utils/log.js";

/** @type {import('./manifest.ts').writeManifest} */
export async function writeManifest(config, manifest) {
	const oldManifestName = await getManifestName(config);
	if (oldManifestName !== undefined) {
		await fs.remove(path.resolve(config.outDir, oldManifestName));
	}

	const content = manifestContent({ rootDir: config.rootDir, outDir: config.outDir }, manifest);
	const manifestHash = Hash.create().update(content).digest();

	const manifestName = `manifest-${manifestHash}.mjs`;
	await setManifestName(config, manifestName);

	log(`Writing manifest ${manifestName}`, { scope: "Manifest", level: "debug" });

	const filePath = path.resolve(config.outDir, manifestName);
	await fs.writeTextFile(filePath, content);
}

/** @type {import('./manifest.ts').loadManifest} */
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

/** @type {import('./manifest.ts').getManifestPath} */
export async function getManifestPath(config) {
	const name = await getManifestName(config);
	if (name === undefined) {
		throw Error("No manifest found");
	}

	return path.resolve(config.outDir, name);
}

/**
 * @param {import("../Config.js").FrugalConfig} config
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
 * @param {import("../Config.js").FrugalConfig} config
 * @param {string} name
 */
async function setManifestName(config, name) {
	const manifestNamePath = path.resolve(config.outDir, "manifest");
	await fs.writeTextFile(manifestNamePath, name);
}

/** @type {import('./manifest.ts').manifestContent} */
export function manifestContent(config, manifest) {
	return `${manifest.pages
		.map((page) => {
			const pagePath = path.resolve(config.rootDir, page.outputPath);
			const importIdentifier = `${path.relative(config.outDir, pagePath)}`;
			return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
		})
		.join("\n")}
export { default as config } from "./${path.relative(
		config.outDir,
		path.resolve(config.rootDir, manifest.config),
	)}";

export const hash = ${JSON.stringify(manifest.hash)};
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

export class ManifestExecutionError extends Error {}
