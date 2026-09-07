/* ===== tools/fracciones.js — Laboratorio de fracciones parciales ===== */
/* Seis ejercicios con pasos "Paso 1..N", resolvedor simbólico real para los
   lineales distintos (fórmula cerrada A = N(r₁)/(r₁−r₂)) y mini calculadora. */
(function () {
  "use strict";
  window.TOOLS = window.TOOLS || {};

  /* ================= aritmética racional exacta ================= */

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }
  function reduce(n, d) {
    if (d === 0) return null;
    if (n === 0) return { n: 0, d: 1 };
    var g = gcd(n, d);
    n /= g; d /= g;
    if (d < 0) { n = -n; d = -d; }
    return { n: n, d: d };
  }
  function ratAdd(a, b) { return reduce(a.n * b.d + b.n * a.d, a.d * b.d); }
  function ratSub(a, b) { return reduce(a.n * b.d - b.n * a.d, a.d * b.d); }
  function ratMul(a, b) { return reduce(a.n * b.n, a.d * b.d); }
  function ratDiv(a, b) { return b.n === 0 ? null : reduce(a.n * b.d, a.d * b.n); }
  function parseRat(x) {
    if (typeof x !== "number" || !isFinite(x)) return null;
    var s = x.toFixed(6);
    var m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) return null;
    var sign = m[1] === "-" ? -1 : 1;
    var whole = parseInt(m[2], 10);
    var frac = m[3] ? parseInt(m[3], 10) : 0;
    var den = m[3] ? Math.pow(10, m[3].length) : 1;
    return reduce(sign * (whole * den + frac), den);
  }
  function ratTex(r) {
    if (!r) return "0";
    if (r.d === 1) return String(r.n);
    if (r.n === 1) return "\\frac{1}{" + r.d + "}";
    if (r.n === -1) return "-\\frac{1}{" + r.d + "}";
    return "\\frac{" + r.n + "}{" + r.d + "}";
  }

  /* ================= formato de expresiones ================= */

  // a·x + b como texto LaTeX
  function numTerm(a, b) {
    if (a === 0) return String(b);
    var s;
    if (a === 1) s = "x";
    else if (a === -1) s = "-x";
    else s = a + "x";
    if (b > 0) s += "+" + b;
    else if (b < 0) s += b;
    return s;
  }
  // factor lineal (x − r)
  function factorTex(r) {
    if (r === 0) return "x";
    var s = r < 0 ? "x+" + (-r) : "x-" + r;
    return "(" + s + ")";
  }
  // c·ln|x−r|
  function lnTerm(c, r) {
    if (!c || c.n === 0) return null;
    var inner = factorTex(r).slice(1, -1);
    if (c.d === 1 && c.n === 1) return "\\ln|" + inner + "|";
    if (c.d === 1 && c.n === -1) return "-\\ln|" + inner + "|";
    return ratTex(c) + "\\ln|" + inner + "|";
  }
  // une términos respetando los signos
  function joinTerms(terms) {
    var out = "";
    terms.forEach(function (t) {
      if (!t) return;
      if (out === "") { out = t; return; }
      if (t.charAt(0) === "-") out += " - " + t.slice(1);
      else out += " + " + t;
    });
    return out === "" ? "0" : out;
  }

  /* ============ resolvedor simbólico: lineales distintos ============ */
  /* Datos: denominador (x−r₁)(x−r₂), numerador lineal a·x + b.
     Fórmula cerrada: A = N(r₁)/(r₁−r₂), B = N(r₂)/(r₂−r₁). */

  function solverSteps(s) {
    var r1 = s.r1, r2 = s.r2, a = s.a, b = s.b;
    var N = function (r) { return a * r + b; };
    var A = reduce(N(r1), r1 - r2);
    var B = reduce(N(r2), r2 - r1);
    var Ntex = numTerm(a, b);
    var f1 = factorTex(r1), f2 = factorTex(r2);
    function diff(x, y) { return x + " - " + (y < 0 ? "(" + y + ")" : y); }

    var pasos = [
      "Verificamos que la fracción es propia ($\\deg P < \\deg Q$) y factorizamos el denominador: $Q(x) = " + f1 + f2 + "$: dos factores lineales <b>distintos</b>.",
      "Proponemos la forma de descomposición: $$\\frac{" + Ntex + "}{" + f1 + f2 + "} = \\frac{A}{" + f1 + "} + \\frac{B}{" + f2 + "}$$",
      "Multiplicamos ambos lados por el denominador común $Q(x) = " + f1 + f2 + "$: $$" + Ntex + " = A" + f2 + " + B" + f1 + "$$",
      "<b>Sustitución estratégica</b> en las raíces: con $x = " + r1 + "$: $A = \\frac{N(r_{1})}{r_{1}-r_{2}} = \\frac{" + N(r1) + "}{" + diff(r1, r2) + "} = " + ratTex(A) + "$; " +
        "con $x = " + r2 + "$: $B = \\frac{N(r_{2})}{r_{2}-r_{1}} = \\frac{" + N(r2) + "}{" + diff(r2, r1) + "} = " + ratTex(B) + "$.",
      "Integramos término a término (logaritmos naturales): $$\\int \\frac{" + ratTex(A) + "}{" + f1 + "}\\,dx + \\int \\frac{" + ratTex(B) + "}{" + f2 + "}\\,dx$$",
    ];
    return { pasos: pasos, A: A, B: B };
  }

  /* ================= ejercicios ================= */

  var EX = [
    {
      id: "e1",
      titulo: "∫ dx / (x² − 5x + 6)",
      integrand: "\\frac{1}{x^{2}-5x+6}",
      escenario: {
        nombre: "Escenario 1 · Factores lineales distintos",
        detalle: "El denominador factoriza como $(x-2)(x-3)$: dos raíces reales <b>distintas</b> (2 y 3). Cada factor lineal $(x-r)$ aporta una fracción con numerador constante $A/(x-r)$, y las constantes se despejan evaluando en las raíces.",
        kind: "ok",
      },
      solver: { r1: 2, r2: 3, a: 0, b: 1 },
    },
    {
      id: "e2",
      titulo: "∫ (3x + 1) / ((x + 1)(x − 2)) dx",
      integrand: "\\frac{3x+1}{(x+1)(x-2)}",
      escenario: {
        nombre: "Escenario 1 · Factores lineales distintos",
        detalle: "El denominador $(x+1)(x-2)$ tiene dos raíces reales distintas ($-1$ y $2$): se resuelve por <b>sustitución estratégica</b> en cada raíz.",
        kind: "ok",
      },
      solver: { r1: 2, r2: -1, a: 3, b: 1 },
    },
    {
      id: "e3",
      titulo: "∫ dx / ((x − 1)²(x + 2))",
      integrand: "\\frac{1}{(x-1)^{2}(x+2)}",
      escenario: {
        nombre: "Escenario 2 · Factor lineal repetido",
        detalle: "El factor $(x-1)^{2}$ tiene multiplicidad 2: hay que <b>escalonar</b> $A/(x-1) + B/(x-1)^{2}$. Omitir un escalón impide igualar los grados del polinomio.",
        kind: "warn",
      },
      pasos: [
        "El denominador ya está factorizado: $(x-1)^{2}(x+2)$: un <b>factor lineal repetido</b> de multiplicidad 2 y un factor lineal simple.",
        "Proponemos la descomposición <b>escalonada</b> (un término por cada potencia): $$\\frac{1}{(x-1)^{2}(x+2)} = \\frac{A}{x-1} + \\frac{B}{(x-1)^{2}} + \\frac{C}{x+2}$$",
        "Multiplicamos ambos lados por el denominador común $(x-1)^{2}(x+2)$: $$1 = A(x-1)(x+2) + B(x+2) + C(x-1)^{2}$$",
        "<b>Sustitución estratégica</b> en las raíces: con $x=1$: $1 = 3B \\Rightarrow B = \\frac{1}{3}$; con $x=-2$: $1 = 9C \\Rightarrow C = \\frac{1}{9}$.",
        "Para $A$ igualamos coeficientes (o sustituimos $x=0$): $1 = -2A + \\frac{2}{3} + \\frac{1}{9} \\Rightarrow A = -\\frac{1}{9}$.",
        "Integramos término a término: $\\int \\frac{-1/9}{x-1}\\,dx + \\int \\frac{1/3}{(x-1)^{2}}\\,dx + \\int \\frac{1/9}{x+2}\\,dx$, con $\\int (x-1)^{-2}dx = -(x-1)^{-1}$ en el escalón medio.",
      ],
      final: "-\\frac{1}{9}\\ln|x-1| - \\frac{1}{3(x-1)} + \\frac{1}{9}\\ln|x+2| + C",
    },
    {
      id: "e4",
      titulo: "∫ (x + 2) / (x² + 2x + 4) dx",
      integrand: "\\frac{x+2}{x^{2}+2x+4}",
      escenario: {
        nombre: "Escenario 3 · Cuadrático irreductible simple",
        detalle: "El discriminante es $b^{2}-4ac = 4-16 = -12 < 0$: no hay raíces reales. Se <b>completa el cuadrado</b> y el resultado combina $\\ln$ y $\\arctan$.",
        kind: "ok",
      },
      pasos: [
        "El denominador $x^{2}+2x+4$ tiene discriminante $b^{2}-4ac = 4-16 = -12 < 0$: <b>cuadrático irreductible simple</b> (no tiene raíces reales).",
        "<b>Completamos el cuadrado:</b> $x^{2}+2x+4 = (x+1)^{2}+3$.",
        "Reescribimos el numerador en torno a $u = x+1$: $x+2 = (x+1)+1 = u+1$.",
        "Separamos la integral: $$\\int \\frac{u}{u^{2}+3}\\,du + \\int \\frac{du}{u^{2}+3}$$",
        "Primera integral (con $w = u^{2}+3$): $\\frac{1}{2}\\ln(u^{2}+3)$; segunda (forma $\\int \\frac{du}{u^{2}+a^{2}} = \\frac{1}{a}\\arctan\\frac{u}{a}$ con $a=\\sqrt{3}$): $\\frac{1}{\\sqrt{3}}\\arctan\\left(\\frac{u}{\\sqrt{3}}\\right)$.",
        "Regresamos con $u = x+1$.",
      ],
      final: "\\frac{1}{2}\\ln(x^{2}+2x+4) + \\frac{1}{\\sqrt{3}}\\arctan\\left(\\frac{x+1}{\\sqrt{3}}\\right) + C",
    },
    {
      id: "e5",
      titulo: "∫ (x³ + x) / (x² + 1) dx — división larga",
      integrand: "\\frac{x^{3}+x}{x^{2}+1}",
      escenario: {
        nombre: "Antes de descomponer · División larga",
        detalle: "La fracción es impropia ($\\deg P = 3 \\geq \\deg Q = 2$): hay que <b>dividir primero</b>; solo la fracción propia restante se descompone en fracciones parciales.",
        kind: "warn",
      },
      pasos: [
        "Comprobamos los grados: $\\deg P = 3 \\geq \\deg Q = 2$: la fracción es <b>impropia</b> → primero la <b>división larga</b> de polinomios.",
        "Dividimos $(x^{3} + 0x^{2} + x + 0) \\div (x^{2}+1)$: primer término $x^{3}/x^{2} = x$; multiplicamos $x(x^{2}+1) = x^{3}+x$; el resto es $0$.",
        "Entonces $\\frac{x^{3}+x}{x^{2}+1} = x + \\frac{0}{x^{2}+1} = x$: la fracción impropia se reduce a un polinomio.",
        "Integramos: $\\int x\\,dx = \\frac{x^{2}}{2}$.",
        '<span style="font-size:12.5px">💡 Si el resto no fuera cero, la fracción propia restante se descompondría en fracciones parciales.</span>',
      ],
      final: "\\frac{x^{2}}{2} + C",
    },
    {
      id: "e6",
      titulo: "∫ (x + 1) / (x² + 1)² dx",
      integrand: "\\frac{x+1}{(x^{2}+1)^{2}}",
      escenario: {
        nombre: "Escenario 4 · Cuadrático irreductible repetido",
        detalle: "El cuadrático $(x^{2}+1)^{2}$ es irreductible ($b^{2}-4ac = -4 < 0$) y está repetido: se escalonan <b>numeradores lineales</b> $(Ax+B)$ y $(Cx+D)$, uno por cada potencia.",
        kind: "warn",
      },
      pasos: [
        "El denominador $(x^{2}+1)^{2}$ es un <b>cuadrático irreductible repetido</b> ($b^{2}-4ac = -4 < 0$), de multiplicidad 2.",
        "Proponemos la descomposición escalonada con <b>numeradores lineales</b>: $$\\frac{x+1}{(x^{2}+1)^{2}} = \\frac{Ax+B}{x^{2}+1} + \\frac{Cx+D}{(x^{2}+1)^{2}}$$",
        "Multiplicamos por el denominador común $(x^{2}+1)^{2}$: $x+1 = (Ax+B)(x^{2}+1) + Cx + D$.",
        "Expandimos y agrupamos por potencias de $x$: $Ax^{3} + Bx^{2} + (A+C)x + (B+D)$.",
        "Igualamos coeficientes: $A = 0$, $B = 0$, $A+C = 1 \\Rightarrow C = 1$, $B+D = 1 \\Rightarrow D = 1$.",
        "Queda $\\int \\frac{x}{(x^{2}+1)^{2}}\\,dx + \\int \\frac{dx}{(x^{2}+1)^{2}}$.",
        "Primera (con $u = x^{2}+1$): $-\\frac{1}{2(x^{2}+1)}$; segunda (fórmula de reducción): $\\frac{x}{2(x^{2}+1)} + \\frac{1}{2}\\arctan x$.",
      ],
      final: "\\frac{x-1}{2(x^{2}+1)} + \\frac{1}{2}\\arctan x + C",
    },
  ];

  /* ================= construcción del panel de un ejercicio ================= */

  function buildExercise(ex) {
    var sol = ex.solver ? solverSteps(ex.solver) : null;
    var pasos = sol ? sol.pasos : ex.pasos;
    var final = sol
      ? joinTerms([lnTerm(sol.A, ex.solver.r1), lnTerm(sol.B, ex.solver.r2)]) + " + C"
      : ex.final;
    var kind = ex.escenario.kind === "ok" ? "tip" : "warn";

    var wrap = H.el(
      '<div class="ex-panel" style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin:12px 0;background:var(--bg-2)">' +
      '<div style="font-weight:700;margin-bottom:4px">' + ex.titulo + "</div>" +
      '<div class="formula-box">' + math.raw("$$\\int " + ex.integrand + "\\,dx$$") + "</div>" +
      '<div class="callout ' + kind + '" style="margin:10px 0"><div class="callout-title">🗂 ' + ex.escenario.nombre + "</div>" +
      math.raw(ex.escenario.detalle) + "</div>" +
      '<div class="steps-controls" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0"></div>' +
      '<div class="steps-body"></div>' +
      '<div class="answer-box" style="display:none;margin-top:10px"></div>' +
      "</div>"
    );

    var controls = wrap.querySelector(".steps-controls");
    var body = wrap.querySelector(".steps-body");
    var answer = wrap.querySelector(".answer-box");

    pasos.forEach(function (p, i) {
      var btn = H.btn("Paso " + (i + 1), function () {
        var d = body.querySelector('[data-step="' + i + '"]');
        d.style.display = d.style.display === "none" ? "" : "none";
      }, "small");
      controls.appendChild(btn);
      var div = H.el(
        '<div class="step-item" data-step="' + i + '" style="display:none;margin:6px 0;padding:8px 12px;border-left:3px solid var(--accent-2);background:rgba(108,140,255,0.06);border-radius:6px"></div>'
      );
      div.innerHTML = math.raw(p);
      body.appendChild(div);
    });

    var allBtn = H.btn("👁 Ver todos los pasos", function () {
      var hidden = body.querySelectorAll('.step-item[style*="display: none"]').length > 0;
      body.querySelectorAll(".step-item").forEach(function (d) { d.style.display = hidden ? "" : "none"; });
    }, "small ghost");
    var ansBtn = H.btn("✅ Ver resultado final", function () {
      if (answer.style.display === "none") {
        answer.innerHTML = '<div class="tool-out" style="margin:0"><b>✅ Resultado final</b><br>' +
          math.raw("$$\\int " + ex.integrand + "\\,dx = " + final + "$$") + "</div>";
        answer.style.display = "";
      } else {
        answer.style.display = "none";
      }
    }, "small primary");
    controls.appendChild(allBtn);
    controls.appendChild(ansBtn);

    return wrap;
  }

  /* ================= mini calculadora ================= */

  function buildCalculator() {
    var wrap = H.el(
      '<div class="tool-out" style="margin-top:18px">' +
      '<div style="font-weight:700;margin-bottom:4px">🧮 Mini calculadora de fracciones parciales</div>' +
      '<div style="font-size:13px;color:var(--text-dim);margin-bottom:10px">Para denominadores con dos raíces reales distintas. Introduce raíces y un numerador lineal; resuelve A y B en vivo con la fórmula cerrada.</div>' +
      '<div class="calc-inputs" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px"></div>' +
      '<div class="calc-out"></div>' +
      "</div>"
    );
    var inputs = wrap.querySelector(".calc-inputs");
    var out = wrap.querySelector(".calc-out");

    function numInput(label, value) {
      var c = H.el('<label class="ctl"><span></span><input type="number" step="any"></label>');
      c.querySelector("span").textContent = label;
      var inp = c.querySelector("input");
      inp.value = value;
      inp.addEventListener("input", update);
      return inp;
    }
    var iR1 = numInput("Raíz r₁", 2);
    var iR2 = numInput("Raíz r₂", 3);
    var iA = numInput("a (coef. de x)", 0);
    var iB = numInput("b (constante)", 1);
    inputs.appendChild(iR1);
    inputs.appendChild(iR2);
    inputs.appendChild(iA);
    inputs.appendChild(iB);

    function update() {
      var r1 = parseFloat(iR1.value), r2 = parseFloat(iR2.value), a = parseFloat(iA.value), b = parseFloat(iB.value);
      if (!isFinite(r1) || !isFinite(r2) || !isFinite(a) || !isFinite(b)) {
        out.innerHTML = '<span style="color:var(--warn)">⚠️ Ingresa números válidos en los cuatro campos.</span>';
        return;
      }
      if (r1 === r2) {
        out.innerHTML = '<span style="color:var(--warn)">⚠️ Las raíces deben ser distintas (r₁ ≠ r₂): con raíces repetidas el escenario es otro (factor lineal repetido).</span>';
        return;
      }
      var r1r = parseRat(r1), r2r = parseRat(r2), ar = parseRat(a), br = parseRat(b);
      if (!r1r || !r2r || !ar || !br) {
        out.innerHTML = '<span style="color:var(--warn)">⚠️ No pude interpretar los números.</span>';
        return;
      }
      var N1 = ratAdd(ratMul(ar, r1r), br);
      var N2 = ratAdd(ratMul(ar, r2r), br);
      var A = ratDiv(N1, ratSub(r1r, r2r));
      var B = ratDiv(N2, ratSub(r2r, r1r));
      var Ntex = numTerm(a, b);
      var f1 = factorTex(r1), f2 = factorTex(r2);
      out.innerHTML = math.raw(
        "Descomposición propuesta: $$\\frac{" + Ntex + "}{" + f1 + f2 + "} = \\frac{" + ratTex(A) + "}{" + f1 + "} + \\frac{" + ratTex(B) + "}{" + f2 + "}$$" +
        "Fórmula cerrada: $A = \\frac{N(r_{1})}{r_{1}-r_{2}} = " + ratTex(A) + " \\approx " + H.num(A.n / A.d, 4) +
        "$ &nbsp;y&nbsp; $B = \\frac{N(r_{2})}{r_{2}-r_{1}} = " + ratTex(B) + " \\approx " + H.num(B.n / B.d, 4) + "$.<br>" +
        "Antiderivada: $$\\int \\frac{" + Ntex + "}{" + f1 + f2 + "}\\,dx = " + joinTerms([lnTerm(A, r1), lnTerm(B, r2)]) + " + C$$"
      );
    }
    update();
    return wrap;
  }

  /* ================= herramienta ================= */

  window.TOOLS["fracciones"] = {
    title: "Laboratorio de fracciones parciales",
    description: "Seis ejercicios con pasos, resolvedor real de constantes A y B para lineales distintos y mini calculadora de la fórmula cerrada.",
    icon: "➗",

    mount: function (host, cfg) {
      var st = { ei: 0 };

      var controls = H.el('<div class="tool-controls"></div>');
      var sel = H.select(
        "Ejercicio",
        EX.map(function (e, i) { return { label: e.titulo, value: String(i) }; }),
        "0",
        function (v) { st.ei = parseInt(v, 10); renderExercise(); }
      );
      controls.appendChild(sel.el);
      host.appendChild(controls);

      var box = H.el("<div></div>");
      host.appendChild(box);

      function renderExercise() {
        box.innerHTML = "";
        box.appendChild(buildExercise(EX[st.ei]));
        window.renderMath && window.renderMath(box);
      }
      renderExercise();

      host.appendChild(buildCalculator());

      /* tabla de los cuatro escenarios (siempre visible) */
      var tblHtml =
        '<div style="margin-top:18px"><div style="font-weight:700;margin-bottom:6px">🗂 Los cuatro escenarios de descomposición</div>' +
        '<div class="tbl-wrapper"><table class="tbl"><thead><tr><th>Escenario</th><th>Forma del denominador</th><th>Descomposición</th><th>Resultado al integrar</th></tr></thead><tbody>' +
        '<tr><td>1. Lineales distintos</td><td>$(x-a)(x-b)$</td><td>$\\dfrac{A}{x-a} + \\dfrac{B}{x-b}$</td><td>$\\ln|ax+b|$</td></tr>' +
        '<tr><td>2. Lineal repetido</td><td>$(x-a)^{n}$</td><td>$\\dfrac{A_{1}}{x-a} + \\cdots + \\dfrac{A_{n}}{(x-a)^{n}}$</td><td>$\\ln$ y potencias</td></tr>' +
        '<tr><td>3. Cuadrático irreductible simple</td><td>$ax^{2}+bx+c$ con $b^{2}-4ac<0$</td><td>$\\dfrac{Ax+B}{ax^{2}+bx+c}$</td><td>$\\ln$ y $\\arctan$</td></tr>' +
        '<tr><td>4. Cuadrático repetido</td><td>$(ax^{2}+bx+c)^{n}$</td><td>$\\dfrac{A_{1}x+B_{1}}{ax^{2}+bx+c} + \\cdots$</td><td>reducción + $\\arctan$</td></tr>' +
        "</tbody></table></div></div>";
      host.appendChild(H.el(math.raw(tblHtml)));

      window.renderMath && window.renderMath(host);
    },
  };
})();
