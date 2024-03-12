import { css } from "../../../packages/plugin-css/exports/index.js";

/** @type {import("../../../packages/frugal/exports/index.ts").BuildConfig} */
export default {
	plugins: [css()],
	cleanAllOutDir: false,
};
