import { count } from "./count.ts";

export function DisplayCount() {
	return <span>{count.value}</span>;
}
