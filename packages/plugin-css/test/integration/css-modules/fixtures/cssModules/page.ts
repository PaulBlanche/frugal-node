//@ts-expect-error: non typed file
import * as page from "./page.module.css";

export const route = "/page";

export function render() {
	return `${JSON.stringify(page)}`;
}
