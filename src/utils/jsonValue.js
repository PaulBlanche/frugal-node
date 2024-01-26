import * as _type from "./_type/jsonValue.js";

/** @typedef {_type.JsonValue} JsonValue */
/** @typedef {_type.HashableJsonValue} HashableJsonValue */

/**
 * @param {_type.JsonValue} value
 * @returns {_type.HashableJsonValue}
 */
export function hashableJsonValue(value) {
	if (value === undefined || value === null || typeof value !== "object") {
		return value;
	}

	if (Array.isArray(value)) {
		return [0, value.map((entry) => hashableJsonValue(entry))];
	}

	return [
		1,
		Object.keys(value)
			.sort()
			.map((key) => {
				return /** @type {[string, _type.HashableJsonValue]} */ ([
					key,
					hashableJsonValue(value[key]),
				]);
			}),
	];
}
