import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

runTscInProjectRootOutsideNodeModules();

function runTscInProjectRootOutsideNodeModules() {
	const projectRootPath = path.resolve("./");
	const nodeModulesPath = path.resolve("./node_modules");
	const tsConfigPath = path.resolve("./tsconfig.json");
	const parsedTsConfig = ts.parseConfigFileTextToJson(
		tsConfigPath,
		fs.readFileSync(tsConfigPath, { encoding: "utf8" }),
	);

	/** @type {ts.FormatDiagnosticsHost} */
	const formatHost = {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	};

	const tsConfig = ts.parseJsonConfigFileContent(
		parsedTsConfig.config,
		ts.sys,
		path.resolve("./"),
	);

	const program = ts.createProgram({
		rootNames: tsConfig.fileNames,
		options: tsConfig.options,
	});

	const diagnostics = ts.getPreEmitDiagnostics(program);

	const filteredDiagnostics = diagnostics.reduce(
		(diagnostics, diagnostic) => {
			if (diagnostic.file && diagnostic.start) {
				const absolutePathToCurrentFile = path.resolve(diagnostic.file.fileName);
				if (
					absolutePathToCurrentFile.startsWith(projectRootPath) &&
					!absolutePathToCurrentFile.startsWith(nodeModulesPath)
				) {
					diagnostics.push(diagnostic);
				}
			} else {
				diagnostics.push(diagnostic);
			}

			return diagnostics;
		},
		/** @type {ts.Diagnostic[]} */ ([]),
	);

	console.error(ts.formatDiagnosticsWithColorAndContext(filteredDiagnostics, formatHost));

	if (filteredDiagnostics.length > 0) {
		process.exit(-1);
	}
}
