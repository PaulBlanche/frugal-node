import type { Form } from "./Form.ts";
import type { NavigationConfig, PageResult } from "./Page.js";

export interface Submitter {
	submit(event?: SubmitEvent): Promise<PageResult>;
}

interface SubmitterMaker {
	create(form: Form, config: NavigationConfig): Submitter;
}

export let Submitter: SubmitterMaker;
