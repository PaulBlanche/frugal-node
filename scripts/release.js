import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as url from "node:url";
import * as semver from "semver";
import * as utils from "./_utils.js";

// bump package
// commit bump
// tag and push tag => [pkgName]@[version]

const pkgArg = process.argv[2];
const pkg = utils.isPackage(pkgArg) ? pkgArg : undefined;
const releaseTypeArg = process.argv[3];
const releaseType = (() => {
	switch (releaseTypeArg) {
		case undefined:
		case "patch": {
			return "patch";
		}
		case "minor": {
			return "minor";
		}
		case "major": {
			return "major";
		}
		case "premajor": {
			return "premajor";
		}
		case "preminor": {
			return "preminor";
		}
		case "prepatch": {
			return "prepatch";
		}
		default: {
			return undefined;
		}
	}
})();

if (pkg === undefined) {
	throw Error(`Unknown package "${pkgArg}"`);
}
if (releaseType === undefined) {
	throw Error(`Unknown release type "${releaseType}"`);
}

const pkgInfoBefore = await utils.readPkgInfo(pkg);
child_process.execSync(`npm version ${releaseType}`, {
	cwd: utils.pkgDir(pkg),
});
const pkgInfoAfter = await utils.readPkgInfo(pkg);
console.log(`Bump "${pkgInfoAfter.name}": "${pkgInfoBefore.version}" -> "${pkgInfoAfter.version}"`);
