// Palette checks: (1) no raw colours outside the token files, (2) WCAG contrast of the
// role pairs in both themes, (3) src/lib/palette.ts matches the --c-* source colours.
// Run with `npm run check:palette`. Pass --table to print the contrast table as Markdown.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');
let failed = false;
const fail = (msg) => {
	failed = true;
	console.error('FAIL ' + msg);
};

// ---- 1. raw colours ----
const SKIP_DIRS = new Set(['content']);
const TOKEN_FILES = new Set(['src/styles/global.css', 'src/lib/palette.ts']);
const files = [];
(function walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) {
			if (!SKIP_DIRS.has(name)) walk(p);
		} else if (/\.(astro|css|ts|js|mjs)$/.test(name)) files.push(p);
	}
})(join(root, 'src'));
const RAW = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(|:\s*(white|black)\b/;
for (const f of files) {
	const rel = relative(root, f);
	let inComment = false;
	readFileSync(f, 'utf8')
		.split('\n')
		.forEach((line, i) => {
			const wasInComment = inComment;
			if (line.includes('/*') && !line.includes('*/')) inComment = true;
			if (line.includes('*/')) inComment = false;
			if (wasInComment || inComment) return;
			if (!RAW.test(line) || line.includes('lint-colors: allow')) return;
			if (TOKEN_FILES.has(rel)) {
				if (rel.endsWith('palette.ts')) return;
				if (/^\s*--[\w-]+:/.test(line) || /^\s*(\/\*|\*|\/\/)/.test(line)) return;
			}
			fail(`${rel}:${i + 1} raw colour outside tokens: ${line.trim().slice(0, 80)}`);
		});
}

// ---- 2. contrast ----
const block = (selector) => {
	const start = css.indexOf(selector + ' {');
	const body = css.slice(start, css.indexOf('\n}', start));
	const out = {};
	for (const [, k, v] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[k] = v.trim();
	return out;
};
const light = block(':root');
const dark = { ...light, ...block("[data-theme='dark']") };
const hex = (h) => {
	const v = h.slice(1);
	const f = v.length === 3 ? v.replace(/./g, (c) => c + c) : v;
	return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
function parse(theme, value, depth = 0) {
	const v = value.trim();
	if (depth > 10) throw new Error('loop at ' + v);
	if (v.startsWith('#')) return hex(v);
	let m = v.match(/^var\((--[\w-]+)\)$/);
	if (m) {
		if (theme[m[1]] === undefined) throw new Error('missing ' + m[1]);
		return parse(theme, theme[m[1]], depth + 1);
	}
	m = v.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/);
	if (m) {
		const a = parse(theme, m[1], depth + 1);
		const b = parse(theme, m[3], depth + 1);
		const p = Number(m[2]) / 100;
		return a.map((x, i) => x * p + b[i] * (1 - p));
	}
	throw new Error('cannot parse ' + v);
}
const colour = (theme, name) => parse(theme, `var(${name})`);
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
	const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum ratio, what it covers]
const PAIRS = [
	['--text', '--bg', 4.5, 'body text'],
	['--text', '--surface', 4.5, 'text on cards'],
	['--text-muted', '--bg', 4.5, 'secondary text'],
	['--text-muted', '--surface', 4.5, 'secondary text on cards'],
	['--link', '--bg', 4.5, 'links'],
	['--link', '--surface', 4.5, 'links on cards'],
	['--link', '--surface-muted', 4.5, 'links on chips'],
	['--text', '--surface-muted', 4.5, 'text on chips'],
	['--on-accent', '--accent', 4.5, 'text on primary fill and active nav'],
	['--on-accent', '--accent-hover', 4.5, 'text on primary hover'],
	['--text', '--hover-bg', 4.5, 'text on nav hover'],
	['--hover-text', '--hover-bg', 4.5, 'text on hover tint'],
	['--text', '--accent-soft', 4.5, 'inline code, selection'],
	['--link', '--accent-soft', 4.5, 'topic chips'],
	['--text', '--mark', 4.5, 'mark'],
	['--code-fg', '--code-bg', 4.5, 'code blocks'],
	['--banner-paper', '--banner-ink', 3, 'banner two-tone'],
	['--focus', '--bg', 3, 'focus ring'],
	['--focus', '--surface', 3, 'focus ring on cards'],
	['--accent-border', '--bg', 3, 'outline of primary button'],
	['--border-strong', '--bg', 3, 'outline of secondary button'],
	['--star', '--surface', 3, 'star icon'],
	['--avatar-fg', '--avatar-bg', 3, 'avatar'],
];
const rows = [];
for (const [fg, bg, min, what] of PAIRS) {
	const ratios = [
		ratio(colour(light, fg), colour(light, bg)),
		ratio(colour(dark, fg), colour(dark, bg)),
	];
	rows.push([what, fg, bg, min, ratios]);
	ratios.forEach((v, i) => {
		if (v < min) fail(`${['light', 'dark'][i]} ${fg} on ${bg} = ${v.toFixed(2)} (< ${min}): ${what}`);
	});
}
if (process.argv.includes('--table')) {
	console.log('| Pair | Min | Light | Dark |\n|---|---|---|---|');
	for (const [what, fg, bg, min, r] of rows) {
		console.log(`| ${what} (\`${fg}\` on \`${bg}\`) | ${min} | ${r[0].toFixed(2)} | ${r[1].toFixed(2)} |`);
	}
}

// ---- 3. palette.ts vs the --c-* source colours ----
const ts = readFileSync(join(root, 'src/lib/palette.ts'), 'utf8');
for (const name of ['blue', 'pink', 'teal', 'taupe', 'mist']) {
	const fromTs = ts.match(new RegExp(name + ":\\s*'(#[0-9a-f]{6})'"))?.[1];
	if (fromTs !== light['--c-' + name]) fail(`palette.ts ${name} ${fromTs} != --c-${name} ${light['--c-' + name]}`);
}

console.log(failed ? 'palette check FAILED' : `palette check ok (${files.length} files, ${PAIRS.length} pairs x 2 themes)`);
process.exit(failed ? 1 : 0);
