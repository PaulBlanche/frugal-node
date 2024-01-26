import { LEVELS } from "../log.js";

export type Level = keyof typeof LEVELS;

export type MessageOrError = string | Error | (() => string | Error);

export type LogOptions = {
	level?: Exclude<Level, "silent">;
	scope?: string;
};

export type Log = (messageOrError: MessageOrError, options?: LogOptions) => void;

export type LogConfig = {
	level: Level;
	scopes: Record<string, Level>;
	dateFormatter: Intl.DateTimeFormat;
	timeFormatter: Intl.DateTimeFormat;
};
