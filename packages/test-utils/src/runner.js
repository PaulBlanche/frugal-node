import { spawn } from "node:child_process";
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

const args = [
	"--test",
	...(options.values.coverage
		? [
				"--experimental-test-coverage",
				"--test-reporter=lcov",
				"--test-reporter-destination=lcov.info",
				"--test-coverage-exclude=**/test-utils/**/*",
				"--test-coverage-exclude=**/test/**/*",
			]
		: []),
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

spawn(process.execPath, args, {
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
