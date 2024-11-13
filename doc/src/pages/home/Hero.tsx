import { Arrow } from "../../glyphs/icons/Arrow.tsx";
import * as hero from "./Hero.module.css";

export function Hero() {
	return (
		<div class={hero["hero"]}>
			<h1 class={hero["title"]}>
				<span class={hero["highlight"]}>Frugal</span>
			</h1>
			<p class={hero["tagline"]}>A web framework that wastes not</p>
			<a href="/doc@latest/getting-started" class={hero["button"]}>
				<span>Get started</span>
				<Arrow class={hero["arrow"]} $type="right" aria-hidden={true} width={20} />
			</a>
		</div>
	);
}
