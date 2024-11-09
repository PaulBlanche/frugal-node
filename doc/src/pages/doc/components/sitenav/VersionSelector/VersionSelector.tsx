import { Session } from "@frugal-node/session";
import { clsx } from "clsx";
import { VERSIONS, type Version } from "../../../../../data/doc/config.ts";
import * as versionSelector from "./VersionSelector.module.css";

export type VersionSelectorProps = {
	version: Version;
	class?: string;
};

export function VersionSelector({ version, class: className }: VersionSelectorProps) {
	return (
		<div class={clsx(versionSelector["select"], className)}>
			<select
				onChange={(event) => {
					const target = location.href.replace(
						/\/doc@\d+(\.\d+)*/,
						`/doc@${event.currentTarget.value}/`,
					);
					Session.navigate(target);
				}}
			>
				{VERSIONS.map((versionOption) => {
					return (
						<option
							key={versionOption}
							value={version}
							selected={version === versionOption}
						>
							frugal@{versionOption}
						</option>
					);
				})}
			</select>
		</div>
	);
}
