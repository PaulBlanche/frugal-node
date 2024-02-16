import type { FrugalConfig } from "../../Config.js";
import type * as page from "../../page/Page.js";
import type { Producer } from "../../page/Producer.js";
import type * as pathObject from "../../page/_type/PathObject.js";
import type { HandlerInfo } from "../../utils/http.js";
import type { log } from "../../utils/log.js";
import type * as cache from "../cache/Cache.js";
import type { Session } from "../session/Session.js";

export type BaseContext = {
	url: URL;
	request: Request;
	config: FrugalConfig;
	state: Record<string, unknown>;
	session?: Session;
	cache: cache.RuntimeCache;
	watch: boolean;
	log: typeof log;
	info: HandlerInfo;
	secure: boolean;
};

export type RouteContext<TYPE extends "dynamic" | "static" = "dynamic" | "static"> = BaseContext & {
	page: TYPE extends "dynamic" ? page.DynamicPage : page.StaticPage;
	producer: Producer;
	params: pathObject.Collapse<unknown>;
};
