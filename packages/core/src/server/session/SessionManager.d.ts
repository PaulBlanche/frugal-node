import type { CookieConfig } from "../../utils/cookies.js";
import type { Session } from "./Session.js";

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

export type SessionManagerConfig = {
	storage: SessionStorage;
	cookie: Omit<CookieConfig, "expires">;
};

export interface SessionManager {
	get(headers: Headers): Promise<Session>;

	persist(session: Session, headers: Headers): Promise<void>;

	destroy(session: Session, headers: Headers): Promise<void>;
}

interface SessionManagerCreator {
	create(config: SessionManagerConfig): SessionManager;
}

export let SessionManager: SessionManagerCreator;
