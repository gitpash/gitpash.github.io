// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';

// Posts first published elsewhere carry a canonicalUrl; keep them out of the sitemap so the
// original keeps the credit.
const postsElsewhere = readdirSync('./src/content/blog')
	.filter((f) => /^canonicalUrl:/m.test(readFileSync(`./src/content/blog/${f}`, 'utf8')))
	.map((f) => `/blog/${f.replace(/\.mdx?$/, '')}/`);

// https://astro.build/config
export default defineConfig({
	site: 'https://gitpash.github.io',
	base: '/',
	build: { inlineStylesheets: 'always' },
	integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') && !postsElsewhere.some((p) => page.endsWith(p)) })],
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark-dimmed' },
			defaultColor: false,
		},
	},
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Inter',
			cssVariable: '--font-inter',
			weights: [400, 500, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Source Serif 4',
			cssVariable: '--font-serif',
			weights: [400, 600],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Silkscreen',
			cssVariable: '--font-pixel',
			weights: [400],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['monospace'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Fira Code',
			cssVariable: '--font-mono',
			weights: [400],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
