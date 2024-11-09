import { useData } from "@frugal-node/preact/client";
import * as preact from "preact";
import * as hooks from "preact/hooks";

export type ClientProps = preact.RenderableProps<{
	id: number;
	date: Date;
}>;

export function Client(props: ClientProps) {
	const [state, setState] = hooks.useState("server");

	hooks.useEffect(() => {
		setState("client");
	}, []);

	return (
		<>
			<div>
				{state} {props.id} {props.date.getTime()}
			</div>
			<ErrorBoundary>
				<UseData />
			</ErrorBoundary>
			{props.children}
		</>
	);
}

function UseData() {
	const data = useData<{ foo: string }>();

	return <span>data : {data.foo}</span>;
}

class ErrorBoundary extends preact.Component {
	constructor() {
		super();
		this.state = { errored: false, error: undefined };
	}

	static getDerivedStateFromError(error: any) {
		return { errored: true, error };
	}

	render(props: any, state: { error: any; errored: boolean }) {
		if (state.errored) {
			return <p>{state.error?.message ?? "unknown error"}</p>;
		}
		return props.children;
	}
}
