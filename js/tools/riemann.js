/* ===== tools/riemann.js — Simulador de sumas de Riemann ===== */
(function () {
  "use strict";
  const FUNCS = [
    { label: "f(x) = x²", f: function (x) { return x * x; }, tex: "x^2", a: 0, b: 2 },
    { label: "f(x) = x³", f: function (x) { return x * x * x; }, tex: "x^3", a: 0, b: 2 },
    { label: "f(x) = sin(x)", f: function (x) { return Math.sin(x); }, tex: "\\sin x", a: 0, b: 3.141592653589793 },
    { label: "f(x) = e^x", f: function (x) { return Math.exp(x); }, tex: "e^{x}", a: 0, b: 2 },
    { label: "f(x) = √x", f: function (x) { return Math.sqrt(x); }, tex: "\\sqrt{x}", a: 0, b: 4 },
    { label: "f(x) = 1/x", f: function (x) { return 1 / x; }, tex: "\\frac{1}{x}", a: 1, b: 5 },
    { label: "f(x) = cos(x)", f: function (x) { return Math.cos(x); }, tex: "\\cos x", a: 0, b: 3.141592653589793 },
  ];

  function riemannSum(f, a, b, n, method) {
    const dx = (b - a) / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      let xi;
      if (method === "left") xi = a + i * dx;
      else if (method === "right") xi = a + (i + 1) * dx;
      else xi = a + (i + 0.5) * dx;
      s += f(xi) * dx;
    }
    return s;
  }

  window.TOOLS = window.TOOLS || {};
  window.TOOLS["riemann"] = {
    title: "Simulador de sumas de Riemann",
    description: "Ajusta la función, el método y el número de rectángulos para ver la convergencia al valor exacto.",
    icon: "📐",

    mount: function (host, cfg) {
      /* --- estado --- */
      const st = {
        fi: 0, method: "mid", n: 8, showRect: true,
      };

      /* --- controles --- */
      const controls = H.el('<div class="tool-controls"></div>');
      const selFunc = H.select("Función", FUNCS.map(function (f, i) { return { label: f.label, value: String(i) }; }), "0", function (v) {
        st.fi = parseInt(v, 10);
        draw();
      });
      const selMethod = H.select("Método", [
        { label: "Punto medio (Mₙ)", value: "mid" },
        { label: "Izquierda (Lₙ)", value: "left" },
        { label: "Derecha (Rₙ)", value: "right" },
      ], "mid", function (v) { st.method = v; draw(); });
      const slN = H.slider("Número de rectángulos n", 1, 128, 1, 8, function (v) { st.n = v; draw(); });

      const chkRect = H.el('<label class="ctl" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" checked> Mostrar rectángulos</label>');
      chkRect.querySelector("input").addEventListener("change", function (e) { st.showRect = e.target.checked; draw(); });

      const btnAnimate = H.btn("▶ Animar n → 64", function () { animate(); }, "primary");

      controls.appendChild(selFunc.el);
      controls.appendChild(selMethod.el);
      controls.appendChild(slN.el);
      controls.appendChild(chkRect);
      controls.appendChild(btnAnimate);
      host.appendChild(controls);

      /* --- salida --- */
      const out = H.resultPanel("");
      host.appendChild(out);

      /* --- gráfico --- */
      const chart = H.chart();
      host.appendChild(chart.el);

      /* --- cálculo de referencia (geométrico exacto) --- */
      function exactValue(fi) {
        const F = FUNCS[fi];
        if (F.tex === "x^2") { const b = FUNCS[fi].b; return Math.pow(b, 3) / 3; }
        if (F.tex === "x^3") { const b = FUNCS[fi].b; return Math.pow(b, 4) / 4; }
        if (F.tex === "\\sin x") return 2;
        if (F.tex === "e^{x}") return Math.exp(2) - 1;
        if (F.tex === "\\sqrt{x}") return (2 / 3) * Math.pow(4, 1.5);
        if (F.tex === "\\frac{1}{x}") return Math.log(5);
        if (F.tex === "\\cos x") return 0;
        return NaN;
      }

      function draw() {
        const F = FUNCS[st.fi];
        const a = F.a, b = F.b, f = F.f, n = st.n, method = st.method;
        const dx = (b - a) / n;
        const exact = exactValue(st.fi);
        const approx = riemannSum(f, a, b, n, method);
        const methodName = { mid: "Punto medio", left: "Izquierda", right: "Derecha" }[method];
        const sym = { mid: "M", left: "L", right: "R" }[method];

        out.innerHTML =
          '<b>' + methodName + " con n = " + n + ":</b> $S_{" + n + "} = " + Math.round(approx * 10000) / 10000 + "$<br>" +
          "Valor exacto: $\\int_{" + a + "}^{" + b + "} " + F.tex + "\\,dx = " + Math.round(exact * 10000) / 10000 + "$<br>" +
          "<b>Error:</b> " + H.truth(Math.abs(approx - exact) < 1e-9) + " (diferencia = " + H.num(Math.abs(approx - exact), 6) + ")" +
          "<br><span style='font-size:12.5px;color:var(--text-dim)'>Interpretación: " +
          (method === "mid" ? "Mₙ compensa los errores de ambos extremos y suele converger más rápido." :
            method === "left" ? "Lₙ subestima si f es creciente y sobrestima si es decreciente." :
              "Rₙ sobrestima si f es creciente y subestima si es decreciente.") + "</span>";

        /* datos */
        const xs = [], ys = [];
        const NPTS = 400;
        for (let i = 0; i <= NPTS; i++) {
          const x = a + (b - a) * i / NPTS;
          xs.push(x); ys.push(f(x));
        }
        const data = [];
        if (st.showRect && n <= 200) {
          const rx = [], ry = [];
          for (let i = 0; i < n; i++) {
            const x0 = a + i * dx;
            let xi;
            if (method === "left") xi = x0;
            else if (method === "right") xi = x0 + dx;
            else xi = x0 + dx / 2;
            rx.push(x0, x0 + dx, x0 + dx, x0);
            ry.push(0, 0, f(xi), f(xi));
          }
          data.push({
            type: "scatter", mode: "lines", x: rx, y: ry,
            fill: "toself", fillcolor: "rgba(108,140,255,0.22)",
            line: { color: "rgba(108,140,255,0.9)", width: 1.2 },
            name: "Rectángulos", hoverinfo: "skip",
          });
        }
        data.push({
          type: "scatter", mode: "lines", x: xs, y: ys,
          line: { color: "#38bdf8", width: 3 },
          name: "f(x)", hovertemplate: "x=%{x:.3f}<br>f=%{y:.3f}<extra></extra>",
        });
        // línea y=0
        data.push({
          type: "scatter", mode: "lines", x: [a, b], y: [0, 0],
          line: { color: "#3a4270", width: 1 }, name: "eje x", hoverinfo: "skip", showlegend: false,
        });

        chart.plot(data, {
          title: { text: "f(x) = " + F.label.replace("f(x) = ", "") + " en [" + a + ", " + b + "] — " + methodName + " con n = " + n, font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, zeroline: false },
          yaxis: { title: { text: "y" }, zeroline: true },
        });
        window.renderMath && window.renderMath(out);
      }

      function animate() {
        let m = 1;
        const timer = setInterval(function () {
          st.n = m;
          slN.set(m);
          if (m >= 64) { clearInterval(timer); }
          m *= 2;
        }, 260);
      }

      draw();
    },
  };
})();
