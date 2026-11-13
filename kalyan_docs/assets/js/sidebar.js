/* ============================================================
   Sidebar rendering, navigation, theme, progress (localStorage)
   ============================================================ */

const STORAGE_KEY = "vitess-tutorial-progress";
const THEME_KEY = "vitess-tutorial-theme";

// Compute the path to the docs root from any page (index.html vs chapters/NN.html)
function docsRoot() {
  const path = window.location.pathname;
  if (path.includes("/chapters/")) return "../";
  return "./";
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

function markVisited(chapterId) {
  const p = loadProgress();
  p[chapterId] = { visited: true, ts: Date.now() };
  saveProgress(p);
}

function totalChapters(manifest) {
  return manifest.reduce((acc, part) => acc + part.chapters.length, 0);
}

function visitedCount(manifest) {
  const p = loadProgress();
  let n = 0;
  for (const part of manifest) {
    for (const ch of part.chapters) {
      if (p[ch.id]?.visited) n++;
    }
  }
  return n;
}

function currentChapterSlugFromUrl() {
  const m = window.location.pathname.match(/\/chapters\/([^/.]+)\.html/);
  return m ? m[1] : null;
}

function currentChapterIdFromUrl(manifest) {
  const slug = currentChapterSlugFromUrl();
  if (!slug) return null;
  for (const part of manifest) {
    for (const ch of part.chapters) {
      if (ch.slug === slug) return ch.id;
    }
  }
  return null;
}

function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  // For reveal.js theme integration
  const lightLink = document.getElementById("reveal-theme");
  if (lightLink) {
    lightLink.href = theme === "light"
      ? "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css"
      : "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css";
  }
}

function flatChapters(manifest) {
  const all = [];
  for (const part of manifest) {
    for (const ch of part.chapters) all.push({ ...ch, part: part.part });
  }
  return all;
}

async function loadManifest() {
  const root = docsRoot();
  const res = await fetch(root + "assets/data/chapters.json");
  return await res.json();
}

// Compute the display index (1-indexed by manifest order) for each chapter.
function buildDisplayIndex(manifest) {
  const idx = {};
  let n = 1;
  for (const part of manifest) {
    for (const ch of part.chapters) {
      idx[ch.id] = n++;
    }
  }
  return idx;
}

function renderSidebar(manifest, currentId, container) {
  const root = docsRoot();
  const progress = loadProgress();
  const total = totalChapters(manifest);
  const visited = visitedCount(manifest);
  const pct = total ? Math.round((visited / total) * 100) : 0;
  const displayIdx = buildDisplayIndex(manifest);

  let html = `
    <div class="sidebar-header">
      <div class="sidebar-logo">V</div>
      <div>
        <div class="sidebar-title">Vitess Tutorial</div>
        <div class="sidebar-subtitle">From basic SQL to your first PR</div>
      </div>
    </div>
    <div class="sidebar-progress">
      <span>Progress</span>
      <span><strong>${visited}</strong> / ${total} (${pct}%)</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
    <div class="search-wrap">
      <input id="sidebar-search" class="search-input" type="text" placeholder="Filter chapters… (Cmd+K)" />
    </div>
  `;

  for (const part of manifest) {
    html += `<div class="part" data-part-name="${escapeHtml(part.part)}"><div class="part-title">${escapeHtml(part.part)}</div><ul class="chapter-list">`;
    for (const ch of part.chapters) {
      const isCurrent = ch.id === currentId;
      const v = !!progress[ch.id]?.visited;
      const href = root + `chapters/${ch.slug}.html`;
      const num = String(displayIdx[ch.id]).padStart(2, "0");
      const haystack = (ch.title + " " + part.part).toLowerCase();
      html += `
        <li class="chapter-item" data-haystack="${escapeHtml(haystack)}">
          <a href="${href}" class="${isCurrent ? "active" : ""}">
            <span class="chapter-number">${num}</span>
            <span class="chapter-title">
              ${escapeHtml(ch.title)}
              <div class="chapter-meta">
                <span class="badge ${ch.difficulty}">${ch.difficulty}</span>
                · ${ch.minutes} min
                ${v && !isCurrent ? '<span class="chapter-check">✓</span>' : ""}
              </div>
            </span>
          </a>
        </li>
      `;
    }
    html += `</ul></div>`;
  }

  const currentView = localStorage.getItem("vitess-tutorial-view") === "slides" ? "slides" : "docs";
  const viewLabel = currentView === "docs" ? "Presentation mode" : "Docs mode";

  html += `
    <div class="sidebar-footer">
      <button id="view-toggle" title="Toggle between docs view and slide presentation">${viewLabel}</button>
      <button id="theme-toggle">Toggle theme</button>
      <button id="glossary-btn">Glossary</button>
      <button id="reset-progress">Reset progress</button>
      <button id="help-btn">? Help</button>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  });
  document.getElementById("reset-progress")?.addEventListener("click", () => {
    if (confirm("Reset all chapter progress?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
  document.getElementById("help-btn")?.addEventListener("click", () => {
    document.getElementById("help-dialog")?.classList.add("show");
  });
  document.getElementById("glossary-btn")?.addEventListener("click", () => {
    document.getElementById("glossary-drawer")?.classList.add("show");
  });
  document.getElementById("view-toggle")?.addEventListener("click", () => {
    const cur = localStorage.getItem("vitess-tutorial-view") === "slides" ? "slides" : "docs";
    const next = cur === "docs" ? "slides" : "docs";
    localStorage.setItem("vitess-tutorial-view", next);
    if (next === "docs" && /^#\/\d/.test(window.location.hash)) {
      window.location.hash = "";
    }
    location.reload();
  });

  // Sidebar filter
  const searchInput = document.getElementById("sidebar-search");
  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const items = container.querySelectorAll(".chapter-item");
    let anyVisible = false;
    items.forEach(li => {
      const hay = li.getAttribute("data-haystack") || "";
      const show = !q || hay.includes(q);
      li.style.display = show ? "" : "none";
      if (show) anyVisible = true;
    });
    // Hide empty parts
    container.querySelectorAll(".part").forEach(part => {
      const anyShown = Array.from(part.querySelectorAll(".chapter-item")).some(
        li => li.style.display !== "none"
      );
      part.style.display = anyShown ? "" : "none";
    });
    // No-result hint
    let hint = container.querySelector(".no-result");
    if (!anyVisible && q) {
      if (!hint) {
        hint = document.createElement("div");
        hint.className = "no-result";
        hint.textContent = "No chapter matches.";
        container.appendChild(hint);
      }
    } else if (hint) {
      hint.remove();
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// Set up keyboard shortcuts for chapter nav
function setupChapterNav(manifest, currentId) {
  if (!currentId) return;
  const all = flatChapters(manifest);
  const idx = all.findIndex(c => c.id === currentId);
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const root = docsRoot();

  const prevLink = document.getElementById("prev-chapter");
  const nextLink = document.getElementById("next-chapter");
  if (prevLink) {
    if (prev) {
      prevLink.href = root + `chapters/${prev.slug}.html`;
      prevLink.title = `Previous: ${prev.title}`;
    } else {
      prevLink.classList.add("disabled");
      prevLink.href = "#";
    }
  }
  if (nextLink) {
    if (next) {
      nextLink.href = root + `chapters/${next.slug}.html`;
      nextLink.title = `Next: ${next.title}`;
    } else {
      nextLink.classList.add("disabled");
      nextLink.href = "#";
    }
  }

  document.addEventListener("keydown", (e) => {
    // Cmd/Ctrl+K focuses the sidebar search regardless of focus
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      document.getElementById("sidebar-search")?.focus();
      return;
    }
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "n" && next) { window.location = root + `chapters/${next.slug}.html`; }
    if (e.key === "p" && prev) { window.location = root + `chapters/${prev.slug}.html`; }
    if (e.key === "?") {
      document.getElementById("help-dialog")?.classList.toggle("show");
    }
    if (e.key === "g") {
      document.getElementById("glossary-drawer")?.classList.toggle("show");
    }
    if (e.key === "Escape") {
      document.getElementById("help-dialog")?.classList.remove("show");
      document.getElementById("glossary-drawer")?.classList.remove("show");
    }
  });
}

function setupSidebarToggle() {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const isMobile = () => window.matchMedia("(max-width: 960px)").matches;

  toggle?.addEventListener("click", () => {
    if (isMobile()) {
      // Mobile: slide-in overlay
      sidebar?.classList.toggle("open");
      backdrop?.classList.toggle("show");
    } else {
      // Desktop: hide / show the entire sidebar column
      const hidden = document.documentElement.classList.toggle("sidebar-hidden");
      localStorage.setItem("vitess-tutorial-sidebar-hidden", hidden ? "1" : "0");
    }
  });
  backdrop?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    backdrop?.classList.remove("show");
  });
}

async function initSidebar() {
  applyTheme(getCurrentTheme());

  const manifest = await loadManifest();
  const currentId = currentChapterIdFromUrl(manifest);
  if (currentId) markVisited(currentId);

  const container = document.getElementById("sidebar");
  if (container) renderSidebar(manifest, currentId, container);

  setupChapterNav(manifest, currentId);
  setupSidebarToggle();

  // expose for index.html
  window.__tutorialManifest = manifest;
  window.dispatchEvent(new CustomEvent("manifest-loaded", { detail: manifest }));
}

document.addEventListener("DOMContentLoaded", initSidebar);
