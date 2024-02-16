import type * as http from "../../../utils/http.js";
import type { SessionStorage } from "../sessionStorage.js";

export type SessionManagerConfig = {
	storage: SessionStorage;
	cookie?: http.CookieConfig;
};
