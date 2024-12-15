/** @import { Context } from "../../../../src/server/context.js" */
/** @import { RouterContext, Route } from "../../../../src/server/middleware/router.js" */
/** @import { Page } from "../../../../src/page/Page.js"; */
/** @import { Producer } from "../../../../src/page/Producer.js"; */
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */
/** @import { CacheHandler } from "../../../../src/RuntimeConfig.js" */

/**
 * @param {Partial<FrugalResponse>} config
 */
export function makeFrugalResponse(config) {
	return /** @type {FrugalResponse} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<Context>} config
 */
export function makeContext(config) {
	return /** @type {Context} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<Request>} config
 */
export function makeRequest(config) {
	return /** @type {Request} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<ServerCache>} config
 */
export function makeServerCache(config) {
	return /** @type {ServerCache} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<CacheHandler>} config
 */
export function makeCacheHandler(config) {
	return /** @type {CacheHandler} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<RouterContext>} config
 */
export function makeRouterContext(config) {
	return /** @type {RouterContext} */ (
		/** @type {unknown} */ ({
			log: () => {
				// empty
			},
			...config,
		})
	);
}

/**
 * @param {Partial<Route>} config
 */
export function makeRoute(config) {
	return /** @type {Route} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<Page>} config
 */
export function makePage(config) {
	return /** @type {Page} */ (/** @type {unknown} */ (config));
}

/**
 * @param {Partial<Producer>} config
 */
export function makeProducer(config) {
	return /** @type {Producer} */ (/** @type {unknown} */ (config));
}
