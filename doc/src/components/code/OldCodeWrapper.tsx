import { clsx } from "clsx";
import * as hooks from "preact/hooks";
import { Check } from "../../glyphs/icons/Check.tsx";
import { Clipboard } from "../../glyphs/icons/Clipboard.tsx";
import * as code from "./CodeWrapper.module.css";

export type CodeWrapperProps = {
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
	const id = hooks.useId();

	const tabRefs = props.files.map(() => hooks.useRef<HTMLButtonElement>(null));
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
						<button
							class={code["tab"]}
							key={file.filename}
							ref={tabRefs[index]}
							type="button"
							id={`tab-${file.filename}-${id}`}
							role="tab"
							aria-selected={active === file.filename}
							aria-controls={`tabpanel-${file.filename}-${id}`}
							tabIndex={active === file.filename ? 0 : -1}
							onKeyDown={(event) => handleKeyDown(event, index)}
							onMouseDown={() => handleClick(file.filename)}
							onTouchStart={() => handleClick(file.filename)}
							onFocus={(event) => {
								tabRefs[index].current?.scrollIntoView({
									block: "start",
									inline: "nearest",
								});
							}}
						>
							<span class={code["tabfocus"]}>{file.filename}</span>
						</button>
					))}
				</div>
			)}
			<div class={code["tabpanels"]}>
				{props.files.map((file, index) => (
					<div
						ref={panelRefs[index]}
						class={clsx(code["tabpanel"], active === file.filename && code["active"])}
						key={file.filename}
						id={`tabpanel-${file.filename}-${id}`}
						role="tabpanel"
						aria-labelledby={`tab-${file.filename}-${id}`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/#accessibilityfeatures
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
				const previousIndex = index === 0 ? tabRefs.length - 1 : index - 1;
				focusAndSelect(previousIndex);
				handled = true;
				break;
			}
			case "ArrowRight": {
				const nextIndex = index === tabRefs.length - 1 ? 0 : index + 1;
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
				focusAndSelect(tabRefs.length - 1);
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
		const tab = tabRefs[index];
		tab.current?.focus();
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
		} catch (error) {
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
		} catch (error) {
			return false;
		} finally {
			document.body.removeChild(textArea);
		}
	}
}
