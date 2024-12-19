import { spawn } from "node:child_process";
import * as path from "node:path";
import { parseArgs } from "node:util";
import * as fs from "@frugal-node/core/utils/fs";
import chalk from "chalk";
import { CoverageReport } from "monocart-coverage-reports";

const options = parseArgs({
	strict: true,
	allowPositionals: false,
	options: {
		files: {
			type: "string",
			multiple: true,
			short: "f",
		},
		type: {
			type: "string",
			short: "t",
			default: "all",
		},
		names: {
			type: "string",
			multiple: true,
			short: "n",
		},
		only: {
			type: "boolean",
			short: "o",
		},
		coverage: {
			type: "boolean",
			multiple: false,
			short: "c",
			default: false,
		},
	},
});

/** @type {Record<string, string|undefined>} */
const testRunnerEnv = {
	FORCE_COLOR: "true",
};

const coverageTempDir = "./coverage/.tmp";
if (options.values.coverage) {
	// clean previous coverage
	try {
		await fs.remove(coverageTempDir, { recursive: true });
	} catch (error) {
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}

	process.env["NODE_V8_COVERAGE"] = coverageTempDir;
}

const args = [
	"--test",
	"--test-concurrency=1",
	"--test-reporter=spec",
	"--test-reporter-destination=stdout",
	"--experimental-test-module-mocks",
	"--experimental-test-snapshots",
	"--no-warnings=ExperimentalWarning",
	...(options.values.names ?? []).map((name) => `--test-name-pattern="${name}"`),
	options.values.only && "--test-only",
	(options.values.files !== undefined
		? options.values.files
		: parseType(options.values.type) === "unit"
			? ["**/test/unit/**/*.test.js"]
			: parseType(options.values.type) === "integration"
				? ["**/test/integration/**/*.test.js"]
				: ["**/*.test.js"]
	).join(" "),
].filter(/** @return {flag is string} */ (flag) => flag !== undefined);

console.log(
	chalk.gray(`${chalk.bold("Running tests with command")}\nnode\n  ${args.join("\n  ")}`),
);

const testProcess = spawn(process.execPath, args, {
	env: testRunnerEnv,
	stdio: "inherit",
});

testProcess.on("exit", async () => {
	let report = undefined;
	if (options.values.coverage) {
		const baseConfig = {
			cleanCache: true,
			dataDir: coverageTempDir,
			reports: ["v8", "lcovonly"],
			filter: {
				"**/test-utils/**": false,
				"**/test/**": false,
				"**/exports/**": false,
				"**/node_modules/**": false,
				"**/package.json": false,
				"**/*.d.ts": false,
				"**/packages/**": true,
			},
			all: {
				dir: "./packages",
			},
		};

		if (options.values.type === "unit") {
			report = new CoverageReport({
				...baseConfig,
				name: "Frugal unit test coverage",
				outputDir: "./coverage/unit/",
			});
		}

		if (options.values.type === "inte") {
			report = new CoverageReport({
				...baseConfig,
				name: "Frugal backend integration test coverage",
				outputDir: "./coverage/inte",
			});

			for await (const entry of await fs.readDir(coverageTempDir)) {
				if (entry.isFile() && !entry.name.startsWith("coverage")) {
					const a = await fs.readTextFile(path.resolve(coverageTempDir, entry.name));
					report.add(JSON.parse(a).result);
				}
			}
		}
	}

	if (report) {
		console.log("generating coverage");
		await report.generate();
	}
});

/**
 * @param {string} type
 * @returns {"all"|'unit'|'integration'}
 */
function parseType(type) {
	if (type === "unit") {
		return "unit";
	}
	if (type === "integration") {
		return "integration";
	}
	if (type === "inte") {
		return "integration";
	}
	return "all";
}
