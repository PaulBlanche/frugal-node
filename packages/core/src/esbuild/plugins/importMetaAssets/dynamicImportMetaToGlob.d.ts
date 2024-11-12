import type * as swc from "@swc/core";

export function dynamicImportToGlob(node: swc.Argument): string | undefined;

export class DynamicUrlError extends Error {}
