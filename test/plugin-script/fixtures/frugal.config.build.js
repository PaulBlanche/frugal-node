import { script } from "../../../packages/plugin-script/exports/index.js";

/** @type {import("../../../packages/frugal/exports/index.js").BuildConfig} */
export default {
	plugins: [script({})],
	cleanAllOutDir: false,
};
