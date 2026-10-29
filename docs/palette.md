# Palette kit

One token set, defined in `src/styles/global.css` (light in `:root`, dark in `[data-theme='dark']`).
Components use role tokens only; raw colours live in that file and in `src/lib/palette.ts`
(cover generator). `npm run check:palette` fails on stray hex/rgb/`white`/`black` in `src`,
on contrast below the thresholds below, and when `palette.ts` drifts from the `--c-*` values.

## Source colours

| Token | Value | Feeds |
|---|---|---|
| `--c-pink` | #FCDCDC | accent fill (primary button, active nav), hover tint, banner beam, dark-theme avatar marks |
| `--c-teal` | #2B4C59 | links and small accents on light surfaces, light-theme avatar marks, dark `<mark>`, `--text` is a shade of it |
| `--c-blue` | #95BCCC | links and accents in dark theme, light `<mark>`, dark banner paper |
| `--c-taupe` | #988080 | outlines of the pink fill and secondary buttons, light star icon, `--text-muted` is a shade of it |
| `--c-mist` | #BECEDA | light banner paper; `--bg` and `--surface-muted` are tints of it |

## Roles

| Role | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F5F8F9 | #152228 | page |
| `--surface` | #FFFFFF | #1B2B32 | cards, hero |
| `--surface-muted` | #EAF0F3 | #10191E | chips, quiet fills |
| `--border` | #D9E2E8 | #2C4149 | hairlines |
| `--border-strong` | taupe | #857373 | outline of secondary buttons, card hover border |
| `--text` | #172932 | #E8EEF1 | body, headings |
| `--text-muted` | #6A5A5A | #B9A8A8 | secondary text, eyebrow, dates |
| `--accent` | pink | pink | primary fill, active nav pill |
| `--accent-hover` | #F2C6C6 | #F2C6C6 | primary hover |
| `--accent-soft` | pink | #4A3A3D | inline code, selection, topic chips |
| `--on-accent` | #172932 | #172932 | text on pink |
| `--accent-border` | taupe | pink | outline of the primary button |
| `--accent-strong` | teal | blue | accent for text and lines |
| `--link` | = accent-strong | = accent-strong | links, timeline dots, outline buttons text |
| `--focus` | = accent-strong | = accent-strong | 3px focus ring |
| `--mark` | blue | teal | `<mark>` |
| `--hover-bg` | 40% pink over `--bg` | 11% pink over `--bg` | weak hover tint (always weaker than the active pink) |
| `--hover-text` | #172932 | pink | text on hover tint |
| `--code-bg` / `--code-fg` | #FFF / #172932 | #0E1A1F / #E8EEF1 | code blocks |
| `--banner-ink` / `--banner-paper` / `--banner-beam` | #172932 / mist / pink | #0E1A1F / blue / pink | hero banner two-colour dither and beam (read by the canvas script) |
| `--avatar-bg` / `--avatar-fg` | pink / teal | #20333B / pink | pixel avatar |
| `--star` | taupe | pink | star icon |

Cover tones (`COVER_PALETTES` in `palette.ts`) are shades and tints of the same five colours.

## Contrast checks (WCAG 2.x, computed by `npm run check:palette`)

Text pairs need 4.5, graphics and outlines 3.

| Pair | Min | Light | Dark |
|---|---|---|---|
| body text (`--text` on `--bg`) | 4.5 | 14.06 | 13.89 |
| text on cards (`--text` on `--surface`) | 4.5 | 15.00 | 12.47 |
| secondary text (`--text-muted` on `--bg`) | 4.5 | 6.11 | 7.15 |
| secondary text on cards (`--text-muted` on `--surface`) | 4.5 | 6.52 | 6.42 |
| links (`--link` on `--bg`) | 4.5 | 8.63 | 8.01 |
| links on cards (`--link` on `--surface`) | 4.5 | 9.21 | 7.19 |
| links on chips (`--link` on `--surface-muted`) | 4.5 | 8.00 | 8.77 |
| text on chips (`--text` on `--surface-muted`) | 4.5 | 13.04 | 15.20 |
| text on primary fill and active nav (`--on-accent` on `--accent`) | 4.5 | 11.72 | 11.72 |
| text on primary hover (`--on-accent` on `--accent-hover`) | 4.5 | 9.77 | 9.77 |
| text on nav hover (`--text` on `--hover-bg`) | 4.5 | 13.08 | 10.43 |
| text on hover tint (`--hover-text` on `--hover-bg`) | 4.5 | 13.08 | 9.55 |
| inline code, selection (`--text` on `--accent-soft`) | 4.5 | 11.72 | 9.13 |
| topic chips (`--link` on `--accent-soft`) | 4.5 | 7.19 | 5.27 |
| mark (`--text` on `--mark`) | 4.5 | 7.39 | 7.86 |
| code blocks (`--code-fg` on `--code-bg`) | 4.5 | 15.00 | 15.12 |
| banner two-tone (`--banner-paper` on `--banner-ink`) | 3 | 9.31 | 8.72 |
| focus ring (`--focus` on `--bg`) | 3 | 8.63 | 8.01 |
| focus ring on cards (`--focus` on `--surface`) | 3 | 9.21 | 7.19 |
| outline of primary button (`--accent-border` on `--bg`) | 3 | 3.43 | 12.71 |
| outline of secondary button (`--border-strong` on `--bg`) | 3 | 3.43 | 3.64 |
| star icon (`--star` on `--surface`) | 3 | 3.66 | 11.41 |
| avatar (`--avatar-fg` on `--avatar-bg`) | 3 | 7.19 | 10.27 |
