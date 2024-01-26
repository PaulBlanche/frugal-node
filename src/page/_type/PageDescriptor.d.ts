import { JsonValue } from "../../utils/jsonValue.js";
import * as webstream from "../../utils/webstream.js";
import { PageAssets } from "../Assets.js";
import { PathObject } from "../PathObject.js";
import { PageResponse } from "../Response.js";
import { Session } from "../Session.js";

export type Phase = "build" | "refresh" | "generate";

type BaseContext<PATH extends string> = {
	phase: Phase;
	params: PathObject<PATH>;
	path: string;
};

export type RenderContext<
	PATH extends string,
	DATA extends JsonValue = JsonValue,
> = BaseContext<PATH> & {
	data: DATA;
	assets: PageAssets;
	descriptor: string;
};

export type Render<PATH extends string, DATA extends JsonValue = JsonValue> = (
	context: RenderContext<PATH, DATA>,
) => string | webstream.ReadableStream<string>;

export type GetBuildPathsContext = {
	phase: Phase;
	resolve: (path: string) => string;
};

export type PathList<PATH extends string = string> = PathObject<PATH>[];

export type GetBuildPaths<PATH extends string> = (
	context: GetBuildPathsContext,
) => Promise<PathList<PATH>> | PathList<PATH>;

export type GenerateContext<PATH extends string> = BaseContext<PATH> & {
	resolve: (path: string) => string;
	state: Record<string, unknown>;
	request: Request;
	session?: Session;
};

export type Generate<PATH extends string, DATA extends JsonValue> = (
	context: GenerateContext<PATH>,
) => Promise<PageResponse<DATA>> | PageResponse<DATA>;

export type BuildContext<PATH extends string> = BaseContext<PATH> & {
	resolve: (path: string) => string;
	state?: Record<string, unknown>;
	request?: Request;
	session?: Session;
};

export type Build<PATH extends string, DATA extends JsonValue> = (
	context: BuildContext<PATH>,
) => Promise<PageResponse<DATA>> | PageResponse<DATA>;

interface BasePageDescriptor<PATH extends string, DATA extends JsonValue> {
	route: string;
	render: Render<PATH, DATA>;
}

export interface DynamicPageDescriptor<
	PATH extends string = string,
	DATA extends JsonValue = JsonValue,
> extends BasePageDescriptor<PATH, DATA> {
	generate: Generate<PATH, DATA>;
}

export interface StaticPageDescriptor<
	PATH extends string = string,
	DATA extends JsonValue = JsonValue,
> extends BasePageDescriptor<PATH, DATA> {
	strictPaths?: boolean;
	getBuildPaths?: GetBuildPaths<PATH>;
	build?: Build<PATH, DATA>;
}

export type PageDescriptor<PATH extends string = string, DATA extends JsonValue = JsonValue> =
	| StaticPageDescriptor<PATH, DATA>
	| DynamicPageDescriptor<PATH, DATA>;
