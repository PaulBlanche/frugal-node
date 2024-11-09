import type { DynamicPage, StaticPage } from "../page/Page.ts";
import type { Collapse } from "../page/PathParams.js";
import type { Producer } from "../page/Producer.js";
import type { log } from "../utils/log.js";
import type { HandlerInfo } from "../utils/serve.js";
import type { ServerCache } from "./ServerCache.ts";
import type { Session } from "./session/Session.ts";

export type BaseContext = {
	url: URL;
	request: Request;
	config: { cryptoKey: Promise<CryptoKey | undefined>; publicDir?: string };
	state: Record<string, unknown>;
	session?: Session;
	cache: ServerCache;
	watch: boolean;
	log: typeof log;
	info: HandlerInfo;
	secure: boolean;
};

export type RouteContext<TYPE extends "dynamic" | "static" = "dynamic" | "static"> = BaseContext & {
	page: TYPE extends "dynamic" ? DynamicPage : StaticPage;
	producer: Producer;
	params: Collapse<Partial<Record<string, string | string[]>>>;
};
