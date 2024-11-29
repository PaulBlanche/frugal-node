/** @import * as self from "./send.js" */

import * as path from "node:path";
import mime from "mime";
import { Hash } from "./Hash.js";
import * as fs from "./fs.js";

/** @type {self.send} */
export async function send(request, options) {
	const url = new URL(request.url);
	const decodedPathname = decodeURIComponent(url.pathname);
	const normalizedPath = path.normalize(decodedPathname);

	if (normalizedPath !== decodedPathname) {
		url.pathname = normalizedPath;
		return Response.redirect(url, 301);
	}

	const filePath = `.${decodedPathname}`;

	if (!isValidPath(filePath)) {
		return undefined;
	}

	const resolvedFilePath = path.resolve(options.rootDir, filePath);

	const paths = [];
	for (const ext of options.compressionExt) {
		paths.push(`${resolvedFilePath}.${ext}`);
	}
	paths.push(resolvedFilePath);

	for (const filePath of paths) {
		try {
			const stats = await fs.stat(filePath);

			if (stats.isDirectory()) {
				return undefined;
			}

			const headers = new Headers();

			headers.set("Date", new Date().toUTCString());
			headers.set("Content-Length", stats.size.toString());
			if (stats.mtime) {
				headers.set("Last-Modified", stats.mtime.toUTCString());
			}
			headers.set("Etag", computeWeakEtag(stats));
			const contentType = mime.getType(path.extname(resolvedFilePath));
			if (contentType) {
				headers.set("Content-Type", contentType);
			}
			if (filePath.endsWith("br")) {
				headers.set("Content-Encoding", "br");
			}
			if (filePath.endsWith("gzip") || filePath.endsWith("gz")) {
				headers.set("Content-Encoding", "gzip");
			}

			const body = await fs.createReadableStream(filePath);

			return new Response(/** @type {ReadableStream<any>} */ (body), {
				headers,
			});
		} catch (/** @type {any} */ error) {
			if (error instanceof fs.NotFound) {
				continue;
			}
			return new Response(error.message, { status: 500 });
		}
	}

	return undefined;
}

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isValidPath(filePath) {
	if (typeof filePath !== "string") {
		return false;
	}

	// malicious NULL in path
	if (filePath.indexOf("\0") !== -1) {
		return false;
	}

	// malicious absolute path
	if (path.isAbsolute(filePath)) {
		return false;
	}

	// malicious UP (..) in path
	if (UP_PATH_REGEXP.test(path.normalize(`.${path.sep}${filePath}`))) {
		return false;
	}

	return true;
}

/**
 * @param {fs.FileInfo} fileInfo
 * @returns {string}
 */
function computeWeakEtag(fileInfo) {
	return `W/${Hash.create()
		.update(fileInfo.mtime?.toJSON() ?? "empty")
		.digest()}`;
}
