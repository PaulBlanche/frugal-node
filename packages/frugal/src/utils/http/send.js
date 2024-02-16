import * as path from "node:path";
import mime from "mime";
import * as fs from "../fs.js";
import * as hash from "../hash.js";
import * as readableStream from "../readableStream.js";
import * as _type from "./_type/send.js";

/**
 * @param {Request} request
 * @param {_type.SendOptions} options
 * @returns {Promise<Response>}
 */
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
		return new Response("", {
			status: 404,
		});
	}

	const resolvedFilePath = path.resolve(options.rootDir, filePath);

	try {
		const stats = await fs.stat(resolvedFilePath);

		if (stats.isDirectory()) {
			return new Response("", {
				status: 404,
			});
		}

		const headers = new Headers();
		headers.set("Content-Length", stats.size.toString());
		if (stats.mtime) {
			headers.set("Last-Modified", stats.mtime.toUTCString());
		}
		headers.set("Etag", computeWeakEtag(stats));
		const contentType = mime.getType(path.extname(resolvedFilePath));
		if (contentType) {
			headers.set("Content-Type", contentType);
		}

		const body = await fs.createReadableStream(resolvedFilePath);

		return new Response(readableStream.toReadableStream(body), { headers });
	} catch (/** @type {any} */ error) {
		if (error instanceof fs.NotFound) {
			return new Response(undefined, { status: 404 });
		}
		return new Response(error.message, { status: 500 });
	}
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
	return `W/${hash
		.create()
		.update(fileInfo.mtime?.toJSON() ?? "empty")
		.digest()}`;
}
