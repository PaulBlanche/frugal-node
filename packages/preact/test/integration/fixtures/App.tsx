import { Head, type PageProps } from "@frugal-node/preact";
import { Client } from "./Client.island.tsx";

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
				<Client id={1} date={new Date(1234)}>
					<span>server in island</span>
					<Client id={2} date={new Date(5678)}>
						<span>server in nested island</span>
					</Client>
				</Client>
			</div>
		</>
	);
}
