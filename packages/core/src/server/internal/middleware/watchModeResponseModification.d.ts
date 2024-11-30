import type { Next } from "../../middleware.js";
import type { AuthContext } from "./auth.js";

export function watchModeResponseModification(
	context: AuthContext,
	next: Next<AuthContext>,
): Promise<Response>;
