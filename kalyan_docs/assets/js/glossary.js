/* ============================================================
   Glossary popovers + drawer.
   - Hover/click any <span class="g" data-term="key">label</span>
     to see the definition.
   - "Glossary" sidebar button opens a full drawer with all terms.
   ============================================================ */

(function () {
  const docsRoot = window.location.pathname.includes("/chapters/") ? "../" : "./";

  let glossary = null;
  let popover = null;
  let drawer = null;

  async function loadGlossary() {
    if (glossary) return glossary;
    try {
      const res = await fetch(docsRoot + "assets/data/glossary.json");
      glossary = await res.json();
    } catch (e) {
      console.warn("Glossary failed to load", e);
      glossary = {};
    }
    return glossary;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function showPopover(target, key) {
    const entry = glossary?.[key];
    if (!entry) return;
    if (!popover) {
      popover = document.createElement("div");
      popover.className = "glossary-popover";
      document.body.appendChild(popover);
    }
    const related = (entry.related || [])
      .map(k => `<span class="g" data-term="${escapeHtml(k)}">${escapeHtml(glossary[k]?.term || k)}</span>`)
      .join(", ");
    popover.innerHTML = `
      <div class="gp-term">${escapeHtml(entry.term)}</div>
      <div>${escapeHtml(entry.def)}</div>
      ${related ? `<div class="gp-related">See also: ${related}</div>` : ""}
    `;
    popover.style.display = "block";
    const rect = target.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;
    // Constrain to viewport
    const maxLeft = window.innerWidth - 340 + window.scrollX;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    popover.style.top = top + "px";
    popover.style.left = left + "px";
  }

  function hidePopover() {
    if (popover) popover.style.display = "none";
  }

  function attachListeners() {
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest(".g[data-term]");
      if (t) showPopover(t, t.getAttribute("data-term"));
    });
    document.addEventListener("mouseout", (e) => {
      const t = e.target.closest(".g[data-term]");
      const moving = e.relatedTarget?.closest(".glossary-popover");
      if (t && !moving) hidePopover();
    });
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".g[data-term]");
      if (t) {
        e.preventDefault();
        showPopover(t, t.getAttribute("data-term"));
      } else if (!e.target.closest(".glossary-popover")) {
        hidePopover();
      }
    });
    // Close drawer on outside click
    document.addEventListener("click", (e) => {
      if (drawer?.classList.contains("show") &&
          !e.target.closest(".glossary-drawer") &&
          !e.target.closest("#glossary-btn")) {
        drawer.classList.remove("show");
      }
    });
  }

  function buildDrawer() {
    if (drawer) return drawer;
    drawer = document.createElement("aside");
    drawer.className = "glossary-drawer";
    drawer.id = "glossary-drawer";
    const keys = Object.keys(glossary).sort((a, b) =>
      glossary[a].term.localeCompare(glossary[b].term)
    );
    const items = keys.map(k => {
      const e = glossary[k];
      return `<dt id="g-${escapeHtml(k)}">${escapeHtml(e.term)}</dt><dd>${escapeHtml(e.def)}</dd>`;
    }).join("");
    drawer.innerHTML = `
      <button class="gd-close" onclick="document.getElementById('glossary-drawer').classList.remove('show')">Close (Esc)</button>
      <h2>Glossary</h2>
      <input class="gd-search" type="text" placeholder="Filter terms…" id="gd-filter" />
      <dl id="gd-list">${items}</dl>
    `;
    document.body.appendChild(drawer);
    const filter = drawer.querySelector("#gd-filter");
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      const dts = drawer.querySelectorAll("dt");
      dts.forEach(dt => {
        const dd = dt.nextElementSibling;
        const hay = (dt.textContent + " " + (dd?.textContent || "")).toLowerCase();
        const show = !q || hay.includes(q);
        dt.style.display = show ? "" : "none";
        if (dd) dd.style.display = show ? "" : "none";
      });
    });
    return drawer;
  }

  async function init() {
    await loadGlossary();
    buildDrawer();
    attachListeners();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
