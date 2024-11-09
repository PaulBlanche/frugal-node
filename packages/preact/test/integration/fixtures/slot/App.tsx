import { Head, type PageProps } from "@frugal-node/preact";
import { DisplayCount } from "./DisplayCount.island.tsx";
import { Slotter } from "./Slotter.island.tsx";

export function App({ assets }: PageProps) {
	const scripts = assets.get("js");

	return (
		<>
			<Head>
				{scripts.map((script) => {
					return <script key={script.path} async type="module" src={script.path} />;
				})}
			</Head>

			<div>
				<span>App</span>
				<Slotter>
					<span>static data</span>
					<DisplayCount />
				</Slotter>
			</div>
		</>
	);
}
