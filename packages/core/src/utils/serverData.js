/** @import * as self from "./serverData.js" */

import * as zod from "zod";
import { Hash } from "./Hash.js";

const GLOBAL_STATE = {
	UID: "",
	PLACEHOLDER_REGEXP: /./,
};

const ESCAPE_REGEXP = /[<>\/\u2028\u2029]/g;
/** @type {Record<string, string>} */
const ESCAPE_CHARS = {
	"<": "\\u003C",
	">": "\\u003E",
	"/": "\\u002F",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029",
};

/** @type {self._initGlobalState} */
export function _initGlobalState(uid) {
	GLOBAL_STATE.UID = uid;
	GLOBAL_STATE.PLACEHOLDER_REGEXP = new RegExp(`":${uid}:(\\d+):"`, "g");
}

_initGlobalState(Math.random().toString(36).toUpperCase().slice(2));

/** @type {self.serialize} */
export function serialize(serverData) {
	process.env["NODE_ENV"] !== "production" && assertServerData(serverData);

	if (typeof serverData === "undefined") {
		return String(serverData);
	}

	/** @type {string[]} */
	const values = [];

	const json = JSON.stringify(serverData, function (key, toJsonValue) {
		// toJSON methods are called before the replacer. To get the real value
		// associated to the key (and not the "jsonified" one) we must use
		// `this`.
		const value = this[key];

		const result = _serializeValue(value, values);

		if (result !== undefined) {
			return result;
		}

		return toJsonValue;
	});

	return json
		.replace(ESCAPE_REGEXP, (char) => ESCAPE_CHARS[char])
		.replace(GLOBAL_STATE.PLACEHOLDER_REGEXP, (_, index) => {
			const i = Number(index);
			return values[i];
		});
}

/**
 *
 * @param {unknown} value
 * @param {unknown[]} values
 * @returns
 */
function _serializeValue(value, values) {
	if (typeof value === "undefined") {
		values.push("undefined");
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value === Number.POSITIVE_INFINITY) {
		values.push("Infinity");
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value === Number.NEGATIVE_INFINITY) {
		values.push("-Infinity");
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (Number.isNaN(value)) {
		values.push("NaN");
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (typeof value === "bigint") {
		values.push(value.toString());
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (Array.isArray(value)) {
		const isSparse = value.filter(() => true).length !== value.length;
		if (isSparse) {
			values.push(
				`Array.prototype.slice.call(${serialize(Object.assign({ length: value.length }, value))})`,
			);
			return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
		}
	}

	if (typeof value === "string") {
		values.push(`"${value}"`);
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value instanceof Date) {
		values.push(`new Date("${value.toISOString()}")`);
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value instanceof URL) {
		values.push(`new URL("${value.toString()}")`);
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value instanceof Map) {
		values.push(`new Map(${serialize(Array.from(value.entries()))})`);
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	if (value instanceof Set) {
		values.push(`new Set(${serialize(Array.from(value.values()))})`);
		return `:${GLOBAL_STATE.UID}:${values.length - 1}:`;
	}

	return undefined;
}

// Lots of @__PURE__ annotations are needed because zod function are not
// declared as side-effect free, so esbuild bundle all of them without
// tree-shaking. Each time a builder from zod is called, the annotation must be
// added.

/** @type {zod.Schema<self.ServerData>} */
const serverDataSchema = /* @__PURE__ */ zod.union([
	/* @__PURE__ */
	zod.string(),
	/* @__PURE__ */ zod.number(),
	/* @__PURE__ */ zod.nan(),
	/* @__PURE__ */ zod.boolean(),
	/* @__PURE__ */ zod.null(),
	/* @__PURE__ */ zod.undefined(),
	/* @__PURE__ */ zod.date(),
	/* @__PURE__ */ zod.map(
		/* @__PURE__ */ zod.lazy(() => serverDataSchema),
		/* @__PURE__ */ zod.lazy(() => serverDataSchema),
	),
	/* @__PURE__ */ zod.set(/* @__PURE__ */ zod.lazy(() => serverDataSchema)),
	/* @__PURE__ */ zod.instanceof(URL),
	/* @__PURE__ */ zod.record(
		/* @__PURE__ */ zod.lazy(() => serverDataSchema),
		/* @__PURE__ */ zod.lazy(() => serverDataSchema),
	),
	/* @__PURE__ */ zod.array(/* @__PURE__ */ zod.lazy(() => serverDataSchema)),
]);

/** @type {self.transformToSerializable} */
export function transformToSerializable(value, selector, key = "root") {
	const map = selector(value, key);

	if (map !== undefined) {
		return map();
	}

	if (
		value === null ||
		value === undefined ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean" ||
		value instanceof Date ||
		value instanceof URL
	) {
		return value;
	}

	if (value instanceof Map) {
		const transformed = new Map();
		let i = 0;
		for (const [name, val] of value.entries()) {
			transformed.set(
				transformToSerializable(name, selector, `${key}.mapkey-${i++}`),
				transformToSerializable(val, selector, `${key}.mapval-${i++}`),
			);
		}
		return transformed;
	}

	if (value instanceof Set) {
		const transformed = new Set();
		let i = 0;
		for (const val of value.values()) {
			transformed.add(transformToSerializable(val, selector, `${key}.setval-${i++}`));
		}
		return transformed;
	}

	if (Array.isArray(value)) {
		const transformed = [];
		let i = 0;
		for (const val of value) {
			transformed.push(transformToSerializable(val, selector, `${key}.arrval-${i++}`));
		}
		return transformed;
	}

	/** @type {Record<any, any>} */
	const transformed = {};
	for (const [name, val] of Object.entries(value)) {
		const transformedKey = transformToSerializable(name, selector, `${key}.objkey-${name}`);
		if (!(typeof transformedKey === "string" || typeof transformedKey === "number")) {
			throw new Error(`type "${typeof transformedKey}" can't be used as an index type.`);
		}
		transformed[transformedKey] = transformToSerializable(
			val,
			selector,
			`${key}.objval-${name}`,
		);
	}

	return transformed;
}

/**
 *
 * @param {unknown} data
 * @returns {asserts data is self.ServerData}
 */
export function assertServerData(data) {
	try {
		serverDataSchema.parse(data);
	} catch (error) {
		if (error instanceof zod.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

/** @type {self.hash} */
export function hash(serverData) {
	/** @type {self._Context} */
	const context = { visited: [], hasher: Hash.create() };

	_internalHash(serverData, context);

	return context.hasher.digest();
}

const TAG = {
	NULL: "a",
	UNDEFINED: "b",
	NUMBER: "c",
	TRUE: "d",
	FALSE: "e",
	STRING: "f",
	ARRAY: "g",
	SET: "h",
	ITEM: "i",
	RECORD: "j",
	MAP: "k",
	KEY: "l",
	VALUE: "m",
	REF: "n",
	DATE: "o",
	URL: "p",
	CLOSE_NESTED: "q",
	BIGINT: "r",
};

/**
 * @param {self.ServerData} rawValue
 * @param {self._Context} context
 */
function _internalHash(rawValue, context) {
	const { type, value } = _getType(rawValue, context);

	switch (type) {
		case "null": {
			context.hasher.update(TAG.NULL);
			break;
		}
		case "undefined": {
			context.hasher.update(TAG.UNDEFINED);
			break;
		}
		case "boolean": {
			context.hasher.update(value ? TAG.TRUE : TAG.FALSE);
			break;
		}
		case "string": {
			context.hasher.update(TAG.STRING);
			context.hasher.update(value);
			break;
		}
		case "number": {
			context.hasher.update(TAG.STRING);
			context.hasher.update(String(value));
			break;
		}
		case "reference": {
			context.hasher.update(TAG.REF);
			context.hasher.update(String(value));
			break;
		}
		case "array": {
			context.hasher.update(TAG.ARRAY);
			_hashList(value, context);
			context.hasher.update(TAG.CLOSE_NESTED);
			break;
		}
		case "set": {
			context.hasher.update(TAG.SET);
			_hashList(value, context);
			context.hasher.update(TAG.CLOSE_NESTED);
			break;
		}
		case "record": {
			context.hasher.update(TAG.RECORD);
			_hashKeyValue(value, context);
			context.hasher.update(TAG.CLOSE_NESTED);
			break;
		}
		case "map": {
			context.hasher.update(TAG.MAP);
			_hashKeyValue(value, context);
			context.hasher.update(TAG.CLOSE_NESTED);
			break;
		}
		case "date": {
			context.hasher.update(TAG.DATE);
			context.hasher.update(value.toUTCString());
			break;
		}
		case "url": {
			context.hasher.update(TAG.URL);
			context.hasher.update(value.toString());
			break;
		}
		case "bigint": {
			context.hasher.update(TAG.BIGINT);
			context.hasher.update(value.toString());
		}
	}
}

/**
 * @param {self.ServerData} value
 * @param {self._Context} context
 * @returns {self._Type}
 */
function _getType(value, context) {
	if (value === null) {
		return { type: "null", value };
	}

	if (value === undefined) {
		return { type: "undefined", value };
	}

	if (typeof value === "string") {
		return { type: "string", value };
	}

	if (typeof value === "number") {
		return { type: "number", value };
	}

	if (typeof value === "boolean") {
		return { type: "boolean", value };
	}

	let ref = -1;
	for (let i = 0; i < context.visited.length; i++) {
		const entry = context.visited[i];
		if (entry === value) {
			ref = i;
			break;
		}
	}

	if (ref !== -1) {
		return { type: "reference", value: ref };
	}

	context.visited.push(value);

	if (Array.isArray(value)) {
		return { type: "array", value };
	}

	if (value instanceof Date) {
		return { type: "date", value };
	}

	if (value instanceof Set) {
		return { type: "set", value };
	}

	if (value instanceof Map) {
		return { type: "map", value };
	}

	if (value instanceof URL) {
		return { type: "url", value };
	}

	if (typeof value === "bigint") {
		return { type: "bigint", value };
	}

	return { type: "record", value };
}

/**
 * @param {Set<self.ServerData>|self.ServerData[]} list
 * @param {self._Context} context
 */
function _hashList(list, context) {
	for (const item of list.values()) {
		context.hasher.update(TAG.ITEM);
		_internalHash(item, context);
	}
}

/**
 * @param {Map<self.ServerData, self.ServerData>|{[x:string|number]:self.ServerData}} keyValue
 * @param {self._Context} context
 */
function _hashKeyValue(keyValue, context) {
	const iterator = keyValue instanceof Map ? keyValue.entries() : Object.entries(keyValue);

	for (const [key, item] of iterator) {
		context.hasher.update(TAG.KEY);
		_internalHash(key, context);

		context.hasher.update(TAG.VALUE);
		_internalHash(item, context);
	}
}
