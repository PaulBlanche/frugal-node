import type { ServerData } from "../utils/serverData.js";
import type { PageAssets } from "./PageAssets.js";
import type { PageResponse } from "./PageResponse.js";
import type { PathParams } from "./PathParams.js";

export function assertDynamicDescriptor<PATH extends string, DATA extends ServerData>(
	descriptor: unknown,
): asserts descriptor is DynamicPageDescriptor<PATH, DATA>;

export function assertStaticDescriptor<PATH extends string, DATA extends ServerData>(
	descriptor: unknown,
): asserts descriptor is StaticPageDescriptor<PATH, DATA>;

export function assertPathParamList<PATH extends string>(
	paths: unknown,
): asserts paths is PathParamsList<PATH>;

export type PageDescriptor<PATH extends string = string, DATA extends ServerData = ServerData> =
	| StaticPageDescriptor<PATH, DATA>
	| DynamicPageDescriptor<PATH, DATA>;

export type StaticPageDescriptor<
	PATH extends string = string,
	DATA extends ServerData = ServerData,
> = BasePageDescriptor<PATH, DATA> & {
	type?: "static";
	strictPaths?: boolean;
	getBuildPaths?: GetBuildPaths<PATH>;
	build?: Build<PATH, DATA>;
};

export type DynamicPageDescriptor<
	PATH extends string = string,
	DATA extends ServerData = ServerData,
> = BasePageDescriptor<PATH, DATA> & {
	type: "dynamic";
};

type BasePageDescriptor<PATH extends string, DATA extends ServerData> = {
	route: PATH;
	render?: Render<PATH, DATA>;
	generate?: Generate<PATH, DATA>;
};

export type RenderContext<
	PATH extends string,
	DATA extends ServerData = ServerData,
> = BaseContext<PATH> & {
	data: DATA;
	assets: PageAssets;
	entrypoint: string;
};

export type Render<PATH extends string, DATA extends ServerData = ServerData> = (
	context: RenderContext<PATH, DATA>,
) => string;

type ExtraGenerateContext = {
	state: State;
	request: Request;
	session?: PageSession;
	forceRefresh(path?: string): Promise<boolean>;
};

export type GenerateContext<PATH extends string> = BaseContext<PATH> & ExtraGenerateContext;

export type Generate<PATH extends string, DATA extends ServerData> = (
	context: GenerateContext<PATH>,
) => Promise<PageResponse<DATA> | undefined> | PageResponse<DATA> | undefined;

export type GetBuildPaths<PATH extends string> = () =>
	| Promise<PathParamsList<PATH>>
	| PathParamsList<PATH>;

export type PathParamsList<PATH extends string> = PathParams<PATH>[];

export type Build<PATH extends string, DATA extends ServerData> = (
	context: BuildContext<PATH>,
) => Promise<PageResponse<DATA> | undefined> | PageResponse<DATA> | undefined;

export type BuildContext<PATH extends string> = BaseContext<PATH> &
	(ExtraGenerateContext | Partial<Record<keyof ExtraGenerateContext, undefined>>);

type BaseContext<PATH extends string> = {
	params: PathParams<PATH>;
	location: { pathname: string; search: string };
};

export type State = Record<string, unknown>;

export type PageSession = {
	get<T = unknown>(key: string): T | undefined;
	set<T = unknown>(key: string, value: T): void;
	delete(key: string): void;
	has(key: string): boolean;
};
