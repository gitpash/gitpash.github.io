// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Pavel Luzanov';
export const SITE_DESCRIPTION =
	'Product engineer with a frontend core: I take products to release, from domain and specs to agent workflows.';
export const GITHUB_USERNAME = 'gitpash';
export const GITHUB_URL = 'https://github.com/gitpash';
export const EMAIL = 'arklogin@gmail.com';
export const LINKEDIN_URL = 'https://linkedin.com/in/pavelluz';
export const SITE_URL = 'https://gitpash.github.io';
export const SITE_LOCATION = 'Tokyo, Japan';

// Per-page <title>, description and social-card text. Titles aim at 50-60 characters and
// descriptions at 120-160, and every page has its own.
export const PAGES = {
	home: {
		title: 'Pavel Luzanov: product engineer with a frontend core',
		description:
			'Product engineer in Tokyo. I take products to release, from domain and specs to agent workflows, with years of frontend craft behind it.',
		cardTitle: 'Product engineer with a frontend core',
		cardSubline: 'Domain, specs and agent workflows',
		family: 'terrain',
	},
	about: {
		title: 'About Pavel Luzanov: product engineer in Tokyo, Japan',
		description:
			'How a frontend engineer became a product engineer: the whole delivery cycle, backend and speed work, and agent workflows kept under human review.',
		cardTitle: 'About Pavel Luzanov',
		cardSubline: 'From frontend to the whole delivery cycle',
		family: 'rings',
	},
	blog: {
		title: 'Blog: agent workflows and engineering notes by Pavel',
		description:
			'Notes on agentic workflows, documentation for coding agents and front-end engineering, including the Agent Artifact Protocol and older articles.',
		cardTitle: 'Agent workflows and engineering notes',
		cardSubline: 'The blog of Pavel Luzanov',
		family: 'grid',
	},
	cv: {
		title: 'CV of Pavel Luzanov: product engineer, frontend roots',
		description:
			'Curriculum vitae of Pavel Luzanov: senior product engineer in Tokyo with a frontend core, cross-surface delivery and AI-augmented workflows.',
		cardTitle: 'CV: Pavel Luzanov',
		cardSubline: 'Senior product engineer, frontend roots',
		family: 'stack',
	},
} as const;
