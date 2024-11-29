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
}

export interface EmptyResponse extends BaseResponse {
	readonly type: "empty";
	readonly data: undefined;
	readonly dataHash: string;
}

export type PageResponse<DATA extends ServerData> = EmptyResponse | DataResponse<DATA>;

interface PageResponseCreator {
	data<DATA extends ServerData>(data: DATA, init?: ResponseInit): DataResponse<DATA>;
	empty(init?: ResponseInit): EmptyResponse;
}

export function isPageResponse<DATA extends ServerData>(
	response: unknown,
): response is PageResponse<DATA>;

export let PageResponse: PageResponseCreator;
