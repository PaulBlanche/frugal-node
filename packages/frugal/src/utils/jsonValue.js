import * as _type from "./_type/jsonValue.js";

/** @typedef {_type.JsonValue} JsonValue */
/** @typedef {_type.HashableJsonValue} HashableJsonValue */

/**
 * @param {_type.JsonValue} value
 * @param {unknown[]} [visited]
 * @returns {_type.HashableJsonValue}
 */
export function hashableJsonValue(value, visited = []) {
	if (
		value === undefined ||
		value === null ||
		typeof value === "number" ||
		typeof value === "string" ||
		typeof value === "boolean"
	) {
		return value;
	}

	let ref = -1;
	for (let i = 0; i < visited.length; i++) {
		const entry = visited[i];
		if (entry === value) {
			ref = i;
			break;
		}
	}

	if (ref !== -1) {
		return [2, ref];
	}

	visited.push(value);

	if (Array.isArray(value)) {
		return [0, value.map((entry) => hashableJsonValue(entry, visited))];
	}

	if (!isLiteralObject(value)) {
		throw new HashableJsonError(`Can't handle type "${typeof value}" in JsonValue`);
	}

	return [
		1,
		Object.keys(value)
			.sort()
			.map((key) => {
				return /** @type {[string, _type.HashableJsonValue]} */ ([
					key,
					hashableJsonValue(value[key], visited),
				]);
			}),
	];
}

/**
 * @param {any} value
 */
function isLiteralObject(value) {
	return (
		Object.is(Object.getPrototypeOf(value), Object.prototype) &&
		Object.is(value.constructor, Object)
	);
}

export class HashableJsonError extends Error {}
