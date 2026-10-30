// Performance budget for the built site (run `npm run build` first).
//   npm run check:perf                 static budget on dist/: sizes, third-party requests, image attributes
//   npm run check:perf -- --lighthouse mobile and desktop Lighthouse on Home, Blog and the newest post
//                                      (needs a Chromium: CHROME_PATH, or `npx playwright install chromium`)
// Lighthouse thresholds: 95 on all four categories.
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
if (!existsSync(dist)) {
	console.error('dist/ is missing: run `npm run build` first');
	process.exit(1);
}
let failed = false;
const fail = (m) => ((failed = true), console.error('FAIL ' + m));

const walk = (dir, out = []) => {
	for (const n of readdirSync(dir)) {
		const p = join(dir, n);
		statSync(p).isDirectory() ? walk(p, out) : out.push(p);
	}
	return out;
};
const files = walk(dist);
const size = (f) => statSync(f).size;

// ---- static budget ----
const BUDGET = { html: 120_000, js: 20_000, css: 25_000, preloads: 3, fontsPerPage: 9 };
for (const f of files.filter((f) => f.endsWith('.html') && !f.endsWith('404.html'))) {
	const rel = f.slice(dist.length);
	const html = readFileSync(f, 'utf8');
	if (size(f) > BUDGET.html) fail(`${rel}: HTML ${size(f)} B > ${BUDGET.html}`);
	if ((html.match(/rel="preload"/g) || []).length > BUDGET.preloads) fail(`${rel}: more than ${BUDGET.preloads} preloads`);
	if (/<link[^>]+rel="stylesheet"/.test(html)) fail(`${rel}: render-blocking stylesheet link (CSS should be inlined)`);
	if (/<(link|script|img|source)\b[^>]*(src|href)="https?:\/\//.test(html.replace(/<link[^>]+rel="(canonical|alternate)"[^>]*>/g, ''))) fail(`${rel}: third-party asset request`);
	for (const tag of html.match(/<img\b[^>]*>/g) || []) {
		if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) fail(`${rel}: <img> without width/height: ${tag.slice(0, 80)}`);
		if (!/\balt=/.test(tag)) fail(`${rel}: <img> without alt`);
	}
}
const js = files.filter((f) => f.endsWith('.js')).reduce((n, f) => n + size(f), 0);
const css = files.filter((f) => f.endsWith('.css')).reduce((n, f) => n + size(f), 0);
if (js > BUDGET.js) fail(`JS ${js} B > ${BUDGET.js}`);
if (css > BUDGET.css) fail(`CSS files ${css} B > ${BUDGET.css}`);
const fonts = files.filter((f) => f.endsWith('.woff2'));
if (fonts.length > BUDGET.fontsPerPage + 2) fail(`${fonts.length} font files shipped`);
for (const f of files.filter((f) => /\/(og|covers|img)\/.*\.(png|webp)$|og\.png$/.test(f))) {
	if (/\/og/.test(f) && size(f) > 300_000) fail(`${f.slice(dist.length)} is ${size(f)} B (> 300 KB)`);
}
console.log(`static budget: JS ${js} B, CSS ${css} B, ${fonts.length} font files, ${files.filter((f) => f.endsWith('.html')).length} pages`);

// ---- Lighthouse ----
if (process.argv.includes('--lighthouse')) {
	const port = 4331;
	const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
	// Tiny static server over dist/ (no dependency on `astro preview`, which allows one instance).
	const server = createServer((req, res) => {
		let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
		if (path.endsWith('/')) path += 'index.html';
		const file = join(dist, path);
		if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
			res.writeHead(404).end('not found');
			return;
		}
		res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
	}).listen(port);
	const out = join(mkdtempSync(join(tmpdir(), 'perf-')), 'lh.json');
	const posts = readdirSync(join(dist, 'blog')).filter((n) => statSync(join(dist, 'blog', n)).isDirectory());
	const targets = [['home', '/'], ['blog', '/blog/'], ['post', `/blog/${posts.includes('a-map-instead-of-more-context') ? 'a-map-instead-of-more-context' : posts[0]}/`]];
	const rows = [];
	for (const [name, path] of targets) {
		for (const mode of ['mobile', 'desktop']) {
			const args = ['-y', 'lighthouse@12', `http://localhost:${port}${path}`, '--quiet', '--output=json', `--output-path=${out}`, '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox'];
			if (mode === 'desktop') args.push('--preset=desktop');
			// async spawn: the static server above runs in this process and must keep serving
			await new Promise((done) => spawn('npx', args, { stdio: 'ignore' }).on('close', done));
			const j = JSON.parse(readFileSync(out, 'utf8'));
			const s = Object.fromEntries(Object.entries(j.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
			const a = j.audits;
			rows.push({ page: name, mode, ...s, LCP: a['largest-contentful-paint'].displayValue, CLS: a['cumulative-layout-shift'].displayValue, TBT: a['total-blocking-time'].displayValue });
			for (const [k, v] of Object.entries(s)) if (v < 95) fail(`${name} ${mode} ${k} = ${v} (< 95)`);
		}
	}
	console.table(rows);
	server.close();
}
console.log(failed ? 'perf check FAILED' : 'perf check ok');
process.exit(failed ? 1 : 0);
