/** @import * as self from "./manifest.js" */

import * as path from "node:path";
import { Hash } from "../utils/Hash.js";
import * as fs from "../utils/fs.js";
import { log } from "../utils/log.js";

/** @type {self.writeManifests} */
export async function writeManifests(config, manifest) {
	const oldManifestNames = await getManifestNames(config);
	if (oldManifestNames !== undefined) {
		await Promise.all([
			fs.remove(path.resolve(config.outDir, oldManifestNames.base)),
			fs.remove(path.resolve(config.outDir, oldManifestNames.dynamic)),
			fs.remove(path.resolve(config.outDir, oldManifestNames.static)),
		]);
	}

	const baseContent = baseManifestContent(
		{ rootDir: config.rootDir, outDir: config.outDir },
		manifest,
	);
	const baseManifestHash = Hash.create().update(baseContent).digest();
	const baseManifestName = `base.manifest-${baseManifestHash}.mjs`;

	const staticContent = staticManifestContent(
		{ rootDir: config.rootDir, outDir: config.outDir, baseManifestName },
		manifest,
	);
	const staticManifestHash = Hash.create().update(staticContent).digest();
	const staticManifestName = `static.manifest-${staticManifestHash}.mjs`;

	const dynamicContent = dynamicManifestContent(
		{ rootDir: config.rootDir, outDir: config.outDir, baseManifestName },
		manifest,
	);
	const dynamicManifestHash = Hash.create().update(dynamicContent).digest();
	const dynamicManifestName = `dynamic.manifest-${dynamicManifestHash}.mjs`;

	await setManifestNames(config, {
		base: baseManifestName,
		dynamic: dynamicManifestName,
		static: staticManifestName,
	});

	log(
		`Writing manifests ${baseManifestHash}, ${dynamicManifestName} and  ${staticManifestName}`,
		{
			scope: "Manifest",
			level: "debug",
		},
	);

	await Promise.all([
		fs.writeTextFile(path.resolve(config.outDir, baseManifestName), baseContent),
		fs.writeTextFile(path.resolve(config.outDir, dynamicManifestName), dynamicContent),
		fs.writeTextFile(path.resolve(config.outDir, staticManifestName), staticContent),
	]);
}

/** @type {self.loadStaticManifest} */
export async function loadStaticManifest(config) {
	const manifestPath = await getStaticManifestPath(config);

	try {
		log(`Loading static manifest "${manifestPath}"`, { scope: "Manifest", level: "debug" });
		return await import(manifestPath);
	} catch (/** @type {any} */ error) {
		throw new ManifestError(
			`Error while loading manifest "${manifestPath}": ${error.message}`,
			{ cause: error },
		);
	}
}

/** @type {self.loadDynamicManifest} */
export async function loadDynamicManifest(config) {
	const manifestPath = await getDynamicManifestPath(config);

	try {
		log(`Loading dynamic manifest "${manifestPath}"`, { scope: "Manifest", level: "debug" });
		return await import(manifestPath);
	} catch (/** @type {any} */ error) {
		throw new ManifestError(
			`Error while loading manifest "${manifestPath}": ${error.message}`,
			{ cause: error },
		);
	}
}

/** @type {self.getStaticManifestPath} */
export async function getStaticManifestPath(config) {
	const name = await getManifestNames(config);
	if (name === undefined) {
		throw new Error("No manifest found");
	}

	return path.resolve(config.outDir, name.static);
}

/** @type {self.getDynamicManifestPath} */
export async function getDynamicManifestPath(config) {
	const name = await getManifestNames(config);
	if (name === undefined) {
		throw new Error("No manifest found");
	}

	return path.resolve(config.outDir, name.dynamic);
}

/**
 * @param {self.Config} config
 * @returns {Promise<{ base:string, dynamic: string, static: string } | undefined>}
 */
async function getManifestNames(config) {
	const manifestNamePath = path.resolve(config.outDir, "manifest");

	try {
		return JSON.parse(await fs.readTextFile(manifestNamePath));
	} catch (/** @type {any} */ error) {
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}

	return undefined;
}

/**
 * @param {self.Config} config
 * @param {{ base:string, dynamic: string, static: string }} names
 */
async function setManifestNames(config, names) {
	const manifestNamePath = path.resolve(config.outDir, "manifest");
	await fs.writeTextFile(manifestNamePath, JSON.stringify(names));
}

/**
 * @param {{ rootDir: string; outDir: string }} config
 * @param {self.WritableManifest} manifest
 */
export function baseManifestContent(config, manifest) {
	return `export const hash = "${manifest.hash}";
export const runtimeConfig = "./${path.relative(config.outDir, path.resolve(config.rootDir, manifest.runtimeConfig))}";
export const assets = ${JSON.stringify(manifest.assets, undefined, 2)};
`;
}

/**
 * @param {{ rootDir: string; outDir: string, baseManifestName: string }} config
 * @param {self.WritableManifest} manifest
 */
export function dynamicManifestContent(config, manifest) {
	const dynamicPages = manifest.pages.filter((page) => page.type === "dynamic");

	return `${
		dynamicPages.length > 0
			? `${dynamicPages
					.map((page) => {
						const pagePath = path.resolve(config.rootDir, page.outputPath);
						const importIdentifier = `${path.relative(config.outDir, pagePath)}`;
						return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
					})
					.join("\n")}\n\n`
			: ""
	}export * from "./${config.baseManifestName}"

export const pages = [${dynamicPages
		.map(
			(page) => `{
    "moduleHash": "${page.moduleHash}",
    "entrypoint":"${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
	}`,
		)
		.join(",\n")}];
`;
}

/**
 * @param {{ rootDir: string; outDir: string, baseManifestName: string }} config
 * @param {self.WritableManifest} manifest
 */
export function staticManifestContent(config, manifest) {
	const staticPages = manifest.pages.filter((page) => page.type === "static");

	return `${
		staticPages.length > 0
			? `${staticPages
					.map((page) => {
						const pagePath = path.resolve(config.rootDir, page.outputPath);
						const importIdentifier = `${path.relative(config.outDir, pagePath)}`;
						return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
					})
					.join("\n")}\n\n`
			: ""
	}export * from "./${config.baseManifestName}"

export const pages = [${staticPages
		.map(
			(
				page,
			) => `{${page.params === undefined ? "" : `\n    "params": [\n${page.params.map((params) => `        ${JSON.stringify(params)}`).join(",\n")},\n    ],`} 
    "moduleHash": "${page.moduleHash}",
    "entrypoint":"${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
	}`,
		)
		.join(",\n")}];
`;
}

export class ManifestError extends Error {}
