import { Island } from "@frugal-node/preact/client";
import { NAME } from "./Counter.script.ts";
import { Counter as Component, type CounterProps } from "./Counter.tsx";

export function Counter(props: CounterProps) {
	return <Island name={NAME} Component={Component} props={props} />;
}
