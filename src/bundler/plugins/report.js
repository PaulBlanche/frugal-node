import * as esbuild from "esbuild";
import { log } from "../../utils/log.js";

/** @returns {esbuild.Plugin} */
export function report() {
	let firstBuild = true;

	return {
		name: "frugal-internal:report",
		setup(build) {
			build.onStart(() => {
				if (!firstBuild) {
					log("Rebuild triggered", { level: "info", scope: "esbuild" });
				}
				firstBuild = false;
			});

			build.onEnd(async (result) => {
				const errors = result.errors;
				const warnings = result.warnings;

				for (const error of errors) {
					const formatted = (
						await esbuild.formatMessages([error], {
							kind: "error",
							color: true,
							terminalWidth: 100,
						})
					).join("\n");

					log(`error during build :\n${formatted}`, {
						level: "error",
						scope: "esbuild",
					});
				}

				for (const warning of warnings) {
					const formatted = (
						await esbuild.formatMessages([warning], {
							kind: "warning",
							color: true,
							terminalWidth: 100,
						})
					).join("\n");

					log(`warning during build :\n${formatted}`, {
						level: "warning",
						scope: "esbuild",
					});
				}
			});
		},
	};
}
