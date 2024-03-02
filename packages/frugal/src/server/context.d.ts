import { FrugalConfig, FrugalServerConfig } from "../Config.ts";
import { DynamicPage, StaticPage } from "../page/Page.ts";
import { Collapse } from "../page/PathObject.ts";
import { Producer } from "../page/Producer.ts";
import { log } from "../utils/log.ts";
import { HandlerInfo } from "../utils/serve.ts";
import { ServerCache } from "./ServerCache.ts";
import { PrivateSession } from "./session/Session.ts";

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
