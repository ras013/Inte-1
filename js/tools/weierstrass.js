/* ===== tools/weierstrass.js — Sustitución universal t = tan(x/2) ===== */
(function () {
  "use strict";

  /* ---- evaluación numérica de las identidades ---- */
  function tOf(x) { return Math.tan(x / 2); }
  function sinViaT(x) {
    const t = Math.tan(x / 2);
    return (2 * t) / (1 + t * t);
  }
  function cosViaT(x) {
    const t = Math.tan(x / 2);
    return (1 - t * t) / (1 + t * t);
  }

  /* ---- Simpson: verificación numérica de la integral definida ---- */
  function simpson(f, a, b, n) {
    if (n % 2 !== 0) n += 1;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      s += f(a + i * h) * (i % 2 === 1 ? 4 : 2);
    }
    return (s * h) / 3;
  }

  /* ---- ejercicios resueltos paso a paso ---- */
  const EXERCISES = [
    {
      title: "Ejemplo 1 — ∫ dx/(2+cos x)",
      statement: "Calcula $\\int \\frac{dx}{2+\\cos x}$ con la sustitución de Weierstrass.",
      steps: [
        "Declara el cambio $t = \\tan(x/2)$; su inversa es $x = 2\\arctan t$ y el diferencial $dx = \\dfrac{2\\,dt}{1+t^2}$.",
        "Reescribe el coseno: $\\cos x = \\dfrac{1-t^2}{1+t^2}$. Sustituye: $$\\int \\frac{dx}{2+\\cos x} = \\int \\frac{\\frac{2\\,dt}{1+t^2}}{2 + \\frac{1-t^2}{1+t^2}}$$",
        "Simplifica el denominador: $2 + \\dfrac{1-t^2}{1+t^2} = \\dfrac{2(1+t^2)+1-t^2}{1+t^2} = \\dfrac{3+t^2}{1+t^2}$.",
        "La integral se reduce a $\\int \\dfrac{2\\,dt}{3+t^2} = 2\\int \\dfrac{dt}{t^2+(\\sqrt{3})^2}$: lista para el arco tangente.",
        "Integra con la fórmula del arco tangente: $2 \\cdot \\dfrac{1}{\\sqrt{3}}\\arctan\\left(\\dfrac{t}{\\sqrt{3}}\\right) + C$.",
        "Regresa a la variable original sustituyendo $t = \\tan(x/2)$:",
      ],
      answer: "$$\\int \\frac{dx}{2+\\cos x} = \\frac{2}{\\sqrt{3}}\\arctan\\left(\\frac{\\tan(x/2)}{\\sqrt{3}}\\right) + C$$",
      note: "Todo el truco fue convertir el integrando en $2/(3+t^2)$: una función racional trivial que se integra con arco tangente."
    },
    {
      title: "Ejemplo 2 — ∫ dx/(1+sin x)",
      statement: "Calcula $\\int \\frac{dx}{1+\\sin x}$.",
      steps: [
        "Cambio $t = \\tan(x/2)$: $\\sin x = \\dfrac{2t}{1+t^2}$ y $dx = \\dfrac{2\\,dt}{1+t^2}$.",
        "Sustituye: $$\\int \\frac{dx}{1+\\sin x} = \\int \\frac{\\frac{2\\,dt}{1+t^2}}{1 + \\frac{2t}{1+t^2}}$$",
        "Simplifica el denominador: $1 + \\dfrac{2t}{1+t^2} = \\dfrac{1+t^2+2t}{1+t^2} = \\dfrac{(1+t)^2}{1+t^2}$.",
        "Queda una potencia inmediata: $\\int \\dfrac{2\\,dt}{(1+t)^2} = 2\\int (1+t)^{-2}\\,dt$.",
        "Integra con la regla de potencias: $-\\dfrac{2}{1+t} + C$.",
        "Regresa a la variable original con $t = \\tan(x/2)$:",
      ],
      answer: "$$\\int \\frac{dx}{1+\\sin x} = -\\frac{2}{1+\\tan(x/2)} + C$$",
      note: "El denominador $(1+t)^2$ es un cuadrado perfecto: Weierstrass convierte una integral “imposible” en una potencia inmediata."
    },
    {
      title: "Ejemplo 3 — ∫₀^(π/2) dx/(2+cos x) (definida)",
      statement: "Calcula $\\int_0^{\\pi/2} \\frac{dx}{2+\\cos x}$ recalibrando los límites.",
      steps: [
        "Como en el Ejemplo 1, el cambio $t = \\tan(x/2)$ reduce el integrando a $\\dfrac{2}{3+t^2}$.",
        "Recalibra los límites (¡nunca evalúes en $t$ con los límites originales de $x$!): $x=0 \\Rightarrow t=\\tan 0 = 0$ y $x=\\dfrac{\\pi}{2} \\Rightarrow t=\\tan\\dfrac{\\pi}{4} = 1$.",
        "Nueva integral definida en $t$: $\\int_0^1 \\dfrac{2\\,dt}{3+t^2}$.",
        "Antiderivada: $\\left[\\dfrac{2}{\\sqrt{3}}\\arctan\\left(\\dfrac{t}{\\sqrt{3}}\\right)\\right]_0^1$.",
        "Evalúa en los límites recalibrados: $\\dfrac{2}{\\sqrt{3}}\\left(\\arctan\\dfrac{1}{\\sqrt{3}} - \\arctan 0\\right) = \\dfrac{2}{\\sqrt{3}}\\cdot\\dfrac{\\pi}{6}$.",
      ],
      answer: "$$\\int_0^{\\pi/2} \\frac{dx}{2+\\cos x} = \\frac{\\pi}{3\\sqrt{3}} \\approx 0.6046$$",
      note: "La verificación numérica con Simpson (panel inferior) confirma el valor dentro de $10^{-3}$."
    }
  ];

  window.TOOLS = window.TOOLS || {};
  window.TOOLS["weierstrass"] = {
    title: "La magia de t = tan(x/2)",
    description: "Aplica la sustitución universal de Weierstrass: toda función racional de senos y cosenos se convierte en una función racional de t.",
    icon: "🎩",

    mount: function (host, cfg) {
      const st = { x: 1.2, ex: 0, revealed: 0 };

      /* --- cabecera --- */
      host.appendChild(H.el('<p style="font-size:13px;color:var(--text-dim);margin:0 0 8px">' +
        math.toHtml("La sustitución universal: con $t = \\tan(x/2)$, las expresiones $\\sin x = \\frac{2t}{1+t^2}$, $\\cos x = \\frac{1-t^2}{1+t^2}$ y $dx = \\frac{2\\,dt}{1+t^2}$ son todas racionales en $t$.") +
        "</p>"));

      /* --- introducción interactiva --- */
      const introControls = H.el('<div class="tool-controls"></div>');
      const slX = H.slider("x (radianes)", 0, Math.PI, 0.01, 1.2, function (v) { st.x = v; drawIntro(); });
      introControls.appendChild(slX.el);
      host.appendChild(introControls);

      const introOut = H.resultPanel("");
      host.appendChild(introOut);

      const introChart = H.chart();
      host.appendChild(introChart.el);

      /* --- ejercicios resueltos --- */
      host.appendChild(H.el('<h3 style="margin:26px 0 4px">Ejercicios resueltos paso a paso</h3>'));
      const exControls = H.el('<div class="tool-controls"></div>');
      const selEx = H.select("Ejercicio",
        EXERCISES.map(function (e, i) { return { label: e.title, value: String(i) }; }),
        "0",
        function (v) {
          st.ex = parseInt(v, 10);
          st.revealed = 0;
          buildEx();
        });
      exControls.appendChild(selEx.el);
      host.appendChild(exControls);

      const exOut = H.resultPanel("");
      host.appendChild(exOut);

      /* --- verificación numérica --- */
      const verOut = H.resultPanel("");
      host.appendChild(verOut);

      /* --- identidad clave --- */
      host.appendChild(H.panel("La identidad clave (memorízala)",
        math.raw("$$t = \\tan\\frac{x}{2}, \\qquad \\sin x = \\frac{2t}{1+t^2}, \\qquad \\cos x = \\frac{1-t^2}{1+t^2}, \\qquad dx = \\frac{2\\,dt}{1+t^2}$$") +
        "<div style='font-size:12.5px;color:var(--text-dim)'>Con este único cambio, seno, coseno y diferencial quedan racionales en t: la integral trigonométrica se vuelve algebraica.</div>",
        "tip"));

      /* --- construcción de los ejercicios --- */
      function buildEx() {
        const ex = EXERCISES[st.ex];
        exOut.innerHTML = "";
        const panel = H.el('<div></div>');
        panel.appendChild(H.el('<div style="margin-bottom:8px"><b>' + ex.title + "</b></div>"));

        const statement = H.el('<div style="margin-bottom:10px"></div>');
        statement.innerHTML = math.toHtml(ex.statement);
        panel.appendChild(statement);

        const btns = H.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"></div>');
        const stepsDiv = H.el('<ol style="margin:0 0 10px;padding-left:22px"></ol>');

        ex.steps.forEach(function (s, i) {
          const li = H.el('<li style="display:none;margin:5px 0"></li>');
          li.innerHTML = math.toHtml(s);
          stepsDiv.appendChild(li);
          btns.appendChild(H.btn("Paso " + (i + 1), function () { reveal(i + 1); }));
        });

        btns.appendChild(H.btn("Solución completa", function () { reveal(999); }, "primary"));
        btns.appendChild(H.btn("Reiniciar", function () { st.revealed = 0; buildEx(); }, "ghost"));

        const sol = H.el('<div style="display:none;margin-top:4px"></div>');

        panel.appendChild(btns);
        panel.appendChild(stepsDiv);
        panel.appendChild(sol);
        exOut.appendChild(panel);

        function reveal(k) {
          st.revealed = Math.max(st.revealed, k);
          const lis = stepsDiv.querySelectorAll("li");
          for (let i = 0; i < lis.length; i++) {
            lis[i].style.display = i < st.revealed ? "" : "none";
          }
          if (st.revealed >= ex.steps.length) {
            sol.style.display = "";
            sol.innerHTML = math.toHtml(ex.answer) +
              (ex.note ? '<div style="margin-top:8px;font-size:12.5px;color:var(--text-dim)"><b>Observación:</b> ' + math.toHtml(ex.note) + "</div>" : "");
          }
          window.renderMath && window.renderMath(exOut);
        }
        reveal(st.revealed);
      }

      /* --- introducción: valores en vivo + gráfico --- */
      function drawIntro() {
        const x = st.x;
        const t = tOf(x), s = sinViaT(x), c = cosViaT(x);
        introOut.innerHTML =
          "<b>En vivo, con " + math.toHtml("$x = " + H.num(x, 3) + "$") + ":</b><br>" +
          math.toHtml("$t = \\tan(x/2) = " + H.num(t, 4) + "$") + "<br>" +
          math.toHtml("$\\sin x = \\dfrac{2t}{1+t^2} = " + H.num(s, 4) + "$") + "<br>" +
          math.toHtml("$\\cos x = \\dfrac{1-t^2}{1+t^2} = " + H.num(c, 4) + "$") + "<br>" +
          "<span style='font-size:12.5px;color:var(--text-dim)'>Mueve el deslizador: las expresiones en t coinciden exactamente con sin x y cos x.</span>";
        window.renderMath && window.renderMath(introOut);

        const NPTS = 300;
        const xs = [], ySin = [], ySinT = [], yCos = [], yCosT = [];
        for (let i = 0; i <= NPTS; i++) {
          const xv = Math.PI * i / NPTS;
          xs.push(xv);
          ySin.push(Math.sin(xv));
          ySinT.push(sinViaT(xv));
          yCos.push(Math.cos(xv));
          yCosT.push(cosViaT(xv));
        }
        const data = [
          { type: "scatter", mode: "lines", x: xs, y: ySin, line: { color: "#38bdf8", width: 3 }, name: "sin x", opacity: 0.4, hovertemplate: "sin x = %{y:.4f}<extra></extra>" },
          { type: "scatter", mode: "lines", x: xs, y: ySinT, line: { color: "#fbbf24", width: 2.2, dash: "dot" }, name: "2t/(1+t²)", hovertemplate: "2t/(1+t²) = %{y:.4f}<extra></extra>" },
          { type: "scatter", mode: "lines", x: xs, y: yCos, line: { color: "#34d399", width: 3 }, name: "cos x", opacity: 0.4, hovertemplate: "cos x = %{y:.4f}<extra></extra>" },
          { type: "scatter", mode: "lines", x: xs, y: yCosT, line: { color: "#c084fc", width: 2.2, dash: "dot" }, name: "(1−t²)/(1+t²)", hovertemplate: "(1−t²)/(1+t²) = %{y:.4f}<extra></extra>" },
          { type: "scatter", mode: "lines", x: [x, x], y: [-1.3, 1.3], line: { color: "#3a4270", width: 1.5, dash: "dash" }, name: "x actual", hoverinfo: "skip", showlegend: false },
        ];
        introChart.plot(data, {
          title: { text: "Las curvas punteadas (expresiones en t) se superponen exactamente sobre sin x y cos x", font: { color: "#e8eaf6", size: 13 } },
          showlegend: true,
          xaxis: { title: { text: "x (rad)" }, range: [0, Math.PI], zeroline: false },
          yaxis: { title: { text: "y" }, range: [-1.3, 1.3], zeroline: true },
        });
      }

      /* --- verificación numérica con Simpson --- */
      function drawVerifier() {
        const sim = simpson(function (t) { return 2 / (3 + t * t); }, 0, 1, 64);
        const theo = Math.PI / (3 * Math.sqrt(3));
        const ok = Math.abs(sim - theo) < 1e-3;
        verOut.innerHTML =
          "<b>Verificación numérica (Ejemplo 3)</b> — Simpson con n = 64 sobre " +
          math.toHtml("$\\int_0^1 \\frac{2\\,dt}{3+t^2}$") + ": " +
          math.toHtml("$S_{64} = " + H.num(sim, 6) + "$") + "<br>" +
          "Valor teórico: " + math.toHtml("$\\frac{\\pi}{3\\sqrt{3}} \\approx " + H.num(theo, 6) + "$") + "<br>" +
          "Coincidencia dentro de " + math.toHtml("$10^{-3}$") + ": ";
        verOut.appendChild(H.truth(ok));
        window.renderMath && window.renderMath(verOut);
      }

      /* --- inicialización --- */
      drawIntro();
      buildEx();
      drawVerifier();
      window.renderMath && window.renderMath(host);
    },
  };
})();
