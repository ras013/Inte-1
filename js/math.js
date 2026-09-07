/* ===== math.js — render de LaTeX con KaTeX local (offline) ===== */
(function () {
  "use strict";

  // Reconoce bloques $$...$$ y inline $...$ (sin $ intermedios ni saltos de línea en inline)
  const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Texto plano: HTML escapado + markdown ligero (**negrita**, `código`). */
  function txt(s) {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function katexRender(tex, displayMode) {
    try {
      return katex.renderToString(tex, {
        displayMode: displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      return "<code>" + escapeHtml(tex) + "</code>";
    }
  }

  /**
   * Convierte un texto con $...$ y $$...$$ (y markdown ligero) en HTML.
   * Uso: innerHTML = math.toHtml("...")
   */
  function renderToHtml(text) {
    if (text === null || text === undefined) return "";
    const parts = String(text).split(MATH_RE);
    return parts
      .map(function (part) {
        if (!part) return "";
        if (part.length >= 4 && part[0] === "$" && part[1] === "$" &&
            part[part.length - 1] === "$" && part[part.length - 2] === "$") {
          return katexRender(part.slice(2, -2), true);
        }
        if (part.length >= 2 && part[0] === "$" && part[part.length - 1] === "$") {
          return katexRender(part.slice(1, -1), false);
        }
        return txt(part);
      })
      .join("");
  }

  /**
   * Renderiza HTML que YA contiene LaTeX crudo entre $$ (display) o $ (inline),
   * sin escapar el HTML circundante (usado para campos b.latex / answer).
   */
  function renderRaw(html) {
    if (html === null || html === undefined) return "";
    return String(html)
      .replace(/\$\$([\s\S]+?)\$\$/g, function (m, tex) { return katexRender(tex, true); })
      .replace(/\$([^$\n]+?)\$/g, function (m, tex) { return katexRender(tex, false); });
  }

  /**
   * Renderiza LaTeX ya presente en el DOM del host (auto-render ligero):
   * recorre nodos de texto y reemplaza $...$ y $$...$$. Útil tras insertar
   * HTML que aún contiene marcadores sin procesar. Los nodos que contienen
   * HTML ya renderizado por KaTeX no se tocan (no tienen $ sin balancear
   * porque math.toHtml lo procesó; si contienen $, se renderizan).
   */
  function renderMathInHost(host) {
    if (!host || !host.querySelectorAll || !document.createTreeWalker) return;
    try {
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        const text = node.nodeValue;
        if (!text || text.indexOf("$") === -1) return;
        // solo si hay marcadores balanceados y el nodo no está dentro de un .katex
        if (node.parentNode && node.parentNode.closest && node.parentNode.closest(".katex")) return;
        const html = renderToHtml(text);
        if (html !== text) {
          const span = document.createElement("span");
          span.innerHTML = html;
          node.parentNode.replaceChild(span, node);
        }
      });
    } catch (e) {
      /* entorno sin TreeWalker: noop */
    }
  }

  window.math = {
    toHtml: renderToHtml,
    raw: renderRaw,
    inline: renderToHtml,
  };
  window.renderMath = renderMathInHost;
})();
