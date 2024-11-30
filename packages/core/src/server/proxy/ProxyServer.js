/** @import * as self from "./ProxyServer.js" */
/** @import { Page } from "../../page/Page.js" */
/** @import { Context } from "./context.js" */
/** @import { CompressMethodsObject } from "../../RuntimeConfig.js" */

import Negotiator from "negotiator";
import { parse } from "../../page/parse.js";
import { Server } from "../Server.js";
import { composeMiddleware } from "../middleware.js";
import { etag } from "./middleware/etag.js";
import { router } from "./middleware/router.js";
import { staticFile } from "./middleware/staticFile.js";
import { trailingSlashRedirect } from "./middleware/trailingSlashRedirect.js";

/** @type {self.ProxyServerCreator} */
export const ProxyServer = {
	create,
};

/** @type {self.ProxyServerCreator['create']} */
function create({ config, watch, internal, manifest, publicDir, cacheOverride }) {
	/** @type {{type:'static'|"dynamic", page:Page, index:number }[]} */
	const routes = [];

	const staticPages = manifest.static.pages;
	for (const [index, { moduleHash, entrypoint, descriptor }] of staticPages.entries()) {
		routes.push({
			type: "static",
			index,
			page: parse({ moduleHash, entrypoint, descriptor }),
		});
	}

	const dynamicPages = manifest.dynamic.pages;
	for (const [index, { moduleHash, entrypoint, descriptor }] of dynamicPages.entries()) {
		routes.push({
			type: "dynamic",
			index,
			page: parse({ moduleHash, entrypoint, descriptor }),
		});
	}

	const availableEncodings = _getAvailableEncoding(config.compress.method);

	const serverMiddleware = composeMiddleware([
		staticFile({ rootDir: publicDir }),
		trailingSlashRedirect,
		etag,
		router(routes),
	]);

	return Server.create(
		async (request, serverContext) => {
			const url = new URL(request.url);

			const negotiator = new Negotiator({
				headers: Object.fromEntries(request.headers.entries()),
			});
			const encodings = negotiator.encodings(availableEncodings);

			/** @type {Context} */
			const context = {
				...serverContext,
				url,
				watch,
				request,
				cache: cacheOverride ?? config.serverCache,
				state: {},
				cryptoKey: await config.cryptoKey,
				internal,
				compress: {
					encodings,
					threshold: config.compress.threshold,
				},
			};

			console.log("coucou");

			const response = await serverMiddleware(context, _mostInternalMiddleware);

			return response;
		},
		{ logScope: "ProxyServer" },
	);
}

function _mostInternalMiddleware() {
	return Promise.resolve(
		new Response(null, {
			status: 404,
		}),
	);
}

/**
 * @param {CompressMethodsObject} compress
 * @returns {string[]}
 */
function _getAvailableEncoding(compress) {
	return [
		compress.brotli !== false && "br",
		compress.gzip !== false && "gzip",
		compress.deflate !== false && "deflate",
		"identity",
	].filter(/** @return {encoding is string}*/ (encoding) => typeof encoding === "string");
}
