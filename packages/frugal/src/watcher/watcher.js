import { FrugalConfig } from "../Config.js";
import { ChildContext } from "./ChildContext.js";
import { ParentContext } from "./ParentContext.js";
import * as watchProcess from "./WatchProcess.js";
import * as _type from "./_type/WatchContext.js";

/** @typedef {_WatchContext} WatchContext */

/**
 * @param {FrugalConfig} config
 * @returns
 */
export function context(config) {
	if (isInChildWatchProcess()) {
		return new _WatchContext(new ChildContext(config));
	}
	return new _WatchContext(new ParentContext());
}

class _WatchContext {
	/** @type {ParentContext | ChildContext} */
	#context;

	/** @param {ParentContext | ChildContext} context */
	constructor(context) {
		this.#context = context;
	}

	/** @param {watchProcess.Listener} listener */
	addEventListener(listener) {
		if (this.#context instanceof ParentContext) {
			this.#context.addEventListener(listener);
		}
	}

	/** @param {watchProcess.Listener} listener */
	removeEventListener(listener) {
		if (this.#context instanceof ParentContext) {
			this.#context.removeEventListener(listener);
		}
	}

	/**
	 * @param {_type.WatchOptions} [options]
	 * @returns
	 */
	watch(options) {
		return this.#context.watch(options);
	}

	dispose() {
		return this.#context.dispose();
	}
}

export function isInChildWatchProcess() {
	return process.env["FRUGAL_WATCH_PROCESS_CHILD"] !== undefined;
}
