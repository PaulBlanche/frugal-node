import type * as webStream from "node:stream/web";
import type { JsonValue } from "../utils/jsonValue.ts";
import type { Assets } from "./Assets.ts";
import type { DataResponse } from "./PageResponse.js";
import type { EmptyResponse } from "./PageResponse.js";
import type { PageResponse } from "./PageResponse.ts";
import type { PathObject } from "./PathObject.ts";

export type State = Record<string, unknown>;

export type Session = {
	get<T = unknown>(key: string): T | undefined;
	set<T = unknown>(key: string, value: T): void;
	delete(key: string): void;
	has(key: string): boolean;
};

export type ResponseInit = {
	headers?: HeadersInit;
	status?: number;
	forceDynamic?: boolean;
};

type BaseContext<PATH extends string> = {
	params: PathObject<PATH>;
	location: { pathname: string; search: string };
};

export type RenderContext<
	PATH extends string,
	DATA extends JsonValue = JsonValue,
> = BaseContext<PATH> & {
	data: DATA;
	assets: Assets;
	descriptor: string;
};

export type Render<PATH extends string, DATA extends JsonValue = JsonValue> = (
	context: RenderContext<PATH, DATA>,
) => string | webStream.ReadableStream<string>;

export type PathList<PATH extends string = string> = PathObject<PATH>[];

export type GetBuildPaths<PATH extends string> = () => Promise<PathList<PATH>> | PathList<PATH>;

export type GenerateContext<PATH extends string> = BaseContext<PATH> & {
	data: <DATA extends JsonValue>(data: DATA, init?: ResponseInit) => DataResponse<DATA>;
	empty: (init?: ResponseInit) => EmptyResponse;
	state: State;
	request: Request;
	session?: Session;
};

export type Generate<PATH extends string, DATA extends JsonValue> = (
	context: GenerateContext<PATH>,
) => Promise<PageResponse<DATA> | undefined> | PageResponse<DATA> | undefined;

export type BuildContext<PATH extends string> = BaseContext<PATH> & {
	data: <DATA extends JsonValue>(data: DATA, init?: ResponseInit) => DataResponse<DATA>;
	empty: (init?: ResponseInit) => EmptyResponse;
} & (
		| {
				state: State;
				request: Request;
				session?: Session;
		  }
		| {
				state?: undefined;
				request?: undefined;
				session?: undefined;
		  }
	);

export type Build<PATH extends string, DATA extends JsonValue> = (
	context: BuildContext<PATH>,
) => Promise<PageResponse<DATA> | undefined> | PageResponse<DATA> | undefined;

interface BasePageDescriptor<PATH extends string, DATA extends JsonValue> {
	route: PATH;
	render: Render<PATH, DATA>;
	generate?: Generate<PATH, DATA>;
}

export interface DynamicPageDescriptor<
	PATH extends string = string,
	DATA extends JsonValue = JsonValue,
> extends BasePageDescriptor<PATH, DATA> {
	type: "dynamic";
}

export interface StaticPageDescriptor<
	PATH extends string = string,
	DATA extends JsonValue = JsonValue,
> extends BasePageDescriptor<PATH, DATA> {
	type?: "static";
	strictPaths?: boolean;
	getBuildPaths?: GetBuildPaths<PATH>;
	build?: Build<PATH, DATA>;
}

export type PageDescriptor<PATH extends string = string, DATA extends JsonValue = JsonValue> =
	| StaticPageDescriptor<PATH, DATA>
	| DynamicPageDescriptor<PATH, DATA>;

export function assertStaticDescriptor<PATH extends string, DATA extends JsonValue>(
	descriptor: PageDescriptor<PATH, DATA>,
): asserts descriptor is StaticPageDescriptor<PATH, DATA>;

export function assertDynamicDescriptor<PATH extends string, DATA extends JsonValue>(
	descriptor: PageDescriptor<PATH, DATA>,
): asserts descriptor is DynamicPageDescriptor<PATH, DATA>;
