import { clsx } from "clsx";
import { Bulb } from "../../glyphs/icons/Bulb.tsx";
import { Danger } from "../../glyphs/icons/Danger.tsx";
import { Info } from "../../glyphs/icons/Info.tsx";
import { Warning } from "../../glyphs/icons/Warning.tsx";
import * as callout from "./Callout.module.css";

type CalloutProps = {
	kind: string;
	title: string;
	content: string;
};

const KINDS: Record<string, { title: string; icon: preact.ComponentChildren } | undefined> = {
	warn: { title: "Warning", icon: <Warning aria-hidden class={clsx(callout["icon"])} /> },
	error: { title: "Error", icon: <Danger aria-hidden class={clsx(callout["icon"])} /> },
	info: { title: "Info", icon: <Info aria-hidden class={clsx(callout["icon"])} /> },
	tip: { title: "Tip", icon: <Bulb aria-hidden class={clsx(callout["icon"])} /> },
};

export function Callout({ kind, title, content }: CalloutProps) {
	return (
		<div class={clsx(callout["callout"], kind in KINDS && callout[kind])}>
			{KINDS[kind]?.icon}
			<div
				class={clsx(callout["title"])}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{
					__html: title.trim() ? title : (KINDS[kind]?.title ?? kind),
				}}
			/>
			{content.trim() && (
				<div
					class={clsx(callout["content"])}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			)}
		</div>
	);
}
