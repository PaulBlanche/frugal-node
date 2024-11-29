/** @import * as self from "./ServerCache.js" */

/** @type {self.ServerCacheCreator} */
export const ServerCache = {
	create,
};

/** @type {self.ServerCacheCreator['create']} */
function create(storage) {
	return {
		add(url, response) {
			return Promise.resolve(storage.set(url, _metadata(url, response), response.body));
		},

		async get(path) {
			const entry = await storage.get(path);
			if (entry === undefined) {
				return undefined;
			}

			return _toResponse(entry);
		},
	};
}

/**
 * @param {string} url
 * @param {Response} response
 * @returns {self.Metadata}
 */
function _metadata(url, response) {
	return {
		url,
		hash: response.headers.get("x-frugal-build-hash"),
		headers: Array.from(response.headers.entries()),
		status: response.status,
		statusText: response.statusText,
	};
}

/**
 *
 * @param {self.Entry} entry
 * @returns {Response}
 */
function _toResponse({ body, metadata }) {
	return new Response(body, {
		headers: new Headers(metadata.headers),
		status: metadata.status,
		statusText: metadata.statusText,
	});
}
