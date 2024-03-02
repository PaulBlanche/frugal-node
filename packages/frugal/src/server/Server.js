import { FrugalConfig } from "../Config.js";
import { Page } from "../page/Page.js";
import { Producer } from "../page/Producer.js";
import { log } from "../utils/log.js";
import { nativeHandler, serve } from "../utils/serve.js";
import * as middleware from "./middleware.js";
import { router } from "./middlewares/router.js";
import { staticFile } from "./middlewares/staticFile.js";
import { trailingSlashRedirect } from "./middlewares/trailingSlashRedirect.js";
import { watchModeResponseModification } from "./middlewares/watchModeResponseModification.js";
import { SessionManager } from "./session/SessionManager.js";

/** @type {import('./Server.ts').ServerMaker} */
export const Server = {
	create,
};

/** @type {import('./Server.ts').ServerMaker['create']} */
export async function create({ config, manifest, watch, cache }) {
	const frugalConfig = "validate" in config ? config : FrugalConfig.create(config);
	const serverConfig = frugalConfig.server;
	const manager = serverConfig.session ? SessionManager.create(serverConfig.session) : undefined;

	const routes = manifest.pages.map(({ moduleHash, entrypoint, descriptor }) => {
		const compiledPage = Page.create({
			moduleHash,
			entrypoint,
			pageDescriptor: descriptor,
		});

		const pageProducer = Producer.create(
			manifest.assets,
			compiledPage,
			manifest.hash,
			frugalConfig,
		);

		return { page: compiledPage, producer: pageProducer };
	});

	const serverMiddleware = middleware.composeMiddleware(
		[
			trailingSlashRedirect,
			...serverConfig.middlewares,
			process.env.NODE_ENV !== "production" && watchModeResponseModification,
			router(routes),
			staticFile,
		].filter(
			/** @returns {middleware is import("./middleware.ts").Middleware<import("./context.js").BaseContext>} */
			(middleware) => Boolean(middleware),
		),
	);

	return {
		nativeHandler(secure) {
			return nativeHandler(handler(secure));
		},

		handler,

		serve({ signal, onListen, port } = {}) {
			const secure = serverConfig.secure;

			return serve(handler(secure), {
				port: port ?? serverConfig.port,
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

	/** @type {import('./Server.ts').Server['handler']} */
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

				/** @type {import("./context.js").BaseContext} */
				const context = {
					request,
					info,
					config: { global: frugalConfig, server: serverConfig },
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
