import * as code from "./Code.module.css";
import { CodeWrapper } from "./CodeWrapper.island.tsx";
import type { File } from "./File.ts";
import { Highlight } from "./Highlight.tsx";

export type CodeProps = {
	id?: string;
	files: File[];
	class?: string;
	noLineNumbers?: boolean;
	"aria-labelledby"?: string;
};

export function Code(props: CodeProps) {
	return (
		<CodeWrapper
			id={props.id}
			aria-labelledby={props["aria-labelledby"]}
			files={props.files.map((file) => {
				return {
					filename: file.filename,
					content: (
						<Highlight
							file={file}
							noLineNumbers={props.noLineNumbers}
							class={code["content"]}
						/>
					),
				};
			})}
			class={props.class}
		/>
	);
}
