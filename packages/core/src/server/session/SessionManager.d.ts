import type { CookieConfig } from "../../utils/cookies.js";
import type { Session } from "./Session.js";
import type { SessionStorage } from "./SessionStorage.js";

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
