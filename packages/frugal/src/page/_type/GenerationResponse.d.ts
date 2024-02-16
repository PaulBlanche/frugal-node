import type * as webStream from "node:stream/web";
import type { JsonValue } from "../../utils/jsonValue.js";

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
