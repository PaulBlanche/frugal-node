import type { FrugalConfig, FrugalServerConfig } from "../Config.ts";
import type { DynamicPage, StaticPage } from "../page/Page.ts";
import type { Collapse } from "../page/PathObject.ts";
import type { Producer } from "../page/Producer.ts";
import type { log } from "../utils/log.ts";
import type { HandlerInfo } from "../utils/serve.ts";
import type { ServerCache } from "./ServerCache.ts";
import type { PrivateSession } from "./session/Session.ts";

export type BaseContext = {
	url: URL;
	request: Request;
	config: { global: FrugalConfig; server: FrugalServerConfig };
	state: Record<string, unknown>;
	session?: PrivateSession;
	cache: ServerCache;
	watch: boolean;
	log: typeof log;
	info: HandlerInfo;
	secure: boolean;
};

export type RouteContext<TYPE extends "dynamic" | "static" = "dynamic" | "static"> = BaseContext & {
	page: TYPE extends "dynamic" ? DynamicPage : StaticPage;
	producer: Producer;
	params: Collapse<unknown>;
};
