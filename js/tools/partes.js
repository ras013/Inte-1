/* ===== tools/partes.js — Máquina de integración por partes (U5) ===== */
(function () {
  "use strict";

  window.TOOLS = window.TOOLS || {};

  /*
   * Cinco ejercicios: simple (1), logarítmica (2), tabulares (3 y 4) y cíclica (5).
   * Los pasos contienen HTML + LaTeX ($...$ / $$...$$) que se pasa por math.raw.
   * Las tabulares incluyen una tabla dinámica signo | derivadas de u | integrales de dv.
   */
  var EXERCISES = [
    {
      label: "∫ x·eˣ dx — simple",
      tex: "\\int x\\,e^{x}\\,dx",
      kind: "simple",
      solution: "(x-1)e^{x} + C",
      steps: [
        { t: "Elige u y dv (LIATE)", h: "El integrando mezcla una familia <b>algebraica</b> ($x$) y una <b>exponencial</b> ($e^x$). LIATE ordena L → I → A → T → E: la algebraica precede a la exponencial, así que $u = x$ y $dv = e^x\\,dx$." },
        { t: "Deriva e integra", h: "Deriva $u$: $du = dx$. Integra $dv$: $v = e^x$." },
        { t: "Aplica la fórmula", h: "La fórmula es $\\int u\\,dv = uv - \\int v\\,du$: $\\int x\\,e^x\\,dx = x\\,e^x - \\int e^x\\,dx$." },
        { t: "Integral restante inmediata", h: "$\\int e^x\\,dx = e^x$, así que queda $x\\,e^x - e^x$." },
        { t: "Resultado", h: "Factoriza: $x\\,e^x - e^x = e^x(x-1)$ y añade $+C$. Verifica derivando: $\\frac{d}{dx}\\left[e^x(x-1)\\right] = e^x(x-1) + e^x = x\\,e^x$ ✔." },
      ],
    },
    {
      label: "∫ x·ln(x) dx — logarítmica",
      tex: "\\int x\\ln x\\,dx",
      kind: "log",
      solution: "\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C",
      steps: [
        { t: "Elige u y dv (LIATE)", h: "Familias: <b>logarítmica</b> ($\\ln x$) y <b>algebraica</b> ($x$). La L va antes que la A en LIATE: $u = \\ln x$ y $dv = x\\,dx$." },
        { t: "Deriva e integra", h: "$du = \\frac{1}{x}\\,dx$ y $v = \\frac{x^2}{2}$." },
        { t: "Aplica la fórmula", h: "$\\int x\\ln x\\,dx = \\frac{x^2}{2}\\ln x - \\int \\frac{x^2}{2}\\cdot\\frac{1}{x}\\,dx$." },
        { t: "Simplifica el integrando restante", h: "$\\frac{x^2}{2}\\cdot\\frac{1}{x} = \\frac{x}{2}$, con lo que queda $-\\frac{1}{2}\\int x\\,dx$." },
        { t: "Integra y reúne", h: "$-\\frac{1}{2}\\cdot\\frac{x^2}{2} = -\\frac{x^2}{4}$; resultado: $\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$." },
        { t: "¿Por qué no al revés?", h: "Con $u = x$ y $dv = \\ln x\\,dx$ tendrías que <b>integrar</b> el logaritmo, que no es inmediato. LIATE lo pone como $u$ precisamente para que su derivada $1/x$ simplifique la integral." },
      ],
    },
    {
      label: "∫ x²·cos(x) dx — tabular",
      tex: "\\int x^2\\cos x\\,dx",
      kind: "tabular",
      solution: "x^2\\sin x + 2x\\cos x - 2\\sin x + C",
      table: {
        headers: ["Signo", "Derivadas de u", "Integrales de dv"],
        rows: [
          ["+", "x^2", "\\sin x"],
          ["-", "2x", "-\\cos x"],
          ["+", "2", "-\\sin x"],
        ],
        note: "La siguiente derivada de $u$ es $0$: la tabla termina aquí.",
      },
      steps: [
        { t: "Elige u y dv (LIATE)", h: "Algebraica × trigonométrica: $u = x^2$, $dv = \\cos x\\,dx$. Como el polinomio se degrada al derivar, conviene el <b>método tabular</b> en vez de repetir la fórmula tres veces." },
        { t: "Construye la tabla", h: "Signos alternados $+, -, +$; columna central con las derivadas sucesivas $x^2 \\to 2x \\to 2 \\to 0$; columna derecha con las integrales sucesivas $\\sin x \\to -\\cos x \\to -\\sin x$." },
        { t: "Ensambla los productos diagonales", h: "Multiplica en diagonal (signo × u de la fila × integral de la misma fila) y suma: <b>$+x^2\\sin x - 2x(-\\cos x) + 2(-\\sin x)$</b>." },
        { t: "Simplifica y añade +C", h: "$x^2\\sin x + 2x\\cos x - 2\\sin x + C$. La alternancia de signos es clave: con todos los signos positivos el resultado no derivaría al integrando." },
      ],
    },
    {
      label: "∫ x³·e^(2x) dx — tabular",
      tex: "\\int x^3 e^{2x}\\,dx",
      kind: "tabular",
      solution: "e^{2x}\\left(\\frac{x^3}{2} - \\frac{3x^2}{4} + \\frac{3x}{4} - \\frac{3}{8}\\right) + C",
      table: {
        headers: ["Signo", "Derivadas de u", "Integrales de dv"],
        rows: [
          ["+", "x^3", "\\frac{e^{2x}}{2}"],
          ["-", "3x^2", "\\frac{e^{2x}}{4}"],
          ["+", "6x", "\\frac{e^{2x}}{8}"],
          ["-", "6", "\\frac{e^{2x}}{16}"],
        ],
        note: "La siguiente derivada de $u$ es $0$: la tabla termina aquí.",
      },
      steps: [
        { t: "Elige u y dv (LIATE)", h: "$u = x^3$ (algebraica), $dv = e^{2x}\\,dx$ (exponencial). El polinomio se agota al derivar: tres aplicaciones de partes se condensan en una sola tabla." },
        { t: "Construye la tabla", h: "Derivadas sucesivas $x^3 \\to 3x^2 \\to 6x \\to 6 \\to 0$; integrales sucesivas $\\frac{e^{2x}}{2} \\to \\frac{e^{2x}}{4} \\to \\frac{e^{2x}}{8} \\to \\frac{e^{2x}}{16}$; signos $+, -, +, -$." },
        { t: "Ensambla los productos diagonales", h: "Suma los productos en diagonal: <b>$+x^3\\frac{e^{2x}}{2} - 3x^2\\frac{e^{2x}}{4} + 6x\\frac{e^{2x}}{8} - 6\\frac{e^{2x}}{16}$</b>." },
        { t: "Simplifica los coeficientes", h: "$\\frac{e^{2x}}{2}x^3 - \\frac{3e^{2x}}{4}x^2 + \\frac{3e^{2x}}{4}x - \\frac{3e^{2x}}{8}$, y añade $+C$." },
      ],
    },
    {
      label: "∫ eˣ·sin(x) dx — cíclica",
      tex: "\\int e^{x}\\sin x\\,dx",
      kind: "ciclica",
      solution: "\\frac{e^x}{2}(\\sin x - \\cos x) + C",
      steps: [
        { t: "Elige u y dv (LIATE)", h: "Trigonómica antes que exponencial: $u = \\sin x$, $dv = e^x\\,dx$; entonces $du = \\cos x\\,dx$ y $v = e^x$." },
        { t: "Primera aplicación", h: "Llama $I$ a la integral incógnita: $I = \\int e^x\\sin x\\,dx = e^x\\sin x - \\int e^x\\cos x\\,dx$." },
        { t: "Segunda aplicación", h: "A la integral restante: $u = \\cos x$, $dv = e^x\\,dx$, $du = -\\sin x\\,dx$, $v = e^x$: $\\int e^x\\cos x\\,dx = e^x\\cos x + \\int e^x\\sin x\\,dx$." },
        { t: "La integral reaparece", h: "Sustituye de vuelta: $I = e^x\\sin x - e^x\\cos x - \\int e^x\\sin x\\,dx = e^x(\\sin x - \\cos x) - I$. ¡La integral original reapareció con coeficiente $-1$!" },
        { t: "Salto al álgebra", h: "Trata $I$ como una incógnita: suma $I$ a ambos lados, $I + I = e^x(\\sin x - \\cos x)$, es decir $2I = e^x(\\sin x - \\cos x)$." },
        { t: "Despeja", h: "$I = \\frac{e^x}{2}(\\sin x - \\cos x) + C$. Verifica derivando: $\\frac{d}{dx}\\left[\\frac{e^x}{2}(\\sin x - \\cos x)\\right] = e^x\\sin x$ ✔. Sin el despeje, el proceso iteraría sin fin." },
      ],
    },
  ];

  /* ---------- tabla tabular dinámica ---------- */

  function tabularHtml(tbl) {
    var h = '<div class="tbl-wrapper"><table class="tbl"><thead><tr>';
    tbl.headers.forEach(function (hd) { h += "<th>" + hd + "</th>"; });
    h += "</tr></thead><tbody>";
    tbl.rows.forEach(function (r) {
      h += "<tr><td><b>" + r[0] + "</b></td><td>$" + r[1] + "$</td><td>$" + r[2] + "$</td></tr>";
    });
    h += "</tbody></table></div>";
    if (tbl.note) h += '<div style="font-size:13px;color:var(--text-dim);margin-top:-6px">' + math.raw(tbl.note) + "</div>";
    return h;
  }

  // Inserta la tabla en el paso "Construye la tabla" de cada ejercicio tabular.
  EXERCISES.forEach(function (e) {
    if (e.table) e.steps[1].h += tabularHtml(e.table);
  });

  /* ---------- tarjeta LIATE ---------- */

  function liateCard() {
    var items = [
      { k: "L", name: "Logarítmicas", ex: "$\\ln x$, $\\log_a x$", why: "No tienen antiderivada inmediata directa, pero su derivada $1/x$ es algebraica: al derivarlas (hacerlas $u$) la dificultad se transfiere." },
      { k: "I", name: "Inversas trigonométricas", ex: "$\\arcsin x$, $\\arctan x$", why: "Igual que las logarítmicas: su derivada es algebraica o un cociente sencillo." },
      { k: "A", name: "Algebraicas", ex: "$x$, $x^2$, $\\sqrt{x}$", why: "Derivarlas reduce el grado; en productos con trigonométricas o exponenciales van como $u$." },
      { k: "T", name: "Trigonométricas", ex: "$\\sin x$, $\\cos 3x$", why: "Se integran sin degradarse; pueden ocupar el lugar de $dv$." },
      { k: "E", name: "Exponenciales", ex: "$e^x$, $2^x$", why: "Se integran sin cambiar de forma; ideales para $dv$." },
    ];
    var h = '<div style="font-weight:700;margin-bottom:8px">Jerarquía LIATE — elige como u la familia que aparezca <u>más arriba</u> en el integrando:</div>';
    items.forEach(function (it, i) {
      h += '<div style="display:flex;gap:12px;align-items:flex-start;padding:9px 12px;margin:5px 0;border-radius:9px;border:1px solid var(--border);background:' +
        (i === 0 ? "rgba(52,211,153,0.10)" : "var(--card)") + '">' +
        '<span style="flex:0 0 30px;height:30px;display:grid;place-items:center;border-radius:8px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-2))">' + it.k + "</span>" +
        '<div style="flex:1"><div style="font-weight:700">' + it.name + ' <span style="font-weight:400;color:var(--text-dim)">' + math.raw(it.ex) + "</span></div>" +
        '<div style="font-size:13px;color:var(--text-dim)">' + math.raw(it.why) + "</div></div>" +
        '<span style="flex:0 0 auto;font-size:11px;color:var(--text-dim)">prioridad ' + (i + 1) + "</span></div>";
    });
    h += '<div style="font-size:13px;color:var(--text-dim);margin-top:8px">Regla de oro: <b>la fórmula no elimina la integral, la transforma</b>. Si la nueva integral $\\int v\\,du$ resulta más complicada que la original, la elección de $u$ fue incorrecta.</div>';
    return math.raw(h);
  }

  /* ---------- herramienta ---------- */

  window.TOOLS["partes"] = {
    title: "Máquina de integración por partes",
    description: "Paso a paso: elige u y dv según LIATE, aplica la fórmula, usa el método tabular y despeja las integrales cíclicas.",
    icon: "🧩",

    mount: function (host, cfg) {
      var st = { fi: 0, revealed: 0 };

      /* --- controles --- */
      var controls = H.el('<div class="tool-controls"></div>');
      var sel = H.select("Ejercicio", EXERCISES.map(function (e, i) { return { label: e.label, value: String(i) }; }), "0", function (v) {
        st.fi = parseInt(v, 10);
        resetSteps();
      });
      controls.appendChild(sel.el);

      var stepBtns = H.el('<div class="ctl" style="flex-direction:row;flex-wrap:wrap;gap:6px;align-items:center"><label style="white-space:nowrap">Pasos:</label></div>');
      controls.appendChild(stepBtns);

      controls.appendChild(H.btn("Mostrar todo", showAll, ""));
      controls.appendChild(H.btn("Reiniciar", resetSteps, "ghost"));
      host.appendChild(controls);

      /* --- ficha del ejercicio --- */
      var ficha = H.resultPanel("");
      host.appendChild(ficha);

      /* --- pasos revelados --- */
      var stepsOut = H.resultPanel("");
      host.appendChild(stepsOut);

      /* --- tarjeta LIATE --- */
      var liate = H.el('<div class="callout note" style="margin-top:16px"><div class="callout-title">📋 Tarjeta LIATE — cómo elegir u y dv</div></div>');
      liate.insertAdjacentHTML("beforeend", liateCard());
      host.appendChild(liate);

      /* --- lógica --- */

      function buildStepButtons() {
        var old = stepBtns.querySelectorAll("button");
        for (var i = 0; i < old.length; i++) old[i].remove();
        EXERCISES[st.fi].steps.forEach(function (s, i) {
          stepBtns.appendChild(H.btn("Paso " + (i + 1), function () { reveal(i); }, "small"));
        });
      }

      function reveal(upTo) {
        if (upTo + 1 > st.revealed) st.revealed = upTo + 1;
        render();
      }

      function showAll() {
        st.revealed = EXERCISES[st.fi].steps.length;
        render();
      }

      function resetSteps() {
        st.revealed = 0;
        buildStepButtons();
        render();
      }

      function render() {
        var e = EXERCISES[st.fi];
        ficha.innerHTML = '<div style="font-size:14.5px"><b>Ejercicio:</b> ' + math.raw("$$" + e.tex + "$$") + "</div>";
        var h = "";
        for (var i = 0; i < e.steps.length; i++) {
          if (i >= st.revealed) break;
          h += '<div class="tool-out" style="margin:8px 0">' +
            '<div style="font-weight:700;color:var(--accent-2);font-size:13px;margin-bottom:4px">Paso ' + (i + 1) + " — " + e.steps[i].t + "</div>" +
            math.raw(e.steps[i].h) + "</div>";
        }
        if (st.revealed >= e.steps.length) {
          h += '<div class="tool-out" style="border-color:rgba(52,211,153,0.4);border-style:solid">' +
            '<div style="font-weight:700;color:var(--ok);margin-bottom:4px">✔ Solución completa</div>' +
            math.raw("$$" + e.tex + " = " + e.solution + "$$") + "</div>";
        }
        stepsOut.innerHTML = h;
        window.renderMath && window.renderMath(ficha);
        window.renderMath && window.renderMath(stepsOut);
      }

      /* --- arranque --- */
      resetSteps();
      window.renderMath && window.renderMath(host);
    },
  };
})();
