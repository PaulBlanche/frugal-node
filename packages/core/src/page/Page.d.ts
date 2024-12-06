import type * as pathToRegexp from "path-to-regexp";
import type { ServerData } from "../utils/serverData.js";
import type * as descriptor from "./PageDescriptor.js";
import type { PageResponse } from "./PageResponse.js";
import type { PathParams } from "./PathParams.js";

type BasePage<PATH extends string = string, DATA extends ServerData = ServerData> = {
	readonly moduleHash: string;
	readonly entrypoint: string;
	readonly route: PATH;
	readonly regexpRoute: RegExp;

	render(context: descriptor.RenderContext<PATH, DATA>): string;

	generate(context: descriptor.GenerateContext<PATH>): Promise<PageResponse<DATA> | undefined>;

	compile(path: PathParams<PATH>): string;

	match(path: string): pathToRegexp.Match<PathParams<PATH>>;
};

export type DynamicPage<
	PATH extends string = string,
	DATA extends ServerData = ServerData,
> = BasePage<PATH, DATA> & {
	readonly type: "dynamic";
};

export type StaticPage<
	PATH extends string = string,
	DATA extends ServerData = ServerData,
> = BasePage<PATH, DATA> & {
	readonly strictPaths: boolean;
	readonly type: "static";

	getBuildPaths(): Promise<descriptor.PathParamsList<PATH>>;
	build(context: descriptor.BuildContext<PATH>): Promise<PageResponse<DATA> | undefined>;
};

export type Page<PATH extends string = string, DATA extends ServerData = ServerData> =
	| DynamicPage<PATH, DATA>
	| StaticPage<PATH, DATA>;

interface PageCreator {
	static<PATH extends string = string, DATA extends ServerData = ServerData>(page: {
		entrypoint: string;
		moduleHash: string;
		descriptor: descriptor.StaticPageDescriptor<PATH, DATA>;
	}): StaticPage<PATH, DATA>;
	dynamic<PATH extends string = string, DATA extends ServerData = ServerData>(page: {
		entrypoint: string;
		moduleHash: string;
		descriptor: descriptor.DynamicPageDescriptor<PATH, DATA>;
	}): DynamicPage<PATH, DATA>;
}

export let Page: PageCreator;

export class PageError extends Error {}
