import { run } from "node:test";
import * as reporters from "node:test/reporters";
import { parseArgs } from "node:util";

const options = parseArgs({
	strict: true,
	allowPositionals: false,
	options: {
		concurrency: {
			type: "string",
			multiple: false,
			short: "c",
			default: "false",
		},
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
	},
});

run({
	concurrency: parseConcurrency(options.values.concurrency),
	globPatterns:
		options.values.files !== undefined
			? options.values.files
			: parseType(options.values.type) === "unit"
				? ["**/test/unit/**/*.test.js"]
				: parseType(options.values.type) === "integration"
					? ["**/test/integration/**/*.test.js"]
					: ["**/*.test.js"],
	testNamePatterns: options.values.names,
	only: options.values.only,
})
	.compose(reporters.spec)
	.pipe(process.stdout);

/**
 * @param {string} concurrency
 * @returns {boolean|number}
 */
function parseConcurrency(concurrency) {
	if (concurrency === "true") {
		return true;
	}
	const numberConcurrency = Number(concurrency);
	if (Number.isNaN(numberConcurrency)) {
		return false;
	}
	return numberConcurrency;
}

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
