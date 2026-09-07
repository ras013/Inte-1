/* ===== helpers.js — utilidades de UI compartidas por las herramientas ===== */
(function () {
  "use strict";
  const H = {};

  /** Crea un elemento HTML a partir de un string. */
  H.el = function (html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  /** Tarjeta visual con título y cuerpo HTML. */
  H.panel = function (title, bodyHtml, cls) {
    const p = H.el(
      '<div class="callout ' + (cls || "note") + '">' +
      (title ? '<div class="callout-title">' + title + "</div>" : "") +
      "<div>" + bodyHtml + "</div></div>"
    );
    return p;
  };

  /** Botón con clase opcional. */
  H.btn = function (label, onclick, cls) {
    const b = H.el('<button class="btn ' + (cls || "") + '">' + label + "</button>");
    b.addEventListener("click", onclick);
    return b;
  };

  /** Slider: devuelve {el, get, set, setRange}. */
  H.slider = function (label, min, max, step, value, oninput) {
    const wrap = H.el(
      '<div class="ctl"><label></label><input type="range"></div>'
    );
    const lab = wrap.querySelector("label");
    const input = wrap.querySelector("input");
    input.min = min; input.max = max; input.step = step; input.value = value;
    const fmt = function (v) {
      if (step >= 1 && Math.round(step) === step) return String(Math.round(v));
      return String(Math.round(v * 100) / 100);
    };
    function refresh() {
      const v = parseFloat(input.value);
      lab.textContent = label + ": " + fmt(v);
      const span = Math.max(1e-9, parseFloat(input.max) - parseFloat(input.min));
      const pct = (v - parseFloat(input.min)) / span * 100;
      input.style.setProperty("--fill", Math.max(0, Math.min(100, pct)) + "%");
      oninput && oninput(v);
    }
    const update = function (v) { input.value = v; refresh(); };
    lab.textContent = label + ": " + fmt(value);
    input.style.setProperty("--fill", "0%");
    input.addEventListener("input", refresh);
    return {
      el: wrap,
      get: () => parseFloat(input.value),
      set: update,
      /** Cambia el rango (min/max/step/valor) en caliente. */
      setRange: function (newMin, newMax, newStep, newValue) {
        input.min = newMin; input.max = newMax;
        if (newStep !== undefined) input.step = newStep;
        if (newValue !== undefined) input.value = newValue;
        refresh();
      },
    };
  };

  /** Select: devuelve {el, get, set}. */
  H.select = function (label, options, value, onchange) {
    const wrap = H.el('<div class="ctl"><label></label><select></select></div>');
    wrap.querySelector("label").textContent = label;
    const sel = wrap.querySelector("select");
    options.forEach(function (o) {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () { onchange && onchange(sel.value); });
    return { el: wrap, get: () => sel.value, set: function (v) { sel.value = v; onchange && onchange(v); } };
  };

  /** Indicador verdadero/falso. */
  H.truth = function (ok) {
    return H.el('<span class="truth-ind ' + (ok ? "ok" : "no") + '">' + (ok ? "✔ correcto" : "✘ incorrecto") + "</span>");
  };

  /** Badge. */
  H.badge = function (text, kind) {
    return H.el('<span class="chip" style="border-color:' + (kind === "ok" ? "rgba(52,211,153,0.5)" : kind === "warn" ? "rgba(251,191,36,0.5)" : "var(--border)") + '">' + text + "</span>");
  };

  /** Muestra un resultado matemático en un panel. */
  H.resultPanel = function (html) {
    return H.el('<div class="tool-out">' + html + "</div>");
  };

  /** Crea un contenedor de gráfico Plotly y devuelve la referencia. */
  H.chart = function () {
    const host = H.el('<div class="plot-host"><div class="chart"></div></div>');
    const chartEl = host.querySelector(".chart");
    return {
      el: host,
      _connected: false,
      plot: function (data, layout) {
        // Plotly v3.x falla ("namespaceURI" error) si el contenedor NO está
        // conectado al documento al llamar newPlot. Si hiciera falta, lo
        // adjuntamos al body (red de seguridad; el flujo normal de app.js ya
        // monta la herramienta conectada).
        if (typeof chartEl.isConnected === "boolean" && !chartEl.isConnected
            && typeof document !== "undefined" && document.body
            && host.parentNode !== document.body) {
          document.body.appendChild(host);
        }
        const cfg = Object.assign({
          displayModeBar: false,
          responsive: true,
          staticPlot: false,
        }, this.config || {});
        return Plotly.newPlot(chartEl, data, Object.assign({
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { family: "Segoe UI, sans-serif", color: "#c9cfe8", size: 12 },
          margin: { l: 46, r: 18, t: 34, b: 42 },
          xaxis: { gridcolor: "#242b4d", zerolinecolor: "#3a4270" },
          yaxis: { gridcolor: "#242b4d", zerolinecolor: "#3a4270" },
        }, layout || {}));
      },
      clear: function () { Plotly.purge(chartEl); },
    };
  };

  /** Número con formato: hasta 5 decimales sin notación científica molesta. */
  H.num = function (x, d) {
    if (!isFinite(x)) return String(x);
    const p = d === undefined ? 4 : d;
    const r = Math.round(x * Math.pow(10, p)) / Math.pow(10, p);
    return String(r);
  };

  /** Restablece Plotly en todos los gráficos dentro de un contenedor (memoria). */
  H.dispose = function (host) {
    host.querySelectorAll(".chart").forEach(function (c) {
      try { Plotly.purge(c); } catch (e) { /* noop */ }
    });
  };

  window.H = H;
})();
