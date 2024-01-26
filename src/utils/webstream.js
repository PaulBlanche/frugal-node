import * as webstream from "stream/web";

export * from "stream/web";

/**
 * @param {webstream.ReadableStream<string>} stream
 * @returns {Promise<string>}
 */
export async function readStream(stream) {
	const chunks = [];

	for await (const chunk of stream) {
		chunks.push(chunk);
	}

	return chunks.join("");
}
