# PHILOSIFY ADS ATELIÊ — INVENTORY SPEC (v1 — RATIFIED by Roberto, 28 Jul 2026)
Ads Ateliê is a core revenue feature: advertisers (Philosify's clients) buy publication in Philosify's channel. This document defines WHERE ads publish in the ratified design, in WHAT formats, and under WHICH rules. RATIFIED IN FULL — annex to the Design Law; WP3 implements it. Future changes to this system are driven by the market, on Roberto's direction.

## 0. Media law (RATIFIED by Roberto, 28 Jul 2026)
**Two media only: Cards and Videos.** Every spot serves one of exactly two unit types:
- **Ad Card** — the platform Cell anatomy (square corners, dashed hairline border, `SPONSORED` tag): advertiser image/artwork, headline, one line, CTA. The Interstice Strip is the horizontal variant of the Ad Card; the "Presented by" sponsorship line carries a compact card (small logo card) rather than bare text.
- **Ad Video** — always contained inside the Ad Card frame: muted, click-to-play, 3–5s loop allowed as preview, never autoplay sound, never expanding, 16:9/9:16 assets letterboxed within the card.
No other media: no bare text links, no takeovers, no interstitial overlays, no audio units, no native-prose "advertorials."

## 1. The five spots

| # | Spot | Where | Format & budget | Character |
|---|------|-------|-----------------|-----------|
| S1 | **Post-Analysis Slot** | After the verdict stack + actions row on every completed analysis (Music, Cinema, Literature, News) and on public report permalinks | Full-column strip, max 120px tall: logo + one line + CTA; or one Cell-sized card. Image or 3–5s muted loop; video click-to-play inside frame | The premium moment: reader just finished, attention highest, zero interruption |
| S2 | **In-Flow Sponsored Cell** | Inside result/feed lists: News search results, Ideas debates feed, Community roster | Exactly the platform Cell anatomy with `SPONSORED` tag; max ONE per list, never above position 3 | Native, scarce, clearly labeled |
| S3 | **Module Sponsorship ("Presented by")** | One line under the module ticker: `MODULE PRESENTED BY [ADVERTISER]` in telemetry voice + small logo | Text + monochrome logo only; one advertiser per module per period (exclusive) | The prestige tier — podcast-style patronage of Music, News, etc., sellable per market/language |
| S4 | **Interstice Strip** | Between top-level blocks on multi-section pages (e.g., between Colloquium and Debates in Ideas; below the grid on the landing IF Roberto allows landing ads — see §4) | Full-container width, max 120px tall | The classic banner, disciplined |
| S5 | **Report-Page Slot** | On shareable analysis permalinks viewed by logged-out visitors: S1 position + optionally one S2-style card in the related area | Same budgets as S1/S2 | Monetizes the acquisition surface — traffic advertisers can't reach elsewhere |

## 2. Absolute exclusions (trust inventory)
No ads, ever: **Unsafe Zone**, **Constellation**, **History's Living Globe** (all Shell C), **auth**, **checkout/Buy Credits**, **legal**, and **inside the 720px reading column mid-analysis**. These exclusions are sellable as a fact: advertisers buy into a channel users trust precisely because it is disciplined.

## 3. Design rules (inherit the frozen Law)
- Ads use platform tokens: square corners, hairline **dashed** border (the one visual marker reserved for ads), `SPONSORED` tag in telemetry voice on every unit, no exceptions.
- Ads never use **silver**, never the brand white register for their text (advertiser content sits in the bright-grey tier), never mimic system controls, never animate beyond the muted loop, never autoplay sound, never expand.
- Total ad area ≤ ~25% of any viewport; one S1 + one S2 maximum per page.
- Advertiser creative lives inside the fixed frame; 16:9/9:16 assets are contained click-to-play — no large-format video placements sold.

## 4. Ratified decisions (28 Jul 2026)
1. **Landing ads: NONE.** The landing is ad-free — the front door sells Philosify itself; scarcity prices everything inside higher.
2. **Targeting: CONTEXTUAL ONLY.** Advertisers buy module × language × market (e.g., Music/PT-BR, News/JP). No behavioral tracking, no third-party pixels — a brand fit, a compliance simplification across five markets, and a selling point.
3. **Pricing: RATIFIED.** S3 sponsorships flat-rate per period+market; S1/S5 premium CPM; S2/S4 standard CPM. Rates bind to the existing five-market Excel/Python model. Future adjustments are market-driven.

## 5. The Ateliê itself (advertiser-facing)
The footer's "Philosify Ads Ateliê" opens the advertiser surface (spec §3c): a Shell A page presenting the five spots with their exact pixel budgets and exclusion list, live availability per module/market, creative upload with automatic Law-conformance checks (dashed frame applied, colors contained, `SPONSORED` tag forced), and Stripe billing on the same patterns as credits. Reporting to advertisers: impressions, clicks, module/language/market breakdown from first-party analytics only.

## 6. Implementation hook
On ratification: this file enters `/new_design`, WP3 gains "implement S1–S5 per Ads Ateliê spec," WP4 binds availability + reporting, and the conformance lint adds the ad rules (dashed border present, silver absent, tag present).
