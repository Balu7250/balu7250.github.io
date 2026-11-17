# Test report

Branch `portfolio-upgrade`, run on 17 Nov 2026 in the Linux cloud container used for this work.
Every result below came from an actual run. Anything not run is listed under "Not tested".

## Environment

| Tool | Version | Notes |
|------|---------|-------|
| Chromium | Google Chrome for Testing 153.0.8010.12  | Playwright's bundled build, headless |
| Playwright | 1.63.0 | Drives `tests/site.test.cjs` |
| axe-core | 4.14.1 | WCAG 2.0/2.1/2.2 A and AA, plus best-practice rules |
| Lighthouse | 12.8.2 | Default mobile (simulated Moto G Power, slow 4G) and `--preset=desktop` |
| html-validate | 8.29.0 | `html-validate:recommended` (inline styles allowed) |
| Node.js | v22.23.4 | `node --check` for JS syntax |
| Server | `python3 -m http.server` | Local and uncompressed. GitHub Pages adds gzip/brotli and caching. |

Outbound network access in the container is restricted. Requests to `www.google.com` (favicon service) and `cdn.jsdelivr.net` (Devicon) were blocked, so those runs exercised the **fallback path**: local logos and letter badges.

## Summary

| Check | Result |
|-------|--------|
| HTML validation (`index.html`) | Pass, 0 errors. First run found 10 (8 `aria-label` on plain lists, empty dialog heading placeholder, lowercase doctype); all fixed. |
| JS syntax (`node --check assets/js/main.js`) | Pass |
| Playwright + axe suite | **87/87 checks passed** |
| Lighthouse mobile | Performance 96, Accessibility 100, Best Practices 96, SEO 100. FCP 2.0 s, LCP 2.5 s, CLS 0.004, TBT 0 ms |
| Lighthouse desktop | Performance 100, Accessibility 100, Best Practices 96, SEO 100. FCP 0.4 s, LCP 0.6 s, CLS 0.001, TBT 0 ms |

The Lighthouse runs were local, single runs, against an uncompressed server. Scores on the live site will differ: compression will help, and real network distance will hurt.

**Best Practices 96:** the one lost point is "errors in console", caused by the blocked external logo requests in this sandbox. On an open network those requests succeed.

**Other Lighthouse notes:**
- "Text compression" and "cache TTL" flags come from the local server.
- "Render-blocking CSS" (24 KB stylesheet) is kept as one file on purpose. Splitting critical CSS would add a build step for a small gain.

## Issues found during testing and fixed

| Issue | Fix |
|-------|-----|
| Meta description was 206 characters, so it would be cut off in search results | Rewritten to 155 characters |
| html-validate: `aria-label` on `<ul>` elements | Removed; the lists already sit under labelled headings |
| html-validate: empty `<h2>` in the dialog template | Default text "Case study" |
| Desktop title wrapped as "…Engineer \| Technical / Lead" | Each role kept on one line (`white-space: nowrap`), so it breaks only at the separator |
| "In development" tag in the stats row stretched to full width | Made inline |

## All automated checks (`tests/site.test.cjs`)

| Result | Check | Detail |
|--------|-------|--------|
| PASS | viewport 320x640: no horizontal scroll | scrollWidth=320 |
| PASS | viewport 320x640: name and title in first screen | title bottom=249 of 640 |
| PASS | viewport 320x640: first CTA in first screen | cta top=638 |
| PASS | viewport 320x640: no script errors |  |
| PASS | viewport 360x740: no horizontal scroll | scrollWidth=360 |
| PASS | viewport 360x740: name and title in first screen | title bottom=249 of 740 |
| PASS | viewport 360x740: first CTA in first screen | cta top=610 |
| PASS | viewport 360x740: no script errors |  |
| PASS | viewport 375x667: no horizontal scroll | scrollWidth=375 |
| PASS | viewport 375x667: name and title in first screen | title bottom=249 of 667 |
| PASS | viewport 375x667: first CTA in first screen | cta top=582 |
| PASS | viewport 375x667: no script errors |  |
| PASS | viewport 390x844: no horizontal scroll | scrollWidth=390 |
| PASS | viewport 390x844: name and title in first screen | title bottom=249 of 844 |
| PASS | viewport 390x844: first CTA in first screen | cta top=554 |
| PASS | viewport 390x844: no script errors |  |
| PASS | viewport 414x896: no horizontal scroll | scrollWidth=414 |
| PASS | viewport 414x896: name and title in first screen | title bottom=249 of 896 |
| PASS | viewport 414x896: first CTA in first screen | cta top=554 |
| PASS | viewport 414x896: no script errors |  |
| PASS | viewport 768x1024: no horizontal scroll | scrollWidth=768 |
| PASS | viewport 768x1024: name and title in first screen | title bottom=248 of 1024 |
| PASS | viewport 768x1024: first CTA in first screen | cta top=469 |
| PASS | viewport 768x1024: no script errors |  |
| PASS | viewport 1024x768: no horizontal scroll | scrollWidth=1024 |
| PASS | viewport 1024x768: name and title in first screen | title bottom=309 of 768 |
| PASS | viewport 1024x768: first CTA in first screen | cta top=531 |
| PASS | viewport 1024x768: no script errors |  |
| PASS | viewport 1280x800: no horizontal scroll | scrollWidth=1280 |
| PASS | viewport 1280x800: name and title in first screen | title bottom=325 of 800 |
| PASS | viewport 1280x800: first CTA in first screen | cta top=547 |
| PASS | viewport 1280x800: no script errors |  |
| PASS | viewport 1440x900: no horizontal scroll | scrollWidth=1440 |
| PASS | viewport 1440x900: name and title in first screen | title bottom=325 of 900 |
| PASS | viewport 1440x900: first CTA in first screen | cta top=547 |
| PASS | viewport 1440x900: no script errors |  |
| PASS | viewport 1920x1080: no horizontal scroll | scrollWidth=1920 |
| PASS | viewport 1920x1080: name and title in first screen | title bottom=325 of 1080 |
| PASS | viewport 1920x1080: first CTA in first screen | cta top=547 |
| PASS | viewport 1920x1080: no script errors |  |
| PASS | viewport 844x390: no horizontal scroll | scrollWidth=844 |
| PASS | viewport 844x390: name and title in first screen | title bottom=228 of 390 |
| PASS | viewport 844x390: no script errors |  |
| PASS | projects: 9 cards on load |  |
| PASS | projects: Insurance filter shows 1 |  |
| PASS | projects: aria-pressed follows filter |  |
| PASS | projects: SaaS filter shows 2 |  |
| PASS | clients: AT&T chip filters to 2 projects |  |
| PASS | clients: client filter chip visible |  |
| PASS | clients: clearing restores 9 |  |
| PASS | clients: clear chip hidden again |  |
| PASS | clients: duplicate marquee links removed from tab order |  |
| PASS | clients: pause button stops marquee |  |
| PASS | dialog: opens |  |
| PASS | dialog: title filled |  |
| PASS | dialog: focus on close button |  |
| PASS | dialog: Escape closes |  |
| PASS | dialog: focus returns to opener |  |
| PASS | experience: show more expands |  |
| PASS | skills: group highlight dims others |  |
| PASS | theme: toggle switches and persists after reload | system -> dark -> dark |
| PASS | keyboard: first Tab focuses skip link |  |
| PASS | keyboard: skip link moves focus to main |  |
| PASS | desktop interactions: no script errors |  |
| PASS | menu: links hidden before opening |  |
| PASS | menu: opens with aria-expanded=true |  |
| PASS | menu: Escape closes and returns focus |  |
| PASS | dialog (mobile): fits screen and scrolls |  |
| PASS | no-JS: all 9 case studies readable | visible=9 |
| PASS | no-JS: navigation visible |  |
| PASS | no-JS: full experience visible |  |
| PASS | assets: 26 local files return 200 |  |
| PASS | anchors: every in-page link has a target |  |
| PASS | seo: title | Balaraju | Senior Java Backend Engineer & Technical Lead |
| PASS | seo: meta description 120-170 chars | 155 chars |
| PASS | seo: canonical is site root |  |
| PASS | seo: Open Graph title, url and image |  |
| PASS | seo: twitter card |  |
| PASS | seo: exactly one h1 |  |
| PASS | seo: JSON-LD Person parses |  |
| PASS | seo: html lang set |  |
| PASS | a11y: every image has alt |  |
| PASS | security: target=_blank links use noopener |  |
| PASS | axe 390px dark: no violations |  |
| PASS | axe 390px light: no violations |  |
| PASS | axe 1440px dark: no violations |  |
| PASS | axe 1440px light: no violations |  |

External hosts the page tried to reach during the run: www.google.com, cdn.jsdelivr.net. Both are optional logo upgrades loaded after the page.

## Not tested (needs manual testing)
- **Firefox, Safari (macOS and iOS), Edge and Android Chrome:** only Chromium is installed here. Edge and Android Chrome use the same engine, so the risk is low. Safari and Firefox were reviewed by code only:
  - `dialog` needs Safari 15.4+
  - `color-mix()` needs Safari 16.2+ and Firefox 113+, with a solid fallback before it
  - `inert` is not used
  - `text-wrap: balance` is decorative and safe to ignore
- **Real devices and notch/safe-area behaviour:** emulated viewports only.
- **Screen readers** (NVDA, JAWS, VoiceOver, TalkBack): not run. axe-core finds about a third of WCAG issues, so this run is not a WCAG 2.2 AA conformance claim.
- **Zoom to 200% / 400% and text-only resize:** not run as automated checks. Layout uses relative units and reflows at 320 px.
- **External links** (LinkedIn, GitHub, PJSD Academy, favicon service, Devicon): couldn't be fetched from the sandbox. URLs were checked by format only.
- **Live logo upgrade path:** the network was blocked here, so only the fallback was exercised. Check on the live site that company logos appear and that TCS shows its own mark.
- **Global network performance** (US, UK, EU, UAE, Singapore, Australia): no multi-region testing was available. GitHub Pages is served from a global CDN (Fastly).
- **Resume download on iOS:** Safari may open the PDF in a viewer instead of downloading it. Both work, but check it.

## Re-running the tests
```bash
npm i --no-save playwright axe-core html-validate
node tests/site.test.cjs
npx html-validate index.html
```
