# PHILOSIFY — OFFICIAL LOGO GEOMETRY (ratified 28 Jul 2026)
The lockup (owl + perch line + wordmark) is the logo in ANY circumstance — favicons included. The owl never appears without her name. Reference render: `philosify-logo-vertical.png` (4× master). All values below reproduce it exactly.

## Reference unit
H = owl height. Master: H = 528px.

| Element | Master (4×) | Law (ratio) |
|---|---|---|
| Owl height | 528px | H (reference) |
| Owl width | 393px | source aspect 322:432 (0.745·H); never distorted |
| Wordmark | "philosify" — Michroma Regular, lowercase, 118px | font-size = 0.223·H |
| Letter-spacing | 0.20em (+ −0.20em end compensation) | fixed |
| Word ink width (W) | 786px | ≈1.49·H |
| Perch line length | 786px | = W exactly (p left edge to y right edge) |
| Line thickness | 6px | ≈ H/88 |
| Talon overlap | 12px (owl bottom over line top) | ≈ H/44 |
| Line→word gap | 20px, INK-measured | ≈ H/26 = 0.17 × font-size |
| Axis | owl, line, word share one centered vertical axis | fixed |
| Color | #F5F5F6 line/word; owl solid white | always white |
| Ground | #070708 | ALWAYS BLACK (own plate on light surfaces) |

## Ink measurement (mandatory)
The line→word gap is measured from the line's bottom edge to the TOPMOST INK of the ascenders (h/l/f) — never to the font's bounding box. Michroma's internal top-bearing at 118px is 43px (36% of font size) and MUST be compensated (e.g., negative top margin in CSS ≈ bearing − desired ink gap).

## Working scales
- Landing masthead: H=132 → word ≈30px, line 1.5px, overlap 3px, ink gap 5px
- Module pages: H=96 → word ≈21px, line ~1px, overlap 2px, ink gap ~3.6px
- Asset cuts: faithful art at H ≥ 64px; reinforced (brightness-boosted) cut below ~48px

## Horizontal variant (footers)
Same elements rotated in role: the perch line runs under the word at its baseline (descenders hang below), owl standing on the same line at the left end; one continuous line spanning owl + word; owl ≈30–33px, reinforced cut.
