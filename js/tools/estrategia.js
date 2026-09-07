/* ===== tools/estrategia.js — Detector de técnica de integración (U12) ===== */
(function () {
  "use strict";

  window.TOOLS = window.TOOLS || {};

  /* Las 7 preguntas del flujo diagnóstico de la Unidad 12. */
  var QUESTIONS = [
    "¿Reconocimiento inmediato (coincide con la tabla o un múltiplo constante de ella)?",
    "¿Manipulación algebraica previa (expandir, separar, identidad, racionalizar)?",
    "¿Sustitución u (función compuesta acompañada de su derivada o de un múltiplo de ella)?",
    "¿Partes / LIATE (producto de familias dispares)?",
    "¿Sustitución trigonométrica (radicales $\\sqrt{a^2-x^2}$, $\\sqrt{x^2+a^2}$, $\\sqrt{x^2-a^2}$)?",
    "¿Fracciones parciales (cociente de polinomios $P(x)/Q(x)$)?",
    "¿Weierstrass (senos y cosenos enredados en un denominador sin factor útil)?",
  ];

  /*
   * Puzzles: para cada uno, las 7 respuestas del flujo (a: "Sí" | "No" | "—" cuando
   * ya quedó resuelto antes) con una breve explicación, y el veredicto final.
   */
  var PUZZLES = [
    {
      tex: "\\int 3x^2\\,dx",
      verdict: "Integral inmediata (potencia)",
      verdictWhy: "La pregunta 1 basta: la tabla y la linealidad resuelven el ejercicio sin ninguna transformación. Resultado: $x^3 + C$.",
      q: [
        { a: "Sí", w: "Coincide con $\\int x^n\\,dx$ con $n = 2$ y múltiplo constante 3: $3\\cdot\\frac{x^3}{3} = x^3$." },
        { a: "—", w: "Ya resuelto en la pregunta 1: no hace falta seguir el flujo." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
      ],
    },
    {
      tex: "\\int 2x\\cos(x^2)\\,dx",
      verdict: "Sustitución u",
      verdictWhy: "El patrón $f(g(x))\\,g'(x)$ es exacto: la pregunta 3 «mata» al resto del flujo. Resultado: $\\sin(x^2) + C$.",
      q: [
        { a: "No", w: "No hay fórmula inmediata para un producto de $x$ por $\\cos(x^2)$." },
        { a: "No", w: "No hay nada que expandir, separar ni racionalizar." },
        { a: "Sí", w: "Composición $\\cos(x^2)$ con derivada interna $2x$ presente: $u = x^2$, $du = 2x\\,dx$. La integral se contrae a $\\int\\cos u\\,du = \\sin(x^2) + C$." },
        { a: "—", w: "Resuelto en la pregunta 3 (ver $2x\\cos(x^2)$ y aplicar partes sería un error de orden del flujo)." },
        { a: "—", w: "Resuelto en la pregunta 3." },
        { a: "—", w: "Resuelto en la pregunta 3." },
        { a: "—", w: "Resuelto en la pregunta 3." },
      ],
    },
    {
      tex: "\\int x\\ln x\\,dx",
      verdict: "Partes (LIATE)",
      verdictWhy: "La logarítmica no tiene antiderivada inmediata, pero su derivada $1/x$ simplifica la integral: $u = \\ln x$, $dv = x\\,dx$. Resultado: $\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$.",
      q: [
        { a: "No", w: "No existe una inmediata para el producto $x\\ln x$." },
        { a: "No", w: "Ninguna identidad ni expansión lo vuelve familiar." },
        { a: "No", w: "No hay una función interna cuya derivada aparezca como factor." },
        { a: "Sí", w: "Producto de familias dispares (algebraica × logarítmica). LIATE: la L va primero → $u = \\ln x$, $du = \\frac{1}{x}\\,dx$, $dv = x\\,dx$, $v = \\frac{x^2}{2}$." },
        { a: "—", w: "Resuelto en la pregunta 4." },
        { a: "—", w: "Resuelto en la pregunta 4." },
        { a: "—", w: "Resuelto en la pregunta 4." },
      ],
    },
    {
      tex: "\\int \\frac{1}{1+x^2}\\,dx",
      verdict: "Integral inmediata (arctan)",
      verdictWhy: "Reconocimiento directo de la tabla: $\\int\\frac{dx}{1+x^2} = \\arctan x + C$. Nada que transformar.",
      q: [
        { a: "Sí", w: "Coincide con la forma inmediata $\\int\\frac{dx}{1+x^2} = \\arctan x + C$." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
        { a: "—", w: "Ya resuelto en la pregunta 1." },
      ],
    },
    {
      tex: "\\int 4x\\,e^{2x^2}\\,dx",
      verdict: "Sustitución u",
      verdictWhy: "La derivada de la interna $2x^2$ es $4x$, que aparece exactamente: $\\int e^u\\,du = e^{2x^2} + C$.",
      q: [
        { a: "No", w: "No es una forma inmediata de la tabla." },
        { a: "No", w: "No hay álgebra útil que aplicar." },
        { a: "Sí", w: "Interna $u = 2x^2$; $du = 4x\\,dx$ aparece <b>exactamente</b> en el integrando: $\\int 4x\\,e^{2x^2}\\,dx = \\int e^u\\,du = e^{2x^2} + C$." },
        { a: "—", w: "Resuelto en la pregunta 3." },
        { a: "—", w: "Resuelto en la pregunta 3." },
        { a: "—", w: "Resuelto en la pregunta 3." },
        { a: "—", w: "Resuelto en la pregunta 3." },
      ],
    },
    {
      tex: "\\int \\frac{1}{x^2-9}\\,dx",
      verdict: "Fracciones parciales (o forma inmediata generalizada)",
      verdictWhy: "El flujo canónico llega a la pregunta 6: factoriza $x^2-9 = (x-3)(x+3)$ y descompón. Atajo equivalente: la forma $\\int\\frac{dx}{x^2-a^2} = \\frac{1}{2a}\\ln\\left|\\frac{x-a}{x+a}\\right|$ con $a=3$. Resultado: $\\frac{1}{6}\\ln\\left|\\frac{x-3}{x+3}\\right| + C$.",
      q: [
        { a: "No", w: "No aparece tal cual en la tabla básica (la forma con logaritmo requiere factorizar el denominador)." },
        { a: "No", w: "El denominador ya está ordenado; no hay nada que simplificar." },
        { a: "No", w: "No hay composición con su derivada como factor." },
        { a: "No", w: "No es un producto de familias dispares." },
        { a: "No", w: "No hay radicales." },
        { a: "Sí", w: "Cociente de polinomios propio: $\\frac{1}{x^2-9} = \\frac{1}{(x-3)(x+3)} = \\frac{A}{x-3} + \\frac{B}{x+3}$; con $A = \\frac{1}{6}$ y $B = -\\frac{1}{6}$." },
        { a: "—", w: "Resuelto en la pregunta 6." },
      ],
    },
    {
      tex: "\\int \\sqrt{4-x^2}\\,dx",
      verdict: "Sustitución trigonométrica",
      verdictWhy: "El radical $\\sqrt{a^2-x^2}$ con $a=2$ activa la pregunta 5: $x = 2\\sin\\theta$, $dx = 2\\cos\\theta\\,d\\theta$; $\\sqrt{4-x^2} = 2\\cos\\theta$. Resultado: $2\\arcsin\\frac{x}{2} + \\frac{x}{2}\\sqrt{4-x^2} + C$.",
      q: [
        { a: "No", w: "El radical $\\sqrt{4-x^2}$ no está en la tabla básica de inmediatas." },
        { a: "No", w: "Racionalizar o separar no elimina el radical." },
        { a: "No", w: "No hay composición con su derivada como factor." },
        { a: "No", w: "No es un producto de familias dispares." },
        { a: "Sí", w: "Radical de la forma $\\sqrt{a^2-x^2}$ con $a=2$: $x = 2\\sin\\theta$ y la identidad $1-\\sin^2\\theta = \\cos^2\\theta$ elimina el radical." },
        { a: "—", w: "Resuelto en la pregunta 5." },
        { a: "—", w: "Resuelto en la pregunta 5." },
      ],
    },
    {
      tex: "\\int \\frac{dx}{2+\\cos x}",
      verdict: "Weierstrass (t = tan(x/2))",
      verdictWhy: "Último recurso (pregunta 7): con $t = \\tan(x/2)$ se tiene $\\cos x = \\frac{1-t^2}{1+t^2}$ y $dx = \\frac{2\\,dt}{1+t^2}$, y todo se vuelve racional en $t$.",
      q: [
        { a: "No", w: "No es una forma inmediata." },
        { a: "No", w: "Las identidades trigonométricas no eliminan el coseno del denominador." },
        { a: "No", w: "No hay una derivada interna como factor." },
        { a: "No", w: "No es un producto de familias." },
        { a: "No", w: "No hay radicales." },
        { a: "No", w: "No es un cociente de polinomios en $x$ (hay un $\\cos x$)." },
        { a: "Sí", w: "Seno/coseno enredados en un denominador con constantes: $t = \\tan(x/2)$ convierte el integrando en una función racional de $t$, integrable por fracciones parciales." },
      ],
    },
    {
      tex: "\\int \\frac{dx}{x^2+4x+5}",
      verdict: "Manipulación algebraica (completar el cuadrado) → inmediata arctan",
      verdictWhy: "La pregunta 2 transforma el denominador en $(x+2)^2+1$ y devuelve el problema a la pregunta 1 (forma inmediata arctan). Resultado: $\\arctan(x+2) + C$.",
      q: [
        { a: "No", w: "El denominador $x^2+4x+5$ no coincide todavía con $1+x^2$ ni con $a^2+x^2$." },
        { a: "Sí", w: "Completar el cuadrado: $x^2+4x+5 = (x+2)^2+1$. Con $u = x+2$ ($du = dx$) queda $\\int\\frac{du}{u^2+1} = \\arctan u = \\arctan(x+2) + C$." },
        { a: "—", w: "Resuelto en la pregunta 2 (la pregunta 2 devolvió el problema a la pregunta 1)." },
        { a: "—", w: "Resuelto en la pregunta 2." },
        { a: "—", w: "Resuelto en la pregunta 2." },
        { a: "—", w: "Resuelto en la pregunta 2." },
        { a: "—", w: "Resuelto en la pregunta 2." },
      ],
    },
    {
      tex: "\\int x\\,e^{x}\\,dx",
      verdict: "Partes (LIATE simple)",
      verdictWhy: "Producto algebraica × exponencial: la pregunta 4 activa LIATE con $u = x$, $dv = e^x\\,dx$. Resultado: $e^x(x-1) + C$.",
      q: [
        { a: "No", w: "No hay fórmula inmediata para el producto $x\\,e^x$." },
        { a: "No", w: "No hay nada que expandir, separar ni racionalizar." },
        { a: "No", w: "Derivar $e^x$ no produce $x$: no hay composición con su derivada." },
        { a: "Sí", w: "Producto de familias dispares (algebraica × exponencial). LIATE: la A precede a la E → $u = x$, $du = dx$, $dv = e^x\\,dx$, $v = e^x$. $\\int x\\,e^x\\,dx = x\\,e^x - \\int e^x\\,dx = x\\,e^x - e^x + C$." },
        { a: "—", w: "Resuelto en la pregunta 4." },
        { a: "—", w: "Resuelto en la pregunta 4." },
        { a: "—", w: "Resuelto en la pregunta 4." },
      ],
    },
  ];

  /* Mapa de decisión rápida: "Si ves X → usa Y" (tabla de la U12). */
  var DECISION_MAP = [
    { form: "Composición $f(g(x))\\cdot g'(x)$: la derivada interna aparece como factor", tech: "Sustitución $u = g(x)$", idea: "$\\int f(u)\\,du$ con $du = g'(x)\\,dx$" },
    { form: "Producto de familias opuestas: $x^n e^{ax}$, $x^n\\ln x$, $e^{ax}\\sin(bx)$", tech: "Partes (LIATE; tabular si el polinomio se repite)", idea: "$\\int u\\,dv = uv - \\int v\\,du$" },
    { form: "Radicales $\\sqrt{a^2-x^2}$, $\\sqrt{x^2+a^2}$, $\\sqrt{x^2-a^2}$", tech: "Sustitución trigonométrica", idea: "$x = a\\sin\\theta$, $a\\tan\\theta$, $a\\sec\\theta$" },
    { form: "Cociente de polinomios propio $P(x)/Q(x)$ (división larga si $\\deg P \\geq \\deg Q$)", tech: "Fracciones parciales", idea: "Factoriza $Q$ y descompón en fracciones" },
    { form: "$\\frac{1}{ax^2+bx+c}$ con cuadrático sin raíces reales", tech: "Completar el cuadrado → arctan", idea: "$(x+h)^2+k^2$, $u = x+h$" },
    { form: "Seno/coseno en el denominador con constantes, sin factor útil", tech: "Weierstrass (último recurso)", idea: "$t = \\tan(x/2)$: todo racional en $t$" },
  ];

  /* ---------- render del análisis ---------- */

  function analysisHtml(p) {
    var h = '<div style="margin-top:10px">';
    h += '<div style="font-weight:700;margin-bottom:8px">Flujo de las 7 preguntas aplicado a ' + math.raw("$" + p.tex + "$") + "</div>";
    QUESTIONS.forEach(function (q, i) {
      var ans = p.q[i];
      var cls = ans.a === "Sí" ? 'style="color:var(--ok)"' : ans.a === "No" ? 'style="color:var(--err)"' : 'style="color:var(--text-dim)"';
      h += '<details style="border:1px solid var(--border);border-radius:8px;margin:6px 0;background:var(--card)">' +
        '<summary style="cursor:pointer;padding:8px 12px;font-size:13.5px;user-select:none">' +
        "<b>P" + (i + 1) + ".</b> " + math.raw(q) + ' — <span ' + cls + "><b>" + (ans.a === "—" ? "ya resuelto" : ans.a) + "</b></span></summary>" +
        '<div style="padding:6px 14px 10px;font-size:13.5px;color:var(--text-dim)">' + math.raw(ans.w) + "</div></details>";
    });
    h += '<div class="callout tip" style="margin:10px 0 4px"><div class="callout-title">🧭 Veredicto</div>' +
      "<b>" + p.verdict + "</b> — " + math.raw(p.verdictWhy) + "</div>";
    return h;
  }

  function decisionMapHtml() {
    var h = '<div class="tbl-wrapper"><table class="tbl"><thead><tr>' +
      "<th>Si ves…</th><th>→ Usa…</th><th>Idea clave</th>" +
      "</tr></thead><tbody>";
    DECISION_MAP.forEach(function (r) {
      h += "<tr><td>" + math.raw(r.form) + "</td><td><b>" + r.tech + "</b></td><td>" + math.raw(r.idea) + "</td></tr>";
    });
    h += "</tbody></table></div>";
    return h;
  }

  /* ---------- herramienta ---------- */

  window.TOOLS["estrategia"] = {
    title: "Detector de técnica de integración",
    description: "Entrena el flujo de las siete preguntas: descubre qué técnica usar para cada integral y por qué.",
    icon: "🧭",

    mount: function (host, cfg) {
      /* --- intro --- */
      var intro = H.panel("🧭 Cómo usar esta herramienta",
        "Antes de integrar, <b>diagnostica</b>. Recorre las 7 preguntas en orden: la mayoría de las integrales mueren en las preguntas 1–3; las preguntas 4–7 se reservan para integrandos resistentes. Pulsa <b>🔍 Analizar</b> en cada puzzle para ver el flujo aplicado y el veredicto.",
        "note");
      host.appendChild(intro);

      /* --- puzzles --- */
      var puzzles = H.el('<div style="margin-top:6px"></div>');
      PUZZLES.forEach(function (p, i) {
        var card = H.el('<div class="exercise" style="margin:10px 0"></div>');
        card.innerHTML =
          '<div class="exercise-head" style="flex-wrap:wrap;gap:12px"><span style="color:var(--text-dim);font-family:var(--mono)">' + (i + 1) + ".</span>" +
          math.raw("$$" + p.tex + "$$") + "</div>" +
          '<div class="actions"><button class="btn small">🔍 Analizar</button></div>' +
          '<div class="hidden" data-an></div>';
        card.querySelector("button").addEventListener("click", function () {
          var an = card.querySelector("[data-an]");
          var btn = card.querySelector("button");
          if (an.classList.contains("hidden")) {
            an.innerHTML = analysisHtml(p);
            an.classList.remove("hidden");
            btn.textContent = "🔍 Ocultar análisis";
          } else {
            an.classList.add("hidden");
            btn.textContent = "🔍 Analizar";
          }
          window.renderMath && window.renderMath(an);
        });
        puzzles.appendChild(card);
      });
      host.appendChild(puzzles);

      /* --- mapa de decisión rápida --- */
      var map = H.el('<div class="callout note" style="margin-top:18px"><div class="callout-title">🗺️ Mapa de decisión rápida — si ves X, usa Y</div></div>');
      map.insertAdjacentHTML("beforeend", decisionMapHtml());
      host.appendChild(map);

      window.renderMath && window.renderMath(host);
    },
  };
})();
