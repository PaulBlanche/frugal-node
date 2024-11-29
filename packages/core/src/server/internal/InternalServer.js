/** @import * as self from "./InternalServer.js" */

import { PageAssets } from "../../page/PageAssets.js";
import { Producer } from "../../page/Producer.js";
import { parse } from "../../page/parse.js";
import { Server } from "../Server.js";
import { composeMiddleware } from "../middleware.js";
import { SessionManager } from "../session/SessionManager.js";
import { auth } from "./middleware/auth.js";
import { dynamicRouter } from "./middleware/dynamicRouter.js";
import { staticRouter } from "./middleware/staticRouter.js";
import { watchModeResponseModification } from "./middleware/watchModeResponseModification.js";

/** @type {self.InternalServerCreator} */
export const InternalServer = {
	create,
};

/** @type {self.InternalServerCreator['create']} */
function create({ manifest, config, watch }) {
	const sessionManager = config.session ? SessionManager.create(config.session) : undefined;

	const staticRoutes =
		manifest.static === undefined
			? []
			: manifest.static.pages.map(({ moduleHash, entrypoint, descriptor, params }) => {
					const compiledPage = parse({
						moduleHash,
						entrypoint,
						descriptor,
					});

					const pageAssets = PageAssets.create(
						manifest.static.assets,
						compiledPage.entrypoint,
					);
					const pageProducer = Producer.create(
						pageAssets,
						compiledPage,
						manifest.static.hash,
						config.cryptoKey,
					);

					return { page: compiledPage, producer: pageProducer, paramList: params };
				});

	const dynamicRoutes =
		manifest.dynamic === undefined
			? []
			: manifest.dynamic.pages.map(({ moduleHash, entrypoint, descriptor }) => {
					const compiledPage = parse({
						moduleHash,
						entrypoint,
						descriptor,
					});

					const pageAssets = PageAssets.create(
						manifest.dynamic.assets,
						compiledPage.entrypoint,
					);
					const pageProducer = Producer.create(
						pageAssets,
						compiledPage,
						manifest.dynamic.hash,
						config.cryptoKey,
					);

					return { page: compiledPage, producer: pageProducer };
				});

	const serverMiddleware = composeMiddleware([
		auth(),
		...config.middlewares,
		watchModeResponseModification,
		staticRouter(staticRoutes),
		dynamicRouter(dynamicRoutes),
	]);

	return Server.create(
		async (request, serverContext) => {
			const session = await sessionManager?.get(request.headers);
			const url = new URL(request.url);

			const context = {
				...serverContext,
				watch,
				session,
				url,
				request,
				state: {},
				cryptoKey: await config.cryptoKey,
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
		{ logScope: "InternalServer" },
	);
}

function _mostInternalMiddleware() {
	return Promise.resolve(
		new Response(null, {
			status: 404,
		}),
	);
}
