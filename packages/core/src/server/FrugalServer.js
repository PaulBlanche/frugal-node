/** @import * as self from "./FrugalServer.js" */
/** @import { Route } from "./middleware/router.js" */
/** @import { CompressMethodsObject } from "../RuntimeConfig.js" */
/** @import { Context } from "./context.ts" */

import Negotiator from "negotiator";
import { PageAssets } from "../page/PageAssets.js";
import { Producer } from "../page/Producer.js";
import { parse } from "../page/parse.js";
import { Server } from "./Server.js";
import { composeMiddleware } from "./middleware.js";
import { buildJitStaticPage } from "./middleware/buildJitStaticPage.js";
import { compress } from "./middleware/compress.js";
import { errorPage } from "./middleware/errorPage.js";
import { etag } from "./middleware/etag.js";
import { forceGenerateStaticPage } from "./middleware/forceGenerateStaticPage.js";
import { generateDynamicPage } from "./middleware/generateDynamicPage.js";
import { router } from "./middleware/router.js";
import { serveFromCacheStaticPage } from "./middleware/serveFromCacheStaticPage.js";
import { staticFile } from "./middleware/staticFile.js";
import { strictPathCheck } from "./middleware/strictPathCheck.js";
import { trailingSlashRedirect } from "./middleware/trailingSlashRedirect.js";
import { watchModeResponseModification } from "./middleware/watchModeResponseModification.js";
import { watchModeStaticPage } from "./middleware/watchModeStaticPage.js";
import { SessionManager } from "./session/SessionManager.js";

/** @type {self.FrugalServerCreator} */
export const FrugalServer = {
	create,
};

/** @type {self.FrugalServerCreator['create']} */
function create({ config, manifest, watch, publicDir, cacheOverride, rootDir }) {
	const cache = cacheOverride ?? config.serverCache;

	/** @type {Route[]} */
	const routes = [];

	if (manifest.static !== undefined) {
		for (const { moduleHash, entrypoint, descriptor, params } of manifest.static.pages) {
			const page = parse({ moduleHash, entrypoint, descriptor });
			const pageAssets = PageAssets.create(manifest.static.assets, page.entrypoint);
			const producer = Producer.create({
				assets: pageAssets,
				page,
				configHash: manifest.static.hash,
				runtimeConfig: config,
				cache,
			});
			routes.push({
				page,
				producer,
				paramList: params,
			});
		}
	}

	if (manifest.dynamic !== undefined) {
		for (const { moduleHash, entrypoint, descriptor } of manifest.dynamic.pages) {
			const page = parse({ moduleHash, entrypoint, descriptor });
			const pageAssets = PageAssets.create(manifest.dynamic.assets, page.entrypoint);
			const producer = Producer.create({
				assets: pageAssets,
				page,
				configHash: manifest.dynamic.hash,
				runtimeConfig: config,
				cache,
			});
			routes.push({
				page,
				producer,
			});
		}
	}

	const availableEncodings = _getAvailableEncoding(config.compress.method);

	const serverMiddleware = composeMiddleware([
		errorPage({}, rootDir),
		etag,
		//csrf,
		trailingSlashRedirect,
		compress,
		...config.middlewares,
		staticFile({ rootDir: publicDir }),
		watchModeResponseModification,
		router(routes, [
			generateDynamicPage,
			strictPathCheck([
				forceGenerateStaticPage,
				watchModeStaticPage,
				serveFromCacheStaticPage,
				buildJitStaticPage,
			]),
		]),
	]);

	const sessionManager = config.session ? SessionManager.create(config.session) : undefined;

	return Server.create(
		async (request, serverContext) => {
			const url = new URL(request.url);
			const session = await sessionManager?.get(request.headers);

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
				cache,
				state: {},
				session,
				cryptoKey: config.cryptoKey,
				compress: {
					encodings,
					threshold: config.compress.threshold,
				},
				cacheHandler: config.cacheHandler,
			};

			const response = await serverMiddleware(context, _mostInternalMiddleware);

			if (response.headers.get("Date") === null) {
				response.headers.set("Date", new Date().toUTCString());
			}

			if (session) {
				await sessionManager?.persist(session, response.headers);
			}

			return response;
		},
		{ logScope: "FrugalServer" },
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
