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
		routes: [{ src: "^(?:/(.*))$", dest: "/", check: true }, { handle: "filesystem" }],
	};
}
