export type SendOptions = {
	rootDir: string;
};

export function send(request: Request, options: SendOptions): Promise<Response>;
