import type * as preact from "preact";
import toc from "./toc.svg";

export function Toc({
	xmlns = "http://www.w3.org/2000/svg",
	viewBox = toc.viewBox,
	stroke = "currentColor",
	...rest
}: preact.JSX.IntrinsicElements["svg"]) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: icons dont need title
		<svg xmlns={xmlns} viewBox={viewBox} stroke={stroke} {...rest}>
			<use href={toc.href} />
		</svg>
	);
}
