import { clsx } from "clsx";
import type { Element } from "hast";
import type * as preact from "preact";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import type { File } from "./File.ts";
import * as highlight from "./Highlight.module.css";

const HIGHLIGHTER = await createHighlighterCore({
	themes: [
		import("shiki/themes/material-theme-darker.mjs"),
		import("shiki/themes/material-theme-lighter.mjs"),
	],
	langs: [
		import("shiki/langs/javascript.mjs"),
		import("shiki/langs/jsx.mjs"),
		import("shiki/langs/typescript.mjs"),
		import("shiki/langs/tsx.mjs"),
		import("shiki/langs/json.mjs"),
		[], // text
	],
	engine: createOnigurumaEngine(import("shiki/wasm")),
});

type HighlightProps = {
	file: File;
	noLineNumbers?: boolean;
} & preact.JSX.IntrinsicElements["div"];

export function Highlight({
	file: { code, language, highlights },
	noLineNumbers = true,
	class: className,
	...divProps
}: HighlightProps) {
	const htmlCode = HIGHLIGHTER.codeToHtml(code, {
		lang: language && HIGHLIGHTER.getLoadedLanguages().includes(language) ? language : "text",
		themes: { dark: "material-theme-darker", light: "material-theme-lighter" },
		transformers: [
			{
				root(node) {
					node.children.push({
						type: "element",
						tagName: "pre",
						properties: {
							class: highlight["lineNumbers"],
						},
						children: noLineNumbers
							? []
							: Array.from({ length: lineNumbers(code) }, (_, i) => {
									return [
										{
											type: "element",
											tagName: "span",
											properties: {},
											children: [{ type: "text", value: `${i + 1}` }],
										},
										{
											type: "text",
											value: "\n",
										},
									] as Element[];
								}).flat(),
					});

					if (highlights) {
						node.children.push({
							type: "element",
							tagName: "pre",
							properties: {
								class: highlight["lineHighlights"],
							},
							children: lineHighlights(highlights).map(
								({ isHighlighted, length }) => {
									return {
										type: "element",
										tagName: "div",
										properties: {
											class: isHighlighted && highlight["highlight"],
										},
										children: [{ type: "text", value: "\n".repeat(length) }],
									};
								},
							),
						});
					}
				},
				pre(node) {
					this.addClassToHast(node, highlight["highlight"]);
					node.properties["tabindex"] = "-1";
					if (!noLineNumbers) {
						this.addClassToHast(node, highlight["highlightLineNumbers"]);
					}
				},
				code(node) {
					if (language) {
						this.addClassToHast(node, `language-${language}`);
					}
				},
			},
		],
	});

	return (
		<div
			{...divProps}
			class={clsx(className, highlight["wrapper"])}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: code was escaped by shiki
			dangerouslySetInnerHTML={{ __html: htmlCode }}
		/>
	);
}

function lineHighlights(lines: [number, number][]) {
	const highlights: { isHighlighted: boolean; length: number }[] = [];
	let lastHighlightEnd = 0;
	for (const line of lines) {
		const padLength = line[0] - lastHighlightEnd - 1;
		if (padLength > 0) {
			highlights.push({ isHighlighted: false, length: padLength });
		}
		const highlightLength = line[1] - line[0] + 1;
		highlights.push({ isHighlighted: true, length: highlightLength });
		lastHighlightEnd = line[1];
	}

	return highlights;
}

const LINE_END_REGEXP = /\n(?!$)/g;
function lineNumbers(code: string) {
	const match = code.match(LINE_END_REGEXP);
	return match ? match.length + 1 : 1;
}
