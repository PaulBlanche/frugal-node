import { Form } from "./Form.ts";
import { NavigationConfig, PageResult } from "./Page.js";

export interface Submitter {
	submit(event?: SubmitEvent): Promise<PageResult>;
}

interface SubmitterMaker {
	create(form: Form, config: NavigationConfig): Submitter;
}

export const Submitter: SubmitterMaker;
