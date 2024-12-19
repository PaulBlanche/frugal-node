/** @import * as puppeteer from "puppeteer"; */

import * as path from "node:path";
import * as url from "node:url";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";
import { SourceMapConsumer } from "source-map";
import * as vfilLocation from "vfile-location";

/**
 * @param {() => Promise<void>|void} callback
 * @param {{ page: puppeteer.Page}} options
 */
export async function withCoverage(callback, { page }) {
	await page.coverage.startJSCoverage({
		resetOnNavigation: false,
		includeRawScriptCoverage: true,
	});

	try {
		await callback();
	} finally {
		const testFile = process.argv[1];
		const originalCoverage = await restoreOriginalLocation(
			await page.coverage.stopJSCoverage(),
			path.resolve(path.dirname(testFile), "project/dist/public/js"),
		);

		if (originalCoverage.length > 0 && process.env["NODE_V8_COVERAGE"]) {
			const data = JSON.stringify({ result: originalCoverage });
			const coverageFile = path.resolve(
				process.env["NODE_V8_COVERAGE"],
				`${Hash.create().update(data).digest()}.json`,
			);
			await fs.ensureDir(path.dirname(coverageFile));
			await fs.writeTextFile(coverageFile, data);
		}
	}
}

/**
 *
 * @param {puppeteer.JSCoverageEntry[]} coverage
 * @param {string} base
 */
async function restoreOriginalLocation(coverage, base) {
	/** @type {{ [s:string]: { url: URL; source: string; functionsMap: { [s:string]: { name:string; isBlockCoverage: boolean; rangesMap: { [s:string]: { startOffset: number; endOffset: number; count: number } } } } } }} */
	const coverageMap = {};

	for (const entry of coverage) {
		if (!entry.rawScriptCoverage) {
			continue;
		}

		const consumer = await loadInlineSourceMap(entry.text);

		if (!consumer) {
			continue;
		}

		for (const functionCoverage of entry.rawScriptCoverage.functions) {
			for (const range of functionCoverage.ranges) {
				// get generatedStart and generatedEnd
				const generatedStartPosition = vfilLocation
					.location(entry.text)
					.toPoint(range.startOffset);
				const originalStartPosition =
					generatedStartPosition && consumer.originalPositionFor(generatedStartPosition);
				const generatedEndPosition = vfilLocation
					.location(entry.text)
					.toPoint(range.endOffset);
				const originalEndPosition =
					generatedEndPosition && consumer.originalPositionFor(generatedEndPosition);

				if (!(originalStartPosition && originalEndPosition)) {
					continue;
				}
				if (originalStartPosition?.source === null) {
					continue;
				}

				// get the original file for the range
				const originalSourceFilePath = path.resolve(base, originalStartPosition.source);

				// recreate the raw v8 coverage
				coverageMap[originalSourceFilePath] = coverageMap[originalSourceFilePath] ?? {
					url: url.pathToFileURL(originalSourceFilePath).toString(),
					source: await fs.readTextFile(originalSourceFilePath),
					functionsMap: {},
				};

				coverageMap[originalSourceFilePath].functionsMap[functionCoverage.functionName] =
					coverageMap[originalSourceFilePath].functionsMap[
						functionCoverage.functionName
					] ?? {
						name: functionCoverage.functionName,
						isBlockCoverage: functionCoverage.isBlockCoverage,
						rangesMap: {},
					};

				// convert back the position to offset
				const originalStartOffset = vfilLocation
					.location(coverageMap[originalSourceFilePath].source)
					.toOffset(originalStartPosition);
				const originalEndOffset = vfilLocation
					.location(coverageMap[originalSourceFilePath].source)
					.toOffset(originalEndPosition);

				if (
					!(originalStartOffset && originalEndOffset) ||
					originalEndOffset < originalStartOffset
				) {
					continue;
				}
				const rangeHash = `${originalStartOffset}:${originalEndOffset}`;

				// append the original range to the raw v8 coverage
				coverageMap[originalSourceFilePath].functionsMap[
					functionCoverage.functionName
				].rangesMap[rangeHash] = coverageMap[originalSourceFilePath].functionsMap[
					functionCoverage.functionName
				].rangesMap[rangeHash] ?? {
					startOffset: originalStartOffset,
					endOffset: originalEndOffset,
					count: 0,
				};

				coverageMap[originalSourceFilePath].functionsMap[
					functionCoverage.functionName
				].rangesMap[rangeHash].count += range.count;
			}
		}
	}

	// to raw V8 script coverage
	return Object.values(coverageMap).flatMap(({ url, source, functionsMap }) => {
		const functions = [];

		for (const func of Object.values(functionsMap)) {
			const ranges = Object.values(func.rangesMap).sort(
				(a, b) => a.startOffset - b.startOffset,
			);
			// filter out function with empty range
			if (ranges.length > 0) {
				functions.push({ name: func.name, isBlockCoverage: func.isBlockCoverage, ranges });
			}
		}

		// filter out entry with no coverage info
		if (functions.length === 0) {
			return [];
		}

		// filter out entry not related to source code
		if (
			url.toString().includes("test") ||
			url.toString().includes("test-utils") ||
			url.toString().includes("exports")
		) {
			return [];
		}

		return [
			{
				url,
				scriptId: url,
				source,
				functions,
			},
		];
	});
}

const INLINE_SOURCEMAP_REGEX = /^data:application\/json[^,]+base64,/;
const SOURCEMAP_REGEX =
	/(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/;

/**
 * @param {string} source
 */
function loadInlineSourceMap(source) {
	const sourceMapURL = getInlineSourceMap(source);

	if (sourceMapURL === undefined) {
		return undefined;
	}

	return new SourceMapConsumer(decodeInlineMap(sourceMapURL));
}

/**
 *
 * @param {string} base64Data
 * @returns {string}
 */
function decodeInlineMap(base64Data) {
	const rawData = base64Data.slice(base64Data.indexOf(",") + 1);
	return Buffer.from(rawData, "base64").toString();
}

const LINE_END_REGEXP = /\r?\n/;

/**
 * @param {string} source
 * @returns
 */
function getInlineSourceMap(source) {
	const lines = source.split(LINE_END_REGEXP);
	let sourceMapUrl = null;
	for (let i = lines.length - 1; i >= 0 && !sourceMapUrl; i--) {
		sourceMapUrl = lines[i].match(SOURCEMAP_REGEX);
	}

	if (!sourceMapUrl) {
		return undefined;
	}

	return isInlineMap(sourceMapUrl[1]) ? sourceMapUrl[1] : undefined;
}

/**
 *
 * @param {string} sourceMappingURL
 * @returns
 */
function isInlineMap(sourceMappingURL) {
	return INLINE_SOURCEMAP_REGEX.test(sourceMappingURL);
}
