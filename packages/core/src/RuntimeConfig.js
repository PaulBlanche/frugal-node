/** @import * as self from "./RuntimeConfig.js" */

import * as url from "node:url";
import { ServerConfig } from "./server/ServerConfig.js";

/** @type {self.RuntimeConfigCreator} */
export const RuntimeConfig = {
	create,
};

/** @type {self.RuntimeConfigCreator['create']} */
function create(config) {
	const self = url.fileURLToPath(config.self);

	return {
		...ServerConfig.create(config),
		get self() {
			return self;
		},
	};
}

export class RuntimeConfigError extends Error {}
