/** @type {import("../../../../../packages/frugal/exports/index.ts").Config} */
export const config = {
	self: import.meta.url,
	pages: ["./page1.ts", "./page2.ts"],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
