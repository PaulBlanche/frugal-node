import type * as marked from "marked";
import * as preact from "preact";
import { render } from "preact-render-to-string";
import { Callout } from "./Callout.tsx";

const CALLOUT_HINT = /^>\s*\[!(.*)\]/m;
const CALLOUT_REGEX = /^>\s*\[!(.*)\](.*)?\n((?:>.*\n)*)$/m;

type CalloutToken = {
	type: "callout";
	raw: string;
	kind: string;
	title: marked.Token[];
	text: marked.Token[];
};

export function calloutExtension(): marked.TokenizerAndRendererExtension {
	return {
		name: "callout",
		level: "block",

		start(src: string) {
			return src.match(CALLOUT_HINT)?.index;
		},

		tokenizer(this: marked.TokenizerThis, src: string): CalloutToken | undefined {
			const match = CALLOUT_REGEX.exec(src);
			if (match && match.index === 0) {
				const title: marked.Token[] = [];
				this.lexer.inline(match[2], title);

				const text: marked.Token[] = [];
				this.lexer.blockTokens(match[3].replace(/^>[^\S\r\n]*/gm, ""), text);

				return {
					type: "callout",
					raw: match[0],
					kind: match[1],
					title,
					text,
				};
			}

			return undefined;
		},

		renderer(this: marked.RendererThis, token: marked.Tokens.Generic) {
			const calloutToken = token as CalloutToken;

			return render(
				preact.h(Callout, {
					kind: calloutToken.kind,
					title: this.parser.parseInline(calloutToken.title),
					content: this.parser.parse(calloutToken.text),
				}),
			);
		},
	};
}
