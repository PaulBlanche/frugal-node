/** @import * as self from "./watchPlugin.js" */

export const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

/** @type {self.watchPlugin} */
export function watchPlugin(watchContext) {
	return {
		name: "frugal-internal-plugin:watch",
		setup: (build, context) => {
			build.onStart(() => {
				console.log({
					type: "build:start",
					[WATCH_MESSAGE_SYMBOL]: true,
				});
			});

			build.onEnd(async (result) => {
				if (result.errors.length === 0) {
					context.reset();

					await watchContext.startServer({
						onListen: () => {
							console.log({
								type: "build:end",
								[WATCH_MESSAGE_SYMBOL]: true,
							});
						},
					});
				}
			});
		},
	};
}
