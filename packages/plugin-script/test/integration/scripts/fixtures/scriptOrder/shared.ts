import * as pkg from "zod/package.json" with { type: "json" };

if (import.meta.environment === "client") {
	console.log(pkg.default.name);
}
