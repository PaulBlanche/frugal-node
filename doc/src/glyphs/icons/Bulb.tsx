import bulb from "./bulb.svg";

export function Bulb({
	xmlns = "http://www.w3.org/2000/svg",
	viewBox = bulb.viewBox,
	fill = "currentColor",
	...rest
}: preact.JSX.IntrinsicElements["svg"]) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: icons dont need title
		<svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
			<use href={bulb.href} />
		</svg>
	);
}
