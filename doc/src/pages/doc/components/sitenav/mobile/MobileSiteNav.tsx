import { clsx } from "clsx";
import * as hooks from "preact/hooks";
import type { Lang, Version } from "../../../../../data/doc/config.ts";
import type { Toc } from "../../../../../data/doc/toc.ts";
import { Close } from "../../../../../glyphs/icons/Close.tsx";
import { Toc as TocIcon } from "../../../../../glyphs/icons/Toc.tsx";
import { BaseNav } from "../BaseNav.tsx";
import { FocusTrap } from "./FocusTrap.ts";
import * as mobileSiteNav from "./MobileSiteNav.module.css";

export type MobileSiteNavProps = {
	version: Version;
	lang: Lang;
	toc: Toc;
	class?: string;
};

export function MobileSiteNav({ toc, version, lang, class: className }: MobileSiteNavProps) {
	const drawerRef = hooks.useRef<HTMLDetailsElement>(null);

	hooks.useEffect(() => {
		document.addEventListener("keydown", handleKeyPress);
		return () => {
			document.removeEventListener("keydown", handleKeyPress);
			FocusTrap.deactivate();
		};
	}, []);

	const [isOpen, setIsOpen] = hooks.useState(false);
	const [isTrueOpen, { step, onTransitionEnd }] = useTransition(isOpen);

	console.log({ isOpen, isTrueOpen, step });

	return (
		<div class={className}>
			<details ref={drawerRef} class={mobileSiteNav["drawer"]} open={isTrueOpen}>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: keydown already trigger click on summary */}
				<summary tabindex={0} onClick={toggle} class={clsx(mobileSiteNav["toggle"])}>
					<TocIcon
						class={clsx(mobileSiteNav["icon"], mobileSiteNav["toc"])}
						height={20}
					/>
					<Close
						class={clsx(mobileSiteNav["icon"], mobileSiteNav["close"])}
						height={20}
					/>
				</summary>

				<BaseNav
					onTransitionEnd={onTransitionEnd}
					style={{
						transform: step === Step.DURING ? "translateX(0%)" : "translateX(-100%)",
					}}
					class={mobileSiteNav["nav"]}
					version={version}
					lang={lang}
					toc={toc}
				/>
			</details>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents:  keyboard handling done in useEffect at document level*/}
			<div
				style={{
					opacity: step === Step.DURING ? undefined : "0",
				}}
				onClick={close}
				class={clsx(mobileSiteNav["overlay"])}
			/>
		</div>
	);

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === "Escape") {
			close();
		}
	}

	function toggle(event: MouseEvent) {
		setIsOpen((isOpen) => !isOpen);
		document.body.classList.toggle("no-scroll");
		drawerRef.current && FocusTrap.toggle(drawerRef.current, {});
		event.preventDefault();
	}

	function close() {
		setIsOpen(false);
		document.body.classList.remove("no-scroll");
		FocusTrap.deactivate();
	}
}

export enum Step {
	BEFORE = "before",
	DURING = "during",
	AFTER = "after",
}

export type UseTransition = [
	boolean,
	{
		step: Step;
		onTransitionEnd: (event: TransitionEvent) => void;
	},
];

export function useTransition(value: boolean): UseTransition {
	const [delayedValue, setDelayedValue] = hooks.useState(false);
	const isHookMountedRef = hooks.useRef(false);

	hooks.useEffect(() => {
		isHookMountedRef.current = true;

		return () => {
			isHookMountedRef.current = false;
		};
	}, []);

	hooks.useEffect(() => {
		if (value) {
			if (isHookMountedRef.current) {
				setDelayedValue(true);
			}
		}
	}, [value]);

	const onTransitionEnd = (event: TransitionEvent): void => {
		// since transitionend bubble, check if the event came from our element.
		// If it came from a different element, we do nothing
		if (event.target !== event.currentTarget) {
			return;
		}

		if (!value) {
			setDelayedValue(false);
		}
	};

	let step: Step;
	if (value && !delayedValue) {
		step = Step.BEFORE;
	} else if (!value && delayedValue) {
		step = Step.AFTER;
	} else if (isHookMountedRef.current) {
		step = Step.DURING;
	} else {
		step = value ? Step.DURING : Step.BEFORE;
	}

	return [value || delayedValue, { step, onTransitionEnd }];
}
