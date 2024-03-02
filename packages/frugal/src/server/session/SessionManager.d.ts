import { CookieConfig } from "../../utils/cookies.js";
import { PrivateSession } from "./Session.js";
import { SessionStorage } from "./SessionStorage.js";

export type SessionManagerConfig = {
	storage: SessionStorage;
	cookie?: CookieConfig;
};

export interface SessionManager {
	get(headers: Headers): Promise<PrivateSession>;

	persist(session: PrivateSession, headers: Headers): Promise<void>;

	destroy(session: PrivateSession, headers: Headers): Promise<void>;
}

interface SessionManagerMaker {
	create(config: SessionManagerConfig): SessionManager;
}

export const SessionManager: SessionManagerMaker;
