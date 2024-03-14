import * as preact from "preact";

/** @typedef {{ update(state: preact.VNode[]): void; instanceStack: Set<Effect>; }} Manager */

/** @typedef {{ reduceComponentsToState: (components: Effect[]) => preact.VNode[]; manager: Manager; }} SideEffectProps */

const isServer = typeof document === "undefined";

/**
 * @extends {preact.Component<SideEffectProps>}
 */
export class Effect extends preact.Component {
	/**
	 * @param {SideEffectProps} props
	 */
	constructor(props) {
		super(props);

		if (isServer) {
			this.#pushToStack();
			this.#emitChange();
		}
	}
	componentDidMount() {
		this.#pushToStack();
		this.#emitChange();
	}

	componentDidUpdate() {
		this.#emitChange();
	}

	componentWillUnmount() {
		this.#popFromStack();
		this.#emitChange();
	}

	render() {
		return null;
	}

	#emitChange = () => {
		this.props.manager.update(
			this.props.reduceComponentsToState([...this.props.manager.instanceStack]),
		);
	};

	#pushToStack() {
		this.props.manager.instanceStack.add(this);
	}

	#popFromStack() {
		this.props.manager.instanceStack.delete(this);
	}
}
