import { Page } from "../../page/Page.js";
import { Producer } from "../../page/Producer.js";
import { BaseContext } from "../context.js";
import { Middleware } from "../middleware.js";

export function router(routes: { producer: Producer; page: Page }[]): Middleware<BaseContext>;
