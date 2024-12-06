import type { ServerData } from "../utils/serverData.js";

export type ResponseInit = {
	headers?: HeadersInit;
	status?: number;
	forceDynamic?: boolean;
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
}

export function isPageResponse<DATA extends ServerData>(
	response: unknown,
): response is PageResponse<DATA>;

export let PageResponse: PageResponseCreator;
