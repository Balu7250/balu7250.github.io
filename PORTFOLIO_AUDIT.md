# Portfolio audit

Audit of `Balu7250/balu7250.github.io` at commit `bc5af1c` (before this upgrade), carried out on 17 Nov 2026.
Each finding lists evidence, impact, the fix applied on branch `portfolio-upgrade`, and how the fix was verified.
Test details are in [TEST_REPORT.md](TEST_REPORT.md).

**Starting point:** a single 139 KB `index.html` (CSS, JavaScript, base64 logos and a JSON icon map all inline) plus `profile.webp`.
No metadata files, no tests, no CI. GitHub Pages serves `main` from the repository root.

## Critical

### C1. Unverified project details presented as fact
- **Evidence:** the PJSD Academy cards listed contributions ("Kept student data access secure and role-based", "Designed for multi-batch course delivery…") and a Java/Spring Boot/React stack. These were placeholder text written when the cards were added. No source material supports them.
- **Impact:** presenting invented details as fact damages credibility with recruiters, and they could be challenged in an interview.
- **Fix:** removed. Both products now show only what was provided: product name, client, "In development". The missing details are listed in [CONTENT_VERIFICATION.md](CONTENT_VERIFICATION.md).
- **Verified:** manual review of `index.html`; the PJSD cards contain no technology or feature claims.

## High

### H1. Main content only existed after JavaScript ran
- **Evidence:** projects, skills, experience bullets and the "At a glance" stack were built with `innerHTML` from JS arrays. The HTML source had empty containers.
- **Impact:** crawlers that don't run scripts, link previews, reader modes and visitors with scripts blocked saw an almost empty page.
- **Fix:** all content is now static HTML. `assets/js/main.js` only adds behaviour. Without JS, case studies show inline and every experience bullet is visible.
- **Verified:** Playwright run with JavaScript disabled shows all 9 case studies, navigation and every experience bullet.

### H2. Contradictory employment status
- **Evidence:** "Current role: Technical Lead, Virtusa" next to the dates "Jun 2025 – Mar 2026".
- **Impact:** recruiters notice date inconsistencies.
- **Fix:** changed to "Most recent role" and flagged for confirmation.
- **Verified:** manual review.

### H3. Client relationships could read as direct employment
- **Evidence:** project cards showed only the client brand, e.g. "Google", "Apple".
- **Impact:** could imply employment by those companies.
- **Fix:**
  - Every card states the employer and role.
  - The Projects section explains the relationship.
  - The client strip is titled "Client programs delivered through employers".
  - PJSD is labelled "Independent product".
- **Verified:** manual review.

### H4. No technical SEO
- **Evidence:** no meta description, canonical URL, Open Graph or Twitter tags, favicon, `robots.txt`, `sitemap.xml` or structured data.
- **Impact:** weak search snippets and blank link previews on LinkedIn and Slack.
- **Fix:** added all of the above, plus a JSON-LD `Person` built only from verified facts and a real 1200×630 social image.
- **Verified:**
  - Lighthouse SEO scored 100 on mobile and desktop.
  - The test suite checks every tag and parses the JSON-LD.

## Medium

### M1. Typewriter animation on the job title
- **Evidence:** a script rewrote the heading's text node every 35–70 ms.
- **Impact:** screen readers could re-announce the title, the motion couldn't be paused (WCAG 2.2.2), and the title wasn't stable for crawlers.
- **Fix:** replaced with the static title "Senior Java Backend Engineer | Technical Lead".
- **Verified:** manual review; axe found no violations.

### M2. Client marquee accessibility
- **Evidence:** the scrolling strip had no pause control, and its duplicate set for the loop was focusable.
- **Impact:** keyboard users met every client twice, and the motion couldn't be stopped.
- **Fix:**
  - A "Pause scrolling" button with `aria-pressed`.
  - The duplicates are `aria-hidden` and out of the tab order.
  - Under reduced motion the strip doesn't move and wraps instead.
- **Verified:** automated checks on the duplicate tab order and the pause button.

### M3. Third-party requests on every visit
- **Evidence:** Google Fonts CSS and font files, plus about 26 Devicon CDN requests and Google favicon lookups before content appeared.
- **Impact:** slower first paint on slow or distant connections, and a dependency on three outside hosts.
- **Fix:**
  - Fonts are self-hosted in `assets/fonts` with `font-display: swap`, and the two hero fonts are preloaded.
  - Technology icons were cut to 6 local SVGs.
  - Live brand logos now load only after the page's `load` event, as an upgrade.
- **Verified:** Lighthouse measured mobile LCP 2.5 s and CLS 0.004 (simulated throttling).

### M4. Large single file
- **Evidence:** 139 KB of HTML with base64 SVGs and a 25 KB icon-path JSON.
- **Impact:** nothing could be cached separately, and the file was hard to maintain.
- **Fix:** split into 52 KB HTML, 24 KB CSS and 10 KB JS, with the logos as separate files.
- **Verified:** `du -b`.

### M5. Oversized images
- **Evidence:** the 1254 px portrait was used for a 400 px hero (and later the 36 px nav avatar).
- **Impact:** wasted bandwidth on phones.
- **Fix:**
  - Added 480 px and 800 px WebP versions with `srcset` and `sizes`.
  - The hero image has `fetchpriority="high"` and explicit dimensions.
  - The nav avatar uses the 480 px file.
- **Verified:** the asset check passed and the Lighthouse image audits passed.

### M6. Dialog and keyboard behaviour
- **Evidence:** focus was not returned after closing the project dialog, there was no skip link, and the mobile menu didn't close on Escape.
- **Fix:**
  - Focus returns to the button that opened the dialog.
  - Escape closes the dialog and the menu.
  - Added a skip link and landmarks.
  - Filter buttons expose `aria-pressed`.
  - A polite live region announces how many projects are shown.
- **Verified:** the Playwright keyboard and dialog checks pass.

### M7. Skills mixed evidence levels
- **Evidence:** a flat icon grid with no indication of which skills were professional delivery and which were personal or learning.
- **Fix:**
  - Recruiter-friendly groups, each labelled with its evidence level.
  - Python, FastAPI, LLM/RAG, React Native and Flutter sit under "Exploring".
  - Per-skill icons removed; no proficiency bars.
- **Verified:** manual review. The open questions are listed in [CONTENT_VERIFICATION.md](CONTENT_VERIFICATION.md).

### M8. Markdown files would be published as web pages
- **Evidence:** GitHub Pages runs Jekyll by default and renders `.md` files as HTML pages.
- **Impact:** internal review documents would be indexable pages on the portfolio domain.
- **Fix:** added `.nojekyll`.
- **Note:** the repository is public, so these files are still readable on GitHub.
- **Verified:** needs a check after deploy that `/PORTFOLIO_AUDIT` returns the raw file or 404, not a styled page.

### M9. Resume PDF metadata
- **Evidence:** converting the original `.docx` produced a PDF whose Author field was another person's name, inherited from the resume template.
- **Fix:** set Author to "Balaraju" and added a title. The phone number paragraph and its icon were removed, as requested.
- **Verified:** `pdfinfo`, and `pdftotext` finds no phone number.

## Low

| ID | Finding | Fix / status |
|----|---------|--------------|
| L1 | Some buttons were under 44 px tall (theme toggle 40 px, copy button and filters ~32 px). | Raised to 40–46 px. axe target-size passes. |
| L2 | `color-mix()` and `backdrop-filter` had no fallbacks. | Added a solid background before `color-mix` and a `-webkit-backdrop-filter` prefix. Other features (`dialog`, `env()`, `text-wrap`) degrade safely. |
| L3 | The email address is public, so it may attract spam. | Kept visible by choice. No address obfuscation added. |
| L4 | The source of truth was a private build script outside the repository. | The repository now holds the real source. No build step. |
| L5 | The LinkedIn post image (outside this repo) still says "9 projects". | Flagged in CONTENT_VERIFICATION.md. |
| L6 | Lighthouse flags compression and cache lifetime. | Caused by the local Python test server. GitHub Pages serves gzip/brotli with a 10-minute cache, which can't be configured on Pages. |
| L7 | The DOM has 820 elements (Lighthouse notes it). | This is the full static content, well under the 1,400-element warning level. No action. |

## Not changed (deliberately)
- **Live company logos (Google favicon service) and Devicon upgrades:** kept because the owner asked for logos that follow brand changes. They load after the page and fall back to local files.
- **Light/dark theme, project filters, client click-to-filter, experience "show more", copy email, back-to-top:** all kept.
- **Visual identity:** navy, Spring green, Bricolage Grotesque and IBM Plex Sans are kept.
