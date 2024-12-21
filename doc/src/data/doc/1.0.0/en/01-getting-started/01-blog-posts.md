# Blog posts

For our blog, we need to have a "blog post page" that displays a given blog post. We want this page to be static and we want a page for each of our posts.

## Static page with data fetching

Before anything, we need a list of posts to render. As a starting point we will use an array of posts as a makeshift database, and to simplify things further we will write this array directly in our page file `pages/posts.ts`.

```ts filename=pages/posts.ts
type Post = { 
    slug: string; 
    title: string; 
    content: string;
}

const POSTS: Post[] = [
    {
        slug: "hello-world",
        title: "Hello world",
        content: "<p>This is my first post ever</p>"
    },
    {
        slug: "second-post",
        title: "Second post",
        content: "<p>And a second post !</p>"
    },
]
```

Now we need to define the pattern of URLs generated from the page. We would like URLs like `/post/hello-world` and `/post/second-post` for our posts. To do so, we will use the route `/post/:slug` :

```ts filename=pages/posts.ts lines=[7]
...

const POSTS: Post[] = [
    ...
]

export const route = '/post/:slug';
```

To generate an html page for each post, Frugal needs you to define a `getBuildPaths` method (called at build time) that will return the list of all possible "param objects". With a route `/post/:slug`, the param object will have the shape `{ slug: string }`. The `getBuildPaths` method has to return the list of each slug:

```ts filename=pages/posts.ts lines=[1,7-9]
import { type PathParamsList } from "@frugal-node/core/page"

...

export const route = '/post/:slug';

export function getBuildPaths(): PathParamsList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}
```

> [!tip]
> The `PathParamsList` type will infer the shape of the path objects from the `route` for you. That's why you need the `PathParamsList<typeof route>` type.

We simply have to map over an array, but any asynchronous operations can happen here: reading from a file or a database, calling an API, etc...

Then, we define the data fetching method `build`. This method is called at build time, and this is where - given the URL parameters - we query any data needed to build the page :

```ts filename=pages/posts.ts lines=[2-3,13-16]
import { 
    type BuildContext, 
    PageResponse, 
    type PathParamsList, 
} from "@frugal-node/core/page"

...

export function getBuildPaths(): PathParamsList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function build({ params: { slug } }: BuildContext<typeof route>) {
    const post = POSTS.find(post => post.slug === slug)
    return PageResponse.data(post)
}
```

Here in the `build` function we search an array, but again any asynchronous operations can happen here.

The consolidated data that was fetched (here a single `Post` matching the given slug) is returned in a response object via the `PageResponse.data` function.

Finally, we define a `render` method that will output HTML markup for a given data object :

```ts filename=pages/posts.ts lines=[5,15-23]
import { 
    type BuildContext, 
    PageResponse,
    type PathParamsList, 
    type RenderContext,
} from "@frugal-node/core/page"

...

export function build({ params: { slug } }: BuildContext<typeof route>) {
    const post = POSTS.find(post => post.slug === slug)
    return PageResponse.data(post)
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

Now that our page is complete, we can add it to the `pages` list in the `cli.js` module :

```ts filename=cli.js lines=[6]
...

/** @type {import("@frugal-node/core/config/build").BuildConfig} */
const config = {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts']
};

...
```

Here is the whole file `pages/posts.ts` after we are done :

```ts filename=pages/posts.ts
import { 
    type BuildContext, 
    PageResponse,
    type PathParamsList, 
    type RenderContext,
} from "@frugal-node/core/page"

export const route = '/post/:slug'

type Post = { 
    slug:string; 
    title: string; 
    content: string;
}

const POSTS: Post[] = [
    {
        slug: "hello-world",
        title: "Hello world",
        content: "<p>This is my first post ever</p>"
    },
    {
        slug: "second-post",
        title: "Second post",
        content: "<p>And a second post !</p>"
    },
]

export function getBuildPaths(): PathParamsList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function build({ params: { slug } }: BuildContext<typeof route>) {
    const post = POSTS.find(post => post.slug === slug)
    return PageResponse.data(post)
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> This is the general shape of a static page: a `route` string and three methods `getBuildPaths`, `build`, and `render`.
>
> But as you saw earlier with the `pages/home.ts` page, `getBuildPaths` and `build` are optional if you don't need them :
>
> - You don't need `getBuildPaths` for a page with a single path.
> - You don't need `build` for a page without any data fetching.
>
> However, you must always define a `route`.

## External data

Having the `POSTS` array keeps everything simple, but mixing code and data's not a good practice; we'd have to update the page code each time we want to add a post.

Instead, we could have an `posts.json` file containing all our posts. Adding a post would simply means adding a new entry to the `posts.json`. No code modification needed.

To do so, we create a `pages/posts.json` file :

```ts filename=pages/posts.json
[
    {
        "slug": "hello-world",
        "title": "Hello world",
        "content": "<p>This is my first post ever</p>"
    },
    {
        "slug": "second-post",
        "title": "Second post",
        "content": "<p>And a second post !</p>"
    }
]
```

We can remove our `POSTS` array. Instead of reading from the array, we will read from the `posts.json` file.

Now we have to rewrite the `getBuildPaths` and `build` methods. Let's start with `getBuildPaths`. We have to load the `posts.json` file and iterate over each post:

```ts filename=pages/posts.ts lines=[1,5-11]
import * as fs from 'node:fs'

...

export async function getBuildPaths(): Promise<PathParamsList<typeof route>> {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const posts: Post[] = JSON.parse(postsText)

    return posts.map(post => ({ slug: post.slug }));
}

...
```

> [!info]
> The `new URL(..., import.meta.url)` pattern is necessary because Frugal will bundle your project, output it in another place and run it from there. Frugal detects external files referenced via `new URL(..., import.meta.url)`, copy them right next to the outputed code and rewrite the url to point to the copied asset. 
>
> If you need to reference external files, use `new URL(..., import.meta.url)` instead of as simple path. In dev mode, Frugal will watch those external files and trigger a page reload on change.

For the `build` method, given the slug, we find the corresponding entry in the `posts.json` file and get its `"content"`. :

```ts filename=pages/posts.ts lines=[4,10-22]
import { 
    type BuildContext, 
    PageResponse,
    type PathParamsList, 
    type RenderContext,
} from "@frugal-node/core/page"

...

export async function build({ params: { slug } }: BuildContext<typeof route>) {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const posts: Post[] = JSON.parse(postsText)

    const post = posts.find(post => post.slug === slug)

    if (post === undefined) {
        return PageResponse.empty({ status: 404 })
    }

    return PageResponse.data<Post>(post)
}

...
```

> [!tip]
> Instead of a `PageResponse.data` response, the `build` function can return an `PageResponse.empty` response when you wish to return a response without calling the `render` method. Here we use it to return a `404` without a body.

Here is the whole file `pages/posts.ts` after we are done :

```ts filename=pages/posts.ts
import { 
    type BuildContext, 
    PageResponse,
    type PathParamsList, 
    type RenderContext,
} from "@frugal-node/core/page"
import * as fs from 'node:fs'

export const route = '/post/:slug'

type Post = { 
    slug:string; 
    title: string; 
    content: string;
}

export async function getBuildPaths(): Promise<PathParamsList<typeof route>> {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const posts: Post[] = JSON.parse(postsText)

    return posts.map(post => ({ slug: post.slug }));
}

export async function build({ params: { slug } }: BuildContext<typeof route>) {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const posts: Post[] = JSON.parse(postsText)

    const post = posts.find(post => post.slug === slug)

    if (post === undefined) {
        return PageResponse.empty({ status: 404 })
    }

    return PageResponse.data<Post>(post)
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

## Using markdown

Having raw html inside json in our `pages/posts.json` file is not practical. Instead of having a `"content"` value, we could have a `"file"` value pointing to a markdown file. It would make editing content easier.

To do so, we write two markdown files with our content (`/pages/content/hello-world.md` and `/pages/content/second-post.md`) and update the `pages/posts.json` file :

```ts filename=pages/posts.json
[
    {
        "slug": "hello-world",
        "title": "Hello world",
        "file": "hello-world"
    },
    {
        "slug": "second-post",
        "title": "Second post",
        "file": "second-post"
    }
]
```

Previously, `pages/posts.json` contained a list of `Post` (`title`, `slug` and `content`). Now it contains a different type (`title`, `slug` and `file`) that we'll call `Entry` :

```ts filename=pages/posts.ts
...

type Entry = {
    slug: string,
    title: string,
    file: string
}

...
```

The `getBuildPaths` method does not change (except for a change in type to use `Entry`), since the `pages/posts.json` still contains all slugs that needs to be generated. But we need to change the `build` method to read and parse the markdown file. We will use marked for this task :

```ts filename=pages/posts.ts lines=[3,10,27-30]
...

import { marked } from "marked"

...

export async function getBuildPaths(): Promise<PathParamsList<typeof route>> {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const entries: Entry[] = JSON.parse(postsText)

    return entries.map(entry => ({ slug: entry.slug }));
}


export async function build({ params: { slug } }: BuildContext<typeof route>) {
    const postsFileURL = new URL('./posts.json', import.meta.url)
    const postsText = await fs.promises.readFile(postsFileURL, { encoding: 'utf-8' })
    const entries: Entry[] = JSON.parse(postsText)

    const entry = entries.find(entry => entry.slug === slug)

    if (entry === undefined) {
        return PageResponse.empty({ status: 404 })
    }

    const postFileURL = new URL(`./content/${entry.file}.md`, import.meta.url)
    const markdown = await fs.promises.readFile(postFileURL, { encoding: 'utf-8' })
    const content = marked.parse(markdown)

    return PageResponse.data<Post>({ slug:post.slug, title: post.title, content })
}
```

> [!info]
> Frugal can handle `new URL(..., import.meta.url)` with dynamic values with some caveats, including :
>  - variables will be replaced with a wildcard that will match **only one level of files** : `new URL(./data/${bar}.md, import.meta.url)` will match `./data/foo.md` but not `./data/bar/foo.md`.
>  - paths must end with a file extension, to avoid matching and copying too many files.
>  - paths must be relative.

We now have a small markdown file-based static blog, but it could be improved (left as an exercice to the reader) :

- the `pages/` directory is a mess of unrelated files (`.ts` files for pages and `.json` data). We could better organise the project by separating data and source files.
- instead of having the `posts.json` file, we could have all our markdown files in a single directory, each with a front-matter for title and slug. The `getBuildPaths` method would scan the directory, parse the front-matter of each file and output the liste of slugs

Our static blog only serves raw HTML for now. In the next section, we will add assets (JS scripts and CSS) to our pages.