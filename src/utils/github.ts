import { GITHUB_USERNAME } from '../consts';

export interface GitHubRepo {
	name: string;
	description: string | null;
	html_url: string;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	updated_at: string;
	topics: string[];
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
	const response = await fetch(
		`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
		{
			headers: {
				Accept: 'application/vnd.github.v3+json',
			},
		}
	);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	const repos: GitHubRepo[] = await response.json();

	// Prefer orientation / protocol work, then stars; filter forks
	const preferred = new Set(['agent-artifact-protocol', 'gitpash', 'distractor-lab']);
	return repos
		.filter((repo) => !repo.fork)
		.sort((a, b) => {
			const ap = preferred.has(a.name) ? 1 : 0;
			const bp = preferred.has(b.name) ? 1 : 0;
			if (ap !== bp) return bp - ap;
			return b.stargazers_count - a.stargazers_count;
		})
		.slice(0, 6);
}

export async function getGitHubStats() {
	const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
		},
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	const data = await response.json();
	return {
		public_repos: data.public_repos,
		followers: data.followers,
		following: data.following,
	};
}
