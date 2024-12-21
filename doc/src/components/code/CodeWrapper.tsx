import { clsx } from "clsx";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { Check } from "../../glyphs/icons/Check.tsx";
import { Clipboard } from "../../glyphs/icons/Clipboard.tsx";
import * as sr from "../../styles/screen-reader.module.css";
import * as code from "./CodeWrapper.module.css";

export type CodeWrapperProps = {
	id: string;
	files: { filename: string; content: preact.ComponentChildren }[];
	class?: string;
	"aria-labelledby"?: string;
};

export function CodeWrapper(props: CodeWrapperProps) {
	const hasOnlyOneFile = props.files.length === 1;
	const hasNoFilenames = props.files.every((file) => file.filename === "");

	const hideTabs = hasOnlyOneFile && hasNoFilenames;

	const [active, setActive] = hooks.useState(props.files[0].filename);
	const [copyStatus, setCopyStatus] = hooks.useState("pristine");

	// biome-ignore lint/correctness/useHookAtTopLevel: not top level, but in a map is ok
	const labelRefs = props.files.map(() => hooks.useRef<HTMLLabelElement>(null));

	// biome-ignore lint/correctness/useHookAtTopLevel: not top level, but in a map is ok
	const inputRefs = props.files.map(() => hooks.useRef<HTMLInputElement>(null));

	// biome-ignore lint/correctness/useHookAtTopLevel: not top level, but in a map is ok
	const panelRefs = props.files.map(() => hooks.useRef<HTMLDivElement>(null));

	return (
		<div class={clsx(code["wrapper"], props.class)}>
			{!hideTabs && (
				<div
					class={code["tablist"]}
					role="tablist"
					aria-labelledby={props["aria-labelledby"]}
				>
					{props.files.map((file, index) => (
						<preact.Fragment key={file.filename}>
							<input
								type="radio"
								name={`tablist-${props.id}`}
								ref={inputRefs[index]}
								id={`tabtoggle-${file.filename}-${props.id}`}
								class={clsx(sr["hidden"], code["input"])}
								checked={active === file.filename}
								onFocus={() => {
									labelRefs[index].current?.scrollIntoView({
										block: "start",
										inline: "nearest",
									});
								}}
								onKeyDown={(event) => handleKeyDown(event, index)}
								onChange={() => handleClick(file.filename)}
							/>
							{/* biome-ignore lint/a11y/useFocusableInteractive: label is focusable throught the matching input */}
							<label
								id={`tab-${file.filename}-${props.id}`}
								// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: label is interactive throught the matching input
								role="tab"
								aria-selected={active === file.filename}
								aria-controls={`tabpanel-${file.filename}-${props.id}`}
								ref={labelRefs[index]}
								class={code["tab"]}
								for={`tabtoggle-${file.filename}-${props.id}`}
							>
								<span class={code["tabfocus"]}>{file.filename}</span>
							</label>
						</preact.Fragment>
					))}
				</div>
			)}
			<div class={code["tabpanels"]}>
				{props.files.map((file, index) => (
					<div
						ref={panelRefs[index]}
						class={clsx(code["tabpanel"], active === file.filename && code["active"])}
						key={file.filename}
						id={`tabpanel-${file.filename}-${props.id}`}
						role="tabpanel"
						aria-labelledby={`tab-${file.filename}-${props.id}`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: tabpanel should be focusable
						tabIndex={0}
					>
						{file.content}
					</div>
				))}
			</div>
			{!hideTabs && (
				<button
					type="button"
					title="Copy to clipboard"
					class={clsx(code["copy"], copyStatus === "success" && code["success"])}
					onClick={() => {
						const activeIndex = props.files.findIndex(
							(file) => file.filename === active,
						);
						const panel = panelRefs[activeIndex].current;
						if (panel?.textContent) {
							copy(panel.textContent).then((success) => {
								if (success) {
									setCopyStatus("success");
									setTimeout(() => {
										setCopyStatus("pristine");
									}, 2000);
								}
							});
						}
					}}
				>
					<Clipboard width="20" class={code["clip"]} aria-hidden="true" />
					<Check width="20" class={code["check"]} aria-hidden="true" />
				</button>
			)}
		</div>
	);

	function handleKeyDown(event: KeyboardEvent, index: number) {
		let handled = false;

		switch (event.key) {
			case "ArrowLeft": {
				const previousIndex = index === 0 ? props.files.length - 1 : index - 1;
				focusAndSelect(previousIndex);
				handled = true;
				break;
			}
			case "ArrowRight": {
				const nextIndex = index === props.files.length - 1 ? 0 : index + 1;
				focusAndSelect(nextIndex);
				handled = true;
				break;
			}
			case "Home": {
				focusAndSelect(0);
				handled = true;
				break;
			}
			case "End": {
				focusAndSelect(props.files.length - 1);
				handled = true;
				break;
			}
		}

		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function handleClick(filename: string) {
		setActive(filename);
	}

	function focusAndSelect(index: number) {
		const input = inputRefs[index];
		input.current?.focus();
		const file = props.files[index];
		setActive(file.filename);
	}

	async function copy(text: string) {
		if (!navigator.clipboard) {
			return Promise.resolve(fallbackCopy(text));
		}

		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}

	function fallbackCopy(text: string) {
		const textArea = document.createElement("textarea");
		textArea.value = text;

		// Avoid scrolling to bottom
		textArea.style.top = "0";
		textArea.style.left = "0";
		textArea.style.position = "fixed";

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			return document.execCommand("copy");
		} catch {
			return false;
		} finally {
			document.body.removeChild(textArea);
		}
	}
}
