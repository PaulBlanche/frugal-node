/** @import * as self from "./LiveReloadServer.js" */
/** @import { Handler, EventStreamResponse } from "../../utils/serve.js" */

import { log } from "../../utils/log.js";
import { serve } from "../../utils/serve.js";

const ENCODER = new TextEncoder();

/** @type {self.LiveReloadServerCreator} */
export const LiveReloadServer = {
	create,
};

/** @type {self.LiveReloadServerCreator['create']} */
function create() {
	/** @type {Map<number, ReadableStreamController<Uint8Array>>} */
	const controllers = new Map();

	return {
		dispatch,

		serve({ onListen, signal, port = 4075 } = {}) {
			return serve(_handler(), {
				port,
				signal,
				onListen(args) {
					onListen?.(args);
					log(`Live reload server listening at http://${args.hostname}:${args.port}`, {
						scope: "LiveReloadServer",
					});
				},
			});
		},
	};

	/** @type {self.LiveReloadServer['dispatch']} */
	function dispatch(event) {
		log(`"${event.type}" event dispatched`, {
			scope: "LiveReloadServer",
			level: "debug",
		});

		const payload = `data: ${JSON.stringify(event)}\n\n`;
		for (const [id, controller] of controllers.entries()) {
			log(`dispatch "${event.type}" event to connection ${id}`, {
				scope: "LiveReloadServer",
				level: "verbose",
			});

			controller.enqueue(ENCODER.encode(payload));
		}
	}

	/** @returns {Handler} */
	function _handler() {
		let id = 0;
		return () => {
			const controllerId = id++;
			/** @satisfies {UnderlyingSource<Uint8Array>} */
			const source = {
				start: (controller) => {
					log(`open new livereload connection (id:${controllerId})`, {
						scope: "LiveReloadServer",
						level: "verbose",
					});
					controllers.set(controllerId, controller);
					dispatch({ type: "connected" });
				},
				cancel: (error) => {
					if (error) {
						log(
							new Error(`error on livereload connection (id:${controllerId})`, {
								cause: error,
							}),
							{
								level: "error",
							},
						);
					} else {
						const controller = controllers.get(controllerId);
						if (controller) {
							log(`close livereload connection (id:${controllerId})`, {
								scope: "LiveReloadServer",
								level: "verbose",
							});
							controllers.delete(controllerId);
							controller.close();
						}
					}
				},
			};

			const response = /** @type {EventStreamResponse} */ (
				new Response(new ReadableStream(source), {
					headers: {
						"Access-Control-Allow-Origin": "*",
						Connection: "Keep-Alive",
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						"Keep-Alive": `timeout=${Number.MAX_SAFE_INTEGER}`,
					},
				})
			);

			response.close = () => {
				source.cancel();
			};

			return response;
		};
	}
}
