import { Head, type PageProps } from "@frugal-node/preact";

import "./session.script.ts";

export type BaseLayoutProps = PageProps & {
	children?: preact.ComponentChildren;
};

export function BaseLayout({ assets, children }: BaseLayoutProps) {
	const scripts = assets.get("js");
	const styles = assets.get("css");

	return (
		<>
			<Head>
				<html lang="en" />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

				<meta
					name="description"
					content="Frugal web developpment with a framework that does not waste resources. Do the same, but send less"
				/>
				<title>Frugal</title>
				{scripts.map((script) => {
					return <script key={script.path} async type="module" src={script.path} />;
				})}
				{styles.map((style) => {
					return <link key={style.path} rel="stylesheet" href={style.path} />;
				})}
			</Head>
			{children}
		</>
	);
}
