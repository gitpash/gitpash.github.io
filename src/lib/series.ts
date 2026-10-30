// Registry of post series. A post joins a series with `series` and `seriesOrder` in its frontmatter.
export const SERIES: Record<string, { title: string; description: string }> = {
	aap: {
		title: 'Agent Artifact Protocol in practice',
		description: 'Posts about a small map convention that lets an agent find repository context without loading all of it.',
	},
};
