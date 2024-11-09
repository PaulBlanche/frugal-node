import * as fs from "node:fs";
import * as url from "node:url";

export const store = async () =>
	JSON.parse(
		await fs.promises.readFile(url.fileURLToPath(import.meta.resolve("../../../data.json")), {
			encoding: "utf-8",
		}),
	);
