# Using Preact

## Update the configuration

First we need to update our `tsconfig.json` to handle jsx syntax. To do so, you simply need to add two properties : 

```json filename=tsconfig.json
{
    "compilerOptions": {
        ...
		"jsx": "react-jsx",
		"jsxImportSource": "preact"
    }
}

```

Frugal uses [esbuild](https://esbuild.github.io/) under the hood. Esbuild will respect the configuration inside your `tsconfig.json`. With this we have both our IDE and frugal configured to work with jsx syntax.

## Update the post page

First, we move our markup in a jsx component inside `pages/PostPage.tsx` :

```tsx filename=pages/PostPage.tsx
import { type PageProps, useData, Head } from "@frugal-node/react"

export function PostPage({ assets }: PageProps) {
    const data = useData<{ title:string, content: string }>()

    return <>
        <Head>
            {assets.get('css').map(style => {
                return <link rel="stylesheet" href={style.path} />
            })}
        </Head>

        <h1>{data.title}</h1>
        <div dangerouslySetInnerHTML={{ __html:  data.content }} />
    </>
}
```

In this component :

- `PageProps` is the standard props object passed to page components (the top-level component of your page).
- `useData` is the hook used to access the data object. This hook can be used in any component with some caveats.
- `Head` is the component used to modify the document's `<head>`. We use it to link to the page stylesheet.

Now we need to modify the page module :

```ts filename=pages/posts.ts
...

import { getRenderFrom } from "@frugal-node/react"
import { PostPage } from "./PostPage.tsx"

...

export const render = getRenderFrom(PostPage)
```

And that's it. We now have a static page that can be designed with jsx components. But remember that the homepage still uses js templates to output raw HTML. This means that you can mix any UI framework you want on different pages.

For now, Frugal still outputs static markup for our components. To have a client-side component, we'll have to use islands.

## First client-side island

We will add a counter to the homepage. To do so, we first need to migrate it to preact, like we did for the posts page (this is left as an exercise for you).

Once the page works with preact, we create our stateful counter component :

```tsx filename=Counter.tsx
import * as hooks from "preact/hooks";

export type CounterProps = {
    initialValue: number;
};

export function Counter({ initialValue }: CounterProps) {
    const [count, setCount] = hooks.useState(initialValue)

    return (
        <div>
            <button onClick={() => setCount(Math.max(0, count - 1))}>
                decrement
            </button>

            <span>{count}</span>

            <button onClick={() => setCount(count + 1)}>
                increment
            </button>
        </div>
    );
}
```

Next, we create a hydration script `CounterIsland.script.ts` :

```tsx
import { hydrate } from "@frugal-node/preact/client";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.environment === "client") {
    hydrate(NAME, () => Counter);
}
```

>[!warn]
> Inside scripts (or inside script dependencies), always use `@frugal-node/preact/client` and not `@frugal-node/preact` to avoid pulling server code in your client bundles.

Since it is a client-side script using `import.meta.environment`, the `hydrate` function will execute only client-side. The function will hydrate all instances of islands with the name `"Counter"` with the `Counter` component.

Now we create a `CounterIsland.tsx` component to create island instances of our `Counter` component :

```tsx
import { Island } from "@frugal-node/preact";
import { NAME } from "./Counter-hydrate.script.ts";
import { Counter, CounterProps } from "./Counter.tsx";

export function CounterIsland(props: CounterProps) {
    return <Island name={NAME} Component={Counter} props={props} />;
}
```

The `Island` component will render the `Counter` components in the static markup outputted by Frugal and embed in that markup any data necessary to the hydration process. The name of the island is also embedded in the markup.

We can now use our `CounterIsland` inside our `Page` component :

```tsx filename=pages/HomePage.tsx lines=[2,18]
...
import { CounterIsland } from "./CounterIsland.tsx"

...

export function Page({ assets }: PageProps) {
    return <>
        <Head>
            {assets.get('css').map(style => {
                return <link rel="stylesheet" href={style.path} />
            })}
            {assets.get('js').map(script => {
                return <script type="module" src={script.path} />
            })}
        </Head>

        <h1 id={TITLE_ID}>My blog</h1>
        <CounterIsland initialValue={3}/>
    </>
}

...

```

Inside your browser's dev tools, you can see the generated js bundle containing our first _vanilla_ script (changing the style of the title every 0.5s), our `Counter.ts` component and its dependencies (`hydrate`, `preact` etc...).

## To infinity and beyond

The _getting-started_ section is done; you had a first overview of Frugal's capacities. Check out the references and guides to learn more about Frugal!