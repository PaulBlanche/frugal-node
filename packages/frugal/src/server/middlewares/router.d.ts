import type { Page } from "../../page/Page.js";
import type { Producer } from "../../page/Producer.js";
import type { BaseContext } from "../context.js";
import type { Middleware } from "../middleware.js";

export function router(routes: { producer: Producer; page: Page }[]): Middleware<BaseContext>;
