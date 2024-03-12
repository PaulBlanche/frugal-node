export type Node = {
	importCount: number;
	filePath: string;
	parsed: boolean;
	children: Record<string, boolean>;
};

export function dependencies(path: string): Promise<string[]>;
