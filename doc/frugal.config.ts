/** @import { RuntimeConfig } from "@frugal-node/core/config/runtime"; */

import { docLatestRewrite } from "./src/middlewares/docLatestRewrite.ts";

/** @type {RuntimeConfig} */
export default {
	self: import.meta.url,
	middlewares: [docLatestRewrite],
};
