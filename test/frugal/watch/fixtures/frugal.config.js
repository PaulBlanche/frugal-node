/** @type {import('../../../../packages/frugal/exports/config/index.ts').Config} */
export default {
	self: import.meta.url,
	outdir: "./dist/",
	pages: ["./page1.ts", "./page2.ts"],
	log: { level: "silent" },
};
