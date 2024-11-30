import type { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { docLatestRewrite } from "./src/middlewares/docLatestRewrite.ts";

if (process.env["NODE_ENV"] !== "production") {
	const dotenvx = await import("@dotenvx/dotenvx");
	dotenvx.config({
		path: ["./.env.local"],
	});
}

const cryptoKey = process.env["CRYPTO_KEY"];
if (cryptoKey === undefined) {
	throw new Error("no crypto key found in env variable");
}

// biome-ignore lint/style/noDefaultExport: well known export
export default {
	self: import.meta.url,
	middlewares: [docLatestRewrite],
	cryptoKey,
} satisfies RuntimeConfig;
