import type { PageProps } from "@frugal-node/preact";
import { clsx } from "clsx";
import { Code } from "../../components/code/Code.tsx";
import * as link from "../../styles/link.module.css";
import { Hero } from "./Hero.tsx";
import * as page from "./Page.module.css";
import { HomeLayout } from "./_layout/HomeLayout.tsx";
import { Counter } from "./counter/Counter.island.tsx";

export function Page(props: PageProps) {
	return (
		<HomeLayout {...props}>
			<Hero />

			<div class={clsx(page["entry"])}>
				<h2 class={clsx(page["title"])} id="static-by-default">
					Static by default
				</h2>

				<div class={page["description"]}>
					<p>
						By default Frugal only produces static html at build time, working{" "}
						<strong>like a static site generator</strong>.
					</p>
					<p>
						Each static page will be rebuilt only if the underlying data or code
						changed. If you use Frugal as a server, static page can also be{" "}
						<strong>
							generated <em>just in time</em>
						</strong>{" "}
						(on the first request), or <strong>regenerated via webhook</strong>.
					</p>
					<p>
						With a good content strategy you don't need to redeploy when your content
						changes
					</p>
				</div>

				<Code
					aria-labelledby="static-by-default"
					class={clsx(page["code"])}
					files={[
						{
							filename: "static-page.ts",
							language: "ts",
							code: `import { PageResponse } from "@frugal-node/core/page"
                        
export const route = '/';

export function build() {
    return PageResponse.data({
        hello: 'world'
    });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>Hello \${data.hello} !</h1>
        </body>
    </html>\`;
}
`,
						},
					]}
				/>
			</div>

			<div class={clsx(page["entry"])}>
				<h2 class={clsx(page["title"])} id="server-side-rendering-when-needed">
					Server side rendering when needed
				</h2>

				<div class={page["description"]}>
					<p>
						Frugal comes with a server that can render{" "}
						<strong>dynamic pages at request time</strong>. Pages can answer to GET,
						POST, PUT and DELETE with fully controlable responses (status and headers).
					</p>
				</div>

				<Code
					aria-labelledby="server-side-rendering-when-needed"
					class={clsx(page["code"])}
					files={[
						{
							filename: "dynamic-page.ts",
							language: "ts",
							code: `import { PageResponse } from "@frugal-node/core/page"
                        
export const route = '/:id';
    
export const type = 'dynamic'

export async function generate({ request, params }) {
    if (request.method === "GET") {
        return PageResponse.data({
            post: await getPostById(params.id)
        });
    }

    return PageResponse.empty({ status: 404 });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>\${data.post.title}</h1>
            \${data.post.content}
        </body>
    </html>\`;
}
`,
						},
					]}
				/>
			</div>

			<div class={clsx(page["entry"])}>
				<h2 class={clsx(page["title"])} id="progressive-enhancement-via-scripts">
					Progressive enhancement via <em>scripts</em>
				</h2>

				<div class={page["description"]}>
					<p>
						Any module declared as <em>Script</em> will be{" "}
						<strong>bundled and executed in the browser</strong>, allowing you to add
						interactivity to your pages where you need it.
					</p>
					<p>
						Scripts are enhancements of working html page. Clients that can run those
						scripts will get an <strong>enhanced experience</strong>, those that can't
						will get a functional html page.
					</p>
					<p>
						Scripts are the building blocks for island hydration if you use a
						client-side UI framework.
					</p>
				</div>

				<Code
					aria-labelledby="progressive-enhancement-via-scripts"
					class={clsx(page["code"])}
					files={[
						{
							filename: "page.ts",
							language: "ts",
							code: `import { PageResponse } from "@frugal-node/core/page"
import './log.script.ts'
                        
export const route = '/';

export function generate() {
    return PageResponse.data({
         hello: 'world'
    });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>Hello \${data.hello} !</h1>
        </body>
    </html>\`;
}
`,
						},
						{
							filename: "log.script.ts",
							language: "ts",
							code: `if (import.meta.environment === 'client') {
    console.log('Hello world')
}
`,
						},
					]}
				/>
			</div>

			<div class={clsx(page["entry"])}>
				<h2 class={clsx(page["title"])}>Island hydration</h2>

				<div class={page["description"]}>
					<p>
						Based on <em>Scripts</em>, Frugal implements an integration with{" "}
						<a class={clsx(link["link"])} href="https://preactjs.com/">
							Preact
						</a>{" "}
						. You can describe the whole UI with thoses framework, and optionnaly
						declare <strong>island of interactivity</strong> that will be bundled,
						served and <strong>hydrated on the client</strong>.
					</p>
					<Counter initialValue={5} />
				</div>

				<Code
					class={clsx(page["code"])}
					files={[
						{
							filename: "page.ts",
							language: "ts",
							code: `import { PageResponse } from "@frugal-node/core/page"
import { getRenderFrom } from "@frugal-node/preact"
import { Page } from "./Page.tsx";

export const route = '/';

export function build() {
    return PageResponse.data({
        hello: 'world'
    });
}

export const render = getRenderFrom(Page)
`,
						},
						{
							filename: "Page.tsx",
							language: "tsx",
							code: `import { PageProps } from "@frugal-node/preact";
import { Head, useData } from "@frugal-node/preact/client";
import { Counter } from './Counter.island.tsx'

function Page({ assets }: PageProps) {
     const scripts = assets.get("js");
    const data = useData();

    return <>
        <Head>
            {scripts.map((script) => {
                return <script key={script.path} async type="module" src={script.path} />;
            })}
        </Head>

        <h1>Hello {data.hello}</h1>

        <Counter />
    </>
}
`,
						},
						{
							filename: "Counter.island.tsx",
							language: "tsx",
							code: `import { Island } from "@frugal-node/preact/client";

import { NAME } from "./Counter.script.ts";
import { Counter as Component } from "./Counter.tsx";

export function Counter() {
    return <Island name={NAME} Component={Component} />;
}
`,
						},
						{
							filename: "Counter.tsx",
							language: "tsx",
							code: `import { signal } from "@preact/signals";

const count = signal(0);

export function Counter() {
    return <div>
        <button onClick={() => count.value = Math.max(0, count.value - 1)}>
            decrement
        </button>

        <span>count: {count}</span>

        <button onClick={() => count.value += 1}>
            increment
        </button>
    </div>
}
`,
						},
						{
							filename: "Counter.script.ts",
							language: "ts",
							code: `import { hydrate } from "@frugal-node/preact/client";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.environment === 'client') {
    hydrate(NAME, () => Counter);
}
`,
						},
					]}
				/>
			</div>
		</HomeLayout>
	);
}
