import { spawn } from "node:child_process";
import * as url from "node:url";
import { parseArgs } from "node:util";
import chalk from "chalk";

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

const c8Args = [
	"--all",
	"--src=./packages",
	`--reports-dir=${url.fileURLToPath(import.meta.resolve(`../../coverage/${options.values.type}`))}`,
	`--temp-directory=${url.fileURLToPath(import.meta.resolve(`../../coverage/.tmp/${options.values.type}`))}`,
	"--experimental-monocart",
	"--reporter=v8",
	"--reporter=lcovonly",
	"--exclude=**/test-utils/**",
	"--exclude=**/test/**",
	"--exclude=**/exports/**",
];

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

const c8BinPath = url.fileURLToPath(
	new URL(
		(
			await import(new URL("./package.json", import.meta.resolve("c8")).toString(), {
				with: { type: "json" },
			})
		).default.bin,
		import.meta.resolve("c8"),
	),
);

const spawnBin = options.values.coverage ? c8BinPath : process.execPath;
const spawnArgs = options.values.coverage ? [...c8Args, process.execPath, ...args] : args;

const nodeCommandLog = `${process.execPath}\n  ${args.join("\n  ")}`;
const c8CommandLog = `${c8BinPath}\n  ${c8Args.join("\n  ")}`;

console.log(
	chalk.gray(
		`${chalk.bold("Running tests with command")}\n${options.values.coverage ? `${c8CommandLog}\n${nodeCommandLog}` : `${nodeCommandLog}`}`,
	),
);

spawn(spawnBin, spawnArgs, {
	env: {
		FORCE_COLOR: "true",
	},
	stdio: "inherit",
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
