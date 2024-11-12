import type { InternalPlugin } from "../esbuild/Plugin.js";

type WatchContext = {
	startServer: (config: { onListen: () => void }) => Promise<void>;
};

export function watchPlugin(context: WatchContext): InternalPlugin;

export const WATCH_MESSAGE_SYMBOL: unique symbol;
