/** @import * as self from "./parse.js" */

import { log } from "../utils/log.js";
import { Page } from "./Page.js";
import { assertDynamicDescriptor, assertStaticDescriptor } from "./PageDescriptor.js";

/** @type {self.parse} */
export function parse({ descriptor, moduleHash, entrypoint }) {
	if (typeof descriptor === "object" && descriptor !== null && descriptor.type === "dynamic") {
		try {
			process.env.NODE_ENV !== "production" && assertDynamicDescriptor(descriptor);

			log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as DynamicPage`, {
				scope: "Page",
				level: "verbose",
			});

			return Page.dynamic({ descriptor, moduleHash, entrypoint });
		} catch (/** @type {any} */ error) {
			throw new ParseError(
				`Error while parsing descriptor "${entrypoint}": ${error.message}`,
				{ cause: error },
			);
		}
	}

	try {
		process.env.NODE_ENV !== "production" && assertStaticDescriptor(descriptor);

		log(`compiling page descriptor "${entrypoint}" (${moduleHash}) as StaticPage`, {
			scope: "Page",
			level: "verbose",
		});
		return Page.static({ descriptor, moduleHash, entrypoint });
	} catch (/** @type {any} */ error) {
		throw new ParseError(`Error while parsing descriptor "${entrypoint}": ${error.message}`, {
			cause: error,
		});
	}
}

export class ParseError extends Error {}
