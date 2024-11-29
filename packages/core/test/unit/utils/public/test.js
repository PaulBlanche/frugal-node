import * as fs from "node:fs";
import * as zlib from "node:zlib";

const src1 = fs.createReadStream(new URL(import.meta.resolve("./foo.txt")));
const dest1 = fs.createWriteStream(new URL(import.meta.resolve("./foo.txt.br")));

const src2 = fs.createReadStream(new URL(import.meta.resolve("./foo.txt")));
const dest2 = fs.createWriteStream(new URL(import.meta.resolve("./foo.txt.gz")));

const brotli = zlib.createBrotliCompress();
const gzip = zlib.createGzip();

src1.pipe(brotli).pipe(dest1);
src2.pipe(gzip).pipe(dest2);
