declare module "*.module.css" {
	const classNames: {
		[className: string]: string;
	};
	//@ts-expect-error: trust me bro
	export = classNames;
}

declare module "*.svg" {
	const svg: {
		href: string;
		viewBox: string;
	};
	//@ts-expect-error: trust me bro
	export = svg;
}
