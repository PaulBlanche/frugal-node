# Styles and scripts

## Adding build plugins

Styles and scripts are handled via build plugins. To configure them, we first create a `frugal.config.build.js` :

```ts filename=frugal.config.build.js
/** @type {import('frugal-node').BuildConfig} */
export default {
    plugins: []
}
```

We have to pass this config object to our dev script :

```ts filename=dev.js
import { context } from "frugal-node"
import config from "./frugal.config.js"
import buildConfig from "./frugal.config.build.js"

const watchContext = await context(config, buildConfig)

await watchContext.watch()
```

We are now all set to add build plugins.

## Adding style to our posts

Let's add some simple styles to our post page. First, we have to setup the css plugin :

```ts filename=frugal.config.build.js lines=[1,5]
import { css } from "frugal-node/plugin-css"

/** @type {import('frugal-node').BuildConfig} */
export default {
    plugins: [css()],
};
```

Now adding styles is simple: write the CSS and import it. Nothing says frugal like relying on the web platform, so Frugal makes it simple.

We can create a `pages/post.css` file :

```css filename=pages/post.css
h1 {
    color: green;
    text-decoration: solid underline;
    font-size: 4rem;
}
```

We then import it into our page `pages/post.ts`, and link the generated stylesheet in our markup :

```ts filename=pages/post.ts lines=[3,7,10-14]
...

import "./post.css";

...

export function render({ data, assets }: RenderContext<typeof route, Data> ) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("css").map(style => {
            return `<link rel="stylesheet" href="${style.path}" />`
        }).join('\n        ')}
    </head>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The `assets` parameters contain the assets generated for the page. They are grouped by type (`"css"`, `"js"`, ...), and can contain multiple asset for each page. The value returned by `assets.get()` will depend on the type of assets. Here for the type `"css"` you get a list of css file path.

We imported and applied the style in the posts page, and only this page. The title of the homepage has no style. It's because by default the css plugin creates a different CSS bundle for each page. For the posts page `assets.get()` returns one url containing `post.css`, but for the homepage since no `.css` file where imported, no stylesheet were generated and `assets.get()` returns an empty array. Let's fix that by giving it its own style with a `pages/home.css` file :

```css filename=pages/home.css
h1 {
    color: blue;
    text-decoration: wavy underline;
    font-size: 4rem;
}
```

We also edit the `pages/home.ts` module to import the style and link the generated stylesheet in the markup :

```ts filename=page/home.ts lines=[3,10-14]
...

import "./home.css";

...

export function render({ assets }: RenderContext<typeof route>) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("css").map(style => {
            return `<link rel="stylesheet" href="${style.path}" />`
        }).join('\n        ')}
    </head>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

Now the title on the homepage is blue with a wavy underline, while it is green with a solid underline in the posts. Each page gets its own style.

> [!info]
> If you have global styles you want applied to each pages of your project, you can set the [`globalCss`](/doc@{{version}}/reference/configuration#heading-globalcss) in your config. The compiled global stylesheet will be added to the array returned by `assets.get()` for each pages.
>
> You can also change the [`scope`](/doc@{{version}}/reference/plugins#heading-scope) of the css plugin to have each imported `.css` file considered global.

## First client-side script

Let's add a super simple script to our homepage page. First, we have to configure Frugal to bundle _scripts_ :

```ts filename=frugal.config.build.js lines=[2,6]
import { css } from "frugal-node/plugin-css"
import { script } from "frugal-node/plugin-script"

/** @type {import('frugal-node').BuildConfig} */
export default {
    plugins: [css(), script()],
};
```

Each imported module ending with `.script.ts` will be interpreted as a client-side script and bundled with other scripts from the page. Let's write our first seizure-inducing script :

```ts filename=page/hello.script.ts
export const TITLE_ID = 'blog-title'

if (import.meta.environment === 'client') {
    const title = document.getElementById(TITLE_ID)!
    
    let color = 'blue';
    title.style.color = color

    setInterval(() => {
        title.style.color = color
        color = color === 'blue' ? 'red' : 'blue';
    }, 500)
}
```

> [!info]
> The value `import.meta.environment` will change depending on the execution environment. At build time or in the server the value will be `"server"`. Inside a browser it will be `"client"`.
>
> This means that the inside of the condition won't run at build time; it will run only client-side. Any code outside the condition will be executed both at build time and client-side.

We can import our script into our homepage `pages/home.ts`, and link to the generated script in the markup :

```ts filename=page/home.ts lines=[3,14-16,19]
...

import { TITLE_ID } from  "./hello.script.ts";

...

export function render({ assets }: RenderContext<typeof route>) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("css").map(style => {
            return `<link rel="stylesheet" href="${style.path}" />`
        }).join('\n        ')}
        ${assets.get("js").map(script => {
            return `<script type="module" src="${script.path}"></script>`
        }).join('\n        ')}
    </head>
    <body>
        <h1 id="${TITLE_ID}">My blog</h1>
    </body>
</html>`
}
```

Here we also assigned the id exported by the script to the `h1` tag. That way, we only ever have to define "hooks" (like id or class) for our script in one place (a unique source of truth) to keep both the scripts and the markup in sync. Changing the exported id in the script will also update the markup depending on it.

> [!warn]
> Frugal only generates ES Modules from scripts. They need to be imported via a script tag with attribute `type="module"` to work, and won't work with [older browsers](https://caniuse.com/es6-module). 
>
> If you have critical scripts that must work on older browsers, you'll have to bundle them yourself.
>
> **As a general rule, think of scripts as _enhancement_ of a functionning static page instead of what makes the page work.**

If we load the homepage, we see that our script is executed. Scripts are scoped the same way as styles: A bundle is created for each page. This measn that our post pages won't run the script we created.

In the next section, we will use preact server side and leverage scripts to create our first island.