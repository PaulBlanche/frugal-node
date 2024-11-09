import type { NavigationConfig, PageResult } from "../page/Page.js";
import type { Form } from "./Form.ts";

export interface Submitter {
	submit(event?: SubmitEvent): Promise<PageResult>;
}

interface SubmitterCreator {
	create(form: Form, config: NavigationConfig): Submitter;
}

export let Submitter: SubmitterCreator;
