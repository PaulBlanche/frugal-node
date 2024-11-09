import type { CookieConfig } from "../../utils/cookies.js";
import type { SessionStorage } from "./SessionStorage.ts";

interface CookieSessionStorageCreator {
	create(cookieConfig?: Partial<CookieConfig>): SessionStorage;
}

export let CookieSessionStorage: CookieSessionStorageCreator;
