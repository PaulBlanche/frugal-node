export function functionConfigContent() {
	return {
		handler: "index.mjs",
		runtime: "nodejs20.x",
		launcherType: "Nodejs",
	};
}

export function globalConfigContent() {
	return {
		version: 3,
		routes: [{ handle: "filesystem" }, { src: "^(?:/(.*))$", dest: "/", check: true }],
	};
}
