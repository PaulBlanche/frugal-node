import { clsx } from "clsx";
import type * as preact from "preact";
import { Link } from "../../glyphs/icons/Link.tsx";
import * as sr from "../../styles/screen-reader.module.css";
import * as heading from "./Heading.module.css";

type HeadingProps = {
	depth: number;
	text: string;
} & preact.JSX.IntrinsicElements["h1"];

export function Heading({ depth, text, id, ...props }: HeadingProps) {
	const Heading = (depth > 0 && depth < 6 ? `h${depth}` : undefined) as
		| "h1"
		| "h2"
		| "h3"
		| "h4"
		| "h5"
		| "h6"
		| undefined;

	if (Heading === undefined) {
		return <></>;
	}

	return (
		<Heading {...props} id={id} class={clsx(props.class, heading["heading"])}>
			{id && (
				<a href={`#${id}`} tabIndex={-1} class={heading["anchor"]}>
					<span
						class={sr["hidden"]}
						//biome-ignore lint/security/noDangerouslySetInnerHtml: escaped by marked
						dangerouslySetInnerHTML={{ __html: `Link to section ${text}` }}
					/>
					<Link class={heading["icon"]} height="15px" aria-hidden="true" />
				</a>
			)}
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: escaped by marked */}
			<span dangerouslySetInnerHTML={{ __html: text }} />
		</Heading>
	);
}
