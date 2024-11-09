import * as fs from "node:fs";
import * as path from "node:path";

export async function store() {
	return JSON.parse(
		await fs.promises.readFile(path.resolve(import.meta.dirname, "../../../data.json"), {
			encoding: "utf-8",
		}),
	);
}
