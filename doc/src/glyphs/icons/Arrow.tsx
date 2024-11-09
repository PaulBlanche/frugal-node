import arrow from "./arrow.svg";

type ArrowProps = preact.JSX.IntrinsicElements["svg"] & { $type?: keyof typeof TRANSFORM };

const TRANSFORM = {
	right: undefined,
	left: "rotate(180)",
};

export function Arrow({
	xmlns = "http://www.w3.org/2000/svg",
	viewBox = arrow.viewBox,
	fill = "currentColor",
	$type = "right",
	...rest
}: ArrowProps) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: icons dont need title
		<svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
			<use transform={TRANSFORM[$type]} transform-origin="50% 50%" href={arrow.href} />
		</svg>
	);
}
