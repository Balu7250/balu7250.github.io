/* Smoke, interaction, accessibility and SEO checks for the portfolio.
   Usage (from the repository root):
     npm i --no-save playwright axe-core     # or point NODE_PATH at an existing install
     node tests/site.test.cjs
   The script serves the repository with Python's http.server on a free port,
   runs Chromium through Playwright and exits non-zero if any check fails. */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { chromium } = require("playwright");
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const ROOT = path.resolve(__dirname, "..");
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); };

function freePort() {
  return new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
}

(async () => {
  const port = await freePort();
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const BASE = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const external = new Set();

  async function open(viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, ...opts });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_PROXY|net::ERR_/.test(m.text())) errors.push("console: " + m.text()); });
    page.on("request", (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) external.add(new URL(r.url()).host); });
    await page.goto(BASE, { waitUntil: "load" });
    return { ctx, page, errors };
  }

  try {
    // 1. Viewports: no horizontal scroll, name + title + a CTA in the first screen.
    const sizes = [[320, 640], [360, 740], [375, 667], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [844, 390]];
    for (const [w, h] of sizes) {
      const { ctx, page, errors } = await open({ width: w, height: h });
      const m = await page.evaluate(() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        return { sw: document.documentElement.scrollWidth, h1: r("#heroName").bottom, title: r(".hero .title").bottom, cta: r(".cta .btn").top, vh: innerHeight };
      });
      check(`viewport ${w}x${h}: no horizontal scroll`, m.sw <= w, `scrollWidth=${m.sw}`);
      check(`viewport ${w}x${h}: name and title in first screen`, m.title <= m.vh, `title bottom=${Math.round(m.title)} of ${m.vh}`);
      if (h >= 640) check(`viewport ${w}x${h}: first CTA in first screen`, m.cta < m.vh, `cta top=${Math.round(m.cta)}`);
      check(`viewport ${w}x${h}: no script errors`, errors.length === 0, errors.join(" | "));
      await ctx.close();
    }

    // 2. Interactions at desktop size.
    {
      const { ctx, page, errors } = await open({ width: 1440, height: 900 });
      const visible = () => page.evaluate(() => [...document.querySelectorAll(".proj")].filter((c) => !c.classList.contains("hide")).length);
      check("projects: 9 cards on load", (await visible()) === 9);
      await page.click('#projFilters [data-dom="Insurance"]');
      check("projects: Insurance filter shows 1", (await visible()) === 1);
      check("projects: aria-pressed follows filter", await page.getAttribute('#projFilters [data-dom="Insurance"]', "aria-pressed") === "true");
      await page.click('#projFilters [data-dom="SaaS"]');
      check("projects: SaaS filter shows 2", (await visible()) === 2);
      await page.evaluate(() => document.querySelector('#clientTrack .logo-chip[data-client="att"]').click());
      await page.waitForTimeout(600);
      check("clients: AT&T chip filters to 2 projects", (await visible()) === 2);
      check("clients: client filter chip visible", await page.isVisible("#clientFilter"));
      await page.click("#clientFilter");
      check("clients: clearing restores 9", (await visible()) === 9);
      check("clients: clear chip hidden again", !(await page.isVisible("#clientFilter")));
      const dupes = await page.evaluate(() => [...document.querySelectorAll('#clientTrack li[aria-hidden="true"] a')].every((a) => a.tabIndex === -1));
      check("clients: duplicate marquee links removed from tab order", dupes);
      await page.click("#marqueeToggle");
      check("clients: pause button stops marquee", await page.evaluate(() => !document.getElementById("marquee").classList.contains("running")));

      // Dialog
      const opener = page.locator("#proj-rews .open-case");
      await opener.click();
      check("dialog: opens", await page.evaluate(() => document.getElementById("caseDialog").open));
      check("dialog: title filled", (await page.textContent("#dTitle")).includes("TRIRIGA"));
      check("dialog: focus on close button", await page.evaluate(() => document.activeElement.id === "dClose"));
      await page.keyboard.press("Escape");
      check("dialog: Escape closes", await page.evaluate(() => !document.getElementById("caseDialog").open));
      check("dialog: focus returns to opener", await page.evaluate(() => document.activeElement.closest("#proj-rews") !== null));

      // Show more
      await page.click("#experience .job:nth-child(2) .more");
      check("experience: show more expands", await page.getAttribute("#experience .job:nth-child(2) .more", "aria-expanded") === "true" && await page.isVisible("#experience .job:nth-child(2) li.extra"));

      // Skill groups
      await page.click('#skillFilters [data-group="data"]');
      check("skills: group highlight dims others", await page.evaluate(() => document.querySelectorAll(".skill-group.dim").length === document.querySelectorAll(".skill-group").length - 1));

      // Theme persistence
      const before = await page.evaluate(() => document.documentElement.dataset.theme || "system");
      await page.click("#themeBtn");
      const after = await page.evaluate(() => document.documentElement.dataset.theme);
      await page.reload({ waitUntil: "load" });
      const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
      check("theme: toggle switches and persists after reload", after && after !== before && persisted === after, `${before} -> ${after} -> ${persisted}`);

      // Keyboard: skip link
      await page.keyboard.press("Tab");
      check("keyboard: first Tab focuses skip link", await page.evaluate(() => document.activeElement.classList.contains("skip-link")));
      await page.keyboard.press("Enter");
      check("keyboard: skip link moves focus to main", await page.evaluate(() => document.activeElement.id === "main"));

      check("desktop interactions: no script errors", errors.length === 0, errors.join(" | "));
      await ctx.close();
    }

    // 3. Mobile menu
    {
      const { ctx, page } = await open({ width: 390, height: 844 });
      check("menu: links hidden before opening", !(await page.isVisible('#navLinks a[href="#projects"]')));
      await page.click("#menuBtn");
      check("menu: opens with aria-expanded=true", await page.getAttribute("#menuBtn", "aria-expanded") === "true" && await page.isVisible('#navLinks a[href="#projects"]'));
      await page.keyboard.press("Escape");
      check("menu: Escape closes and returns focus", await page.getAttribute("#menuBtn", "aria-expanded") === "false" && await page.evaluate(() => document.activeElement.id === "menuBtn"));
      // Dialog scrolls on a short screen
      await page.click("#proj-rews .open-case");
      const scrollable = await page.evaluate(() => { const d = document.getElementById("caseDialog"); return d.scrollHeight > d.clientHeight && d.getBoundingClientRect().height <= innerHeight; });
      check("dialog (mobile): fits screen and scrolls", scrollable);
      await ctx.close();
    }

    // 4. Without JavaScript: content still present.
    {
      const { ctx, page } = await open({ width: 1280, height: 800 }, { javaScriptEnabled: false });
      const m = await page.evaluate(() => ({
        cases: [...document.querySelectorAll(".proj .case")].filter((c) => c.offsetParent !== null).length,
        nav: document.querySelector('#navLinks a[href="#skills"]').offsetParent !== null,
        extra: document.querySelector("li.extra").offsetParent !== null,
      }));
      check("no-JS: all 9 case studies readable", m.cases === 9, `visible=${m.cases}`);
      check("no-JS: navigation visible", m.nav);
      check("no-JS: full experience visible", m.extra);
      await ctx.close();
    }

    // 5. Assets, anchors and SEO metadata.
    {
      const { ctx, page } = await open({ width: 1280, height: 800 });
      const refs = await page.evaluate(() => {
        const out = new Set();
        document.querySelectorAll("[src],[href],[srcset]").forEach((el) => {
          ["src", "href"].forEach((a) => { const v = el.getAttribute(a); if (v && !/^(https?:|mailto:|#|data:)/.test(v)) out.add(v); });
          const ss = el.getAttribute("srcset"); if (ss) ss.split(",").forEach((p) => out.add(p.trim().split(" ")[0]));
        });
        return [...out];
      });
      for (const r of ["robots.txt", "sitemap.xml", "assets/img/og-image.png"]) refs.push(r);
      const bad = [];
      for (const r of refs) { const res = await page.request.get(BASE + r); if (res.status() !== 200) bad.push(`${r} -> ${res.status()}`); }
      check(`assets: ${refs.length} local files return 200`, bad.length === 0, bad.join(", "));
      const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
      check("anchors: every in-page link has a target", missing.length === 0, missing.join(", "));
      const seo = await page.evaluate(() => {
        const meta = (s) => (document.querySelector(s) || {}).content || (document.querySelector(s) || {}).href || "";
        let ld = null; try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); } catch (e) {}
        return {
          title: document.title, desc: meta('meta[name="description"]'), canonical: meta('link[rel="canonical"]'),
          ogTitle: meta('meta[property="og:title"]'), ogImage: meta('meta[property="og:image"]'), ogUrl: meta('meta[property="og:url"]'),
          tw: meta('meta[name="twitter:card"]'), h1: document.querySelectorAll("h1").length, ld,
          lang: document.documentElement.lang, imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
          blankNoRel: [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener/.test(a.rel)).length,
        };
      });
      check("seo: title", seo.title === "Balaraju | Senior Java Backend Engineer & Technical Lead", seo.title);
      check("seo: meta description 120-170 chars", seo.desc.length >= 120 && seo.desc.length <= 170, `${seo.desc.length} chars`);
      check("seo: canonical is site root", seo.canonical === "https://balu7250.github.io/");
      check("seo: Open Graph title, url and image", seo.ogTitle && seo.ogUrl === "https://balu7250.github.io/" && seo.ogImage.endsWith("/assets/img/og-image.png"));
      check("seo: twitter card", seo.tw === "summary_large_image");
      check("seo: exactly one h1", seo.h1 === 1);
      check("seo: JSON-LD Person parses", seo.ld && seo.ld["@type"] === "Person" && seo.ld.name === "Balaraju");
      check("seo: html lang set", seo.lang === "en");
      check("a11y: every image has alt", seo.imgsNoAlt === 0);
      check("security: target=_blank links use noopener", seo.blankNoRel === 0);
      await ctx.close();
    }

    // 6. axe-core at phone and desktop, dark and light.
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      for (const scheme of ["dark", "light"]) {
        const { ctx, page } = await open({ width: w, height: h }, { colorScheme: scheme, reducedMotion: "reduce" });
        await page.addScriptTag({ content: axeSource });
        const r = await page.evaluate(async () => {
          const res = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
          return res.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")}`);
        });
        check(`axe ${w}px ${scheme}: no violations`, r.length === 0, r.join(" || "));
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail && !r.ok ? "  -> " + r.detail : r.detail ? "  (" + r.detail + ")" : ""}`);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log("External hosts requested: " + ([...external].join(", ") || "none"));
  if (process.env.RESULTS_JSON) fs.writeFileSync(process.env.RESULTS_JSON, JSON.stringify({ results, external: [...external] }, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
