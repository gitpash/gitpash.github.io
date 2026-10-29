# Palette kit

One token set, defined in `src/styles/global.css` (light in `:root`, dark in `[data-theme='dark']`).
Components use role tokens only; raw colours live in that file and in `src/lib/palette.ts`
(cover generator). `npm run check:palette` fails on stray hex/rgb/`white`/`black` in `src`,
on contrast below the thresholds below, and when `palette.ts` drifts from the `--c-*` values.

## Source colours

| Token | Value | Feeds |
|---|---|---|
| `--c-pink` | #FCDCDC | accent fill (primary button, active nav), hover tint, banner beam, dark-theme avatar marks |
| `--c-deep` | #2B4C59 | links and small accents on light surfaces, light-theme avatar marks, dark `<mark>`, `--text` is a shade of it |
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

## Variants under review

Five complete token sets exist while the owner chooses. C is the baseline in `:root`; A, B, D and E
redefine every role for light and dark in `[data-palette='x']` plus `[data-palette='x'][data-theme='dark']`.
Dev only: open any page with `?palette=a|b|c|d|e` (remembered in localStorage); the banner and the
inline covers follow it. Once one is chosen, copy its values into `:root` / `[data-theme='dark']`
and delete the others.

| | Rose (accent) | Companion | Deep blue/ink (links, accent text) | Darkest ink (body text) | Character |
|---|---|---|---|---|---|
| C baseline | #FCDCDC | #BECEDA (secondary) | #2B4C59 | #172932 | bright pink with a green-blue slate |
| A | #E3C6C6 | #BECEDA | #2A3F54 | #1B2A3A | dusty rose with a cooler ink blue |
| B | #E4C8C6 | #BECEDA | #3A2F36 | #2A2126 | dusty rose with a plum-brown ink, blues only as small accents |
| D | #E3C6C6 | #BECEDA | #3F5468 | #26323F | rose plus BECEDA as the quiet companion (chips, hero glow, avatar, banner paper, mark, dark links); one blue-grey hue in two steps, no green cast |
| E | #DBBDBD | #B9C8D4 | #475A6C | #29343F | as D, rose and blue-grey a touch dustier |

Shared by all: taupe #988080 for muted text and outlines. In D and E the deep blue-grey carries links
and accent text, and the darkest step of the same hue carries body text so links stay distinguishable.

## Contrast checks (WCAG 2.x, computed by `npm run check:palette`)

Text pairs need 4.5, graphics and outlines 3.

| Pair | Min | C light | C dark | A light | A dark | B light | B dark | D light | D dark | E light | E dark |
|---|---|---|---|---|---|---|---|---|---|---|---|
| body text (`--text` on `--bg`) | 4.5 | 14.06 | 13.89 | 13.59 | 14.57 | 14.40 | 14.88 | 12.04 | 13.23 | 11.71 | 12.99 |
| text on cards (`--text` on `--surface`) | 4.5 | 15.00 | 12.47 | 14.59 | 12.98 | 15.63 | 13.57 | 13.04 | 11.64 | 12.67 | 11.39 |
| secondary text (`--text-muted` on `--bg`) | 4.5 | 6.11 | 7.15 | 6.36 | 7.60 | 5.78 | 8.38 | 6.31 | 7.36 | 5.96 | 7.28 |
| secondary text on cards (`--text-muted` on `--surface`) | 4.5 | 6.52 | 6.42 | 6.83 | 6.77 | 6.27 | 7.65 | 6.83 | 6.48 | 6.45 | 6.39 |
| links (`--link` on `--bg`) | 4.5 | 8.63 | 8.01 | 10.09 | 8.45 | 11.81 | 8.78 | 7.23 | 9.85 | 6.59 | 9.18 |
| links on cards (`--link` on `--surface`) | 4.5 | 9.21 | 7.19 | 10.84 | 7.53 | 12.81 | 8.01 | 7.84 | 8.66 | 7.13 | 8.05 |
| links on chips (`--link` on `--surface-muted`) | 4.5 | 8.00 | 8.77 | 9.38 | 8.87 | 10.76 | 9.27 | 6.65 | 10.65 | 6.05 | 10.03 |
| text on chips (`--text` on `--surface-muted`) | 4.5 | 13.04 | 15.20 | 12.63 | 15.30 | 13.12 | 15.71 | 11.06 | 14.31 | 10.76 | 14.20 |
| text on primary fill and active nav (`--on-accent` on `--accent`) | 4.5 | 11.72 | 11.72 | 9.15 | 9.15 | 9.95 | 9.95 | 8.17 | 8.17 | 7.26 | 7.26 |
| text on primary hover (`--on-accent` on `--accent-hover`) | 4.5 | 9.77 | 9.77 | 8.12 | 8.12 | 8.77 | 8.77 | 7.18 | 7.18 | 6.42 | 6.42 |
| text on nav hover (`--text` on `--hover-bg`) | 4.5 | 13.08 | 10.43 | 11.67 | 11.43 | 12.49 | 11.71 | 10.37 | 10.26 | 9.76 | 10.22 |
| text on hover tint (`--hover-text` on `--hover-bg`) | 4.5 | 13.08 | 9.55 | 11.67 | 8.44 | 12.49 | 8.93 | 10.37 | 7.71 | 9.76 | 7.07 |
| inline code, selection (`--text` on `--accent-soft`) | 4.5 | 11.72 | 9.13 | 9.15 | 9.06 | 9.95 | 8.73 | 9.65 | 8.53 | 9.05 | 8.48 |
| topic chips (`--link` on `--accent-soft`) | 4.5 | 7.19 | 5.27 | 6.79 | 5.26 | 8.16 | 5.15 | 5.80 | 6.35 | 5.09 | 5.99 |
| mark (`--text` on `--mark`) | 4.5 | 7.39 | 7.86 | 7.19 | 9.20 | 7.70 | 7.22 | 8.09 | 6.53 | 7.41 | 5.89 |
| code blocks (`--code-fg` on `--code-bg`) | 4.5 | 15.00 | 15.12 | 14.59 | 15.70 | 15.63 | 16.07 | 13.04 | 14.88 | 12.67 | 14.79 |
| banner two-tone (`--banner-paper` on `--banner-ink`) | 3 | 9.31 | 8.72 | 9.06 | 9.11 | 9.95 | 9.23 | 8.09 | 11.08 | 7.41 | 10.45 |
| focus ring (`--focus` on `--bg`) | 3 | 8.63 | 8.01 | 10.09 | 8.45 | 11.81 | 8.78 | 7.23 | 9.85 | 6.59 | 9.18 |
| focus ring on cards (`--focus` on `--surface`) | 3 | 9.21 | 7.19 | 10.84 | 7.53 | 12.81 | 8.01 | 7.84 | 8.66 | 7.13 | 8.05 |
| outline of primary button (`--accent-border` on `--bg`) | 3 | 3.43 | 12.71 | 3.41 | 10.75 | 3.38 | 11.35 | 3.38 | 9.94 | 3.38 | 9.00 |
| outline of secondary button (`--border-strong` on `--bg`) | 3 | 3.43 | 3.64 | 3.41 | 3.40 | 3.38 | 3.56 | 3.38 | 3.27 | 3.38 | 3.23 |
| star icon (`--star` on `--surface`) | 3 | 3.66 | 11.41 | 3.66 | 9.58 | 3.66 | 10.36 | 3.66 | 8.75 | 3.66 | 7.89 |
| avatar (`--avatar-fg` on `--avatar-bg`) | 3 | 7.19 | 10.27 | 6.79 | 8.46 | 8.16 | 9.52 | 4.86 | 7.52 | 4.17 | 7.18 |
