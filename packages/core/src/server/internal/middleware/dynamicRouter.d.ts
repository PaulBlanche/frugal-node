import type { Page } from "../../../page/Page.js";
import type { Producer } from "../../../page/Producer.js";
import type { Middleware } from "../../middleware.js";
import type { AuthContext } from "./auth.js";

export function dynamicRouter(
	routes: {
		producer: Producer;
		page: Page;
	}[],
): Middleware<AuthContext>;
