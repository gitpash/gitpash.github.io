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

Three complete token sets exist while the owner chooses. C is the baseline in `:root`; A and B are
redefinitions of every role for light and dark in `[data-palette='a']` / `[data-palette='b']`
(plus their `[data-theme='dark']` blocks). Dev only: open any page with `?palette=a`, `?palette=b`
or `?palette=c` (remembered in localStorage); the banner and the inline covers follow it.
Once one is chosen, copy its values into `:root` / `[data-theme='dark']` and delete the others.

| | Accent (rose) | Deep ink | Darkest ink | Character |
|---|---|---|---|---|
| C baseline | #FCDCDC | #2B4C59 | #172932 | current: bright pink with a green-blue slate |
| A | #E3C6C6 | #2A3F54 | #1B2A3A | dusty rose with a cooler ink blue |
| B | #E4C8C6 | #3A2F36 | #2A2126 | dusty rose with a plum-brown ink, blues only as small accents |

Shared by all three: blue #95BCCC, mist #BECEDA, taupe #988080.

## Contrast checks (WCAG 2.x, computed by `npm run check:palette`)

Text pairs need 4.5, graphics and outlines 3.

| Pair | Min | C light | C dark | A light | A dark | B light | B dark |
|---|---|---|---|---|---|---|---|
| body text (`--text` on `--bg`) | 4.5 | 14.06 | 13.89 | 13.59 | 14.57 | 14.40 | 14.88 |
| text on cards (`--text` on `--surface`) | 4.5 | 15.00 | 12.47 | 14.59 | 12.98 | 15.63 | 13.57 |
| secondary text (`--text-muted` on `--bg`) | 4.5 | 6.11 | 7.15 | 6.36 | 7.60 | 5.78 | 8.38 |
| secondary text on cards (`--text-muted` on `--surface`) | 4.5 | 6.52 | 6.42 | 6.83 | 6.77 | 6.27 | 7.65 |
| links (`--link` on `--bg`) | 4.5 | 8.63 | 8.01 | 10.09 | 8.45 | 11.81 | 8.78 |
| links on cards (`--link` on `--surface`) | 4.5 | 9.21 | 7.19 | 10.84 | 7.53 | 12.81 | 8.01 |
| links on chips (`--link` on `--surface-muted`) | 4.5 | 8.00 | 8.77 | 9.38 | 8.87 | 10.76 | 9.27 |
| text on chips (`--text` on `--surface-muted`) | 4.5 | 13.04 | 15.20 | 12.63 | 15.30 | 13.12 | 15.71 |
| text on primary fill and active nav (`--on-accent` on `--accent`) | 4.5 | 11.72 | 11.72 | 9.15 | 9.15 | 9.95 | 9.95 |
| text on primary hover (`--on-accent` on `--accent-hover`) | 4.5 | 9.77 | 9.77 | 8.12 | 8.12 | 8.77 | 8.77 |
| text on nav hover (`--text` on `--hover-bg`) | 4.5 | 13.08 | 10.43 | 11.67 | 11.43 | 12.49 | 11.71 |
| text on hover tint (`--hover-text` on `--hover-bg`) | 4.5 | 13.08 | 9.55 | 11.67 | 8.44 | 12.49 | 8.93 |
| inline code, selection (`--text` on `--accent-soft`) | 4.5 | 11.72 | 9.13 | 9.15 | 9.06 | 9.95 | 8.73 |
| topic chips (`--link` on `--accent-soft`) | 4.5 | 7.19 | 5.27 | 6.79 | 5.26 | 8.16 | 5.15 |
| mark (`--text` on `--mark`) | 4.5 | 7.39 | 7.86 | 7.19 | 9.20 | 7.70 | 7.22 |
| code blocks (`--code-fg` on `--code-bg`) | 4.5 | 15.00 | 15.12 | 14.59 | 15.70 | 15.63 | 16.07 |
| banner two-tone (`--banner-paper` on `--banner-ink`) | 3 | 9.31 | 8.72 | 9.06 | 9.11 | 9.95 | 9.23 |
| focus ring (`--focus` on `--bg`) | 3 | 8.63 | 8.01 | 10.09 | 8.45 | 11.81 | 8.78 |
| focus ring on cards (`--focus` on `--surface`) | 3 | 9.21 | 7.19 | 10.84 | 7.53 | 12.81 | 8.01 |
| outline of primary button (`--accent-border` on `--bg`) | 3 | 3.43 | 12.71 | 3.41 | 10.75 | 3.38 | 11.35 |
| outline of secondary button (`--border-strong` on `--bg`) | 3 | 3.43 | 3.64 | 3.41 | 3.40 | 3.38 | 3.56 |
| star icon (`--star` on `--surface`) | 3 | 3.66 | 11.41 | 3.66 | 9.58 | 3.66 | 10.36 |
| avatar (`--avatar-fg` on `--avatar-bg`) | 3 | 7.19 | 10.27 | 6.79 | 8.46 | 8.16 | 9.52 |
