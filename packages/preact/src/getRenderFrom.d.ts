import { Assets, Render } from "frugal-node/page";
import { JsonValue } from "frugal-node/utils/jsonValue";
import { Document } from "./DefaultDocument.js";

export type PageProps = {
	descriptor: string;
	assets: Assets;
};

export type Page = preact.ComponentType<PageProps>;

type RenderConfig = {
	Document?: Document;
	embedData?: boolean;
};

export function getRenderFrom<PATH extends string, DATA extends JsonValue>(
	Page: Page,
	config?: RenderConfig,
): Render<PATH, DATA>;
