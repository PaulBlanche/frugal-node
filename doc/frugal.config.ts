/** @import { RuntimeConfig } from "@frugal-node/core/config/runtime"; */

import { docLatestRewrite } from "./src/middlewares/docLatestRewrite.ts";

const cryptoKey = process.env["CRYPTO_KEY"];
if (cryptoKey === undefined) {
	throw new Error("no crypto key found in env variable");
}

/** @type {RuntimeConfig} */
// biome-ignore lint/style/noDefaultExport: <explanation>
export default {
	self: import.meta.url,
	middlewares: [docLatestRewrite],
	cryptoKey,
	log: {
		level: "verbose",
	},
};
