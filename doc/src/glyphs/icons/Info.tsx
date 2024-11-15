import type * as preact from "preact";
import info from "./info.svg";

export function Info({
	xmlns = "http://www.w3.org/2000/svg",
	viewBox = info.viewBox,
	fill = "currentColor",
	...rest
}: preact.JSX.IntrinsicElements["svg"]) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: icons dont need title
		<svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
			<use href={info.href} />
		</svg>
	);
}
