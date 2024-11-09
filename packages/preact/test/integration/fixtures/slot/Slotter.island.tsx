import { Island } from "@frugal-node/preact/client";
import { NAME } from "./Slotter.script.ts";
import { Slotter as Component, SlotterProps } from "./Slotter.tsx";

export function Slotter(props: SlotterProps) {
	return (
		<Island name={NAME} Component={Component} props={props}>
			{props.children}
		</Island>
	);
}
