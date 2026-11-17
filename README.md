# balu7250.github.io

Personal portfolio of **Balaraju**, Senior Java Backend Engineer and Technical Lead.
Live at **https://balu7250.github.io/** (GitHub Pages, served from `main` at the repository root).

The site is a plain static page: no framework and no build step. Edit the files and push.

## Structure
```
index.html                 All page content (projects, experience, skills, contact), metadata and JSON-LD
assets/css/main.css        Styles: colour tokens at the top, light/dark themes, responsive rules at the end
assets/js/main.js          Enhancements only: filters, case-study dialog, theme, menu, client strip, live logos
assets/fonts/              Self-hosted Bricolage Grotesque, IBM Plex Sans, JetBrains Mono (OFL licences included)
assets/img/                Portrait (480/800/original WebP), social image, favicons
assets/logos/              Local brand and technology logos (fallbacks; licences included)
assets/Balaraju_Senior_Java_Backend_Engineer_Resume.pdf
robots.txt, sitemap.xml    Search engine files
.nojekyll                  Stops GitHub Pages from turning the .md files into web pages
tests/site.test.cjs        Playwright + axe-core checks
```

## Common edits
- **Add a project:** copy one `<li class="proj">` block in `index.html`, then give it a unique `id`, `data-client` and `data-dom`.
  - `data-dom` must match a filter button (`BFSI`, `Insurance`, `Telecom`, `Enterprise`, `SaaS`).
  - The text inside `.case` is shown in the pop-up, and inline when JavaScript is off.
- **Update the resume:** replace the PDF in `assets/`, keeping the same file name so links don't break.
- **Change colours:** edit the tokens at the top of `assets/css/main.css`. Each colour is set once for dark and again for light.
- **After changing content:** update `<lastmod>` in `sitemap.xml`.

## Logos
Each logo has a local copy that always works. After the page loads, `main.js` tries to swap in the brand's current icon:
- **Companies:** the company website's icon, via Google's favicon service. Results of 16 px or smaller are ignored, because that is the service's "not found" globe.
- **Technologies:** the latest Devicon file.

Logos are trademarks of their owners and are used only to identify past clients, employers and technologies.

**Licences:** Simple Icons (CC0), Devicon (MIT) and Iconify "logos" (CC0). Licence files are in `assets/logos/`.

## Testing
```bash
npm i --no-save playwright axe-core html-validate
node tests/site.test.cjs        # viewports, interactions, no-JS, assets, SEO, axe
npx html-validate index.html
```
See [TEST_REPORT.md](TEST_REPORT.md) for the latest results, [PORTFOLIO_AUDIT.md](PORTFOLIO_AUDIT.md) for the audit, [CONTENT_VERIFICATION.md](CONTENT_VERIFICATION.md) for facts awaiting confirmation, and [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for publishing.

This repository is public, so everything in it, including these notes, can be read on GitHub.
