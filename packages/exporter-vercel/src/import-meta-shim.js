import url from "node:url";

const importMeta = { url: url.pathToFileURL(__filename) }

export { importMeta as 'import.meta' }
