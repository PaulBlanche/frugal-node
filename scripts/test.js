import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as test from "node:test";
import { spec } from "node:test/reporters";
import * as url from "node:url";

const CHILD_TEST_PROCESS_ENV = "CHILD_TEST_PROCESS";
const TEST_ONLY_ENV = "TEST_ONLY";
export const UPDATE_TEST_SNAPSHOT_ENV = "UPDATE_TEST_SNAPSHOT";
const TEST_FILES_FILTER_ENV = "TEST_FILES_FILTER";
const TEST_NAME_FILTER_ENV = "TEST_NAME_FILTER";

if (process.env[CHILD_TEST_PROCESS_ENV]) {
	testProcessBody();
} else {
	spawnTestProcess();
}

function spawnTestProcess() {
	/** @type {{ command: string; args: string[]; env: Record<string, string> }} */
	const config = {
		command: process.argv[0],
		args: [process.argv[1]],
		env: { ...process.env, [CHILD_TEST_PROCESS_ENV]: "1" },
	};

	const argv = process.argv.slice(2);

	if (argv.includes("--update")) {
		config.env[UPDATE_TEST_SNAPSHOT_ENV] = "1";
	}

	if (argv.includes("--only")) {
		config.env[TEST_ONLY_ENV] = "1";
	}

	if (argv.includes("--coverage")) {
		config.command = "npx";
		config.args.unshift("c8", "node");
	}

	if (argv.includes("--file-filter")) {
		const index = argv.indexOf("--file-filter");
		const filter = argv[index + 1];
		config.env[TEST_FILES_FILTER_ENV] = filter;
	}
	if (argv.includes("-ff")) {
		const index = argv.indexOf("-ff");
		const filter = argv[index + 1];
		config.env[TEST_FILES_FILTER_ENV] = filter;
	}
	if (argv.includes("--name-filter")) {
		const index = argv.indexOf("--name-filter");
		const filter = argv[index + 1];
		config.env[TEST_NAME_FILTER_ENV] = filter;
	}
	if (argv.includes("-nf")) {
		const index = argv.indexOf("-nf");
		const filter = argv[index + 1];
		config.env[TEST_NAME_FILTER_ENV] = filter;
	}

	childProcess.spawn(config.command, config.args, {
		env: config.env,
		stdio: "inherit",
	});
}

async function testProcessBody() {
	const testFiles = [];
	const dir = await fs.promises.opendir(url.fileURLToPath(new URL("../test", import.meta.url)), {
		recursive: true,
	});

	const fileFilter = process.env[TEST_FILES_FILTER_ENV];
	const fileFilterRegexp = new RegExp(fileFilter ?? ".*");

	for await (const entry of dir) {
		if (entry.name.match(/\.test\.[tj]sx?$/)) {
			const filePath = path.resolve(entry.path, entry.name);
			if (filePath.match(fileFilterRegexp)) {
				testFiles.push(filePath);
			}
		}
	}

	const nameFilter = process.env[TEST_NAME_FILTER_ENV];
	const nameFilterRegexp = new RegExp(nameFilter ?? ".*");

	test.run({
		files: testFiles,
		concurrency: true,
		only: process.env[TEST_ONLY_ENV] !== undefined,
		testNamePatterns: nameFilterRegexp,
		timeout: 30 * 1000,
	})
		.compose(new spec())
		.pipe(process.stdout);
}
