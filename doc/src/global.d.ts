declare module "*.module.css" {
	const classNames: {
		[className: string]: string;
	};
	export = classNames;
}

declare module "*.svg" {
	const svg: {
		href: string;
		viewBox: string;
	};
	export = svg;
}
