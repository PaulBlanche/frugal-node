/** @import * as self from "./log.js" */

import chalk from "chalk";

/** @satisfies {Record<self.Level, number>} */
export const LEVELS = /** @type {const} */ ({
	verbose: 0,
	debug: 10,
	info: 20,
	warning: 30,
	error: 40,
	silent: Number.POSITIVE_INFINITY,
});

const GLOBAL_CONFIG = /** @type {self.LogConfig} */ ({
	level: "info",
	scopes: {},
	timeFormatter: new Intl.DateTimeFormat("en-US", {
		hour12: false,
		timeZone: "UTC",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		fractionalSecondDigits: 3,
		timeZoneName: "short",
	}),
	dateFormatter: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }),
});

/** @type {self.config} */
export function config(config = {}) {
	Object.assign(GLOBAL_CONFIG, config);
}

/** @type {self.log} */
export function log(messageOrError, options = {}) {
	const scope = options?.scope ?? "???";
	const level = options?.level ?? (messageOrError instanceof Error ? "error" : "info");

	if (!(level in LEVELS) || /** @type {any} */ (level) === "silent") {
		return;
	}

	const currentLevel = GLOBAL_CONFIG.scopes[scope] ?? GLOBAL_CONFIG.level;

	if (LEVELS[currentLevel] > LEVELS[level]) {
		return;
	}

	const now = new Date();
	const date = chalk.gray(
		`${GLOBAL_CONFIG.dateFormatter.format(now)} ${GLOBAL_CONFIG.timeFormatter.format(now)}`,
	);
	const message = `${date} ${formatLevel(level)} ${formatScope(scope, level)} ${formatMessage(
		messageOrError,
		level,
	)}`;

	console.log(message);
}

/**
 * @param {self.MessageOrError} messageOrError
 * @param {self.Level} level
 * @returns {string}
 */
function formatMessage(messageOrError, level) {
	const message = formatMessageContent(messageOrError);

	switch (level) {
		case "warning":
			return chalk.yellow(message);
		case "error":
			return chalk.redBright(message);
		case "debug":
		case "verbose": {
			return chalk.gray(message);
		}
		default:
			return message;
	}
}

/**
 * @param {self.MessageOrError} messageOrError
 * @returns
 */
function formatMessageContent(messageOrError) {
	if (typeof messageOrError === "function") {
		return formatMessageContent(messageOrError());
	}

	if (messageOrError instanceof Error) {
		return formatError(messageOrError);
	}

	return String(messageOrError);
}

/**
 * @param {Error} error
 * @returns {string}
 */
function formatError(error) {
	const stack = error.stack ?? `${error.name} : ${error.message}\n    [no stack]`;

	const msg = [stack];
	if (error.cause) {
		msg.push(`\ncaused by ${formatCause(error.cause)}`);
	}

	return msg.join("\n");
}

/**
 * @param {any} cause
 * @returns {string}
 */
function formatCause(cause) {
	if (cause instanceof Error) {
		return formatError(cause);
	}

	return String(cause);
}

/**
 * @param {string} scope
 * @param {self.Level} level
 * @returns {string}
 */
function formatScope(scope, level) {
	const formattedScope = chalk.bold(` ${scope} >`);

	switch (level) {
		case "warning":
			return chalk.yellow(formattedScope);
		case "error":
			return chalk.redBright(formattedScope);
		case "debug":
		case "verbose": {
			return chalk.gray(formattedScope);
		}
		default:
			return formattedScope;
	}
}

/**
 * @param {Exclude<self.Level, "silent">} level
 * @returns {string}
 */
function formatLevel(level) {
	const formattedLevel = level.toUpperCase().padEnd(7);
	switch (level) {
		case "debug":
		case "verbose": {
			return chalk.bgGray(
				`${chalk.gray("[")}${chalk.black(formattedLevel)}${chalk.gray("]")}`,
			);
		}
		case "info": {
			return chalk.bgWhiteBright(
				`${chalk.whiteBright("[")}${chalk.black(formattedLevel)}${chalk.whiteBright("]")}`,
			);
		}
		case "warning": {
			return chalk.bgYellowBright(
				`${chalk.yellowBright("[")}${chalk.black(formattedLevel)}${chalk.yellowBright(
					"]",
				)}`,
			);
		}
		case "error": {
			return chalk.bgRedBright(
				`${chalk.redBright("[")}${chalk.black(formattedLevel)}${chalk.redBright("]")}`,
			);
		}
	}
}
