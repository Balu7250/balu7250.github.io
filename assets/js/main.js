/* Balaraju portfolio: progressive enhancement only.
   All content is in index.html; this file adds filters, the case-study dialog,
   the experience "show more" toggles, theme switching, navigation helpers,
   the client strip motion and live brand logos. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function setPressed(buttons, active) {
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === active)); });
  }

  /* ---------- Theme ---------- */
  var themeBtn = $("#themeBtn");
  function currentTheme() {
    return root.dataset.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }
  function syncThemeButton() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Use " + next + " theme");
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* storage unavailable */ }
    syncThemeButton();
  });
  syncThemeButton();

  /* ---------- Mobile navigation ---------- */
  var menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  menuBtn.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
  navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- Scroll progress, active section, back to top ---------- */
  var bar = $("#progress"), toTop = $("#toTop");
  var anchors = $$("a", navLinks);
  var sections = anchors.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = root, max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    var show = h.scrollTop > 600;
    toTop.classList.toggle("show", show);
    toTop.tabIndex = show ? 0 : -1;
    var cur = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    anchors.forEach(function (a, i) { if (i === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    $("#heroName").focus({ preventScroll: true });
  });
  $("#heroName").tabIndex = -1;

  /* ---------- Client strip: seamless loop, pause control ---------- */
  var marquee = $("#marquee"), track = $("#clientTrack"), toggle = $("#marqueeToggle");
  if (!reducedMotion.matches) {
    // A second copy makes the loop seamless. It stays clickable but is hidden from assistive tech and the tab order.
    var clone = track.cloneNode(true);
    clone.removeAttribute("id");
    $$("li", clone).forEach(function (li) {
      li.setAttribute("aria-hidden", "true");
      $$("a", li).forEach(function (a) { a.tabIndex = -1; });
      track.appendChild(li);
    });
    marquee.classList.add("running");
    toggle.hidden = false;
    toggle.addEventListener("click", function () {
      var paused = marquee.classList.toggle("running") === false;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.textContent = paused ? "Resume scrolling" : "Pause scrolling";
    });
  } else {
    root.classList.add("no-marquee");
  }

  /* ---------- Project filters ---------- */
  var projGrid = $("#projGrid"), projFilters = $("#projFilters"), status = $("#projStatus");
  var domButtons = $$(".filter[data-dom]", projFilters), clientFilter = $("#clientFilter");
  var cards = $$(".proj", projGrid);
  var clientNames = {};
  cards.forEach(function (c) { clientNames[c.dataset.client] = $(".client", c).textContent.trim(); });

  function applyProjects(dom, client) {
    var shown = 0;
    cards.forEach(function (c) {
      var match = client ? c.dataset.client === client : (dom === "all" || c.dataset.dom === dom);
      c.classList.toggle("hide", !match);
      if (match) shown++;
    });
    setPressed(domButtons, client ? null : domButtons.filter(function (b) { return b.dataset.dom === dom; })[0]);
    clientFilter.hidden = !client;
    if (client) {
      clientFilter.textContent = "Showing: " + clientNames[client] + " ✕";
      clientFilter.setAttribute("aria-label", "Showing " + clientNames[client] + " projects. Clear filter");
    }
    status.textContent = shown + (shown === 1 ? " project" : " projects") + " shown";
  }
  projFilters.addEventListener("click", function (e) {
    var b = e.target.closest(".filter");
    if (!b) return;
    if (b === clientFilter) { applyProjects("all", null); domButtons[0].focus(); return; }
    applyProjects(b.dataset.dom, null);
  });
  track.addEventListener("click", function (e) {
    var chip = e.target.closest(".logo-chip");
    if (!chip) return;
    e.preventDefault();
    applyProjects("all", chip.dataset.client);
    $("#projects").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    clientFilter.focus({ preventScroll: true });
  });

  /* ---------- Case-study dialog ---------- */
  var dialog = $("#caseDialog"), dBody = $("#dBody"), dTitle = $("#dTitle"), dRel = $("#dRel"), dClient = $("#dClient");
  var opener = null;
  projGrid.addEventListener("click", function (e) {
    var btn = e.target.closest(".open-case");
    if (!btn) return;
    var card = btn.closest(".proj");
    opener = btn;
    // Copy the card's own, page-authored markup into the dialog (no external HTML is injected).
    dClient.replaceChildren(cloneChildren($(".client", card)));
    dTitle.textContent = $("h3", card).textContent;
    dRel.replaceChildren(cloneChildren($(".rel", card)));
    dBody.replaceChildren($(".case", card).cloneNode(true));
    dialog.style.setProperty("--brand", card.style.getPropertyValue("--brand"));
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      dBody.scrollTop = 0;
      $("#dClose").focus();
    } else {
      // Very old browsers: fall back to showing the case study inline.
      card.querySelector(".case").style.display = "block";
    }
  });
  function cloneChildren(el) {
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(el.childNodes, function (n) { frag.appendChild(n.cloneNode(true)); });
    return frag;
  }
  $("#dClose").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", function () { if (opener) opener.focus(); });

  /* ---------- Experience: show more ---------- */
  $$(".job").forEach(function (job) {
    var btn = $(".more", job), extra = $$("li.extra", job);
    if (!btn || !extra.length) return;
    btn.hidden = false;
    var label = $("span", btn);
    btn.addEventListener("click", function () {
      var open = job.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Show less" : "Show " + extra.length + " more";
    });
  });

  /* ---------- Skill group highlight ---------- */
  var skillFilters = $("#skillFilters"), groups = $$(".skill-group");
  var groupButtons = $$(".filter", skillFilters);
  skillFilters.addEventListener("click", function (e) {
    var b = e.target.closest(".filter");
    if (!b) return;
    setPressed(groupButtons, b);
    groups.forEach(function (g) { g.classList.toggle("dim", b.dataset.group !== "all" && g.dataset.group !== b.dataset.group); });
  });

  /* ---------- Copy email ---------- */
  $$(".copy").forEach(function (b) {
    b.hidden = false;
    b.addEventListener("click", function () {
      var done = function () {
        b.textContent = "Copied"; b.classList.add("done");
        setTimeout(function () { b.textContent = "Copy"; b.classList.remove("done"); }, 1600);
      };
      var fallback = function () {
        var r = document.createRange(), s = window.getSelection();
        r.selectNodeContents($("#emailLink")); s.removeAllRanges(); s.addRange(r);
        b.textContent = "Selected";
      };
      try { navigator.clipboard.writeText(b.dataset.copy).then(done, fallback); } catch (err) { fallback(); }
    });
  });

  /* ---------- Live brand logos ----------
     Local logos and letter badges ship with the page. After load, each one is upgraded to the
     brand's current icon (company favicon, or the latest Devicon file) if that loads properly.
     Google's icon service answers unknown sites with a 16px globe, so tiny results are ignored. */
  function upgrade(el, src, minWidth) {
    var img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = function () {
      if (img.naturalWidth < minWidth) return;
      if (el.tagName === "IMG") { el.src = src; return; }
      var n = document.createElement("img");
      n.className = "logo"; n.src = src; n.alt = ""; n.width = 28; n.height = 28;
      el.replaceWith(n);
    };
    img.src = src;
  }
  function liveLogos() {
    $$("[data-live]").forEach(function (el) {
      upgrade(el, "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(el.dataset.live) + "&sz=128", 32);
    });
    $$("[data-live-dv]").forEach(function (el) {
      upgrade(el, "https://cdn.jsdelivr.net/npm/devicon@latest/icons/" + el.dataset.liveDv, 1);
    });
  }
  if (document.readyState === "complete") setTimeout(liveLogos, 300);
  else window.addEventListener("load", function () { setTimeout(liveLogos, 300); });
})();
