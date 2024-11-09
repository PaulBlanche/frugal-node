import { Hash } from "@frugal-node/core/utils/Hash";
import { type HeadManager, headManagerContext } from "@frugal-node/preact";
import Slugger from "github-slugger";
import * as marked from "marked";
import * as preact from "preact";
import { render } from "preact-render-to-string";
import * as link from "../../styles/link.module.css";
import { Code, type CodeProps } from "../code/Code.tsx";
import * as blockquote from "./Blockquote.module.css";
import * as codespan from "./CodeSpan.module.css";
import { Heading } from "./Heading.tsx";

export class Renderer extends marked.Renderer {
	#toc: { label: string; id: string; level: number }[];
	#slugger = new Slugger();
	#headManager: HeadManager | undefined;
	#id: number;

	constructor() {
		super();
		this.#toc = [];
		this.#id = 0;
	}

	get toc() {
		return this.#toc;
	}

	reset() {
		this.#toc = [];
		this.#slugger.reset();
		this.#id = 0;
	}

	set headManager(headManager: HeadManager | undefined) {
		this.#headManager = headManager;
	}

	heading({ tokens, depth }: marked.Tokens.Heading) {
		const text = this.parser.parseInline(tokens);
		const id = `heading-${this.#slugger.slug(text)}`;

		if (depth === 2) {
			this.#toc.push({ id, label: text, level: 0 });
		}
		if (depth === 3) {
			this.#toc.push({ id, label: text, level: 1 });
		}

		return render(
			preact.h(Heading, {
				depth,
				id,
				text,
			}),
		);
	}

	code({ text, lang }: marked.Tokens.Code) {
		return render(
			preact.h(
				headManagerContext.Provider,
				{ value: this.#headManager },
				preact.h(Code, getCodeProps(text, this.#id++, lang)),
			),
		);
	}

	codespan({ text }: marked.Tokens.Codespan): string {
		return `<code class="${codespan["codeSpan"]}">${text}</code>`;
	}

	link({ href, tokens }: marked.Tokens.Link) {
		const text = this.parser.parseInline(tokens);
		if (hasProtocol(href)) {
			return `<a class="${link["link"]}" href="${href}" rel="noopener noreferrer">${text}</a>`;
		}
		return `<a class="${link["link"]}" href="${href}">${text}</a>`;
	}

	blockquote({ tokens }: marked.Tokens.Blockquote) {
		const text = this.parser.parse(tokens);
		return `<blockquote class="${blockquote["blockquote"]}">${text}</blockquote>`;
	}
}

const PROTOCOL_REGEXP = /^(?:[a-z+]+:)?\/\//;
export function hasProtocol(href: string) {
	if (href === undefined) {
		return false;
	}
	return PROTOCOL_REGEXP.test(href);
}

function getCodeProps(code: string, id: number, language?: string): CodeProps {
	const file: CodeProps["files"][number] = { code, filename: "" };
	const props: CodeProps = { files: [file], id: `markdown-code-${id}` };

	if (language === undefined) {
		return props;
	}

	const directiveList = language.split(" ");
	const cleanLanguage = directiveList[0];

	props.files[0].language = cleanLanguage;

	for (const directive of directiveList.slice(1)) {
		const splitIndex = directive.indexOf("=");
		const name = directive.slice(0, splitIndex === -1 ? undefined : splitIndex);
		const value = directive.slice(splitIndex + 1);
		switch (name) {
			case "lines": {
				props.files[0].highlights = value
					.slice(1, -1)
					.split(",")
					.map((range) => {
						const [startStr, endStr = startStr] = range.split("-");
						return [Number(startStr), Number(endStr)];
					});
				break;
			}
			case "filename": {
				props.files[0].filename = value;
				break;
			}
			case "no-line-numbers": {
				props.noLineNumbers = true;
				break;
			}
		}
	}

	return props;
}
