import * as hooks from "preact/hooks";
import { increment } from "./count.ts";

export type SlotterProps = preact.RenderableProps<{}>;

export function Slotter(props: SlotterProps) {
	const [mounted, setMounted] = hooks.useState(true);

	return (
		<div>
			<button id="toggle" onClick={() => setMounted((mounted) => !mounted)}>
				toggle mount
			</button>
			<button id="increment" onClick={increment}>
				increment
			</button>
			{mounted && <div>{props.children}</div>}
		</div>
	);
}
