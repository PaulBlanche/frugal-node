/** @import * as self from "./Server.js" */

import { log } from "../utils/log.js";
import { nativeHandler, serve } from "../utils/serve.js";

/** @type {self.ServerCreator} */
export const Server = {
	create,
};

/** @type {self.ServerCreator['create']} */
export function create(handler, serverConfig) {
	const logScope = serverConfig?.logScope ?? "Server";

	return {
		nativeHandler(secure) {
			return nativeHandler(internalHandler(secure));
		},

		handler: internalHandler,

		serve({ signal, port, secure } = {}) {
			const server = serve(internalHandler(secure), {
				port,
				signal,
			});

			server.listening.then(({ hostname, port }) => {
				const protocol = secure ? "https" : "http";
				log(`listening on ${protocol}://${hostname}:${port}`, {
					scope: logScope,
				});
			});

			return server;
		},
	};

	/** @type {self.Server['handler']} */
	function internalHandler(secure) {
		return async (request, info) => {
			/** @type {typeof log} */
			const identifiedLog = (messageOrError, config) => {
				log(messageOrError, {
					...config,
					scope: `${config?.scope ?? "???"}:${info.identifier}`,
				});
			};

			identifiedLog(`${info.hostname} [${request.method}] ${request.url}`, {
				scope: logScope,
				level: "debug",
			});

			try {
				return handler(request, { info, secure: secure ?? false, log: identifiedLog });
			} catch (/** @type {any} */ error) {
				identifiedLog(error, { scope: logScope });
				return new Response(null, {
					status: 500,
				});
			}
		};
	}
}
