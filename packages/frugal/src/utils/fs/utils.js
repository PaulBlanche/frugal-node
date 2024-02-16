import * as _type from "./_type/fs.js";
import { AlreadyExists, NotFound } from "./errors.js";

/** @param {_type.WriteFileOptions} options */
export function flag(options) {
	if (options.append) {
		if (options.createNew) {
			return "ax";
		}

		return "a";
	}
	if (options.createNew) {
		return "wx";
	}

	return "w";
}

/**
 * @param {any} error
 * @returns {Error}
 */
export function mapError(error) {
	if (error.code === "ENOENT") {
		return new NotFound(error.message);
	}
	if (error.code === "EEXIST") {
		return new AlreadyExists(error.message);
	}
	return error;
}
