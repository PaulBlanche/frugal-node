/** @import * as self from "./error.js" */

import * as path from "node:path";
import * as url from "node:url";

const STACK_LINE_REGEX = /^\s*at(.*)\((.*)\)$/;
const LOCATION_REGEX = /^(.*):(\d+):(\d+)$/;

/** @type {self.normalize} */
export function normalize(error, rootDir) {
	/** @type {self.NormalizedErrror} */
	const normalized = {
		name: "Error",
		message: undefined,
		stack: undefined,
		cause: undefined,
	};

	if (error instanceof Object) {
		if ("name" in error) {
			normalized.name = String(error.name);
		}
		if ("message" in error) {
			normalized.message = String(error.message);
		}
		if ("stack" in error) {
			normalized.stack = String(error.stack)
				.split("\n")
				.reduce(
					(stack, line) => {
						const lineMatch = line.match(STACK_LINE_REGEX);
						if (lineMatch === null) {
							return stack;
						}
						const name = lineMatch[1]
							.trim()
							.replace(/</g, "&lt;")
							.replace(/>/g, "&gt;");
						const location = lineMatch[2];

						if (location === "native") {
							stack.push({
								name: name.length === 0 ? undefined : name,
								location: { type: "native" },
							});
							return stack;
						}

						const locationMatch = location.match(LOCATION_REGEX);
						if (locationMatch === null) {
							return stack;
						}
						const locationFile = locationMatch[1];
						const locationLine = locationMatch[2];
						const locationCol = locationMatch[3];

						if (
							locationFile.includes("node_modules") ||
							locationFile.startsWith("node:")
						) {
							return stack;
						}

						stack.push({
							name: name.length === 0 ? undefined : name,
							location: {
								type: "file",
								file: _formatLocationFile(locationFile, rootDir),
								line: Number(locationLine),
								col: Number(locationCol),
							},
						});
						return stack;
					},
					/** @type {self.NormalizedErrrorStack}*/ ([]),
				);
		}
		if ("cause" in error) {
			normalized.cause = normalize(error.cause, rootDir);
		}
	}

	return normalized;
}

/**
 *
 * @param {string} locationFile
 * @param {string=} rootDir
 */
function _formatLocationFile(locationFile, rootDir) {
	let locationFilePath = locationFile;

	try {
		const locationFileURL = new URL(locationFile);
		if (locationFileURL.protocol !== "file:") {
			return locationFile;
		}

		locationFilePath = url.fileURLToPath(locationFileURL);
	} catch {
		/** ignore error */
	}

	if (locationFilePath.startsWith("/") && rootDir) {
		return path.relative(rootDir, locationFilePath);
	}

	return locationFilePath;
}
