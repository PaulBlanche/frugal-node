import type { Context } from "../context.js";
import type { Middleware } from "../middleware.js";

export type Encoding = "br" | "gzip" | "deflate" | "identity";

export type CompressValue = boolean;

type Config = {
	rootDir?: string;
};

export function staticFile(config: Config): Middleware<Context>;
