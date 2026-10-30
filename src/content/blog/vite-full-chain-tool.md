---
title: 'Using Vite as a full-chain tool of developing, bundling and documenting your code'
description: 'Why a native-ESM dev server beats a webpack setup, how to swap the Storybook builder for Vite, and how to share and document components.'
seoTitle: 'Using Vite as a full-chain front-end tool with Storybook'
cover: 'beams'
pubDate: '2022-03-31'
canonicalUrl: 'https://medium.com/anymind-group/using-vite-as-a-full-chain-tool-of-developing-bundling-and-documenting-your-code-4e9a1d150a02'
tags: ['vite', 'storybook', 'tooling']
---

Webpack has become the default solution for bundling front-end codebases, it has its own strengths like wide tooling integrations, community support and very flexible configuration, basically you can create anything with it. But it also has weaknesses: complicated setup & assets management, bundle size and sometimes performance issues — since it must process all of your app JS modules before any other actions becomes available.

In that case, development mode might become slow, especially if you have many dependencies in your project.

**Can we do better?**

Let’s take a look at another approach of bundling your code. Since [Native ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) are widely supported by modern browsers — we can let them do this “bundling” process for us. One of such tools you can pick is [Vite](https://vitejs.dev/) — Next Generation Frontend Tooling™️. Once you run the development mode script, Vite will do [pre-bundling](https://vitejs.dev/guide/dep-pre-bundling.html):

- trying to ensure CommonJS and UMD compatibility (to be able to serve all code as native ESM)
- if ESM dependency has many internal modules ([`lodash-es`](https://unpkg.com/browse/lodash-es/) [has over 600 internal modules](https://unpkg.com/browse/lodash-es/)! 🤯) it will combine them into a single module (to improve subsequent page load performance

Besides of that, Vite providing some nice defaults:

- [HMR API](https://vitejs.dev/guide/api-hmr.html) over native ESM
- importing `.ts` files out of the box (note that it will only transpile `.ts`files, not type checking them)
- Static asset loading (you don’t need `loader: “file-loder"`)
- SASS & CSS loader
- and a lot more … you can find out the full list in their [docs](https://vitejs.dev/guide/features.html).

## Replace Storybook’s default build plugin

One more thing that may excite you even more about Vite is a [Storybook](https://storybook.js.org/) integration. If you ever use storybook you know it is slow although as a tool — it is very useful and highly appreciated by the community (at the time of writing this, it has 69k stars on GitHub). The reason for this is the same as above — it is using webpack as a builder tool. Luckily, Vite community created nice [plugin](https://github.com/storybookjs/builder-vite) which can replace webpack from SB build process.

```bash
npx sb init --builder storybook-builder-vite
```

I’ve tested both in my UI library and get ~2x faster build with Vite.

## Ok, I’m sold what’s next?

Once you’ll set up your app and integrate Storybook, you might also want to share it with your team, SB team recommending to use [Chromatic](https://www.chromatic.com/) for this. Sign in with your GitHub, GitLab, Bitbucket, or email, and you’ll obtain your `project-token` which you’ll need to deploy your stories.

```bash
# Yarn
yarn add --dev chromatic

# npm
npm install --save-dev chromatic
```

then you can add a script to your package.json file or simply run

```bash
npx chromatic --project-token <your-project-token>
```

This command with initiate Storybook build, which will be published to your Chromatic account as build with a number.

```text
Build 1 published.

View it online at https://www.chromatic.com/build?appId=...&number=1.
```

If you click on the link — you’ll be redirected to your build review page. On this page you can review visual changes diff which this code bring to your components and accept or decline them.

You can also invite your teammates as collaborators to help review new builds and also share your components with others.

## Documenting your components

The last thing I would like to share today is how you can document your components. Recently, I’ve been working on a shared UI library for our React projects, to make it easier for others to reason about component’s API Storybook provides one nice feature they called [argTypes](https://storybook.js.org/docs/react/api/argtypes). With those arguments, you can describe all of your component’s props with dynamic arguments and visually change them in the Storybook UI.

Storybook will build a fully interactive widget from those `argTypes` where you and others can see how your component can react to different props passed.

## Conclusion

There are many good options for bundling|building your front-end codebases these days, and webpack still is the most popular one for good reasons. But front-end tooling ecosystem currently gets a lot of attention from open source community and some big companies — as a result we can see that a lot of new generation tools appear: [Rome](https://rome.tools/), [SWC](https://swc.rs/), [esbuild](https://esbuild.github.io/), [parcel](https://parceljs.org/), [Vite](https://vitejs.dev/), [Snowpack](https://www.snowpack.dev/) and a lot more. All of them has their own strengths and weaknesses — you just need to pick what’s suit your needs best. In my opinion Vite seems the most promising webpack alternative — as if offers speed(thanks to [esbuild](https://esbuild.github.io/)), simple config and easy API, nice defaults, [plugin API](https://vitejs.dev/guide/using-plugins.html), [fast-growing community tools](https://github.com/vitejs/awesome-vite).
