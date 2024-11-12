import * as url from "node:url";
import * as esbuild from "esbuild";
import * as fs from "../../utils/fs.js";

const result = await esbuild.build({
	entryPoints: [url.fileURLToPath(new URL("./livereload.script.js", import.meta.url))],
	write: false,
	bundle: true,
	minify: true,
	target: "es6",
});

await fs.writeTextFile(
	url.fileURLToPath(new URL("./livereload.min.js", import.meta.url)),
	`export default ${JSON.stringify(result.outputFiles[0].text)}`,
);
