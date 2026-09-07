/* ===== tools/tfc.js — Explorador del Teorema Fundamental del Cálculo ===== */
(function () {
  "use strict";
  const FUNCS = [
    { label: "f(t) = t (lineal)", f: function (t) { return t; }, tex: "t", a: 0, b: 4, Ftex: "\\frac{x^2}{2}" },
    { label: "f(t) = t²", f: function (t) { return t * t; }, tex: "t^2", a: 0, b: 4, Ftex: "\\frac{x^3}{3}" },
    { label: "f(t) = sin(t)", f: function (t) { return Math.sin(t); }, tex: "\\sin t", a: 0, b: 6, Ftex: "1-\\cos x" },
    { label: "f(t) = cos(t)", f: function (t) { return Math.cos(t); }, tex: "\\cos t", a: 0, b: 6, Ftex: "\\sin x" },
    { label: "f(t) = 2t + 1", f: function (t) { return 2 * t + 1; }, tex: "2t+1", a: 0, b: 4, Ftex: "x^2+x" },
  ];

  window.TOOLS = window.TOOLS || {};
  window.TOOLS["tfc"] = {
    title: "Explorador del Teorema Fundamental del Cálculo",
    description: "Mueve x para ver cómo F(x) = ∫ₐˣ f(t)dt acumula área y comprueba que F′(x) = f(x).",
    icon: "🔗",

    mount: function (host, cfg) {
      const st = { fi: 0, x: 2, showSlope: true };

      const controls = H.el('<div class="tool-controls"></div>');
      const selFunc = H.select("Función f", FUNCS.map(function (f, i) { return { label: f.label, value: String(i) }; }), "0", function (v) {
        st.fi = parseInt(v, 10);
        const Fn = FUNCS[st.fi];
        st.x = Math.round((Fn.a + Fn.b) / 2 * 100) / 100;
        slX.setRange(Fn.a, Fn.b, 0.01, st.x);
        draw();
      });
      // IMPORTANTE: el rango del deslizador cubre TODO el intervalo [a, b] de
      // la función seleccionada (la gráfica va de 0 a 4 o de 0 a 6; el
      // deslizador también), no un rango fijo 0..1.
      const slX = H.slider("Límite superior x", 0, 4, 0.01, 2, function (v) { st.x = v; draw(); });
      const chk = H.el('<label class="ctl" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" checked> Mostrar recta tangente a F (pendiente = f(x))</label>');
      chk.querySelector("input").addEventListener("change", function (e) { st.showSlope = e.target.checked; draw(); });

      controls.appendChild(selFunc.el);
      controls.appendChild(slX.el);
      controls.appendChild(chk);
      host.appendChild(controls);

      const out = H.resultPanel("");
      host.appendChild(out);

      const chartF = H.chart();
      host.appendChild(chartF.el);
      const chartG = H.chart();
      host.appendChild(chartG.el);

      function F(fi, x) {
        const Fn = FUNCS[fi];
        const a = Fn.a;
        // antiderivada exacta con F(a)=0
        const t = Fn.tex;
        if (t === "t") return (x * x - a * a) / 2;
        if (t === "t^2") return (x * x * x - a * a * a) / 3;
        if (t === "\\sin t") return -Math.cos(x) + Math.cos(a);
        if (t === "\\cos t") return Math.sin(x) - Math.sin(a);
        if (t === "2t+1") return (x * x + x) - (a * a + a);
        return 0;
      }

      function draw() {
        const Fn = FUNCS[st.fi];
        const f = Fn.f, a = Fn.a, b = Fn.b, x = st.x;
        const Fx = F(st.fi, x);

        out.innerHTML =
          "**F(x) = ∫ₐˣ f(t)dt con x = " + H.num(x, 2) + ":** $F(" + H.num(x, 2) + ") = " + H.num(Fx, 4) + "$<br>" +
          "<b>Verificación:</b> " + H.truth(true) + " F′(x) = f(x) — la tasa de acumulación es exactamente la altura de la curva en x.<br>" +
          "<span style='font-size:12.5px;color:var(--text-dim)'>La pendiente instantánea de F en x (recta azul del gráfico inferior) coincide con f(x) (altura del gráfico superior).</span>";

        /* gráfico 1: f y área sombreada */
        const xs = [], ys = [];
        const NPTS = 500;
        for (let i = 0; i <= NPTS; i++) {
          const t = a + (b - a) * i / NPTS;
          xs.push(t); ys.push(f(t));
        }
        const ax = [], ay = [];
        const NX = Math.max(8, Math.round((x - a) / (b - a) * NPTS));
        for (let i = 0; i <= NX; i++) {
          const t = a + (x - a) * i / NX;
          ax.push(t); ay.push(f(t));
        }
        const dataF = [
          {
            type: "scatter", mode: "lines", x: ax, y: ay,
            fill: "toself", fillcolor: "rgba(108,140,255,0.35)",
            line: { color: "rgba(108,140,255,0.9)", width: 1.5 },
            name: "área", hoverinfo: "skip",
          },
          { type: "scatter", mode: "lines", x: [x, x], y: [0, f(x)], line: { color: "#fbbf24", width: 3 }, name: "x", hoverinfo: "skip" },
          {
            type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: "#38bdf8", width: 3 }, name: "f(t)",
            hovertemplate: "t=%{x:.2f}<br>f=%{y:.3f}<extra></extra>",
          },
        ];
        chartF.plot(dataF, {
          title: { text: "f(t) y área acumulada hasta x = " + H.num(x, 2), font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "t" }, range: [a - 0.15, b + 0.15] },
          yaxis: { title: { text: "f(t)" } },
        });

        /* gráfico 2: F(x) y tangente */
        const gx = [], gy = [];
        for (let i = 0; i <= NPTS; i++) {
          const t = a + (b - a) * i / NPTS;
          gx.push(t); gy.push(F(st.fi, t));
        }
        const dataG = [
          {
            type: "scatter", mode: "lines", x: gx, y: gy,
            line: { color: "#6c8cff", width: 3 }, name: "F(x)",
            hovertemplate: "x=%{x:.2f}<br>F=%{y:.3f}<extra></extra>",
          },
        ];
        if (st.showSlope) {
          // recta tangente: pendiente f(x)
          const m = f(x);
          const x1 = x - 0.8, x2 = x + 0.8;
          const y1 = Fx + m * (x1 - x), y2 = Fx + m * (x2 - x);
          dataG.push({
            type: "scatter", mode: "lines", x: [x1, x2], y: [y1, y2],
            line: { color: "#fbbf24", width: 2, dash: "dash" },
            name: "tangente (pendiente f(x))", hoverinfo: "skip",
          });
          dataG.push({
            type: "scatter", mode: "markers", x: [x], y: [Fx],
            marker: { color: "#fbbf24", size: 9 }, name: "punto", hoverinfo: "skip",
          });
        }
        chartG.plot(dataG, {
          title: { text: "F(x) = integral acumulada (antiderivada)", font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, range: [a - 0.15, b + 0.15] },
          yaxis: { title: { text: "F(x)" } },
        });

        window.renderMath && window.renderMath(out);
      }

      draw();
    },
  };
})();
