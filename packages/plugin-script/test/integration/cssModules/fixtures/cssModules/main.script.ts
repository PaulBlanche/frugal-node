//@ts-expect-error: non typed file
import { foo } from "./main.module.css";

// side effect to keep "foo"
(globalThis as any).foo = foo;
