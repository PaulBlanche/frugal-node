export type Level = "verbose" | "debug" | "info" | "warning" | "error" | "silent";

export type MessageOrError = string | Error | (() => string | Error);

export type LogOptions = {
	level?: Exclude<Level, "silent">;
	scope?: string;
};

export type LogConfig = {
	level: Level;
	scopes: Record<string, Level>;
	dateFormatter: Intl.DateTimeFormat;
	timeFormatter: Intl.DateTimeFormat;
};

export const LEVELS: Record<Level, number>;

export function config(config?: Partial<LogConfig>): void;

export function log(messageOrError: MessageOrError, options?: LogOptions): void;
