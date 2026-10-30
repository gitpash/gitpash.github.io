import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { PAGES, SITE_URL } from '../consts';

// Plain-text guide to the site for language-model crawlers and agents (https://llmstxt.org).
export const GET: APIRoute = async () => {
	const posts = (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const lines = [
		'# Pavel Luzanov',
		'',
		`> ${PAGES.home.description}`,
		'',
		'Personal site and blog. Posts are written by Pavel Luzanov; the AAP posts describe a small protocol for giving coding agents a map of a repository.',
		'',
		'## Pages',
		'',
		`- [About](${SITE_URL}/about/): who I am and how I work`,
		`- [CV](${SITE_URL}/cv/): work history and skills`,
		`- [Blog](${SITE_URL}/blog/): all posts`,
		`- [RSS feed](${SITE_URL}/rss.xml)`,
		'',
		'## Posts',
		'',
		...posts.map((post) => `- [${post.data.title}](${SITE_URL}/blog/${post.id}/): ${post.data.description}`),
		'',
		'## Projects',
		'',
		'- [agent-artifact-protocol](https://github.com/gitpash/agent-artifact-protocol): AAP, a git-native convention for agent repository maps (experimental draft), with a Claude Code plugin and a skill',
		'',
	];
	return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
