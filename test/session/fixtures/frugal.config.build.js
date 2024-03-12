import * as frugal from "../../../packages/frugal/exports/index.js";
import { script } from "../../../packages/plugin-script/exports/index.js";

/** @type {frugal.BuildConfig} */
export default {
	plugins: [script()],
};
