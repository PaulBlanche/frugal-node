/** @import * as self from "./FrugalServer.js" */

import { token } from "../utils/crypto.js";
import { InternalServer } from "./internal/InternalServer.js";
import { ProxyServer } from "./proxy/ProxyServer.js";

/** @type {self.FrugalServerCreator} */
export const FrugalServer = {
	create,
};

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
		internal: async (context, type) => {
			const request = new Request(context.request);

			const frugalToken = await token(await config.cryptoKey, { t: type });
			request.headers.set("x-frugal-token", frugalToken);

			return internalHandler(request, context.info);
		},
	});
}
