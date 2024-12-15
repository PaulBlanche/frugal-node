import type { CookieConfig } from "../../utils/cookies.js";
import type { SessionStorage } from "./SessionManager.js";

interface CookieSessionStorageCreator {
	create(cookieConfig?: Partial<CookieConfig>): SessionStorage;
}

export let CookieSessionStorage: CookieSessionStorageCreator;
