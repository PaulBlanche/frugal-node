# Create a project

## Your very own CLI 

Frugal tries to assume as little as possible about your project so you have to configure it. First, let's write the minimal configuration needed. Since this module will directly be executed by Node.js, we need to write vanilla js (you can use jsdoc to typecheck your config) :

```ts filename=cli.js
/** @type {import("@frugal-node/core/config/build").BuildConfig} */
const config = {
    self: import.meta.url,
    pages: []
};
```

The `self` property should be the absolute path of the module (obtained with [`import.meta.url`](https://nodejs.org/docs/latest/api/esm.html#importmetaurl)). The folder where the config module resides will be the root of your project (the _dirname_ of `self`). Frugal will resolve every path in the config relative to this root.

> [!warn]
> Unless you know what you are doing, `self` should always be `import.meta.url`.

The `pages` should list the paths of the page modules of your website.
It is empty for now, but not for long.

Let's finish the cli by actually calling build and watch methods :

```ts filename=cli.js lines=[1,9-15]
import { build, context } from "@frugal-node/core";

/** @type {import("@frugal-node/core/config/build").BuildConfig} */
const config = {
    self: import.meta.url,
    pages: []
};

if (process.argv[2] === "build") {
	await build(config);
}

if (process.argv[2] === "dev") {
	(await context(config)).watch();
}
```

Now you can launch frugal with either :
 - `node cli.js dev` to start the application in dev mode
 - `node cli.js build` to create an optimized production build of the application

> [!info]
> The dev server has live-reload capacity. Changing the code of a page or any of its dependencies should trigger a page reload.
>
> However, this is limited to _staticaly analyzable imports_ (static imports or dynamic imports with paths known ahead of time). Any change in external data sources (database, API, ...) won't trigger a reload: you'll have to refresh the page manually

## Your first page

Create a file `pages/home.ts` with the following code :

```ts filename=pages/home.ts
export const route = '/'

export function render() {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

Add the relative path to the newly created page in the configuration module :

```ts filename=cli.js lines=[6]
...

/** @type {import("@frugal-node/core/config/build").BuildConfig} */
const config = {
    self: import.meta.url,
    pages: ['pages/home.ts']
};

...
```

For now, we will not use any UI framework, so we output basic HTML with template strings in the `render` method. This method will be called at build time to generate the page's markup. The `route` contains the URL pattern of the generated page. Here the generated page will live at the root of the website.

Run `node cli.js dev` to start the dev server and visit `localhost:3000/`

You just wrote your first static page with Frugal!

Now that we have a working project, we will start coding our blog in the next section.

