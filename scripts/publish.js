import * as fs from "node:fs";
import * as url from "node:url";

const PACKAGES = [
	"frugal",
	"exporter-static",
	"exporter-vercel",
	"plugin-css",
	"plugin-script",
	"preact",
	"session",
];

for (const pkgPath of PACKAGES) {
	await publishPkg(pkgPath);
}

/**
 * @param {string} pkgPath
 */
async function publishPkg(pkgPath) {
	const pkg = await pkgInfo(pkgPath);
	console.log(`checking ${pkg.name}`);
	const latestVersion = await fetchLatestVersion(pkg.name);
	if (latestVersion !== pkg.version) {
		console.log(">run npm publish", pkg);
	}
}

/**
 * @param {string} pkgPath
 * @returns {Promise<{ name:string, version:string, private:boolean }>}
 */
async function pkgInfo(pkgPath) {
	const pkgData = await fs.promises.readFile(
		url.fileURLToPath(import.meta.resolve(`../packages/${pkgPath}/package.json`)),
		{
			encoding: "utf-8",
		},
	);
	const pkg = JSON.parse(pkgData);
	return { name: pkg.name, version: pkg.version, private: pkg.private ?? false };
}

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
async function fetchLatestVersion(name) {
	const response = await fetch(`https://registry.npmjs.org/${name}`);
	const metadata = await response.json();

	return metadata["dist-tags"].latest;
}
