import * as fs from "node:fs";

export async function store(path: URL) {
	return JSON.parse(await fs.promises.readFile(path, { encoding: "utf-8" }));
}
