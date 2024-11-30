/** @import * as self from "./FrugalServer.js" */

import { token } from "../utils/crypto.js";
import { InternalServer } from "./internal/InternalServer.js";
import { ProxyServer } from "./proxy/ProxyServer.js";

/** @type {self.FrugalServerCreator} */
export const FrugalServer = {
	create,
};

/*

/foo/static

/_static?path=/foo/static

*/

/** @type {self.FrugalServerCreator['create']} */
function create({ config, manifest, watch, publicDir, cacheOverride }) {
	const internalHandler = InternalServer.create({
		manifest,
		config,
		watch,
	}).handler(config.secure);

	return ProxyServer.create({
		manifest,
		publicDir,
		config,
		watch,
		cacheOverride,
		internal: async (context, action) => {
			let frugalToken;
			if (action.type === "static") {
				frugalToken = await token(await config.cryptoKey, {
					type: action.type,
					op: action.op,
					index: String(action.index),
					url: context.request.url,
					params: JSON.stringify(action.params),
				});
			} else {
				frugalToken = await token(await config.cryptoKey, {
					type: action.type,
					index: String(action.index),
					url: context.request.url,
					params: JSON.stringify(action.params),
				});
			}

			const url = new URL(context.request.url);
			url.pathname = "/";
			url.searchParams.set("token", frugalToken);
			const request = new Request(url.toString(), context.request);

			return internalHandler(request, context.info);
		},
	});
}
