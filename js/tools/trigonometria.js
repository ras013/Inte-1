/* ===== tools/trigonometria.js — Analizador de integrales trigonométricas ===== */
/* Clasifica ∫sin^m(x)·cos^n(x)dx según la paridad de m y n (Unidad 6) y, para
   casos pequeños, desarrolla la antiderivada simbólicamente. */
(function () {
  "use strict";
  window.TOOLS = window.TOOLS || {};

  /* ================= utilidades simbólicas ligeras ================= */

  // coeficiente binomial C(n,k)
  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    var r = 1;
    for (var i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return Math.round(r);
  }

  // máximo común divisor (para simplificar fracciones)
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }

  // monomio ya integrado: (coef/den)·base^pow·trail  (den = pow, simplificado por gcd)
  function mono(coef, pow, base, trail) {
    if (coef === 0) return null;
    var g = gcd(coef, pow);
    var num = Math.abs(coef) / g, den = pow / g;
    var neg = coef < 0, body;
    if (num === 1 && den === 1) body = base + (pow === 1 ? "" : "^{" + pow + "}") + trail;
    else if (den === 1) body = num + base + (pow === 1 ? "" : "^{" + pow + "}") + trail;
    else if (num === 1) body = "\\frac{1}{" + den + "}" + base + "^{" + pow + "}" + trail;
    else body = "\\frac{" + num + "}{" + den + "}" + base + "^{" + pow + "}" + trail;
    return { body: body, neg: neg };
  }

  // monomio sin integrar: coef·base^pow·trail
  function powerTex(coef, pow, base, trail) {
    if (coef === 0) return null;
    var num = Math.abs(coef), neg = coef < 0, body;
    if (pow === 0) body = "1";
    else if (num === 1) body = base + (pow === 1 ? "" : "^{" + pow + "}") + trail;
    else body = num + base + (pow === 1 ? "" : "^{" + pow + "}") + trail;
    return { body: body, neg: neg };
  }

  // suma de términos con signos (primero sin signo si es positivo)
  function sumTex(terms) {
    var out = "", first = true;
    terms.forEach(function (t) {
      if (!t) return;
      if (first) { out += (t.neg ? "-" : "") + t.body; first = false; }
      else out += (t.neg ? " - " : " + ") + t.body;
    });
    return out;
  }

  // expansión de (1-u^2)^k · u^basePow  → Σ binom(k,j)(-1)^j u^{basePow+2j}
  function productTex(k, basePow, base, trail) {
    var terms = [];
    for (var j = 0; j <= k; j++) {
      terms.push(powerTex(binom(k, j) * (j % 2 ? -1 : 1), basePow + 2 * j, base, trail));
    }
    return sumTex(terms);
  }

  // integrando base: sin^m x · cos^n x  (omite potencias cero)
  function integrand(m, n) {
    var parts = [];
    if (m > 0) parts.push("\\sin^{" + m + "} x");
    if (n > 0) parts.push("\\cos^{" + n + "} x");
    if (!parts.length) parts.push("1");
    return parts.join("\\,");
  }

  // Regla de Simpson compuesta
  function simpson(f, a, b, n) {
    if (n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b);
    for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  }

  // indicador ✓/✗ como HTML (H.truth devuelve un elemento; aquí necesitamos un string)
  function truthHtml(ok) {
    return '<span class="truth-ind ' + (ok ? "ok" : "no") + '">' + (ok ? "✔ correcto" : "✘ incorrecto") + "</span>";
  }

  // slider con etiqueta formateada (evita artefactos de precisión del range)
  function makeSlider(label, min, max, step, value, oninput) {
    var wrap = H.el('<div class="ctl"><label></label><input type="range"></div>');
    var lab = wrap.querySelector("label");
    var input = wrap.querySelector("input");
    input.min = min; input.max = max; input.step = step; input.value = value;
    function clean(v) { return Math.round(v * 10000) / 10000; }
    function upd() {
      var v = clean(Math.round(parseFloat(input.value) / step) * step);
      lab.textContent = label + ": " + v;
      oninput && oninput(v);
    }
    lab.textContent = label + ": " + clean(value);
    input.addEventListener("input", upd);
    return {
      el: wrap,
      get: function () { return clean(Math.round(parseFloat(input.value) / step) * step); },
      set: function (v) { input.value = v; upd(); },
    };
  }

  /* ================= desarrollo simbólico (casos 1 y 2) ================= */

  // Caso 1: m impar → u = cos x. Antiderivada exacta como polinomio en cos x.
  function desarrolloCaso1(m, n) {
    var k = (m - 1) / 2;
    // sin x · sin^{m-1} x · cos^n x (omite potencias cero)
    var mani = ["\\sin x"];
    if (m - 1 > 0) mani.push("\\sin^{" + (m - 1) + "} x");
    if (n > 0) mani.push("\\cos^{" + n + "} x");
    var steps = [];
    steps.push(
      "Identificamos $m = " + m + "$ **impar**: aplica el <b>Caso 1</b>. Apartamos un factor $\\sin x$ que proveerá el diferencial: " +
      "$" + integrand(m, n) + " = " + mani.join("\\,") + "$."
    );
    steps.push(
      "La potencia restante es par: $\\sin^{" + (m - 1) + "} x = (\\sin^{2} x)^{" + k + "} = (1-\\cos^{2} x)^{" + k + "}$."
    );
    steps.push(
      "Sustituimos $u = \\cos x$, $du = -\\sin x\\,dx$: $$I = -\\int (1-u^{2})^{" + k + "}" +
      (n > 0 ? "\\,u^{" + n + "}" : "") + "\\,du$$"
    );
    steps.push(
      "Expandimos el binomio: $$I = -\\int\\left(" + productTex(k, n, "u", "") + "\\right)\\,du$$"
    );
    var ant = [];
    for (var j = 0; j <= k; j++) {
      var coef = binom(k, j) * (j % 2 ? -1 : 1) * -1; // signo extra por el "−" inicial
      ant.push(mono(coef, 2 * j + n + 1, "u", ""));
    }
    steps.push("Integramos término a término: $$I = " + sumTex(ant) + "$$");
    var ans = [];
    for (var j2 = 0; j2 <= k; j2++) {
      var c2 = binom(k, j2) * (j2 % 2 ? -1 : 1) * -1;
      ans.push(mono(c2, 2 * j2 + n + 1, "\\cos", " x"));
    }
    steps.push(
      "Regresamos con $u = \\cos x$: $$\\int " + integrand(m, n) + "\\,dx = " + sumTex(ans) + " + C$$"
    );
    return steps;
  }

  // Caso 2: n impar → u = sin x. Antiderivada exacta como polinomio en sin x.
  function desarrolloCaso2(m, n) {
    var k = (n - 1) / 2;
    // cos x · sin^m x · cos^{n-1} x (omite potencias cero)
    var mani = ["\\cos x"];
    if (m > 0) mani.push("\\sin^{" + m + "} x");
    if (n - 1 > 0) mani.push("\\cos^{" + (n - 1) + "} x");
    var steps = [];
    steps.push(
      "Identificamos $n = " + n + "$ **impar**: aplica el <b>Caso 2</b>. Apartamos un factor $\\cos x$: " +
      "$" + integrand(m, n) + " = " + mani.join("\\,") + "$."
    );
    steps.push(
      "La potencia restante es par: $\\cos^{" + (n - 1) + "} x = (\\cos^{2} x)^{" + k + "} = (1-\\sin^{2} x)^{" + k + "}$."
    );
    steps.push(
      "Sustituimos $u = \\sin x$, $du = \\cos x\\,dx$: $$I = \\int" +
      (m > 0 ? "\\,u^{" + m + "}" : "") + "(1-u^{2})^{" + k + "}\\,du$$"
    );
    steps.push(
      "Expandimos el binomio: $$I = \\int\\left(" + productTex(k, m, "u", "") + "\\right)\\,du$$"
    );
    var ant = [];
    for (var j = 0; j <= k; j++) {
      var coef = binom(k, j) * (j % 2 ? -1 : 1);
      ant.push(mono(coef, m + 2 * j + 1, "u", ""));
    }
    steps.push("Integramos término a término: $$I = " + sumTex(ant) + "$$");
    var ans = [];
    for (var j2 = 0; j2 <= k; j2++) {
      var c2 = binom(k, j2) * (j2 % 2 ? -1 : 1);
      ans.push(mono(c2, m + 2 * j2 + 1, "\\sin", " x"));
    }
    steps.push(
      "Regresamos con $u = \\sin x$: $$\\int " + integrand(m, n) + "\\,dx = " + sumTex(ans) + " + C$$"
    );
    return steps;
  }

  /* ============== pasos descriptivos (cuando no hay desarrollo) ============== */

  var PASOS_CASO1_DESC = [
    "Apartamos un factor $\\sin x$: el resto $\\sin^{m-1} x$ tiene potencia par.",
    "Convertimos $\\sin^{m-1} x = (\\sin^{2} x)^{(m-1)/2} = (1-\\cos^{2} x)^{(m-1)/2}$.",
    "Sustituimos $u = \\cos x$, $du = -\\sin x\\,dx$: el integrando se vuelve un polinomio en $u$.",
    "Expandimos el binomio, integramos término a término y regresamos con $u = \\cos x$.",
  ];

  var PASOS_CASO2_DESC = [
    "Apartamos un factor $\\cos x$: el resto $\\cos^{n-1} x$ tiene potencia par.",
    "Convertimos $\\cos^{n-1} x = (\\cos^{2} x)^{(n-1)/2} = (1-\\sin^{2} x)^{(n-1)/2}$.",
    "Sustituimos $u = \\sin x$, $du = \\cos x\\,dx$: el integrando se vuelve un polinomio en $u$.",
    "Expandimos el binomio, integramos término a término y regresamos con $u = \\sin x$.",
  ];

  var PASOS_CASO3_DESC = [
    "Ambos exponentes son pares: no hay factor impar que apartar como diferencial.",
    "Aplicamos ángulo mitad: $\\sin^{2} x = \\frac{1-\\cos 2x}{2}$ y $\\cos^{2} x = \\frac{1+\\cos 2x}{2}$.",
    "Linealizamos el producto, aplicando también $\\sin 2x = 2\\sin x\\cos x$ cuando convenga.",
    "Reducimos iterativamente las potencias pares restantes hasta integrar término a término.",
  ];

  /* ============ casos 3 resueltos (m, n pares, m+n ≤ 8) ============ */
  var CASO3 = {
    "2,0": {
      pasos: [
        "Ambos exponentes pares: usamos ángulo mitad: $\\sin^{2} x = \\frac{1-\\cos 2x}{2}$.",
        "Integramos: $\\int \\frac{1}{2}\\,dx - \\frac{1}{2}\\int \\cos 2x\\,dx = \\frac{x}{2} - \\frac{\\sin 2x}{4}$.",
      ],
      ans: "\\frac{x}{2} - \\frac{\\sin 2x}{4} + C",
    },
    "0,2": {
      pasos: [
        "Ángulo mitad: $\\cos^{2} x = \\frac{1+\\cos 2x}{2}$.",
        "Integramos: $\\int \\frac{1}{2}\\,dx + \\frac{1}{2}\\int \\cos 2x\\,dx = \\frac{x}{2} + \\frac{\\sin 2x}{4}$.",
      ],
      ans: "\\frac{x}{2} + \\frac{\\sin 2x}{4} + C",
    },
    "2,2": {
      pasos: [
        "Reagrupamos el producto: $\\sin^{2} x\\cos^{2} x = (\\sin x\\cos x)^{2}$.",
        "Aplicamos el ángulo doble $\\sin 2x = 2\\sin x\\cos x$: $(\\sin x\\cos x)^{2} = \\left(\\frac{\\sin 2x}{2}\\right)^{2} = \\frac{\\sin^{2} 2x}{4}$.",
        "Linealizamos con ángulo mitad: $\\sin^{2} 2x = \\frac{1-\\cos 4x}{2}$, de modo que el integrando queda $\\frac{1-\\cos 4x}{8}$.",
        "Integramos término a término: $\\int \\frac{1}{8}\\,dx - \\frac{1}{8}\\int \\cos 4x\\,dx = \\frac{x}{8} - \\frac{\\sin 4x}{32}$.",
      ],
      ans: "\\frac{x}{8} - \\frac{\\sin 4x}{32} + C",
    },
    "4,0": {
      pasos: [
        "$\\sin^{4} x = (\\sin^{2} x)^{2} = \\left(\\frac{1-\\cos 2x}{2}\\right)^{2} = \\frac{1 - 2\\cos 2x + \\cos^{2} 2x}{4}$.",
        "Segunda linealización: $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$, con lo que $\\sin^{4} x = \\frac{3}{8} - \\frac{1}{2}\\cos 2x + \\frac{1}{8}\\cos 4x$.",
        "Integramos: $\\frac{3x}{8} - \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32}$.",
      ],
      ans: "\\frac{3x}{8} - \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32} + C",
    },
    "0,4": {
      pasos: [
        "$\\cos^{4} x = \\left(\\frac{1+\\cos 2x}{2}\\right)^{2} = \\frac{1 + 2\\cos 2x + \\cos^{2} 2x}{4}$.",
        "Con $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$: $\\cos^{4} x = \\frac{3}{8} + \\frac{1}{2}\\cos 2x + \\frac{1}{8}\\cos 4x$.",
        "Integramos: $\\frac{3x}{8} + \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32}$.",
      ],
      ans: "\\frac{3x}{8} + \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32} + C",
    },
    "2,4": {
      pasos: [
        "$\\sin^{2} x\\cos^{4} x = \\frac{1-\\cos 2x}{2}\\cdot\\left(\\frac{1+\\cos 2x}{2}\\right)^{2} = \\frac{1 + \\cos 2x - \\cos^{2} 2x - \\cos^{3} 2x}{8}$.",
        "Linealizamos: $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$ y $\\cos^{3} 2x = \\frac{3\\cos 2x + \\cos 6x}{4}$: queda $\\frac{1}{16} + \\frac{\\cos 2x}{32} - \\frac{\\cos 4x}{16} - \\frac{\\cos 6x}{32}$.",
        "Integramos: $\\frac{x}{16} + \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{64} - \\frac{\\sin 6x}{192}$.",
      ],
      ans: "\\frac{x}{16} + \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{64} - \\frac{\\sin 6x}{192} + C",
    },
    "4,2": {
      pasos: [
        "$\\sin^{4} x\\cos^{2} x = \\left(\\frac{1-\\cos 2x}{2}\\right)^{2}\\cdot\\frac{1+\\cos 2x}{2} = \\frac{1 - \\cos 2x - \\cos^{2} 2x + \\cos^{3} 2x}{8}$.",
        "Linealizamos: $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$ y $\\cos^{3} 2x = \\frac{3\\cos 2x + \\cos 6x}{4}$: queda $\\frac{1}{16} - \\frac{\\cos 2x}{32} - \\frac{\\cos 4x}{16} + \\frac{\\cos 6x}{32}$.",
        "Integramos: $\\frac{x}{16} - \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{64} + \\frac{\\sin 6x}{192}$.",
      ],
      ans: "\\frac{x}{16} - \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{64} + \\frac{\\sin 6x}{192} + C",
    },
    "4,4": {
      pasos: [
        "$\\sin^{4} x\\cos^{4} x = (\\sin x\\cos x)^{4} = \\left(\\frac{\\sin 2x}{2}\\right)^{4} = \\frac{\\sin^{4} 2x}{16}$.",
        "Con $\\sin^{4} 2x = \\frac{3}{8} - \\frac{\\cos 4x}{2} + \\frac{\\cos 8x}{8}$: queda $\\frac{3}{128} - \\frac{\\cos 4x}{32} + \\frac{\\cos 8x}{128}$.",
        "Integramos: $\\frac{3x}{128} - \\frac{\\sin 4x}{128} + \\frac{\\sin 8x}{1024}$.",
      ],
      ans: "\\frac{3x}{128} - \\frac{\\sin 4x}{128} + \\frac{\\sin 8x}{1024} + C",
    },
    "6,0": {
      pasos: [
        "$\\sin^{6} x = \\left(\\frac{1-\\cos 2x}{2}\\right)^{3} = \\frac{1 - 3\\cos 2x + 3\\cos^{2} 2x - \\cos^{3} 2x}{8}$.",
        "Linealizamos con $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$ y $\\cos^{3} 2x = \\frac{3\\cos 2x + \\cos 6x}{4}$: queda $\\frac{5}{16} - \\frac{15\\cos 2x}{32} + \\frac{3\\cos 4x}{16} - \\frac{\\cos 6x}{32}$.",
        "Integramos: $\\frac{5x}{16} - \\frac{15\\sin 2x}{64} + \\frac{3\\sin 4x}{64} - \\frac{\\sin 6x}{192}$.",
      ],
      ans: "\\frac{5x}{16} - \\frac{15\\sin 2x}{64} + \\frac{3\\sin 4x}{64} - \\frac{\\sin 6x}{192} + C",
    },
    "0,6": {
      pasos: [
        "$\\cos^{6} x = \\left(\\frac{1+\\cos 2x}{2}\\right)^{3} = \\frac{5}{16} + \\frac{15\\cos 2x}{32} + \\frac{3\\cos 4x}{16} + \\frac{\\cos 6x}{32}$.",
        "Integramos: $\\frac{5x}{16} + \\frac{15\\sin 2x}{64} + \\frac{3\\sin 4x}{64} + \\frac{\\sin 6x}{192}$.",
      ],
      ans: "\\frac{5x}{16} + \\frac{15\\sin 2x}{64} + \\frac{3\\sin 4x}{64} + \\frac{\\sin 6x}{192} + C",
    },
    "2,6": {
      pasos: [
        "Por $\\sin^{2} x = 1-\\cos^{2} x$: $\\sin^{2} x\\cos^{6} x = \\cos^{6} x - \\cos^{8} x$.",
        "Con $\\cos^{6} x = \\frac{5}{16} + \\frac{15\\cos 2x}{32} + \\frac{3\\cos 4x}{16} + \\frac{\\cos 6x}{32}$ y $\\cos^{8} x = \\frac{35}{128} + \\frac{7\\cos 2x}{16} + \\frac{7\\cos 4x}{32} + \\frac{\\cos 6x}{16} + \\frac{\\cos 8x}{128}$, la diferencia queda $\\frac{5}{128} + \\frac{\\cos 2x}{32} - \\frac{\\cos 4x}{32} - \\frac{\\cos 6x}{32} - \\frac{\\cos 8x}{128}$.",
        "Integramos: $\\frac{5x}{128} + \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{128} - \\frac{\\sin 6x}{192} - \\frac{\\sin 8x}{1024}$.",
      ],
      ans: "\\frac{5x}{128} + \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{128} - \\frac{\\sin 6x}{192} - \\frac{\\sin 8x}{1024} + C",
    },
    "6,2": {
      pasos: [
        "Por $\\cos^{2} x = 1-\\sin^{2} x$: $\\sin^{6} x\\cos^{2} x = \\sin^{6} x - \\sin^{8} x$.",
        "Con $\\sin^{6} x = \\frac{5}{16} - \\frac{15\\cos 2x}{32} + \\frac{3\\cos 4x}{16} - \\frac{\\cos 6x}{32}$ y $\\sin^{8} x = \\frac{35}{128} - \\frac{7\\cos 2x}{16} + \\frac{7\\cos 4x}{32} - \\frac{\\cos 6x}{16} + \\frac{\\cos 8x}{128}$, la diferencia queda $\\frac{5}{128} - \\frac{\\cos 2x}{32} - \\frac{\\cos 4x}{32} + \\frac{\\cos 6x}{32} - \\frac{\\cos 8x}{128}$.",
        "Integramos: $\\frac{5x}{128} - \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{128} + \\frac{\\sin 6x}{192} - \\frac{\\sin 8x}{1024}$.",
      ],
      ans: "\\frac{5x}{128} - \\frac{\\sin 2x}{64} - \\frac{\\sin 4x}{128} + \\frac{\\sin 6x}{192} - \\frac{\\sin 8x}{1024} + C",
    },
  };

  // valores exactos de ∫₀^{2π} sin^m·cos^n para exponentes pares
  function exactoPeriodo(m, n) {
    if (m % 2 === 1 || n % 2 === 1) {
      return { tex: "0", val: 0, nota: "Con m o n impar el integrando tiene media nula en un período completo: la integral exacta es 0." };
    }
    var T = {
      "0,0": ["2\\pi", 2 * Math.PI],
      "2,0": ["\\pi", Math.PI], "0,2": ["\\pi", Math.PI],
      "2,2": ["\\frac{\\pi}{4}", Math.PI / 4],
      "4,0": ["\\frac{3\\pi}{4}", 3 * Math.PI / 4], "0,4": ["\\frac{3\\pi}{4}", 3 * Math.PI / 4],
      "2,4": ["\\frac{\\pi}{8}", Math.PI / 8], "4,2": ["\\frac{\\pi}{8}", Math.PI / 8],
      "4,4": ["\\frac{3\\pi}{64}", 3 * Math.PI / 64],
      "6,0": ["\\frac{5\\pi}{8}", 5 * Math.PI / 8], "0,6": ["\\frac{5\\pi}{8}", 5 * Math.PI / 8],
      "2,6": ["\\frac{5\\pi}{64}", 5 * Math.PI / 64], "6,2": ["\\frac{5\\pi}{64}", 5 * Math.PI / 64],
    };
    var e = T[m + "," + n];
    return e ? { tex: e[0], val: e[1], nota: "Ambos exponentes pares: el valor exacto del período completo es " + e[0] + "." } : null;
  }

  /* ================= ejemplos de referencia (escritos) ================= */

  var REFS = [
    {
      caso: 1,
      titulo: "Caso 1 · ∫ sin³x cos²x dx",
      pasos: [
        "Identificamos $m=3$ **impar**: apartamos un factor $\\sin x$: $\\sin^{3} x\\cos^{2} x = \\sin x\\,\\sin^{2} x\\,\\cos^{2} x$.",
        "Convertimos la potencia par: $\\sin^{2} x = 1-\\cos^{2} x$, de modo que el integrando queda $\\sin x\\,(1-\\cos^{2} x)\\,\\cos^{2} x$.",
        "Sustituimos $u = \\cos x$, con $du = -\\sin x\\,dx$: $-\\int (1-u^{2})\\,u^{2}\\,du$.",
        "Expandimos: $-\\int (u^{2}-u^{4})\\,du = -\\frac{u^{3}}{3} + \\frac{u^{5}}{5}$.",
        "Regresamos con $u = \\cos x$ y añadimos la constante.",
      ],
      answer: "\\int \\sin^{3} x\\,\\cos^{2} x\\,dx = \\frac{\\cos^{5} x}{5} - \\frac{\\cos^{3} x}{3} + C",
    },
    {
      caso: 2,
      titulo: "Caso 2 · ∫ sin²x cos³x dx",
      pasos: [
        "Identificamos $n=3$ **impar**: apartamos un factor $\\cos x$: $\\sin^{2} x\\cos^{3} x = \\cos x\\,\\sin^{2} x\\,\\cos^{2} x$.",
        "Convertimos la potencia par: $\\cos^{2} x = 1-\\sin^{2} x$, de modo que el integrando queda $\\cos x\\,\\sin^{2} x\\,(1-\\sin^{2} x)$.",
        "Sustituimos $u = \\sin x$, con $du = \\cos x\\,dx$: $\\int u^{2}\\,(1-u^{2})\\,du$.",
        "Expandimos: $\\int (u^{2}-u^{4})\\,du = \\frac{u^{3}}{3} - \\frac{u^{5}}{5}$.",
        "Regresamos con $u = \\sin x$ y añadimos la constante.",
      ],
      answer: "\\int \\sin^{2} x\\,\\cos^{3} x\\,dx = \\frac{\\sin^{3} x}{3} - \\frac{\\sin^{5} x}{5} + C",
    },
    {
      caso: 3,
      titulo: "Caso 3 · ∫ sin²x cos²x dx",
      pasos: [
        "Ambos exponentes pares: no hay factor impar que apartar. Reagrupamos: $\\sin^{2} x\\cos^{2} x = (\\sin x\\cos x)^{2}$.",
        "Aplicamos el ángulo doble $\\sin 2x = 2\\sin x\\cos x$: $(\\sin x\\cos x)^{2} = \\left(\\frac{\\sin 2x}{2}\\right)^{2} = \\frac{\\sin^{2} 2x}{4}$.",
        "Linealizamos con ángulo mitad: $\\sin^{2} 2x = \\frac{1-\\cos 4x}{2}$, y el integrando queda $\\frac{1-\\cos 4x}{8}$.",
        "Integramos término a término: $\\frac{x}{8} - \\frac{\\sin 4x}{32}$.",
      ],
      answer: "\\int \\sin^{2} x\\,\\cos^{2} x\\,dx = \\frac{x}{8} - \\frac{\\sin 4x}{32} + C",
    },
    {
      caso: 3,
      titulo: "Caso 3 · ∫ sin⁴x dx",
      pasos: [
        "Ángulo mitad aplicado dos veces: $\\sin^{4} x = \\left(\\frac{1-\\cos 2x}{2}\\right)^{2} = \\frac{1 - 2\\cos 2x + \\cos^{2} 2x}{4}$.",
        "Segunda linealización: $\\cos^{2} 2x = \\frac{1+\\cos 4x}{2}$, de modo que $\\sin^{4} x = \\frac{3}{8} - \\frac{1}{2}\\cos 2x + \\frac{1}{8}\\cos 4x$.",
        "Integramos: $\\frac{3x}{8} - \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32}$.",
      ],
      answer: "\\int \\sin^{4} x\\,dx = \\frac{3x}{8} - \\frac{\\sin 2x}{4} + \\frac{\\sin 4x}{32} + C",
    },
  ];

  /* ================= herramienta ================= */

  var CINFO = {
    0: { titulo: "Trivial — integrando constante", sub: "m = 0 y n = 0: el integrando es 1 y la integral es inmediata.", color: "#34d399" },
    1: { titulo: "Caso 1 — m impar", sub: "Apartar sin x · convertir sin² → 1 − cos² · sustituir u = cos x", color: "#38bdf8" },
    2: { titulo: "Caso 2 — n impar", sub: "Apartar cos x · convertir cos² → 1 − sin² · sustituir u = sin x", color: "#fbbf24" },
    3: { titulo: "Caso 3 — ambos exponentes pares", sub: "Ángulo mitad · linealizar · reducir iterativamente", color: "#f87171" },
  };

  window.TOOLS["trigonometria"] = {
    title: "Analizador de integrales trigonométricas",
    description: "Clasifica ∫sinᵐx·cosⁿx dx según la paridad de m y n, muestra la estrategia y comprueba numéricamente con la Regla de Simpson.",
    icon: "🌀",

    mount: function (host, cfg) {
      var st = { m: 3, n: 2, x: 6.3 };

      host.appendChild(H.el(
        '<style>.ref-card.ref-active{border-color:rgba(52,211,153,0.75)!important;box-shadow:0 0 0 1px rgba(52,211,153,0.3)}</style>'
      ));

      /* --- controles --- */
      var controls = H.el('<div class="tool-controls"></div>');
      var slM = H.slider("Exponente m (potencia de sin)", 0, 7, 1, st.m, function (v) { st.m = v; draw(); });
      var slN = H.slider("Exponente n (potencia de cos)", 0, 7, 1, st.n, function (v) { st.n = v; draw(); });
      var slX = makeSlider("Límite de integración x (rad)", 0, 6.3, 0.1, st.x, function (v) { st.x = v; draw(); });
      controls.appendChild(slM.el);
      controls.appendChild(slN.el);
      controls.appendChild(slX.el);
      host.appendChild(controls);

      /* --- salida --- */
      var out = H.resultPanel("");
      host.appendChild(out);

      /* --- gráfico --- */
      var chart = H.chart();
      host.appendChild(chart.el);

      /* --- ejemplos de referencia (siempre visibles) --- */
      var refs = H.el('<div style="margin-top:16px"><div style="font-weight:700;margin-bottom:6px">📚 Ejemplos de referencia resueltos</div></div>');
      REFS.forEach(function (ref, i) {
        var html =
          '<details class="ref-card" data-ref="' + i + '" style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin:8px 0;background:var(--bg-2)">' +
          '<summary style="cursor:pointer;font-weight:600">📝 ' + ref.titulo + "</summary>" +
          '<ol class="t-steps">' + ref.pasos.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol>" +
          '<div class="formula-box">' + math.raw("$$" + ref.answer + "$$") + "</div>" +
          "</details>";
        refs.appendChild(H.el(math.raw(html)));
      });
      host.appendChild(refs);

      /* --- clasificación --- */
      function clasificar(m, n) {
        if (m === 0 && n === 0) return 0;
        if (m % 2 === 1) return 1;
        if (n % 2 === 1) return 2;
        return 3;
      }

      function pasosHtml(lista) {
        return math.raw('<ol class="t-steps">' + lista.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol>");
      }

      function draw() {
        var m = st.m, n = st.n, x = st.x;
        var caso = clasificar(m, n);
        var ci = CINFO[caso];
        var f = function (t) { return Math.pow(Math.sin(t), m) * Math.pow(Math.cos(t), n); };

        var html = "";

        /* veredicto grande */
        html += '<div class="tool-out" style="border-style:solid;border-color:' + ci.color + '55;background:linear-gradient(135deg,rgba(108,140,255,0.14),rgba(56,189,248,0.06))">' +
          '<div style="font-size:19px;font-weight:800;color:' + ci.color + '">' + ci.titulo + "</div>" +
          '<div style="color:var(--text-dim);font-size:13.5px;margin-top:3px">' + ci.sub + "</div>" +
          '<div style="margin-top:8px"><span class="chip" style="border-color:rgba(108,140,255,0.5)">m = ' + m + ' · n = ' + n + "</span>" +
          '<span style="font-size:12px;color:var(--text-dim);margin-left:8px">Regla: m impar → Caso 1 · n impar → Caso 2 · ambos pares → Caso 3</span></div>' +
          "</div>";

        /* la integral en cuestión */
        html += '<div style="text-align:center;margin:12px 0">' + math.raw("$$\\int " + integrand(m, n) + "\\,dx$$") + "</div>";

        /* estrategia / desarrollo */
        if (caso === 0) {
          html += pasosHtml([
            "El integrando es $1$ (no hay ni senos ni cosenos): la integral es inmediata.",
            "$$\\int 1\\,dx = x + C$$",
          ]);
        } else if (caso === 1) {
          html += pasosHtml(m + n <= 8 ? desarrolloCaso1(m, n) : PASOS_CASO1_DESC);
        } else if (caso === 2) {
          html += pasosHtml(m + n <= 8 ? desarrolloCaso2(m, n) : PASOS_CASO2_DESC);
        } else {
          var key = m + "," + n;
          var t = CASO3[key];
          if (t) {
            html += pasosHtml(t.pasos);
            html += '<div class="formula-box">' + math.raw("$$\\int " + integrand(m, n) + "\\,dx = " + t.ans + "$$") + "</div>";
          } else {
            html += pasosHtml(PASOS_CASO3_DESC);
            html += math.raw(
              '<div class="callout note" style="margin:10px 0"><div class="callout-title">Consulta el ejemplo de referencia</div>' +
              "Este caso ($m = " + m + "$, $n = " + n + "$) exige iterar el ángulo mitad varias veces; el patrón completo se muestra en el ejemplo de referencia del Caso 3 de abajo (∫ sin²x cos²x dx y ∫ sin⁴x dx).</div>"
            );
          }
        }

        /* comprobación numérica */
        var full = 2 * Math.PI;
        var vX = simpson(f, 0, x, 400);
        var vFull = simpson(f, 0, full, 400);
        html += '<div class="tool-out" style="margin-top:12px"><b>🔢 Comprobación numérica — Regla de Simpson</b><br>' +
          math.raw("$$\\int_{0}^{" + H.num(x, 2) + "} " + integrand(m, n) + "\\,dx \\approx " + H.num(vX, 5) + "$$") +
          math.raw("$$\\int_{0}^{2\\pi} " + integrand(m, n) + "\\,dx \\approx " + H.num(vFull, 6) + "$$");
        var ex = exactoPeriodo(m, n);
        if (ex) {
          html += "Valor exacto en el período completo: <b>" + math.raw("$" + ex.tex + "$") + "</b> (" + H.num(ex.val, 6) + ") — " +
            truthHtml(Math.abs(vFull - ex.val) < 1e-5) + "<br>" +
            '<span style="font-size:12.5px;color:var(--text-dim)">' + ex.nota + "</span>";
        } else {
          html += '<span style="font-size:12.5px;color:var(--text-dim)">Ambos exponentes pares fuera de la tabla exacta: la comprobación es solo numérica.</span>';
        }
        html += "</div>";

        out.innerHTML = html;

        /* gráfico */
        var NPTS = 400;
        var xs = [], ys = [];
        var ymin = Infinity, ymax = -Infinity;
        for (var i = 0; i <= NPTS; i++) {
          var t = full * i / NPTS;
          var v = f(t);
          xs.push(t); ys.push(v);
          if (v < ymin) ymin = v;
          if (v > ymax) ymax = v;
        }
        var ax = [], ay = [];
        var NX = Math.max(4, Math.round(x / full * NPTS));
        for (var j = 0; j <= NX; j++) {
          var t2 = x * j / NX;
          ax.push(t2); ay.push(f(t2));
        }
        if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
        var data = [
          {
            type: "scatter", mode: "lines", x: ax, y: ay,
            fill: "toself", fillcolor: "rgba(108,140,255,0.35)",
            line: { color: "rgba(108,140,255,0.9)", width: 1.5 },
            name: "área", hoverinfo: "skip",
          },
          {
            type: "scatter", mode: "lines", x: [x, x], y: [ymin, ymax],
            line: { color: "#fbbf24", width: 2.5, dash: "dot" }, name: "x", hoverinfo: "skip",
          },
          {
            type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: "#38bdf8", width: 3 }, name: "f(x)",
            hovertemplate: "x=%{x:.3f}<br>f=%{y:.4f}<extra></extra>",
          },
        ];
        chart.plot(data, {
          title: { text: "f(x) = sin^" + m + "(x) · cos^" + n + "(x)  —  área de 0 a " + H.num(x, 2), font: { color: "#e8eaf6", size: 14 } },
          showlegend: false,
          xaxis: {
            title: { text: "x (rad)" }, range: [0, 6.45],
            tickvals: [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI],
            ticktext: ["0", "π/2", "π", "3π/2", "2π"],
          },
          yaxis: { title: { text: "y" }, zeroline: true },
        });

        /* resaltar ejemplo de referencia del caso detectado */
        host.querySelectorAll(".ref-card").forEach(function (c) { c.classList.remove("ref-active"); });
        var idx = caso === 1 ? [0] : caso === 2 ? [1] : caso === 3 ? [2, 3] : [];
        idx.forEach(function (i) {
          host.querySelectorAll('.ref-card[data-ref="' + i + '"]').forEach(function (c) { c.classList.add("ref-active"); });
        });

        window.renderMath && window.renderMath(host);
      }

      draw();
    },
  };
})();
