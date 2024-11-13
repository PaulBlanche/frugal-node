import type * as preact from "preact";
import link from "./link.svg";

export function Link({
	xmlns = "http://www.w3.org/2000/svg",
	viewBox = link.viewBox,
	fill = "currentColor",
	...rest
}: preact.JSX.IntrinsicElements["svg"]) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: icons dont need title
		<svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
			<use href={link.href} />
		</svg>
	);
}
