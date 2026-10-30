import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Generative cover family; picked from the slug when omitted.
			cover: z.enum(['terrain', 'stack', 'rings', 'blocks', 'beams', 'grid', 'hooks']).optional(),
			tags: z.array(z.string()).default([]),
			// Longer title for <title>/social cards when the headline is short.
			seoTitle: z.string().optional(),
			// Set for articles first published elsewhere; also used as the canonical URL.
			canonicalUrl: z.string().url().optional(),
			// Series slug (see src/lib/series.ts) and position in it; both are needed to join a series.
			series: z.string().optional(),
			seriesOrder: z.number().int().positive().optional(),
		}),
});

export const collections = { blog };
