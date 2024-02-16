import { FrugalConfig } from "../Config.js";
import * as page from "../page/Page.js";
import { Producer } from "../page/Producer.js";
import * as http from "../utils/http.js";
import { log } from "../utils/log.js";
import * as _type from "./_type/Server.js";
import * as cache from "./cache/Cache.js";
import * as context from "./context.js";
import * as middleware from "./middleware.js";
import { router } from "./middlewares/router.js";
import { staticFile } from "./middlewares/staticFile.js";
import { trailingSlashRedirect } from "./middlewares/trailingSlashRedirect.js";
import { watchModeResponseModification } from "./middlewares/watchModeResponseModification.js";
import { SessionManager } from "./session/SessionManager.js";

export class Server {
	/** @type {FrugalConfig} */
	#config;
	/** @type {boolean} */
	#watch;
	/** @type {middleware.Middleware<context.BaseContext>} */
	#middleware;
	/** @type {SessionManager | undefined} */
	#sessionManager;
	/** @type {cache.RuntimeCache} */
	#cache;

	/**
	 * @param {_type.ServerConfig} config
	 */
	constructor({ config, manifest, watch, cache }) {
		this.#config = config instanceof FrugalConfig ? config : new FrugalConfig(config);
		this.#watch = watch;
		this.#cache = cache;

		if (this.#config.server.session) {
			this.#sessionManager = new SessionManager(this.#config.server.session);
		}

		const routes = manifest.pages.map(({ moduleHash, entrypoint, descriptor }) => {
			const compiledPage = page.compile({
				moduleHash,
				entrypoint,
				pageDescriptor: descriptor,
			});
			const producer = new Producer(
				manifest.assets,
				compiledPage,
				manifest.config,
				this.#config,
			);
			return { page: compiledPage, producer };
		});

		this.#middleware = middleware.composeMiddleware(
			[
				trailingSlashRedirect,
				...this.#config.server.middlewares,
				process.env.NODE_ENV !== "production" && watchModeResponseModification,
				router(routes),
				staticFile,
			].filter(
				/** @returns {middleware is middleware.Middleware<context.BaseContext>} */
				(middleware) => Boolean(middleware),
			),
		);
	}

	/**
	 * @param {boolean} [secure]
	 * @returns {http.NativeHandler}
	 */
	nativeHandler(secure) {
		return http.nativeHandler(this.handler(secure));
	}

	/**
	 * @param {boolean} [secure]
	 * @returns {http.Handler}
	 */
	handler(secure) {
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
				const session = await this.#sessionManager?.get(request.headers);

				/** @type {context.BaseContext} */
				const context = {
					request,
					info,
					config: this.#config,
					state: {},
					secure: secure ?? false,
					watch: this.#watch,
					log: identifiedLog,
					cache: this.#cache,
					session,
					url: new URL(request.url),
				};

				const response = await this.#middleware(context, () => {
					return Promise.resolve(
						new Response(null, {
							status: 400,
						}),
					);
				});

				if (session) {
					await this.#sessionManager?.persist(session, response.headers);
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

	/**
	 * @param {http.ServeOptions} [param0]
	 * @returns
	 */
	serve({ signal, onListen, port } = {}) {
		const secure = this.#config.server.secure;
		const handler = this.handler(secure);

		return http.serve(handler, {
			port: port ?? this.#config.server.port,
			signal,
			onListen: (args) => {
				const protocol = secure ? "https" : "http";
				log(`listening on ${protocol}://${args.hostname}:${args.port}`, {
					scope: "FrugalServer",
				});
				onListen?.(args);
			},
		});
	}
}
