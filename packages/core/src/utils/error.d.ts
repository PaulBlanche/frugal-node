export function normalize(error: unknown, rootDir?: string): NormalizedErrror;

type NormalizedErrrorStack = {
	name?: string;
	location: { type: "file"; file: string; line: number; col: number } | { type: "native" };
}[];

export type NormalizedErrror = {
	name: string;
	message?: string;
	stack?: NormalizedErrrorStack;
	cause?: NormalizedErrror;
};
