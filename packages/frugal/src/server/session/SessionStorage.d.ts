export type SessionData = Record<string, unknown>;

export interface SessionStorage {
	create(
		data: SessionData,
		options: { headers: Headers; expires: number | undefined },
	): Promise<string> | string;
	get(
		id: string,
		options: { headers: Headers },
	): Promise<SessionData | undefined> | SessionData | undefined;
	update(
		id: string,
		data: SessionData,
		options: {
			headers: Headers;
			expires?: number | undefined;
		},
	): Promise<void> | void;
	delete(id: string, options: { headers: Headers }): Promise<void> | void;
}
