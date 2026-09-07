/* ===== tools/inmediatas.js — Entrenador de integrales inmediatas (U3) ===== */
(function () {
  "use strict";

  window.TOOLS = window.TOOLS || {};

  /* ---------- utilidades ---------- */

  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function dedupe(arr) {
    return arr.filter(function (v, i) { return arr.indexOf(v) === i; });
  }

  /**
   * Normaliza una respuesta escrita por el usuario:
   * minúsculas, sin espacios, ** -> ^, +C opcional, sinónimos sen/sin, tg/tan,
   * ctg/cot, arctg/arctan/atan, sqrt unicode, exp(x) -> e^(x), |x| -> (x).
   * El orden de los reemplazos importa: ctg antes que tg, arctg antes que tg,
   * sen antes que arcsin (para "arcsen"), e^x antes que exp.
   */
  function normAnswer(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\*\*/g, "^")
      .replace(/\|x\|/g, "(x)")
      .replace(/\|/g, "")
      .replace(/√/g, "sqrt")
      .replace(/e\^x/g, "e^(x)")
      .replace(/sen\(/g, "sin(")
      .replace(/sen/g, "sin")
      .replace(/arctg\(/g, "atan(")
      .replace(/arctg/g, "atan")
      .replace(/arcsin\(/g, "asin(")
      .replace(/arcsin/g, "asin")
      .replace(/arccos\(/g, "acos(")
      .replace(/arccos/g, "acos")
      .replace(/arctan\(/g, "atan(")
      .replace(/arctan/g, "atan")
      .replace(/ctg\(/g, "cot(")
      .replace(/ctg/g, "cot")
      .replace(/tg\(/g, "tan(")
      .replace(/tg/g, "tan")
      .replace(/sin\^-1\(/g, "asin(")
      .replace(/cos\^-1\(/g, "acos(")
      .replace(/tan\^-1\(/g, "atan(")
      .replace(/exp\(/g, "e^(")
      .replace(/\+c/g, "");
  }

  /** Coeficiente numérico bonito: entero, fracción simple o decimal. */
  function fmtCoef(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    var NICE = [2, 3, 4, 5, 6, 8];
    for (var i = 0; i < NICE.length; i++) {
      var d = NICE[i];
      var n = Math.round(v * d);
      if (Math.abs(v - n / d) < 1e-9) return n + "/" + d;
    }
    return H.num(v, 4);
  }

  /** Polinomio en texto plano: "3x^2+2x-1". coefs = [{v, p}] con p >= 0, orden desc. */
  function buildPoly(coefs) {
    var out = "";
    coefs.forEach(function (c, i) {
      var neg = c.v < 0;
      var t = fmtCoef(Math.abs(c.v));
      var term;
      if (c.p === 0) term = t;
      else { var base = c.p === 1 ? "x" : "x^" + c.p; term = t === "1" ? base : t + base; }
      out += (i === 0 ? (neg ? "-" : "") : (neg ? "-" : "+")) + term;
    });
    return out;
  }

  /** Polinomio en LaTeX: "3x^{2}+2x-1". */
  function buildPolyTex(coefs) {
    var out = "";
    coefs.forEach(function (c, i) {
      var neg = c.v < 0;
      var t = fmtCoef(Math.abs(c.v));
      var term;
      if (c.p === 0) term = t;
      else { var base = c.p === 1 ? "x" : "x^{" + c.p + "}"; term = t === "1" ? base : t + base; }
      out += (i === 0 ? (neg ? "-" : "") : (neg ? "-" : "+")) + term;
    });
    return out;
  }

  /* ---------- plantillas: cada generador calcula la antiderivada (no hardcodea) ---------- */

  /** P1: ∫ a·x^n dx — (a, n) elegidos para que a/(n+1) sea "bonito". */
  function genPowerSimple() {
    var pairs = [[3, 2], [2, 3], [5, 4], [4, 3], [6, 2], [2, 5], [4, 5], [6, 5], [2, 1], [3, 4], [5, 2]];
    var p = rnd(pairs);
    var a = p[0], n = p[1];
    var e = n + 1;
    var g = gcd(a, e);
    var N = a / g, D = e / g;
    var base = "x^" + e;
    var sol, variants, solTex;
    if (D === 1) {
      sol = (N === 1 ? base : N + base);
      variants = [sol];
      solTex = (N === 1 ? "" : N + "") + "x^{" + e + "}";
    } else {
      var fr = N + "/" + D;
      sol = fr + base;
      variants = [sol, "(" + fr + ")" + base];
      variants.push((N === 1 ? "" : N) + base + "/" + D);
      variants.push(H.num(N / D, 4) + base);
      solTex = (N === 1 ? "" : N) + "\\frac{x^{" + e + "}}{" + D + "}";
    }
    return {
      tex: "\\int " + (a === 1 ? "" : a) + "x^{" + n + "}\\,dx",
      solution: sol,
      variants: dedupe(variants),
      solTex: solTex,
    };
  }

  /** P2: ∫ (a·x + b) dx — linealidad con dos términos. */
  function genPowerLinear() {
    var a = rnd([2, 3, 4, 6]);
    var b = rnd([-5, -3, -2, -1, 1, 2, 3, 5]);
    var outC = [{ v: a / 2, p: 2 }, { v: b, p: 1 }];
    var sol = buildPoly(outC);
    var variants = [sol];
    if (a === 3) { // 3/2 se puede escribir de varias formas
      variants.push(sol.replace("3/2x^2", "(3/2)x^2"));
      variants.push(sol.replace("3/2x^2", "1.5x^2"));
      variants.push(sol.replace("3/2x^2", "3x^2/2"));
    }
    return {
      tex: "\\int (" + buildPolyTex([{ v: a, p: 1 }, { v: b, p: 0 }]) + ")\\,dx",
      solution: sol,
      variants: dedupe(variants),
      solTex: buildPolyTex(outC),
    };
  }

  /** P3: ∫ (a·x² + b·x + c) dx — trinomio término a término. */
  function genPowerPoly() {
    var a = rnd([3, 6, 9, 12]);
    var b = rnd([-6, -4, -2, 2, 4, 6]);
    var c = rnd([-5, -3, -2, -1, 1, 2, 3, 5]);
    var inC = [{ v: a, p: 2 }, { v: b, p: 1 }, { v: c, p: 0 }];
    var outC = [{ v: a / 3, p: 3 }, { v: b / 2, p: 2 }, { v: c, p: 1 }];
    return {
      tex: "\\int (" + buildPolyTex(inC) + ")\\,dx",
      solution: buildPoly(outC),
      variants: [buildPoly(outC)],
      solTex: buildPolyTex(outC),
    };
  }

  /** E1: ∫ a·e^x dx. */
  function genExpSimple() {
    var a = rnd([2, 3, 4, 5]);
    var sol = a + "e^x";
    return {
      tex: "\\int " + a + "e^{x}\\,dx",
      solution: sol,
      variants: [sol, a + "e^(x)", a + "exp(x)"],
      solTex: a + "e^{x}",
    };
  }

  /** E2: ∫ a·b^x dx = a·b^x / ln b. */
  function genExpBase() {
    var b = rnd([2, 3]);
    var a = rnd([2, 3]);
    var sol = a + "*" + b + "^x/ln(" + b + ")";
    return {
      tex: "\\int " + a + "\\cdot " + b + "^{x}\\,dx",
      solution: sol,
      variants: [sol, a + "*" + b + "^x/ln" + b, "(" + a + "*" + b + "^x)/ln(" + b + ")", "(" + a + "*" + b + "^x)/ln" + b],
      solTex: a + "\\cdot\\frac{" + b + "^{x}}{\\ln " + b + "}",
    };
  }

  /** T1..T7: plantillas trigonométricas (índice 0..6). */
  function trigTemplate(k) {
    var a = rnd([2, 3, 4, 5]);
    var sol, variants, tex, solTex;
    if (k === 0) {            // ∫ a·sin x dx = -a·cos x
      tex = "\\int " + a + "\\sin x\\,dx";
      sol = "-" + a + "cos(x)";
      variants = ["-" + a + "cos(x)", "-" + a + "cosx"];
      solTex = "-" + a + "\\cos x";
    } else if (k === 1) {     // ∫ a·cos x dx = a·sin x
      tex = "\\int " + a + "\\cos x\\,dx";
      sol = a + "sin(x)";
      variants = [a + "sin(x)", a + "sinx", a + "sen(x)", a + "senx"];
      solTex = a + "\\sin x";
    } else if (k === 2) {     // ∫ a·sec²x dx = a·tan x
      tex = "\\int " + a + "\\sec^2 x\\,dx";
      sol = a + "tan(x)";
      variants = [a + "tan(x)", a + "tanx", a + "tg(x)", a + "tgx"];
      solTex = a + "\\tan x";
    } else if (k === 3) {     // ∫ a·sec x·tan x dx = a·sec x
      tex = "\\int " + a + "\\sec x\\tan x\\,dx";
      sol = a + "sec(x)";
      variants = [a + "sec(x)", a + "secx"];
      solTex = a + "\\sec x";
    } else if (k === 4) {     // ∫ a·csc²x dx = -a·cot x
      tex = "\\int " + a + "\\csc^2 x\\,dx";
      sol = "-" + a + "cot(x)";
      variants = ["-" + a + "cot(x)", "-" + a + "cotx", "-" + a + "ctg(x)", "-" + a + "ctgx"];
      solTex = "-" + a + "\\cot x";
    } else if (k === 5) {     // ∫ a/(1+x²) dx = a·arctan x
      tex = "\\int \\frac{" + a + "}{1+x^2}\\,dx";
      sol = a + "arctan(x)";
      variants = [a + "arctan(x)", a + "atan(x)", a + "arctg(x)", a + "tan^-1(x)", a + "atanx", a + "arctanx"];
      solTex = a + "\\arctan x";
    } else {                  // ∫ a/√(1-x²) dx = a·arcsin x
      tex = "\\int \\frac{" + a + "}{\\sqrt{1-x^2}}\\,dx";
      sol = a + "arcsin(x)";
      variants = [a + "arcsin(x)", a + "asin(x)", a + "sin^-1(x)", a + "asinx", a + "arcsinx"];
      solTex = a + "\\arcsin x";
    }
    return { tex: tex, solution: sol, variants: dedupe(variants), solTex: solTex };
  }

  /** L1: ∫ a/x dx = a·ln|x|. */
  function genLogSimple() {
    var a = rnd([2, 3, 5, 7]);
    var sol = a + "ln|x|";
    return {
      tex: "\\int \\frac{" + a + "}{x}\\,dx",
      solution: sol,
      variants: [sol, a + "ln(x)", a + "log|x|", a + "log(x)", "ln(x^" + a + ")"],
      solTex: a + "\\ln|x|",
    };
  }

  /** L2: ∫ 1/x dx = ln|x|. */
  function genLogBase() {
    return {
      tex: "\\int \\frac{1}{x}\\,dx",
      solution: "ln|x|",
      variants: ["ln|x|", "ln(x)", "log|x|", "log(x)"],
      solTex: "\\ln|x|",
    };
  }

  /** C1..C5: combinaciones lineales de familias distintas. */
  function genMixed() {
    var k = Math.floor(Math.random() * 5);
    if (k === 0) {            // ∫ (a·e^x + b/x) dx = a·e^x + b·ln|x|
      var a = rnd([2, 3, 4]), b = rnd([2, 3, 5]);
      return {
        tex: "\\int (" + a + "e^{x} + \\frac{" + b + "}{x})\\,dx",
        solution: a + "e^x+" + b + "ln|x|",
        variants: [a + "e^x+" + b + "ln|x|", a + "e^x+" + b + "ln(x)", a + "e^(x)+" + b + "ln|x|"],
        solTex: a + "e^{x}+" + b + "\\ln|x|",
      };
    }
    if (k === 1) {            // ∫ (a·cos x − b·sin x) dx = a·sin x + b·cos x
      var a1 = rnd([2, 3, 4]), b1 = rnd([2, 3, 4]);
      var sol1 = a1 + "sin(x)+" + b1 + "cos(x)";
      return {
        tex: "\\int (" + a1 + "\\cos x - " + b1 + "\\sin x)\\,dx",
        solution: sol1,
        variants: [sol1, b1 + "cos(x)+" + a1 + "sin(x)", a1 + "sinx+" + b1 + "cosx", a1 + "sen(x)+" + b1 + "cos(x)"],
        solTex: a1 + "\\sin x+" + b1 + "\\cos x",
      };
    }
    if (k === 2) {            // ∫ (a·e^x + b·sin x) dx = a·e^x − b·cos x
      var a2 = rnd([2, 3, 4]), b2 = rnd([2, 3, 4]);
      var sol2 = a2 + "e^x-" + b2 + "cos(x)";
      return {
        tex: "\\int (" + a2 + "e^{x} + " + b2 + "\\sin x)\\,dx",
        solution: sol2,
        variants: [sol2, a2 + "e^x-" + b2 + "cosx", a2 + "e^(x)-" + b2 + "cos(x)"],
        solTex: a2 + "e^{x}-" + b2 + "\\cos x",
      };
    }
    if (k === 3) {            // ∫ (a·x² + b·e^x) dx = (a/3)·x³ + b·e^x
      var a3 = rnd([3, 6, 9]), b3 = rnd([2, 3, 4]);
      var c3 = a3 / 3;
      var sol3 = (c3 === 1 ? "x^3" : c3 + "x^3") + "+" + b3 + "e^x";
      return {
        tex: "\\int (" + a3 + "x^2 + " + b3 + "e^{x})\\,dx",
        solution: sol3,
        variants: [sol3, (c3 === 1 ? "x^3" : c3 + "x^3") + "+" + b3 + "e^(x)"],
        solTex: (c3 === 1 ? "" : c3) + "x^{3}+" + b3 + "e^{x}",
      };
    }
    // ∫ (a·sin x + b·cos x) dx = −a·cos x + b·sin x
    var a4 = rnd([2, 3, 4]), b4 = rnd([2, 3, 4]);
    var sol4 = "-" + a4 + "cos(x)+" + b4 + "sin(x)";
    return {
      tex: "\\int (" + a4 + "\\sin x + " + b4 + "\\cos x)\\,dx",
      solution: sol4,
      variants: [sol4, "-" + a4 + "cosx+" + b4 + "sinx", b4 + "sin(x)-" + a4 + "cos(x)"],
      solTex: "-" + a4 + "\\cos x+" + b4 + "\\sin x",
    };
  }

  /* ---------- categorías ---------- */

  var CATEGORIES = {
    potencia: {
      label: "Potencia",
      gen: function () {
        var r = Math.random();
        if (r < 0.45) return genPowerSimple();
        if (r < 0.75) return genPowerLinear();
        return genPowerPoly();
      },
    },
    exponencial: {
      label: "Exponencial",
      gen: function () { return Math.random() < 0.6 ? genExpSimple() : genExpBase(); },
    },
    trigonometrica: {
      label: "Trigonométrica",
      gen: function () { return trigTemplate(Math.floor(Math.random() * 7)); },
    },
    logaritmica: {
      label: "Logarítmica (1/x)",
      gen: function () { return Math.random() < 0.6 ? genLogSimple() : genLogBase(); },
    },
    combinada: {
      label: "Combinada",
      gen: genMixed,
    },
  };

  /* ---------- tarjeta de memoria (11 filas de la tabla de la U3) ---------- */

  function buildMemTable() {
    var rows = [
      ["x^n", "\\frac{x^{n+1}}{n+1}+C", "$n \\neq -1$"],
      ["\\frac{1}{x}", "\\ln|x|+C", "caso $n=-1$, $x \\neq 0$"],
      ["e^x", "e^x+C", "idéntica a su derivada"],
      ["a^x", "\\frac{a^x}{\\ln a}+C", "$a>0$, $a\\neq 1$"],
      ["\\sin x", "-\\cos x + C", "inversión de signo"],
      ["\\cos x", "\\sin x + C", ""],
      ["\\sec^2 x", "\\tan x + C", "de $\\frac{d}{dx}\\tan x$"],
      ["\\csc^2 x", "-\\cot x + C", ""],
      ["\\sec x\\tan x", "\\sec x + C", ""],
      ["\\frac{1}{\\sqrt{1-x^2}}", "\\arcsin x + C", "$|x|<1$"],
      ["\\frac{1}{1+x^2}", "\\arctan x + C", "base de fracciones parciales"],
    ];
    var h = '<div class="tbl-wrapper"><table class="tbl"><thead><tr>' +
      "<th>$f(x)$</th><th>$\\int f(x)\\,dx$</th><th>Notas</th>" +
      "</tr></thead><tbody>";
    rows.forEach(function (r) {
      h += "<tr><td>$" + r[0] + "$</td><td>$" + r[1] + "$</td><td>" + r[2] + "</td></tr>";
    });
    h += "</tbody></table></div>";
    return math.raw(h);
  }

  /* ---------- herramienta ---------- */

  window.TOOLS["inmediatas"] = {
    title: "Entrenador de integrales inmediatas",
    description: "Genera ejercicios aleatorios de la tabla de integrales inmediatas y corrige tu respuesta al instante.",
    icon: "⚖️",

    mount: function (host, cfg) {
      var st = { cat: "potencia", ex: null, ok: 0, fail: 0, solved: false };

      /* --- controles --- */
      var controls = H.el('<div class="tool-controls"></div>');
      var selCat = H.select("Categoría", [
        { label: "Potencia", value: "potencia" },
        { label: "Exponencial", value: "exponencial" },
        { label: "Trigonométrica", value: "trigonometrica" },
        { label: "Logarítmica (1/x)", value: "logaritmica" },
        { label: "Combinada", value: "combinada" },
      ], "potencia", function (v) { st.cat = v; newExercise(); });
      controls.appendChild(selCat.el);
      controls.appendChild(H.btn("🎲 Nuevo ejercicio", newExercise, "primary"));
      controls.appendChild(H.btn("Comprobar", check, ""));
      controls.appendChild(H.btn("Ver solución", showSolution, "ghost"));
      host.appendChild(controls);

      /* --- enunciado --- */
      var exOut = H.resultPanel("");
      host.appendChild(exOut);

      /* --- caja de respuesta --- */
      var ansRow = H.el('<div class="ctl" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<label style="white-space:nowrap">Tu respuesta:</label>' +
        '<input type="text" placeholder="ej. x^3, 3sin(x), -2cos(x)+C" style="min-width:250px;flex:1"></div>');
      var input = ansRow.querySelector("input");
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { check(); } });
      host.appendChild(ansRow);

      /* --- feedback y marcador --- */
      var fbOut = H.resultPanel("");
      host.appendChild(fbOut);

      var scoreOut = H.resultPanel("");
      host.appendChild(scoreOut);

      /* --- tarjeta de memoria (colapsable) --- */
      var mem = H.el('<details style="margin-top:16px;border:1px solid var(--border);border-radius:10px;background:var(--card);overflow:hidden">' +
        '<summary style="cursor:pointer;padding:12px 16px;font-weight:700;user-select:none">📇 Tarjeta de memoria — tabla de integrales inmediatas (Unidad 3)</summary>' +
        '<div class="mem-body" style="padding:2px 16px 14px"></div></details>');
      mem.querySelector(".mem-body").innerHTML = buildMemTable();
      host.appendChild(mem);

      /* --- lógica --- */

      function updateScore() {
        scoreOut.innerHTML =
          '<span style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
          '<span class="chip" style="border-color:rgba(52,211,153,0.5)">✔ Aciertos: <b>' + st.ok + "</b></span>" +
          '<span class="chip" style="border-color:rgba(248,113,113,0.5)">✘ Fallos: <b>' + st.fail + "</b></span>" +
          (st.ok + st.fail > 0
            ? '<span style="font-size:12.5px;color:var(--text-dim)">Precisión: <b>' + Math.round(st.ok / (st.ok + st.fail) * 100) + "%</b></span>"
            : "") +
          "</span>";
      }

      function newExercise() {
        st.ex = CATEGORIES[st.cat].gen();
        st.solved = false;
        input.value = "";
        fbOut.innerHTML = "";
        exOut.innerHTML = math.raw("$$" + st.ex.tex + "$$") +
          '<div style="font-size:12.5px;color:var(--text-dim);margin-top:6px">Escribe tu antiderivada en texto plano: p. ej. <code style="font-family:var(--mono)">x^3</code>, <code style="font-family:var(--mono)">3sin(x)</code>, <code style="font-family:var(--mono)">-2cos(x)+C</code>. La <b>+C</b> es opcional y se ignoran espacios.</div>';
        updateScore();
        window.renderMath && window.renderMath(exOut);
      }

      function check() {
        if (!st.ex) return;
        if (st.solved) {
          fbOut.innerHTML = '<span style="color:var(--text-dim)">Este ejercicio ya está resuelto. Pulsa «🎲 Nuevo ejercicio».</span>';
          return;
        }
        var ans = normAnswer(input.value);
        if (ans === "") {
          fbOut.innerHTML = "✏️ Escribe una antiderivada antes de comprobar.";
          return;
        }
        var accepted = [st.ex.solution].concat(st.ex.variants).map(normAnswer);
        var ok = accepted.indexOf(ans) !== -1;
        if (ok) {
          st.ok++;
          st.solved = true;
          fbOut.innerHTML = H.truth(true).outerHTML +
            ' <span style="color:var(--ok)">¡Correcto!</span> <span style="color:var(--text-dim)">' +
            math.raw("$\\int " + st.ex.tex.replace("\\int ", "") + " = " + st.ex.solTex + " + C$") + "</span>";
        } else {
          st.fail++;
          fbOut.innerHTML = H.truth(false).outerHTML +
            ' <span style="color:var(--text-dim)">Revisa coeficientes, signos y variables. Pista: <b>deriva tu respuesta</b> para comprobarla, o pulsa «Ver solución».</span>';
        }
        updateScore();
        window.renderMath && window.renderMath(fbOut);
      }

      function showSolution() {
        if (!st.ex) return;
        st.solved = true;
        fbOut.innerHTML =
          '<div style="font-weight:700;margin-bottom:4px">Solución:</div>' +
          math.raw("$$\\int " + st.ex.tex.replace("\\int ", "") + " = " + st.ex.solTex + " + C$$") +
          '<div style="font-size:12.5px;color:var(--text-dim);margin-top:4px">Verifica siempre <b>derivando</b>: si la derivada reproduce el integrando, el resultado es correcto.</div>';
        window.renderMath && window.renderMath(fbOut);
      }

      /* --- arranque --- */
      updateScore();
      newExercise();
      window.renderMath && window.renderMath(host);
    },
  };
})();
