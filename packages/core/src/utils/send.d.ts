export type SendOptions = {
	rootDir: string;
	compressionExt: string[];
};

export function send(request: Request, options: SendOptions): Promise<Response | undefined>;
