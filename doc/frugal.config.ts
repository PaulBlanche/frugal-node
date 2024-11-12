/** @import { RuntimeConfig } from "@frugal-node/core/config/runtime"; */

import { docLatestRewrite } from "./src/middlewares/docLatestRewrite.ts";

/** @type {RuntimeConfig} */
// biome-ignore lint/style/noDefaultExport: well known export
export default {
	self: import.meta.url,
	middlewares: [docLatestRewrite],
};
