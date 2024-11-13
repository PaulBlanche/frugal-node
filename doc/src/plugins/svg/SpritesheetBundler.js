import { log } from "@frugal-node/core/utils/log";
import { toXml } from "xast-util-to-xml";

/** @type {import('./SpritesheetBundler.ts').SpritesheetBundlerMaker} */
export const SpritesheetBundler = {
	create,
};

/** @type {import('./SpritesheetBundler.ts').SpritesheetBundlerMaker['create']} */
function create() {
	/** @type {Map<string, string>} */
	const cache = new Map();

	return { bundle };

	/** @type {import('./SpritesheetBundler.ts').SpritesheetBundler['bundle']} */
	function bundle(name, symbols) {
		const cached = cache.get(name);
		if (cached !== undefined) {
			return cached;
		}

		log(`generating spritesheet "${name}"`, {
			level: "debug",
			scope: "plugin:svg",
		});

		/** @type {Record<string, Set<string>>} */
		const seenId = {};
		const svgContent = [];
		const defs = [];

		for (const symbol of symbols) {
			for (const id of symbol.gatheredIds) {
				seenId[id] = seenId[id] ?? new Set();
				seenId[id].add(symbol.path);
			}

			if (symbol.defs) {
				defs.push(...symbol.defs);
			}

			svgContent.push(toXml(symbol.symbol));
		}

		for (const [id, paths] of Object.entries(seenId)) {
			if (paths.size > 1) {
				log(
					`found the same id "${id}" in multiple symbols : ${Array.from(
						paths.values(),
					).join(", ")}`,
					{ scope: "plugin:svg", level: "warning" },
				);
			}
		}

		const spritesheet = `<svg xmlns="http://www.w3.org/2000/svg">${
			defs.length > 0 ? `<defs>${defs.map((def) => toXml(def)).join("\n")}</defs>` : ""
		}${svgContent.join("\n")}</svg>`;

		cache.set(name, spritesheet);

		return spritesheet;
	}
}
