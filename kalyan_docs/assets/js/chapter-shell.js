/* ============================================================
   chapter-shell.js
   Injects the common chapter chrome (sidebar container, topbar,
   help dialog) so each chapter file only needs to provide its
   <section> slides. Also owns the docs/slides view-mode toggle.
   ============================================================ */

(function () {
  // ---- Pick view mode BEFORE the page paints ----
  const VIEW_KEY = "vitess-tutorial-view";
  const mode = (localStorage.getItem(VIEW_KEY) || "docs") === "slides" ? "slides" : "docs";
  document.documentElement.classList.add(mode + "-mode");

  const title = document.getElementById("chapter-meta")?.dataset?.title || document.title;
  const chapterNum = document.getElementById("chapter-meta")?.dataset?.chapter || "";
  const part = document.getElementById("chapter-meta")?.dataset?.part || "";

  // Build the page shell around the existing #slides container
  const slidesEl = document.getElementById("slides");
  if (!slidesEl) {
    console.error("Missing <div id='slides'> in chapter page");
    return;
  }

  const modeBtnLabel = mode === "docs" ? "◧ Slides" : "▤ Docs";
  const modeBtnTitle = mode === "docs" ? "Switch to slide presentation" : "Switch to docs view";

  const shell = document.createElement("div");
  shell.className = "app";
  shell.innerHTML = `
    <aside class="sidebar" id="sidebar"></aside>
    <div class="sidebar-backdrop"></div>
    <main class="main">
      <div class="topbar">
        <div>
          <button class="menu-toggle" id="menu-toggle">☰</button>
          <span class="topbar-title">Ch ${chapterNum}. ${escapeHtml(title)}</span>
          <span class="topbar-meta">${escapeHtml(part)}</span>
        </div>
        <div class="topbar-actions">
          <a href="../index.html">Home</a>
          <a id="prev-chapter" href="#" title="Previous chapter">← Prev</a>
          <a id="next-chapter" href="#" title="Next chapter">Next →</a>
          <button class="mode-toggle" id="mode-toggle" title="${modeBtnTitle}">${modeBtnLabel}</button>
        </div>
      </div>
      <nav class="chapter-toc" id="chapter-toc" aria-label="Table of contents"></nav>
      <div class="deck-wrap">
        <div class="reveal"><div class="slides" id="reveal-slides"></div></div>
      </div>
    </main>
  `;
  document.body.insertBefore(shell, document.body.firstChild);
  const target = document.getElementById("reveal-slides");
  while (slidesEl.firstChild) target.appendChild(slidesEl.firstChild);
  slidesEl.remove();

  // Wire up the mode toggle
  document.getElementById("mode-toggle")?.addEventListener("click", () => {
    const next = mode === "docs" ? "slides" : "docs";
    localStorage.setItem(VIEW_KEY, next);
    // Drop any reveal #/N hash when going to docs, keep when going to slides
    if (next === "docs") {
      // Strip the slide index hash; preserve any #section anchor if present
      if (/^#\/\d/.test(window.location.hash)) {
        window.location.hash = "";
      }
    }
    location.reload();
  });

  // ---- Build the docs-mode TOC ----
  if (mode === "docs") {
    buildToc();
    setupScrollSpy();
  }

  function buildToc() {
    const toc = document.getElementById("chapter-toc");
    const sections = Array.from(document.querySelectorAll("#reveal-slides > section"));
    if (!toc || sections.length === 0) return;

    const items = [];
    sections.forEach((sec, i) => {
      let label = sec.querySelector("h2")?.textContent
                || sec.querySelector("h1")?.textContent
                || `Section ${i + 1}`;
      // Trim away inline badge text e.g. "Quiz", "Lab", "Beginner"
      label = label.replace(/\s+(Beginner|Deep Dive|Lab|Practice|Recap|Quiz|Examples|Mental model|Common issues|Triage|Quick check)\s*$/i, "").trim();
      // Shorten very long labels
      if (label.length > 60) label = label.slice(0, 57) + "...";

      const id = sec.id || `sec-${i}`;
      sec.id = id;
      items.push({ id, label });
    });

    toc.innerHTML = `
      <span class="toc-label">In this chapter</span>
      <span class="toc-list">
        ${items.map(it => `<a href="#${it.id}">${escapeHtml(it.label)}</a>`).join("")}
      </span>
    `;
  }

  function setupScrollSpy() {
    const links = Array.from(document.querySelectorAll(".chapter-toc .toc-list a"));
    const sections = links
      .map(a => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (sections.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          links.forEach(a => a.classList.toggle("toc-current",
            a.getAttribute("href") === "#" + id));
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach(s => obs.observe(s));
  }

  // Help dialog
  const dialog = document.createElement("div");
  dialog.className = "help-dialog";
  dialog.id = "help-dialog";
  dialog.innerHTML = `
    <div class="help-content">
      <h3>Keyboard shortcuts</h3>
      <table>
        <tr><td><kbd>→</kbd> / <kbd>Space</kbd></td><td>Next slide; at end of chapter, jumps to next chapter</td></tr>
        <tr><td><kbd>←</kbd></td><td>Previous slide; at start of chapter, jumps to previous chapter</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Slide overview / close dialog</td></tr>
        <tr><td><kbd>n</kbd></td><td>Next chapter</td></tr>
        <tr><td><kbd>p</kbd></td><td>Previous chapter</td></tr>
        <tr><td><kbd>v</kbd></td><td>Toggle docs / slides view</td></tr>
        <tr><td><kbd>g</kbd></td><td>Toggle Glossary drawer</td></tr>
        <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
        <tr><td><kbd>f</kbd></td><td>Fullscreen (slides mode)</td></tr>
        <tr><td><kbd>s</kbd></td><td>Speaker notes (slides mode)</td></tr>
      </table>
      <p style="text-align:right; margin-top:16px;">
        <button onclick="document.getElementById('help-dialog').classList.remove('show')">Close</button>
      </p>
    </div>
  `;
  document.body.appendChild(dialog);

  // Auto-inject glossary.js once per page (idempotent)
  if (!document.querySelector('script[data-glossary]')) {
    const s = document.createElement("script");
    s.src = "../assets/js/glossary.js";
    s.setAttribute("data-glossary", "1");
    document.body.appendChild(s);
  }

  // Press 'v' to toggle view mode
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "v") {
      document.getElementById("mode-toggle")?.click();
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
})();
