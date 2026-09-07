/* ===== tools/sustitucion.js — Laboratorio de integración por sustitución (U4) ===== */
(function () {
  "use strict";

  window.TOOLS = window.TOOLS || {};

  /*
   * Ejercicios precargados. Cada uno trae: el integrando (tex), la función f(x)
   * para el gráfico, el rango de dibujo, y la secuencia de pasos revelables.
   * Los pasos contienen HTML + LaTeX ($...$ / $$...$$) que se pasa por math.raw.
   */
  var EXERCISES = [
    {
      label: "∫ 2x·e^(x²) dx",
      tex: "\\int 2x\\,e^{x^2}\\,dx",
      f: function (x) { return 2 * x * Math.exp(x * x); },
      range: [-1.6, 1.6],
      plotTitle: "Integrando f(x) = 2x·e^(x²)",
      solution: "e^{x^2} + C",
      steps: [
        { t: "Detecta la composición", h: "El integrando es una función compuesta: la interna es $u = x^2$ y su derivada $2x$ multiplica al exponencial. Es la regla de la cadena en reversa: $\\frac{d}{dx}e^{x^2} = 2x\\,e^{x^2}$." },
        { t: "Elige u y calcula du", h: "Toma $u = x^2$ y deriva: $du = 2x\\,dx$. El diferencial $2x\\,dx$ aparece <b>exactamente</b> en el integrando: no hace falta ningún ajuste de constantes." },
        { t: "Sustituye", h: "La integral se contrae a una forma inmediata: $\\int 2x\\,e^{x^2}\\,dx = \\int e^u\\,du$." },
        { t: "Integra en u", h: "Usa la tabla: $\\int e^u\\,du = e^u + C$." },
        { t: "Deshaz el cambio", h: "Vuelve a la variable original: $u = x^2$. El resultado se entrega en $x$, nunca en $u$." },
      ],
    },
    {
      label: "∫ cos(3x) dx",
      tex: "\\int \\cos(3x)\\,dx",
      f: function (x) { return Math.cos(3 * x); },
      range: [-3.5, 3.5],
      plotTitle: "Integrando f(x) = cos(3x)",
      solution: "\\frac{1}{3}\\sin(3x) + C",
      steps: [
        { t: "Composición lineal", h: "La función interna es $u = 3x$; su derivada es $du = 3\\,dx$, que es una constante por $dx$." },
        { t: "Ajuste por constante", h: "El integrando solo aporta $dx$, así que despeja $dx = \\frac{1}{3}\\,du$. El factor $\\frac{1}{3}$ sale fuera de la integral." },
        { t: "Sustituye", h: "$\\int \\cos(3x)\\,dx = \\frac{1}{3}\\int \\cos u\\,du$." },
        { t: "Integra en u", h: "$\\frac{1}{3}\\sin u + C$." },
        { t: "Deshaz el cambio", h: "$\\frac{1}{3}\\sin(3x) + C$. Verifica derivando con la regla de la cadena: $\\frac{1}{3}\\cdot 3\\cos(3x) = \\cos(3x)$ ✔." },
      ],
    },
    {
      label: "∫ x²(x³+5)⁷ dx",
      tex: "\\int x^2(x^3+5)^7\\,dx",
      f: function (x) { return x * x * Math.pow(x * x * x + 5, 7); },
      range: [-1, 1],
      plotTitle: "Integrando f(x) = x²·(x³+5)⁷",
      solution: "\\frac{(x^3+5)^8}{24} + C",
      steps: [
        { t: "Identifica la composición", h: "La función interna es $u = x^3+5$; su derivada $3x^2$ es <b>proporcional</b> al factor $x^2$ del integrando (falta el factor 3)." },
        { t: "Calcula du y despeja", h: "$du = 3x^2\\,dx$, de donde $x^2\\,dx = \\frac{1}{3}\\,du$." },
        { t: "Sustituye", h: "$\\int x^2(x^3+5)^7\\,dx = \\frac{1}{3}\\int u^7\\,du$." },
        { t: "Integra en u", h: "Regla de la potencia: $\\frac{1}{3}\\cdot\\frac{u^8}{8} = \\frac{u^8}{24}$." },
        { t: "Deshaz el cambio", h: "$\\frac{(x^3+5)^8}{24} + C$. El $\\frac{1}{3}$ es la constante de ajuste: sin ella, la derivada del resultado no reproduciría el integrando." },
      ],
    },
    {
      label: "∫ dx/(x²+6x+13)",
      tex: "\\int \\frac{1}{x^2+6x+13}\\,dx",
      f: function (x) { return 1 / (x * x + 6 * x + 13); },
      range: [-8, 2],
      plotTitle: "Integrando f(x) = 1/(x²+6x+13)",
      solution: "\\frac{1}{2}\\arctan\\left(\\frac{x+3}{2}\\right) + C",
      steps: [
        { t: "Completa el cuadrado (I)", h: "El trinomio no tiene raíces reales ($b^2-4ac = 36-52 < 0$). Suma y resta $(6/2)^2 = 9$: $x^2+6x+13 = x^2+6x+9-9+13$." },
        { t: "Completa el cuadrado (II)", h: "Agrupa el cuadrado perfecto y la constante: $x^2+6x+9 = (x+3)^2$ y $-9+13 = 4$. Queda $(x+3)^2+4 = (x+3)^2+2^2$." },
        { t: "Sustitución lineal", h: "Toma $u = x+3$, con $du = dx$ (ajuste trivial): $\\int\\frac{dx}{x^2+6x+13} = \\int\\frac{du}{u^2+2^2}$." },
        { t: "Forma inmediata arctan", h: "Aplica $\\int\\frac{du}{u^2+a^2} = \\frac{1}{a}\\arctan\\frac{u}{a}$ con $a = 2$: $\\frac{1}{2}\\arctan\\frac{u}{2} + C$." },
        { t: "Deshaz el cambio", h: "$\\frac{1}{2}\\arctan\\left(\\frac{x+3}{2}\\right) + C$." },
      ],
    },
    {
      label: "∫ x/(x²+1) dx",
      tex: "\\int \\frac{x}{x^2+1}\\,dx",
      f: function (x) { return x / (x * x + 1); },
      range: [-4, 4],
      plotTitle: "Integrando f(x) = x/(x²+1)",
      solution: "\\frac{1}{2}\\ln(x^2+1) + C",
      steps: [
        { t: "Observa la derivada del denominador", h: "El numerador $x$ es proporcional a la derivada del denominador: $(x^2+1)' = 2x$." },
        { t: "Elige u", h: "Toma $u = x^2+1$; entonces $du = 2x\\,dx$ y $x\\,dx = \\frac{1}{2}\\,du$." },
        { t: "Sustituye", h: "$\\int\\frac{x}{x^2+1}\\,dx = \\frac{1}{2}\\int\\frac{du}{u}$." },
        { t: "Integra en u", h: "$\\frac{1}{2}\\ln|u| + C$." },
        { t: "Deshaz el cambio", h: "$\\frac{1}{2}\\ln|x^2+1| + C = \\frac{1}{2}\\ln(x^2+1) + C$ (sin valor absoluto: $x^2+1 > 0$ siempre)." },
      ],
    },
    {
      label: "∫ e^x/(1+e^x) dx",
      tex: "\\int \\frac{e^x}{1+e^x}\\,dx",
      f: function (x) { return Math.exp(x) / (1 + Math.exp(x)); },
      range: [-4, 4],
      plotTitle: "Integrando f(x) = eˣ/(1+eˣ)",
      solution: "\\ln(1+e^x) + C",
      steps: [
        { t: "Observa la derivada del denominador", h: "La derivada del denominador es $(1+e^x)' = e^x$, exactamente el numerador." },
        { t: "Elige u", h: "Toma $u = 1+e^x$; entonces $du = e^x\\,dx$ (coincide con el numerador: sin ajuste)." },
        { t: "Sustituye", h: "$\\int\\frac{e^x}{1+e^x}\\,dx = \\int\\frac{du}{u}$." },
        { t: "Integra en u", h: "$\\ln|u| + C$." },
        { t: "Deshaz el cambio", h: "$\\ln|1+e^x| + C = \\ln(1+e^x) + C$ (positivo siempre)." },
      ],
    },
    {
      label: "∫ ln(x)/x dx",
      tex: "\\int \\frac{\\ln x}{x}\\,dx",
      f: function (x) { return Math.log(x) / x; },
      range: [0.1, 5],
      plotTitle: "Integrando f(x) = ln(x)/x  (x > 0)",
      solution: "\\frac{(\\ln x)^2}{2} + C",
      steps: [
        { t: "Detecta la composición logarítmica", h: "La función $\\ln x$ está compuesta con su propia derivada: $(\\ln x)' = \\frac{1}{x}$, que aparece como factor." },
        { t: "Elige u", h: "Toma $u = \\ln x$; entonces $du = \\frac{1}{x}\\,dx$, exactamente el resto del integrando." },
        { t: "Sustituye", h: "$\\int\\frac{\\ln x}{x}\\,dx = \\int u\\,du$." },
        { t: "Integra en u", h: "Regla de la potencia: $\\frac{u^2}{2} + C$." },
        { t: "Deshaz el cambio", h: "$\\frac{(\\ln x)^2}{2} + C$. Verifica: $\\frac{d}{dx}\\frac{(\\ln x)^2}{2} = \\ln x\\cdot\\frac{1}{x}$ ✔." },
      ],
    },
    {
      label: "∫ x·e^(x²) dx",
      tex: "\\int x\\,e^{x^2}\\,dx",
      f: function (x) { return x * Math.exp(x * x); },
      range: [-1.8, 1.8],
      plotTitle: "Integrando f(x) = x·e^(x²)",
      solution: "\\frac{1}{2}e^{x^2} + C",
      steps: [
        { t: "Detecta la composición", h: "Composición $e^{x^2}$ con interna $u = x^2$; $du = 2x\\,dx$, y el factor $x$ es la mitad de la derivada." },
        { t: "Ajuste por constante", h: "Despeja $x\\,dx = \\frac{1}{2}\\,du$: la integral queda $\\frac{1}{2}\\int e^u\\,du$." },
        { t: "Integra en u", h: "$\\frac{1}{2}e^u + C$." },
        { t: "Deshaz el cambio", h: "$\\frac{1}{2}e^{x^2} + C$. Compara con el ejercicio 1: ahí el factor era $2x$ (sin ajuste); aquí es $x$ (ajuste $\\frac{1}{2}$)." },
      ],
    },
  ];

  /* ---------- herramientas auxiliares ---------- */

  function renderStep(e, i) {
    var s = e.steps[i];
    return '<div class="tool-out" style="margin:8px 0">' +
      '<div style="font-weight:700;color:var(--accent-2);font-size:13px;margin-bottom:4px">Paso ' + (i + 1) + " — " + s.t + "</div>" +
      math.raw(s.h) + "</div>";
  }

  function solutionBox(e) {
    return '<div class="tool-out" style="border-color:rgba(52,211,153,0.4);border-style:solid">' +
      '<div style="font-weight:700;color:var(--ok);margin-bottom:4px">✔ Solución completa</div>' +
      math.raw("$$" + e.tex + " = " + e.solution + "$$") + "</div>";
  }

  /* ---------- herramienta ---------- */

  window.TOOLS["sustitucion"] = {
    title: "Laboratorio de sustitución",
    description: "Resuelve paso a paso integrales por sustitución, verificando la elección de u, el ajuste de constantes y el cambio de variable.",
    icon: "🔄",

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

      /* --- gráfico del integrando --- */
      var chart = H.chart();
      host.appendChild(chart.el);

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
          h += renderStep(e, i);
        }
        if (st.revealed >= e.steps.length) h += solutionBox(e);
        stepsOut.innerHTML = h;
        drawChart();
        window.renderMath && window.renderMath(ficha);
        window.renderMath && window.renderMath(stepsOut);
      }

      function drawChart() {
        var e = EXERCISES[st.fi];
        var xs = [], ys = [];
        var N = 320;
        for (var i = 0; i <= N; i++) {
          var x = e.range[0] + (e.range[1] - e.range[0]) * i / N;
          xs.push(x);
          ys.push(e.f(x));
        }
        chart.plot([
          {
            type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: "#38bdf8", width: 3 }, name: "f(x)",
            hovertemplate: "x=%{x:.3f}<br>f(x)=%{y:.3f}<extra></extra>",
          },
          {
            type: "scatter", mode: "lines", x: e.range, y: [0, 0],
            line: { color: "#3a4270", width: 1 }, name: "eje x", hoverinfo: "skip", showlegend: false,
          },
        ], {
          title: { text: e.plotTitle, font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: { title: { text: "x" }, zeroline: false },
          yaxis: { title: { text: "y" }, zeroline: true },
        });
      }

      /* --- arranque --- */
      resetSteps();
      window.renderMath && window.renderMath(host);
    },
  };
})();
