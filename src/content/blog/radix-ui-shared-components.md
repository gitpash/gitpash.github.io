---
title: 'Building shared-components library with Radix UI'
description: 'Why headless, accessible primitives suit a multi-team company with different stacks, and what composing them looks like.'
pubDate: '2021-12-23'
canonicalUrl: 'https://medium.com/anymind-group/tech-blog-building-shared-components-library-with-radix-ui-f1435fdc89c8'
tags: ['react', 'accessibility', 'ui-library']
---

Recently, our company decided that we can benefit from having shared-components library across multiple teams, after some internal discussions we’ve decided base tech stack and some high level use cases, but in terms of actual implementation — there are still some things to consider. Although many of our projects already have good primitives(we mostly utilize [atomic](https://atomicdesign.bradfrost.com/chapter-2/) pattern) reused within the same team — they are currently lacking of some accessibility features and good keyboard support. Searching for the solution, I’ve found [Radix UI](https://www.radix-ui.com/) — unstyled set of UI primitives with all accessibility baked in! Since teams are using different tech stack, the solution must be headless and allow providing custom styles based on the framework they are using. Having composable sets of primitives without any styles by default seems a very nice way to handle this scenario.

*The interactive demos and code samples of the original article are not reproduced here; the text below refers to them as in the original.*

## Primitives 🧱

Let’s take a look at some building block provided for us to construct our interfaces, below you can see how easy the implementation is, I’ll prove 2 types of “checkbox primitives”: base uncontrolled and controlled with an indeterminate state. Switch item below is somehow similar to one we're going to use in our products, I’ve applied some styles for it to match our UI kit.

In this interactive demo, you can see React implementation and try to use it with keyboard, “tab” for getting focus to move through UI, “spacebar” can toggle checkboxes or switch state — pretty cool, right?

## Composition of primitives 🎼

Now let’s add something a bit more complex, for example [Popover component](https://www.radix-ui.com/docs/primitives/components/popover) and place our newly created toggles into it and see how the code and UI will look like. Notice that for popover state I don’t even need to have special parameter and pass it with handler (but of course it is possible if you want it), here “tab” + “spacebar” again to toggle open|close, navigate between checkboxes and close icon, toggle checkboxes state.

One more UI element heavily used among user interfaces is the [Modal Dialog](https://www.radix-ui.com/docs/primitives/components/dialog), luckily Radix also have primitives for it implemented already, all we need to do is compose it with the content we’d like to present to the user

You can try using keyboard to operate this Dialog and change content state or switch between form fields or action buttons, “escape” will automatically close it.

## Utilities 🛠

Radix’s team also provide some utilities to make creating UI even better, in the examples above I’ve used their icons set(@radix-ui/react-icons), they are also providing a set of [accessible icons](https://www.radix-ui.com/docs/primitives/utilities/accessible-icon) — for better screen readers support. [Visually Hidden](https://www.radix-ui.com/docs/primitives/utilities/visually-hidden) — will help hiding some UI elements yet able to keep them announced by screen readers. [Portal](https://www.radix-ui.com/docs/primitives/utilities/portal) is the same as React’s “createPortal” API — to be able to render any subtree outside of your App body (or attach to any container via reference).

## Conclusion 🤓

Radix-UI primitives can be used to help your team build accessible style system if you need it, or you can gradually adopt it within your current components and improve UX for your site visitors.

*Key strengths are*:

- Modularity (you can install each primitive separately)
- Ease of customization (no styles baked in, can use composition and build components in the way you want)
- Accessibility by default (no need to implement by hands)
- Developer Experience (consistent API, full control over primitive behavior, TypeScript)

*Cons:*

- Some primitives are still not implemented (Select, Toast, Carousel, …)
- Don’t have plug-n-play components (you need to compose them yourself from primitives), but this may be also good if your goal is having more control
- Need to pick style system by yourself (also not a problem if you already have one)

I hope this article can help you to decide whenever you want to use Radix-UI as a base for your style system and also make more people aware of such beautiful tool exist. If you are curious to know more, consider reading their [case studies](https://www.radix-ui.com/case-studies) — review of some big companies adopted their solution and impact it gave on their web apps.
