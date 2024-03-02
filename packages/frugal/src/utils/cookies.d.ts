export type Cookie = {
	name: string;
	value: string;
	expires?: Date | number;
	maxAge?: number;
	domain?: string;
	path?: string;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: "strict" | "lax" | "none";
};

export type CookieConfig = Partial<Omit<Cookie, "value">>;

export function setCookie(headers: Headers, cookie: Cookie): void;

export function getCookies(headers: Headers): Record<string, string>;
