import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

const PACKAGES = /** @type {const} */ ([
	"frugal",
	"exporter-static",
	"exporter-vercel",
	"plugin-css",
	"plugin-script",
	"preact",
	"session",
]);

/**
 *
 * @param {string} pkgPath
 * @returns {pkgPath is (typeof PACKAGES)[number]}
 */
export function isPackage(pkgPath) {
	return /** @type {readonly string[]}*/ (PACKAGES).includes(pkgPath);
}

/**
 * @param {(typeof PACKAGES)[number]} pkg
 * @returns {Promise<{ name:string, version:string, private:boolean }>}
 */
export async function readPkgInfo(pkg) {
	const pkgData = await fs.promises.readFile(path.resolve(pkgDir(pkg), "package.json"), {
		encoding: "utf-8",
	});
	const pkgInfo = JSON.parse(pkgData);
	return { name: pkgInfo.name, version: pkgInfo.version, private: pkgInfo.private ?? false };
}

/**
 * @param {(typeof PACKAGES)[number]} pkg
 * @returns {string}
 */
export function pkgDir(pkg) {
	return url.fileURLToPath(import.meta.resolve(`../packages/${pkg}`));
}
