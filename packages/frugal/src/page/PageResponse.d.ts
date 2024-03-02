import { JsonValue } from "../utils/jsonValue.ts";
import { ResponseInit } from "./PageDescriptor.js";

interface BaseResponse {
	readonly headers: Headers;
	readonly status: number;
}

export interface DataResponse<DATA extends JsonValue> extends BaseResponse {
	readonly type: "data";
	readonly data: DATA;
	readonly dataHash: string;
}

export interface EmptyResponse extends BaseResponse {
	readonly type: "empty";
	readonly data: undefined;
	readonly dataHash: string;
}

export type PageResponse<DATA extends JsonValue> = EmptyResponse | DataResponse<DATA>;

export const FORCE_GENERATE_COOKIE: string;

interface PageResponseMaker {
	data<DATA extends JsonValue>(data: DATA, init?: ResponseInit): DataResponse<DATA>;
	empty(init?: ResponseInit): EmptyResponse;
}

export const PageResponse: PageResponseMaker;
