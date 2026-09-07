/* ===== tools/impropias.js — Explorador de integrales impropias ===== */
(function () {
  "use strict";

  /* ---- utilidades ---- */
  function linspace(a, b, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n);
    return out;
  }
  function clipY(v) { return Math.max(-30, Math.min(30, v)); }

  /* ---- funciones con polo interior para el detector ---- */
  const POLOS = [
    {
      label: "f(x) = 1/x² en [−1, 1] (polo en x = 0)",
      f: function (x) { return 1 / (x * x); },
      a: -1, b: 1, c: 0,
      blindVal: -2,
      blindTex: "\\left[-\\frac{1}{x}\\right]_{-1}^{1} = -1 - 1 = -2",
      verdict: "DIVERGE — polo interior en x = 0",
      ok: false,
      why: "La antiderivada $-1/x$ no es válida en un intervalo que contiene al polo: cada lado tiende a $\\infty$, así que la integral completa diverge. El valor $-2$ es absurdo: un área negativa para un integrando positivo."
    },
    {
      label: "f(x) = 1/√x en [0, 1] (polo en el extremo x = 0)",
      f: function (x) { return 1 / Math.sqrt(x); },
      a: 0, b: 1, c: 0,
      blindVal: 2,
      blindTex: "\\left[2\\sqrt{x}\\right]_{0}^{1} = 2",
      verdict: "CONVERGE a 2 — pero es impropia (polo en el extremo)",
      ok: true,
      why: "El TFC “a ciegas” acierta por casualidad: la antiderivada $2\\sqrt{x}$ se extiende continuamente al polo. La forma rigurosa es el límite lateral $\\int_0^1 \\frac{dx}{\\sqrt{x}} = \\lim_{t\\to 0^+}\\int_t^1 \\frac{dx}{\\sqrt{x}}$."
    },
    {
      label: "f(x) = 1/(x−2) en [0, 3] (polo interior en x = 2)",
      f: function (x) { return 1 / (x - 2); },
      a: 0, b: 3, c: 2,
      blindVal: -Math.log(2),
      blindTex: "\\left[\\ln|x-2|\\right]_{0}^{3} = \\ln 1 - \\ln 2 = -\\ln 2 \\approx -0.693",
      verdict: "DIVERGE — polo interior en x = 2",
      ok: false,
      why: "Ambos lados del polo divergen (los límites laterales de $\\ln|x-2|$ son $\\pm\\infty$). Aplicar el TFC da $-\\ln 2$, un número sin relación con el área."
    },
    {
      label: "f(x) = 1/x en [−1, 1] (polo interior en x = 0)",
      f: function (x) { return 1 / x; },
      a: -1, b: 1, c: 0,
      blindVal: 0,
      blindTex: "\\left[\\ln|x|\\right]_{-1}^{1} = 0 - 0 = 0",
      verdict: "DIVERGE — polo interior en x = 0",
      ok: false,
      why: "Cada lado diverge ($\\ln|t| \\to -\\infty$). El valor 0 es solo el “valor principal de Cauchy”, no la integral impropia, que no existe."
    }
  ];

  window.TOOLS = window.TOOLS || {};
  window.TOOLS["impropias"] = {
    title: "Explorador de integrales impropias",
    description: "Compara convergencia y divergencia en límites infinitos y polos, y audita la continuidad antes del TFC.",
    icon: "♾️",

    mount: function (host, cfg) {
      const st = { tipo: "t1", p1: 1.5, T: 10, p2: 1.2, eps: -2, cp: 1, cq: 2, disc: 0 };

      /* --- selector de tipo --- */
      const top = H.el('<div class="tool-controls"></div>');
      const selTipo = H.select("Tipo de integral impropia", [
        { label: "Tipo 1 — límite superior ∞ (∫₁^∞ dx/x^p)", value: "t1" },
        { label: "Tipo 2 — discontinuidad en x = 0 (∫₀¹ dx/x^p)", value: "t2" },
      ], "t1", function (v) { st.tipo = v; toggle(); draw(); });
      top.appendChild(selTipo.el);
      host.appendChild(top);

      /* --- Tipo 1 --- */
      const wrap1 = H.el('<div></div>');
      const c1 = H.el('<div class="tool-controls"></div>');
      const slP1 = H.slider("p (exponente)", 0.5, 3, 0.05, 1.5, function (v) { st.p1 = v; drawTipo1(); });
      const slT = H.slider("límite temporal T", 1, 50, 1, 10, function (v) { st.T = v; drawTipo1(); });
      c1.appendChild(slP1.el);
      c1.appendChild(slT.el);
      wrap1.appendChild(c1);
      const out1 = H.resultPanel("");
      wrap1.appendChild(out1);
      const chart1 = H.chart();
      wrap1.appendChild(chart1.el);
      host.appendChild(wrap1);

      /* --- Tipo 2 --- */
      const wrap2 = H.el('<div style="display:none"></div>');
      const c2 = H.el('<div class="tool-controls"></div>');
      const slP2 = H.slider("p (exponente)", 0.2, 1.5, 0.01, 1.2, function (v) { st.p2 = v; drawTipo2(); });
      const slEps = H.slider("ε (escala log₁₀)", -4, -0.05, 0.01, -2, function (v) { st.eps = v; drawTipo2(); });
      c2.appendChild(slP2.el);
      c2.appendChild(slEps.el);
      wrap2.appendChild(c2);
      const out2 = H.resultPanel("");
      wrap2.appendChild(out2);
      const chart2 = H.chart();
      wrap2.appendChild(chart2.el);
      host.appendChild(wrap2);

      /* --- detector de discontinuidades --- */
      host.appendChild(H.el('<h3 style="margin:26px 0 4px">Detector de discontinuidades: audita antes del TFC</h3>'));
      const dControls = H.el('<div class="tool-controls"></div>');
      const selDisc = H.select("Función con posible polo",
        POLOS.map(function (p, i) { return { label: p.label, value: String(i) }; }),
        "0",
        function (v) { st.disc = parseInt(v, 10); drawDisc(); });
      dControls.appendChild(selDisc.el);
      host.appendChild(dControls);
      const discOut = H.resultPanel("");
      host.appendChild(discOut);
      const chartDisc = H.chart();
      host.appendChild(chartDisc.el);

      /* --- test de comparación --- */
      host.appendChild(H.el('<h3 style="margin:26px 0 4px">Test de comparación directa</h3>'));
      const cmpControls = H.el('<div class="tool-controls"></div>');
      const slCP = H.slider("p (exponente 1ª curva)", 0.5, 3, 0.05, 1, function (v) { st.cp = v; drawCmp(); });
      const slCQ = H.slider("q (exponente 2ª curva)", 0.5, 3, 0.05, 2, function (v) { st.cq = v; drawCmp(); });
      cmpControls.appendChild(slCP.el);
      cmpControls.appendChild(slCQ.el);
      host.appendChild(cmpControls);
      const cmpOut = H.resultPanel("");
      host.appendChild(cmpOut);
      const chartCmp = H.chart();
      host.appendChild(chartCmp.el);

      /* --- reiniciar --- */
      const resetWrap = H.el('<div style="margin-top:14px"></div>');
      resetWrap.appendChild(H.btn("Reiniciar todo", function () {
        st.tipo = "t1"; selTipo.set("t1");
        st.p1 = 1.5; slP1.set(1.5);
        st.T = 10; slT.set(10);
        st.p2 = 1.2; slP2.set(1.2);
        st.eps = -2; slEps.set(-2);
        st.cp = 1; slCP.set(1);
        st.cq = 2; slCQ.set(2);
        st.disc = 0; selDisc.set("0");
        toggle(); draw();
        window.trackToolUse && window.trackToolUse(cfg && cfg.unitId, "impropias");
      }, "ghost"));
      host.appendChild(resetWrap);

      /* ---- Tipo 1: ∫₁^∞ dx/x^p ---- */
      function drawTipo1() {
        const p = st.p1, T = st.T;
        const f = function (x) { return 1 / Math.pow(x, p); };
        const partial = p === 1 ? Math.log(T) : (Math.pow(T, 1 - p) - 1) / (1 - p);
        const conv = p > 1;
        const limit = p > 1 ? 1 / (p - 1) : 0;
        const pS = H.num(p, 2);
        const partialTex = p === 1 ? "\\ln T" : "\\frac{T^{1-p}-1}{1-p}";

        let html =
          "<b>Tipo 1 — límite superior infinito.</b> " +
          math.toHtml("$f(x) = \\dfrac{1}{x^{" + pS + "}}$ sobre $[1,\\infty)$.") + "<br>" +
          "Integral parcial hasta $T = " + T + "$: " +
          math.toHtml("$\\int_1^{" + T + "} \\frac{dx}{x^{" + pS + "}} = " + partialTex + " = " + H.num(partial, 5) + "$") + "<br>";
        if (conv) {
          html += "Veredicto: <b style='color:var(--ok)'>CONVERGE</b> — " +
            math.toHtml("$\\int_1^{\\infty} \\frac{dx}{x^{" + pS + "}} = \\frac{1}{p-1} = " + H.num(limit, 5) + "$") +
            " — el área se estabiliza: el valor límite exacto existe.";
        } else if (p === 1) {
          html += "Veredicto: <b style='color:var(--err)'>DIVERGE</b> — caso crítico $p = 1$: " +
            math.toHtml("$\\int_1^T \\frac{dx}{x} = \\ln T$") +
            "; con T = 50 apenas da $\\ln 50 \\approx 3.91$ (pruébalo subiendo T al máximo), pero sigue creciendo sin límite: nunca se estabiliza.";
        } else {
          html += "Veredicto: <b style='color:var(--err)'>DIVERGE</b> — con $p < 1$ el área crece como " +
            math.toHtml("$\\frac{T^{1-p}}{1-p}$") + ": cada vez más deprisa.";
        }
        out1.innerHTML = html;
        window.renderMath && window.renderMath(out1);

        const xMax = Math.max(T, 5);
        const xs = linspace(1, xMax, 300);
        const ys = xs.map(f);
        const data = [];
        if (T > 1.01) {
          const xt = linspace(1, T, 90);
          const yt = xt.map(f);
          const xp = xt.concat(xt.slice().reverse());
          const yp = yt.concat(xt.slice().reverse().map(function () { return 0; }));
          data.push({
            type: "scatter", mode: "lines", x: xp, y: yp,
            fill: "toself", fillcolor: "rgba(108,140,255,0.3)",
            line: { color: "rgba(108,140,255,0)", width: 0 },
            name: "área hasta T", hoverinfo: "skip",
          });
        }
        data.push({
          type: "scatter", mode: "lines", x: xs, y: ys,
          line: { color: "#38bdf8", width: 3 },
          name: "f(x) = 1/x^p", hovertemplate: "x=%{x:.2f}<br>f=%{y:.4f}<extra></extra>",
        });
        data.push({
          type: "scatter", mode: "lines", x: [1, xMax], y: [0, 0],
          line: { color: "#3a4270", width: 1 }, name: "eje x", hoverinfo: "skip", showlegend: false,
        });
        chart1.plot(data, {
          title: { text: "Tipo 1: f(x) = 1/x^p y área hasta T", font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, range: [1, xMax] },
          yaxis: { title: { text: "f(x)" } },
        });
      }

      /* ---- Tipo 2: ∫₀¹ dx/x^p ---- */
      function drawTipo2() {
        const p = st.p2;
        const eps = Math.pow(10, st.eps);
        const f = function (x) { return 1 / Math.pow(x, p); };
        const partial = p === 1 ? -Math.log(eps) : (1 - Math.pow(eps, 1 - p)) / (1 - p);
        const conv = p < 1;
        const limit = p < 1 ? 1 / (1 - p) : 0;
        const pS = H.num(p, 2);
        const partialTex = p === 1 ? "-\\ln\\varepsilon" : "\\frac{1-\\varepsilon^{1-p}}{1-p}";

        let html =
          "<b>Tipo 2 — discontinuidad en x = 0.</b> " +
          math.toHtml("$f(x) = \\dfrac{1}{x^{" + pS + "}}$ sobre $(0,1]$: hay una asíntota vertical en $x=0$.") + "<br>" +
          "Recorta el extremo a " + math.toHtml("$\\varepsilon = " + H.num(eps, 4) + "$") + ": " +
          math.toHtml("$\\int_{\\varepsilon}^{1} \\frac{dx}{x^{" + pS + "}} = " + partialTex + " = " + H.num(partial, 5) + "$") + "<br>";
        if (conv) {
          html += "Veredicto: <b style='color:var(--ok)'>CONVERGE</b> — " +
            math.toHtml("$\\int_0^1 \\frac{dx}{x^{" + pS + "}} = \\frac{1}{1-p} = " + H.num(limit, 5) + "$") +
            " — el área se estabiliza al tomar $\\varepsilon \\to 0$.";
        } else if (p === 1) {
          html += "Veredicto: <b style='color:var(--err)'>DIVERGE</b> — caso crítico $p = 1$: " +
            math.toHtml("$\\int_\\varepsilon^1 \\frac{dx}{x} = -\\ln\\varepsilon$") +
            "; con $\\varepsilon = 0.0001$ da $\\approx 9.21$ y sigue creciendo al reducir ε.";
        } else {
          html += "Veredicto: <b style='color:var(--err)'>DIVERGE</b> — con $p > 1$ el área crece como " +
            math.toHtml("$\\frac{\\varepsilon^{1-p}}{p-1}$") + ": explota al acercar ε a 0.";
        }
        out2.innerHTML = html;
        window.renderMath && window.renderMath(out2);

        const x0 = Math.min(eps, 0.002);
        const xs = linspace(x0, 1, 300);
        const ys = xs.map(f).map(clipY);
        const data = [];
        if (eps < 0.99) {
          const xt = linspace(eps, 1, 80);
          const yt = xt.map(f).map(clipY);
          const xp = xt.concat(xt.slice().reverse());
          const yp = yt.concat(xt.slice().reverse().map(function () { return 0; }));
          data.push({
            type: "scatter", mode: "lines", x: xp, y: yp,
            fill: "toself", fillcolor: "rgba(108,140,255,0.3)",
            line: { color: "rgba(108,140,255,0)", width: 0 },
            name: "área desde ε", hoverinfo: "skip",
          });
        }
        data.push({
          type: "scatter", mode: "lines", x: xs, y: ys,
          line: { color: "#38bdf8", width: 3 },
          name: "f(x) = 1/x^p", hovertemplate: "x=%{x:.4f}<br>f=%{y:.3f}<extra></extra>",
        });
        data.push({
          type: "scatter", mode: "lines", x: [x0, 1], y: [0, 0],
          line: { color: "#3a4270", width: 1 }, name: "eje x", hoverinfo: "skip", showlegend: false,
        });
        chart2.plot(data, {
          title: { text: "Tipo 2: f(x) = 1/x^p en (0,1] con asíntota en x = 0", font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, range: [x0, 1] },
          yaxis: { title: { text: "f(x)" }, range: [0, 30] },
        });
      }

      /* ---- detector de discontinuidades ---- */
      function drawDisc() {
        const D = POLOS[st.disc];
        const d = (D.b - D.a) * 0.01;
        let html =
          "<b>Recomendación:</b> audita la continuidad de f en todo el intervalo <b>antes</b> de aplicar el TFC.<br>" +
          "Función: <b>" + D.label + "</b>.<br>" +
          "TFC a ciegas (sin auditar): " + math.toHtml("$F(b)-F(a) = " + D.blindTex + " = " + H.num(D.blindVal, 4) + "$") +
          " → " + (D.ok ? "acierta por casualidad" : "<b style='color:var(--err)'>valor falso</b>") + "<br>" +
          "Resultado correcto: <b style='color:" + (D.ok ? "var(--ok)" : "var(--err)") + "'>" + D.verdict + "</b><br>" +
          "<span style='font-size:12.5px;color:var(--text-dim)'>" + math.toHtml(D.why) + "</span>";
        discOut.innerHTML = html;
        window.renderMath && window.renderMath(discOut);

        const segs = [];
        if (D.a < D.c) segs.push([D.a, D.c - d]);
        if (D.b > D.c) segs.push([D.c + d, D.b]);
        const data = [];
        segs.forEach(function (sg) {
          const xs = linspace(sg[0], sg[1], 200);
          const ys = xs.map(D.f).map(clipY);
          data.push({
            type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: "#38bdf8", width: 3 },
            name: "f(x)", hovertemplate: "x=%{x:.3f}<br>f=%{y:.3f}<extra></extra>",
          });
        });
        data.push({
          type: "scatter", mode: "lines", x: [D.c, D.c], y: [-12, 12],
          line: { color: "#f87171", width: 2.5, dash: "dash" },
          name: "polo x = c (asíntota)", hoverinfo: "skip",
        });
        data.push({
          type: "scatter", mode: "lines", x: [D.a, D.b], y: [0, 0],
          line: { color: "#3a4270", width: 1 }, name: "eje x", hoverinfo: "skip", showlegend: false,
        });
        chartDisc.plot(data, {
          title: { text: "Auditoría de continuidad: " + D.label, font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, range: [D.a - 0.1, D.b + 0.1] },
          yaxis: { title: { text: "f(x)" }, range: [-12, 12] },
        });
      }

      /* ---- test de comparación ---- */
      function drawCmp() {
        const p = st.cp, q = st.cq;
        const fp = function (x) { return 1 / Math.pow(x, p); };
        const fq = function (x) { return 1 / Math.pow(x, q); };
        const xs = linspace(1, 10, 250);
        const yp = xs.map(fp), yq = xs.map(fq);

        const vp = p > 1 ? "converge a " + math.toHtml("$\\frac{1}{p-1} = " + H.num(1 / (p - 1), 4) + "$") : "<b style='color:var(--err)'>diverge</b>";
        const vq = q > 1 ? "converge a " + math.toHtml("$\\frac{1}{q-1} = " + H.num(1 / (q - 1), 4) + "$") : "<b style='color:var(--err)'>diverge</b>";
        const pS = H.num(p, 2);
        const qS = H.num(q, 2);

        cmpOut.innerHTML =
          "<b>Test de comparación directa.</b> Para " + math.toHtml("$x \\ge 1$") + ": si " +
          math.toHtml("$p \\le q$") + " entonces " + math.toHtml("$\\dfrac{1}{x^q} \\le \\dfrac{1}{x^p}$") +
          ": el exponente mayor decae más rápido.<br>" +
          "Con " + math.toHtml("$p = " + pS + "$") + " y " + math.toHtml("$q = " + qS + "$") + ": " +
          math.toHtml("$\\dfrac{1}{x^{" + qS + "}} \\le \\dfrac{1}{x^{" + pS + "}}$") + " en " + math.toHtml("$x \\ge 1$") + ".<br>" +
          "Test p: " + math.toHtml("$\\int_1^{\\infty} \\frac{dx}{x^r}$") + " converge si y solo si " + math.toHtml("$r > 1$") + ".<br>" +
          "Aquí: " + math.toHtml("$\\int_1^{\\infty} \\frac{dx}{x^{" + pS + "}}$") + " " + vp + " y " +
          math.toHtml("$\\int_1^{\\infty} \\frac{dx}{x^{" + qS + "}}$") + " " + vq + ".<br>" +
          "<span style='font-size:12.5px;color:var(--text-dim)'>Regla (0 ≤ f ≤ g): si ∫g converge ⇒ ∫f converge; si ∫f diverge ⇒ ∫g diverge. " +
          (p <= q
            ? "Con p ≤ q, la curva menor es 1/x^q (exponente mayor) y la mayor es 1/x^p: si ∫1/x^p converge (p > 1), también ∫1/x^q; si ∫1/x^q diverge (q ≤ 1), también ∫1/x^p."
            : "Con p > q, la curva menor es 1/x^p y la mayor es 1/x^q: si ∫1/x^q converge (q > 1), también ∫1/x^p; si ∫1/x^p diverge (p ≤ 1), también ∫1/x^q.") +
          "</span>";
        window.renderMath && window.renderMath(cmpOut);

        const data = [
          {
            type: "scatter", mode: "lines", x: xs, y: yp,
            fill: "tozeroy", fillcolor: "rgba(56,189,248,0.12)",
            line: { color: "#38bdf8", width: 3 },
            name: "1/x^p", hovertemplate: "x=%{x:.2f}<br>1/x^p=%{y:.4f}<extra></extra>",
          },
          {
            type: "scatter", mode: "lines", x: xs, y: yq,
            fill: "tozeroy", fillcolor: "rgba(251,191,36,0.12)",
            line: { color: "#fbbf24", width: 3 },
            name: "1/x^q", hovertemplate: "x=%{x:.2f}<br>1/x^q=%{y:.4f}<extra></extra>",
          },
        ];
        chartCmp.plot(data, {
          title: { text: "Test de comparación: 1/x^p vs 1/x^q (x ≥ 1)", font: { color: "#e8eaf6", size: 14 } },
          showlegend: true,
          xaxis: { title: { text: "x" }, range: [1, 10] },
          yaxis: { title: { text: "f(x)" } },
        });
      }

      function toggle() {
        wrap1.style.display = st.tipo === "t1" ? "" : "none";
        wrap2.style.display = st.tipo === "t2" ? "" : "none";
      }
      function draw() {
        if (st.tipo === "t1") drawTipo1(); else drawTipo2();
      }

      /* --- inicialización --- */
      toggle();
      draw();
      drawDisc();
      drawCmp();
    },
  };
})();
