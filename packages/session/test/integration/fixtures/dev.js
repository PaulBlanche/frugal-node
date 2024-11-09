import { context } from "@frugal-node/core"
import config from "./frugal.build.js"

(await context(config)).watch()