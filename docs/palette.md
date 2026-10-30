# Palette kit

One token set, defined in `src/styles/global.css` (light in `:root`, dark in `[data-theme='dark']`).
Components use role tokens only; raw colours live in that file and in `src/lib/palette.ts`
(cover generator). `npm run check:palette` fails on stray hex/rgb/`white`/`black` in `src`,
on contrast below the thresholds below, and when `palette.ts` drifts from the `--c-*` values.

## Source colours

| Token | Value | Feeds |
|---|---|---|
| `--c-pink` | #E3C6C6 | accent fill (primary button, active nav), hover tint, banner beam, dark-theme marks |
| `--c-deep` | #3F5468 | links and small accents on light surfaces, light avatar mark, dark `<mark>` |
| `--c-ink` | #26323F | body text, frames, banner ink; the darkest step of the deep blue-grey |
| `--c-blue` | #95BCCC | cover tones |
| `--c-taupe` | #988080 | outlines of the pink fill and secondary buttons, star icon, `--text-muted` is a shade of it |
| `--c-mist` | #BECEDA | quiet companion: chips, hero glow, avatar, banner paper, dark-theme links; `--bg` and `--surface-muted` are tints of it |

The deep blue-grey carries links and accent text; the darkest step of the same hue carries body
text, so links stay distinguishable from it. Five variants were compared; this is the one the
designer approved.

## Roles

| Role | Light | Dark |
|---|---|---|
| `--bg` | #f4f6f8 | #1b232c |
| `--surface` | #ffffff | #232d38 |
| `--surface-muted` | #e8edf1 | #151c24 |
| `--border` | #d3dce4 | #323f4d |
| `--border-strong` | var(--c-taupe) | #7c6e70 |
| `--text` | var(--c-ink) | #e6ebf0 |
| `--text-muted` | #665759 | #b9aeb0 |
| `--accent` | var(--c-pink) | var(--c-pink) |
| `--accent-hover` | #d8b9b9 | #d8b9b9 |
| `--accent-soft` | color-mix(in srgb, var(--c-mist) 65%, white) | #364250 |
| `--on-accent` | var(--c-ink) | #26323f |
| `--accent-border` | var(--c-taupe) | var(--c-pink) |
| `--accent-strong` | var(--c-deep) | var(--c-mist) |
| `--link` | var(--accent-strong) | var(--accent-strong) |
| `--focus` | var(--accent-strong) | var(--accent-strong) |
| `--mark` | var(--c-mist) | var(--c-deep) |
| `--hover-bg` | color-mix(in srgb, var(--c-pink) 40%, var(--bg)) | color-mix(in srgb, var(--c-pink) 11%, var(--bg)) |
| `--hover-text` | var(--c-ink) | var(--c-pink) |
| `--code-bg` | #ffffff | #12181f |
| `--code-fg` | var(--c-ink) | #e6ebf0 |
| `--banner-ink` | #26323f | #12181f |
| `--banner-paper` | #beceda | #beceda |
| `--banner-beam` | #e3c6c6 | #e3c6c6 |
| `--avatar-bg` | var(--c-mist) | #2b3744 |
| `--avatar-fg` | var(--c-deep) | var(--c-mist) |
| `--star` | var(--c-taupe) | var(--c-pink) |

Values written as `var()` or `color-mix()` resolve to the source colours above. Cover tones
(`COVER_PALETTES` in `palette.ts`, `--cover-*` in CSS) are shades and tints of the same colours.

## Contrast checks (WCAG 2.x, computed by `npm run check:palette`)

Text pairs need 4.5, graphics and outlines 3.

| Pair | Min | Light | Dark |
|---|---|---|---|
| body text (`--text` on `--bg`) | 4.5 | 12.04 | 13.23 |
| text on cards (`--text` on `--surface`) | 4.5 | 13.04 | 11.64 |
| secondary text (`--text-muted` on `--bg`) | 4.5 | 6.31 | 7.36 |
| secondary text on cards (`--text-muted` on `--surface`) | 4.5 | 6.83 | 6.48 |
| links (`--link` on `--bg`) | 4.5 | 7.23 | 9.85 |
| links on cards (`--link` on `--surface`) | 4.5 | 7.84 | 8.66 |
| links on chips (`--link` on `--surface-muted`) | 4.5 | 6.65 | 10.65 |
| text on chips (`--text` on `--surface-muted`) | 4.5 | 11.06 | 14.31 |
| text on primary fill and active nav (`--on-accent` on `--accent`) | 4.5 | 8.17 | 8.17 |
| text on primary hover (`--on-accent` on `--accent-hover`) | 4.5 | 7.18 | 7.18 |
| text on nav hover (`--text` on `--hover-bg`) | 4.5 | 10.37 | 10.26 |
| text on hover tint (`--hover-text` on `--hover-bg`) | 4.5 | 10.37 | 7.71 |
| inline code, selection (`--text` on `--accent-soft`) | 4.5 | 9.65 | 8.53 |
| topic chips (`--link` on `--accent-soft`) | 4.5 | 5.80 | 6.35 |
| mark (`--text` on `--mark`) | 4.5 | 8.09 | 6.53 |
| code blocks (`--code-fg` on `--code-bg`) | 4.5 | 13.04 | 14.88 |
| banner two-tone (`--banner-paper` on `--banner-ink`) | 3 | 8.09 | 11.08 |
| focus ring (`--focus` on `--bg`) | 3 | 7.23 | 9.85 |
| focus ring on cards (`--focus` on `--surface`) | 3 | 7.84 | 8.66 |
| outline of primary button (`--accent-border` on `--bg`) | 3 | 3.38 | 9.94 |
| outline of secondary button (`--border-strong` on `--bg`) | 3 | 3.38 | 3.27 |
| star icon (`--star` on `--surface`) | 3 | 3.66 | 8.75 |
| avatar (`--avatar-fg` on `--avatar-bg`) | 3 | 4.86 | 7.52 |
