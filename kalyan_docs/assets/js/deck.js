/* ============================================================
   Per-chapter deck initialization.
   - In docs mode: don't initialize reveal.js. Just render
     Mermaid diagrams and highlight code.
   - In slides mode: initialize reveal.js as before, plus Mermaid.
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
  const isSlides = document.documentElement.classList.contains("slides-mode");
  const theme = localStorage.getItem("vitess-tutorial-theme") || "dark";

  // Mermaid is needed in both modes
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "light" ? "default" : "dark",
      themeVariables: {
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Inter, sans-serif",
      },
      flowchart: { curve: "basis" },
      sequence:  { useMaxWidth: true },
      securityLevel: "loose",
    });
  }

  const renderAllMermaid = () => {
    if (!window.mermaid) return;
    document.querySelectorAll(".mermaid:not([data-rendered])").forEach((el) => {
      const src = el.textContent.trim();
      el.setAttribute("data-rendered", "1");
      const id = "mmd_" + Math.random().toString(36).slice(2, 9);
      try {
        mermaid.render(id, src).then(({ svg }) => {
          el.innerHTML = svg;
        }).catch(err => {
          el.innerHTML = `<pre style="color:var(--red);">Mermaid error: ${err.message}</pre>`;
        });
      } catch (err) {
        el.innerHTML = `<pre style="color:var(--red);">${err.message}</pre>`;
      }
    });
  };

  const highlightAllCode = () => {
    if (!window.hljs) return;
    document.querySelectorAll("pre code:not([data-highlighted])").forEach((el) => {
      try {
        hljs.highlightElement(el);
        el.setAttribute("data-highlighted", "1");
      } catch {}
    });
  };

  if (isSlides) {
    // Slides mode: reveal.js drives everything
    if (typeof Reveal !== "undefined") {
      // eslint-disable-next-line no-undef
      Reveal.initialize({
        hash: true,
        slideNumber: "c/t",
        progress: true,
        controls: true,
        controlsTutorial: false,
        transition: "slide",
        backgroundTransition: "fade",
        width: "100%",
        height: "100%",
        margin: 0.04,
        minScale: 0.5,
        maxScale: 1.3,
        history: false,
        plugins: [RevealHighlight, RevealNotes, RevealMarkdown],
      });

      Reveal.on("ready", renderAllMermaid);
      Reveal.on("slidechanged", renderAllMermaid);
      Reveal.on("ready", highlightAllCode);
      Reveal.on("slidechanged", highlightAllCode);

      // At the end of a chapter, right-arrow / Space / PageDown jumps
      // to the next chapter. Mirror for left/PageUp at the start.
      document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

        const isNextKey = e.key === "ArrowRight" || e.key === " " || e.key === "PageDown";
        const isPrevKey = e.key === "ArrowLeft" || e.key === "PageUp";
        if (!isNextKey && !isPrevKey) return;

        let routes;
        try { routes = Reveal.availableRoutes(); }
        catch { return; }

        const atEnd   = routes && !routes.right && !routes.down;
        const atStart = routes && !routes.left  && !routes.up;

        if (isNextKey && atEnd) {
          const next = document.getElementById("next-chapter");
          const href = next?.getAttribute("href");
          if (href && href !== "#" && !next.classList.contains("disabled")) {
            e.preventDefault();
            window.location.href = href;
          }
        } else if (isPrevKey && atStart) {
          const prev = document.getElementById("prev-chapter");
          const href = prev?.getAttribute("href");
          if (href && href !== "#" && !prev.classList.contains("disabled")) {
            e.preventDefault();
            window.location.href = href;
          }
        }
      });
    }
  } else {
    // Docs mode: render Mermaid immediately, highlight code, no reveal.js
    renderAllMermaid();
    highlightAllCode();
    // If the URL has #section-id, scroll to it after layout settles.
    if (window.location.hash && !/^#\/\d/.test(window.location.hash)) {
      setTimeout(() => {
        const t = document.querySelector(window.location.hash);
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }
});
