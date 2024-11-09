import type { HeadManager } from "@frugal-node/preact";
import { marked } from "marked";
import { Renderer } from "./Renderer.ts";
import { calloutExtension } from "./calloutExtension.ts";

marked.use({
	extensions: [calloutExtension()],
});

const renderer = new Renderer();

type Parsed = { html: string; toc: { label: string; id: string; level: number }[] };

export function parse(
	markup: string,
	headManager?: HeadManager,
	variables: Record<string, string> = {},
): Parsed {
	renderer.reset();
	renderer.headManager = headManager;

	const html = marked.parse(
		markup.replaceAll(/\{\{(.*?)\}\}/g, (match, name) => {
			return name in variables ? String(variables[name]) : match;
		}),
		{
			async: false,
			renderer,
		},
	) as string;

	return { html, toc: renderer.toc };
}
