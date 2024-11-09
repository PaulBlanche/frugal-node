import { clsx } from "clsx";
import * as link from "../../styles/link.module.css";
import * as footer from "./Footer.module.css";

type FooterProps = {
	class?: string;
};

export function Footer({ class: className }: FooterProps) {
	return (
		<footer class={clsx(footer["footer"], className)}>
			<div class={footer["footerContainer"]}>
				<p>
					Made with 💛 by{" "}
					<a class={link["link"]} href="https://piaille.fr/@whiteshoulders">
						whiteshoulders
					</a>
				</p>
			</div>
		</footer>
	);
}
