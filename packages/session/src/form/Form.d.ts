import type { EncodingType, Method } from "./form-constantes.js";

export interface Form {
	submit(): void;
	readonly directive: string | null | undefined;
	readonly enctype: (typeof EncodingType)[keyof typeof EncodingType];
	readonly url: URL;
	readonly method: (typeof Method)[keyof typeof Method];
	readonly formData: FormData;
	readonly body: FormData | URLSearchParams;
}

interface FormCreator {
	create(form: HTMLFormElement, submitter?: HTMLElement | null | undefined): Form;
}

export let Form: FormCreator;
