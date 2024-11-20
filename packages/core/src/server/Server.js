/** @import * as self from "./Server.js" */
/** @import * as middleware from "./middleware.js"; */
/** @import * as context from "./context.js"; */

import { PageAssets } from "../page/PageAssets.js";
import { Producer } from "../page/Producer.js";
import { parse } from "../page/parse.js";
import { log } from "../utils/log.js";
import { nativeHandler, serve } from "../utils/serve.js";
import { composeMiddleware } from "./middleware.js";
import { router } from "./middlewares/router.js";
import { staticFile } from "./middlewares/staticFile.js";
import { trailingSlashRedirect } from "./middlewares/trailingSlashRedirect.js";
import { watchModeResponseModification } from "./middlewares/watchModeResponseModification.js";
import { SessionManager } from "./session/SessionManager.js";

/** @type {self.ServerCreator} */
export const Server = {
	create,
};

/** @type {self.ServerCreator['create']} */
export function create({ config, manifest, watch, cache, publicDir }) {
	const manager = config.session ? SessionManager.create(config.session) : undefined;

	const routes = manifest.pages.map(({ moduleHash, entrypoint, descriptor }) => {
		const compiledPage = parse({
			moduleHash,
			entrypoint,
			descriptor,
		});

		const pageAssets = PageAssets.create(manifest.assets, compiledPage.entrypoint);
		const pageProducer = Producer.create(pageAssets, compiledPage, manifest.hash);

		return { page: compiledPage, producer: pageProducer };
	});

	const serverMiddleware = composeMiddleware(
		[
			trailingSlashRedirect,
			...config.middlewares,
			watchModeResponseModification,
			router(routes),
			staticFile,
		].filter(
			/** @returns {middleware is middleware.Middleware<context.BaseContext>} */
			(middleware) => Boolean(middleware),
		),
	);

	return {
		nativeHandler(secure) {
			return nativeHandler(handler(secure));
		},

		handler,

		serve({ signal, onListen, port } = {}) {
			const secure = config.secure;

			return serve(handler(secure), {
				port: port ?? config.port,
				signal,
				onListen: (args) => {
					const protocol = secure ? "https" : "http";
					log(`listening on ${protocol}://${args.hostname}:${args.port}`, {
						scope: "FrugalServer",
					});
					onListen?.(args);
				},
			});
		},
	};

	/** @type {self.Server['handler']} */
	function handler(secure) {
		return async (request, info) => {
			/** @type {typeof log} */
			const identifiedLog = (messageOrError, config) => {
				log(messageOrError, {
					...config,
					scope: `${config?.scope ?? "???"}:${info.identifier}`,
				});
			};

			identifiedLog(`${info.hostname} [${request.method}] ${request.url}`, {
				scope: "Server",
				level: "debug",
			});

			try {
				const session = await manager?.get(request.headers);

				/** @type {context.BaseContext} */
				const context = {
					request,
					info,
					config: { cryptoKey: config.cryptoKey, publicDir },
					state: {},
					secure: secure ?? false,
					watch: watch,
					log: identifiedLog,
					cache: cache,
					session,
					url: new URL(request.url),
				};

				const response = await serverMiddleware(context, () => {
					return Promise.resolve(
						new Response(null, {
							status: 400,
						}),
					);
				});

				if (response.headers.get("Date") === null) {
					response.headers.set("Date", new Date().toUTCString());
				}

				if (session) {
					await manager?.persist(session, response.headers);
				}

				return response;
			} catch (/** @type {any} */ error) {
				identifiedLog(error, { scope: "FrugalServer" });
				return new Response(null, {
					status: 500,
				});
			}
		};
	}
}
