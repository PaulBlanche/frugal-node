import { vercel } from "../../../packages/exporter-vercel/src/vercel.js";

/** @type {import("../../../packages/frugal/exports/config/index.ts").BuildConfig} */
export default {
	cleanAllOutDir: false,
	exporter: vercel(),
};
