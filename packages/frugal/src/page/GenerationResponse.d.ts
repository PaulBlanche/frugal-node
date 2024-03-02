import * as webStream from "node:stream/web";
import { PageResponse } from "../page/PageResponse.ts";
import { JsonValue } from "../utils/jsonValue.ts";

export type Init<DATA extends JsonValue> = {
	path: string;
	moduleHash: string;
	configHash: string;
	render: (data: DATA) => string | webStream.ReadableStream<string>;
};

export type SerializedGenerationResponse = {
	path: string;
	hash: string;
	body?: string;
	headers: [string, string][];
	status: number;
};

export interface GenerationResponse {
	readonly path: string;
	readonly hash: string;
	readonly body: string | webStream.ReadableStream<string> | undefined;
	readonly headers: Headers;
	readonly status: number;
	serialize(): Promise<SerializedGenerationResponse>;
}

interface GenerationResponseMaker {
	create<DATA extends JsonValue>(
		response: PageResponse<DATA>,
		init: Init<DATA>,
	): GenerationResponse;
}

export const GenerationResponse: GenerationResponseMaker;

export function toResponse(response: GenerationResponse | SerializedGenerationResponse): Response;
