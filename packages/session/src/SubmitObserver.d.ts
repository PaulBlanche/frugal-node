import { Form } from "./Form.ts";
import { NavigationConfig } from "./Page.js";

export interface SubmitObserver {
	observe(): void;
	disconnect(): void;
}

interface SubmitObserverMaker {
	create(config: NavigationConfig): SubmitObserver;
}

export const SubmitObserver: SubmitObserverMaker;
