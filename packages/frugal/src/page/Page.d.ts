import type * as webStream from "node:stream/web";
import type * as pathToRegexp from "path-to-regexp";
import type { JsonValue } from "../utils/jsonValue.ts";
import type * as descriptor from "./PageDescriptor.ts";
import type { PageResponse } from "./PageResponse.ts";
import type { PathObject } from "./PathObject.ts";

type BasePage<PATH extends string = string, DATA extends JsonValue = JsonValue> = {
	readonly moduleHash: string;
	readonly entrypoint: string;
	readonly route: PATH;

	render(
		context: descriptor.RenderContext<PATH, DATA>,
	): string | webStream.ReadableStream<string>;

	generate(context: descriptor.GenerateContext<PATH>): Promise<PageResponse<DATA> | undefined>;

	compile(path: PathObject<PATH>): string;

	match(path: string): pathToRegexp.Match<PathObject<PATH>>;
};

export type DynamicPage<
	PATH extends string = string,
	DATA extends JsonValue = JsonValue,
> = BasePage<PATH, DATA> & {
	readonly type: "dynamic";
};

export type StaticPage<PATH extends string = string, DATA extends JsonValue = JsonValue> = BasePage<
	PATH,
	DATA
> & {
	readonly strictPaths: boolean;
	readonly type: "static";

	getBuildPaths(): descriptor.PathList<PATH> | Promise<descriptor.PathList<PATH>>;

	build(context: descriptor.BuildContext<PATH>): Promise<PageResponse<DATA> | undefined>;
};

export type Page<PATH extends string = string, DATA extends JsonValue = JsonValue> =
	| DynamicPage<PATH, DATA>
	| StaticPage<PATH, DATA>;

interface PageMaker {
	create<PATH extends string = string, DATA extends JsonValue = JsonValue>(page: {
		entrypoint: string;
		moduleHash: string;
		pageDescriptor: descriptor.PageDescriptor<PATH, DATA>;
	}): Page<PATH, DATA>;
}

export let Page: PageMaker;

export class PageError extends Error {}
