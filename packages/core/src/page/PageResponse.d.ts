import type { ServerData } from "../utils/serverData.js";

type BaseInit = {
	headers?: HeadersInit;
	forceDynamic?: boolean;
};

export type ResponseInit = BaseInit & {
	status?: number;
};

export type RedirectInit = BaseInit & {
	location: string;
	status?: 301 | 302 | 303 | 307 | 308;
};

interface BaseResponse {
	readonly headers: Headers;
	readonly status: number;
	readonly forceDynamic: boolean;
}

export interface DataResponse<DATA extends ServerData> extends BaseResponse {
	readonly type: "data";
	readonly data: DATA;
	readonly dataHash: string;
	readonly maxAge: number;
}

export interface EmptyResponse extends BaseResponse {
	readonly type: "empty";
	readonly data: undefined;
	readonly dataHash: string;
	readonly maxAge: 0;
}

export type PageResponse<DATA extends ServerData> = EmptyResponse | DataResponse<DATA>;

interface PageResponseCreator {
	data<DATA extends ServerData>(
		data: DATA,
		init?: ResponseInit & { maxAge?: number },
	): DataResponse<DATA>;
	empty(init?: ResponseInit): EmptyResponse;
	redirect(init: RedirectInit): EmptyResponse;
}

export function isPageResponse<DATA extends ServerData>(
	response: unknown,
): response is PageResponse<DATA>;

export let PageResponse: PageResponseCreator;
