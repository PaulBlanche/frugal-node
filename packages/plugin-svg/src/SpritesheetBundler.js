import { log } from "frugal-node/utils/log";
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
			for (const id of symbol.svg.gatheredIds) {
				seenId[id] = seenId[id] ?? new Set();
				seenId[id].add(symbol.path);
			}

			if (symbol.svg.defs) {
				defs.push(...symbol.svg.defs);
			}

			const symbolAttributes = Object.entries(symbol.svg.attributes)
				.filter(
					/** @returns {entry is [string, string]}*/ (entry) =>
						entry[1] !== undefined && entry[1] !== null,
				)
				.filter(([key, _]) =>
					["id", "viewbox", "preserveaspectratio"].includes(key.toLowerCase()),
				)
				.map(([key, value]) => `${key}="${value}"`)
				.join(" ");

			svgContent.push(
				`<symbol ${symbolAttributes}>${toXml(symbol.svg.content)}</symbol><use href="#${
					symbol.id
				}" />`,
			);
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
			defs.length !== 0 ? `<defs>${defs.map((def) => toXml(def)).join("\n")}</defs>` : ""
		}${svgContent.join("\n")}</svg>`;

		cache.set(name, spritesheet);

		return spritesheet;
	}
}
