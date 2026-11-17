# Deployment guide

## How the site is published
- **GitHub Pages source:** "Deploy from a branch", branch `main`, folder `/ (root)`. This setting was not changed.
- **URL:** `https://balu7250.github.io/`. Because the repository is named `balu7250.github.io`, there is no extra path segment.
- **Build:** none. The `.nojekyll` file tells Pages to serve files as they are.
- **Links:** all asset paths are relative (`assets/...`), so they work at the root URL and locally.

A push to `main` goes live in about 1–2 minutes. Progress shows under the repository's **Actions** tab ("pages build and deployment").

## Review a change before it goes live
```bash
git fetch origin
```
```bash
git switch portfolio-upgrade
```
```bash
python3 -m http.server 8000
```
Open http://localhost:8000 in your browser, then run the checks:
```bash
npm i --no-save playwright axe-core html-validate && node tests/site.test.cjs
```

## Publish
```bash
git switch main && git pull origin main
```
```bash
git merge --ff-only portfolio-upgrade
```
```bash
git push origin main
```
If `--ff-only` refuses because `main` has moved on, merge it normally (`git merge portfolio-upgrade`), re-run the tests, then push.

## Roll back
Undo the last change without rewriting history:
```bash
git revert --no-edit HEAD && git push origin main
```
To undo the whole upgrade (several commits), revert the range:
```bash
git revert --no-edit bc5af1c..HEAD && git push origin main
```

## After each deploy, check
1. https://balu7250.github.io/ loads, with the portrait and fonts.
2. Company logos appear in the client strip and TCS shows its own mark.
3. **Download resume** downloads the PDF.
4. https://balu7250.github.io/robots.txt and https://balu7250.github.io/sitemap.xml load.
5. https://balu7250.github.io/PORTFOLIO_AUDIT.md shows raw text, not a styled page.
6. Paste the URL into LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/) to refresh the cached preview image.

## Search engines (optional, manual)
- **Google Search Console:** add the property `https://balu7250.github.io/`, verify it with an HTML tag, then submit `sitemap.xml`.
- **Bing Webmaster Tools:** you can import the property from Search Console.

Indexing timing and rankings are decided by the search engines and can't be guaranteed.
