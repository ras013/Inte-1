/* ===== tools/trigsub.js — Triángulo interactivo de sustitución trigonométrica ===== */
/* Muestra el triángulo rectángulo de referencia de los 3 arquetipos (Unidad 7),
   el triple de sustitución y un desarrollo completo de ejemplo por arquetipo. */
(function () {
  "use strict";
  window.TOOLS = window.TOOLS || {};

  /* ================= datos de los 3 arquetipos ================= */

  var ARCH = [
    {
      id: "sin",
      label: "√(a² − x²)   →   x = a·sin θ",
      rad: "\\sqrt{a^{2}-x^{2}}",
      ident: "1-\\sin^{2}\\theta = \\cos^{2}\\theta",
      tripleSym: "x = a\\sin\\theta,\\qquad dx = a\\cos\\theta\\,d\\theta,\\qquad \\sqrt{a^{2}-x^{2}} = a\\cos\\theta",
      triple: function (a) {
        return "x = " + a + "\\sin\\theta,\\qquad dx = " + a + "\\cos\\theta\\,d\\theta,\\qquad \\sqrt{" + (a * a) + "-x^{2}} = " + a + "\\cos\\theta";
      },
      funcTex: function (a, x) { return "\\sin\\theta = \\frac{x}{a} = \\frac{" + x + "}{" + a + "} = " + H.num(x / a, 3); },
      sides: function (a, x) { return { adj: Math.sqrt(a * a - x * x), opp: x, hyp: a }; },
      labels: function (a, x, s) {
        return { adj: "√(a²−x²) = " + H.num(s.adj, 2), opp: "x = " + H.num(x, 2), hyp: "a = " + a };
      },
      dominio: "x ≤ a",
    },
    {
      id: "tan",
      label: "√(x² + a²)   →   x = a·tan θ",
      rad: "\\sqrt{x^{2}+a^{2}}",
      ident: "\\tan^{2}\\theta + 1 = \\sec^{2}\\theta",
      tripleSym: "x = a\\tan\\theta,\\qquad dx = a\\sec^{2}\\theta\\,d\\theta,\\qquad \\sqrt{x^{2}+a^{2}} = a\\sec\\theta",
      triple: function (a) {
        return "x = " + a + "\\tan\\theta,\\qquad dx = " + a + "\\sec^{2}\\theta\\,d\\theta,\\qquad \\sqrt{x^{2}+" + (a * a) + "} = " + a + "\\sec\\theta";
      },
      funcTex: function (a, x) { return "\\tan\\theta = \\frac{x}{a} = \\frac{" + x + "}{" + a + "} = " + H.num(x / a, 3); },
      sides: function (a, x) { return { adj: a, opp: x, hyp: Math.sqrt(a * a + x * x) }; },
      labels: function (a, x, s) {
        return { adj: "a = " + a, opp: "x = " + H.num(x, 2), hyp: "√(x²+a²) = " + H.num(s.hyp, 2) };
      },
      dominio: "cualquier x ≥ 0",
    },
    {
      id: "sec",
      label: "√(x² − a²)   →   x = a·sec θ",
      rad: "\\sqrt{x^{2}-a^{2}}",
      ident: "\\sec^{2}\\theta - 1 = \\tan^{2}\\theta",
      tripleSym: "x = a\\sec\\theta,\\qquad dx = a\\sec\\theta\\tan\\theta\\,d\\theta,\\qquad \\sqrt{x^{2}-a^{2}} = a\\tan\\theta",
      triple: function (a) {
        return "x = " + a + "\\sec\\theta,\\qquad dx = " + a + "\\sec\\theta\\tan\\theta\\,d\\theta,\\qquad \\sqrt{x^{2}-" + (a * a) + "} = " + a + "\\tan\\theta";
      },
      funcTex: function (a, x) { return "\\sec\\theta = \\frac{x}{a} = \\frac{" + x + "}{" + a + "} = " + H.num(x / a, 3); },
      sides: function (a, x) { return { adj: a, opp: Math.sqrt(x * x - a * a), hyp: x }; },
      labels: function (a, x, s) {
        return { adj: "a = " + a, opp: "√(x²−a²) = " + H.num(s.opp, 2), hyp: "x = " + H.num(x, 2) };
      },
      dominio: "x ≥ a",
    },
  ];

  /* ================= ejemplos de referencia (uno por arquetipo) ================= */

  var EJEMPLOS = [
    {
      titulo: "Arquetipo √(a²−x²) · ∫ dx / √(9 − x²)",
      pasos: [
        "<b>Mapeo:</b> el radical es $\\sqrt{a^{2}-x^{2}}$ con $a = 3$; declaramos $x = 3\\sin\\theta$, con $\\theta \\in [-\\pi/2,\\pi/2]$ (ahí el seno es biyectivo y $\\cos\\theta \\geq 0$).",
        "<b>Diferenciación:</b> $dx = 3\\cos\\theta\\,d\\theta$ y $\\sqrt{9-x^{2}} = \\sqrt{9-9\\sin^{2}\\theta} = 3\\cos\\theta$ (positivo en el dominio elegido).",
        "<b>Inserción:</b> $\\int \\frac{3\\cos\\theta\\,d\\theta}{3\\cos\\theta} = \\int d\\theta = \\theta + C$.",
        "<b>Reconstrucción:</b> de $x = 3\\sin\\theta$ se tiene $\\sin\\theta = x/3$, es decir $\\theta = \\arcsin\\left(\\frac{x}{3}\\right)$.",
      ],
      answer: "\\int \\frac{dx}{\\sqrt{9-x^{2}}} = \\arcsin\\left(\\frac{x}{3}\\right) + C",
      note: "Coincide con la fórmula inmediata ∫ dx/√(a²−x²) = arcsin(x/a) + C: la sustitución trigonométrica explica de dónde sale la tabla.",
    },
    {
      titulo: "Arquetipo √(x²+a²) · ∫ dx / (x²·√(1 + x²))",
      pasos: [
        "<b>Mapeo:</b> el radical es $\\sqrt{x^{2}+a^{2}}$ con $a = 1$; declaramos $x = \\tan\\theta$, con $-\\pi/2 < \\theta < \\pi/2$.",
        "<b>Diferenciación:</b> $dx = \\sec^{2}\\theta\\,d\\theta$ y $\\sqrt{1+x^{2}} = \\sqrt{1+\\tan^{2}\\theta} = \\sec\\theta$.",
        "<b>Inserción:</b> $\\int \\frac{\\sec^{2}\\theta\\,d\\theta}{\\tan^{2}\\theta\\,\\sec\\theta} = \\int \\frac{\\sec\\theta}{\\tan^{2}\\theta}\\,d\\theta = \\int \\frac{\\cos\\theta}{\\sin^{2}\\theta}\\,d\\theta$.",
        "<b>Integración:</b> con $u = \\sin\\theta$, $du = \\cos\\theta\\,d\\theta$, queda $\\int \\frac{du}{u^{2}} = -\\frac{1}{u} = -\\csc\\theta$.",
        "<b>Reconstrucción:</b> $\\tan\\theta = x/1$ (opuesto $x$, adyacente $1$, hipotenusa $\\sqrt{1+x^{2}}$); entonces $\\csc\\theta = \\frac{\\sqrt{1+x^{2}}}{x}$.",
      ],
      answer: "\\int \\frac{dx}{x^{2}\\sqrt{1+x^{2}}} = -\\frac{\\sqrt{1+x^{2}}}{x} + C",
      note: "El triángulo de referencia permitió leer csc θ directamente, sin funciones trigonométricas inversas anidadas.",
    },
    {
      titulo: "Arquetipo √(x²−a²) · ∫ √(x² − 4) / x dx",
      pasos: [
        "<b>Mapeo:</b> el radical es $\\sqrt{x^{2}-a^{2}}$ con $a = 2$; declaramos $x = 2\\sec\\theta$, con $\\theta \\in [0,\\pi/2) \\cup (\\pi/2,\\pi]$.",
        "<b>Diferenciación:</b> $dx = 2\\sec\\theta\\tan\\theta\\,d\\theta$ y $\\sqrt{x^{2}-4} = \\sqrt{4\\sec^{2}\\theta-4} = 2\\tan\\theta$.",
        "<b>Inserción:</b> $\\int \\frac{2\\tan\\theta \\cdot 2\\sec\\theta\\tan\\theta\\,d\\theta}{2\\sec\\theta} = \\int 2\\tan^{2}\\theta\\,d\\theta$.",
        "<b>Integración:</b> $\\tan^{2}\\theta = \\sec^{2}\\theta - 1$, así que $2\\int (\\sec^{2}\\theta - 1)\\,d\\theta = 2(\\tan\\theta - \\theta)$.",
        "<b>Reconstrucción:</b> $\\sec\\theta = x/2$ (hipotenusa $x$, adyacente $2$, opuesto $\\sqrt{x^{2}-4}$); entonces $\\tan\\theta = \\frac{\\sqrt{x^{2}-4}}{2}$ y $\\theta = \\operatorname{arcsec}(x/2)$.",
      ],
      answer: "\\int \\frac{\\sqrt{x^{2}-4}}{x}\\,dx = \\sqrt{x^{2}-4} - 2\\operatorname{arcsec}\\left(\\frac{x}{2}\\right) + C",
      note: "Verificación: la derivada de √(x²−4) − 2·arcsec(x/2) recupera exactamente √(x²−4)/x.",
    },
  ];

  /* ================= helpers ================= */

  function makeSlider(label, min, max, step, value, oninput) {
    var wrap = H.el('<div class="ctl"><label></label><input type="range"></div>');
    var lab = wrap.querySelector("label");
    var input = wrap.querySelector("input");
    input.min = min; input.max = max; input.step = step; input.value = value;
    function clean(v) { return Math.round(v * 10000) / 10000; }
    function upd() {
      var v = clean(Math.round(parseFloat(input.value) / step) * step);
      lab.textContent = label + ": " + v;
      var pct = (v - parseFloat(input.min)) / Math.max(1e-9, parseFloat(input.max) - parseFloat(input.min)) * 100;
      input.style.setProperty("--fill", Math.max(0, Math.min(100, pct)) + "%");
      oninput && oninput(v);
    }
    lab.textContent = label + ": " + clean(value);
    input.style.setProperty("--fill", "0%");
    input.addEventListener("input", upd);
    return {
      el: wrap,
      get: function () { return clean(Math.round(parseFloat(input.value) / step) * step); },
      set: function (v) { input.value = v; upd(); },
    };
  }

  // dibuja el triángulo rectángulo con los lados s = {opp, adj, hyp}
  function triangleSvg(s, lbl) {
    var opp = s.opp, adj = s.adj, hyp = s.hyp;
    var S = 120 / Math.max(opp, adj, hyp, 1);
    var xA = 55, yA = 205;                       // vértice del ángulo θ
    var xB = xA + adj * S, yB = yA;              // ángulo recto
    var xC = xB, yC = yA - opp * S;              // vértice superior
    var th = Math.atan2(opp, adj);
    var r = 20;
    var px1 = xA + r, py1 = yA;
    var px2 = xA + r * Math.cos(th), py2 = yA - r * Math.sin(th);
    var mx = (xA + xC) / 2, my = (yA + yC) / 2;
    var ux = hyp > 0 ? opp / hyp : 0, uy = hyp > 0 ? adj / hyp : 0;
    var lx = mx + 16 * ux, ly = my + 16 * uy;
    var q = 14;

    var svg = '<svg viewBox="0 0 320 240" style="width:100%;max-width:430px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">';
    svg += '<line x1="' + xA + '" y1="' + yA + '" x2="' + xB + '" y2="' + yB + '" stroke="#6c8cff" stroke-width="3"/>';
    svg += '<line x1="' + xB + '" y1="' + yB + '" x2="' + xC + '" y2="' + yC + '" stroke="#fbbf24" stroke-width="3"/>';
    svg += '<line x1="' + xA + '" y1="' + yA + '" x2="' + xC + '" y2="' + yC + '" stroke="#38bdf8" stroke-width="3"/>';
    svg += '<path d="M ' + (xB - q) + ' ' + yB + ' L ' + (xB - q) + ' ' + (yB - q) + ' L ' + xB + ' ' + (yB - q) + '" fill="none" stroke="#8b93b8" stroke-width="1.5"/>';
    svg += '<path d="M ' + px1 + ' ' + py1 + ' A ' + r + ' ' + r + ' 0 0 0 ' + px2 + ' ' + py2 + '" fill="none" stroke="#f87171" stroke-width="2"/>';
    svg += '<text x="' + (xA + r * 0.62 * Math.cos(th / 2) + 7) + '" y="' + (yA - r * 0.62 * Math.sin(th / 2) + 5) + '" fill="#f87171" font-size="17" font-weight="700">θ</text>';
    svg += '<text x="' + ((xA + xB) / 2) + '" y="' + (yA + 24) + '" fill="#a5b4fc" font-size="13" text-anchor="middle">' + lbl.adj + "</text>";
    svg += '<text x="' + (xB + 12) + '" y="' + ((yB + yC) / 2 + 4) + '" fill="#fcd34d" font-size="13" text-anchor="start">' + lbl.opp + "</text>";
    svg += '<text x="' + lx + '" y="' + (ly + 4) + '" fill="#7dd3fc" font-size="13" text-anchor="middle">' + lbl.hyp + "</text>";
    svg += "</svg>";
    return svg;
  }

  /* ================= herramienta ================= */

  window.TOOLS["trigsub"] = {
    title: "Triángulo interactivo de sustitución trigonométrica",
    description: "Elige el arquetipo del radical, mueve a y x para ver el triángulo de referencia, el triple de sustitución y el desarrollo completo.",
    icon: "🔺",

    mount: function (host, cfg) {
      var st = { arch: 0, a: 3, x: 1.5 };

      /* --- controles --- */
      var controls = H.el('<div class="tool-controls"></div>');
      var selArch = H.select(
        "Arquetipo del radical",
        ARCH.map(function (a, i) { return { label: a.label, value: String(i) }; }),
        "0",
        function (v) { st.arch = parseInt(v, 10); ajustarSlider(); draw(); }
      );
      var slA = H.slider("Constante a", 1, 6, 1, 3, function (v) { st.a = v; ajustarSlider(); draw(); });
      var slX = makeSlider("x", 0, 6, 0.1, 1.5, function (v) { st.x = v; draw(); });
      controls.appendChild(selArch.el);
      controls.appendChild(slA.el);
      controls.appendChild(slX.el);
      host.appendChild(controls);

      /* --- avisos de dominio --- */
      var warn = H.el("<div></div>");
      host.appendChild(warn);

      /* --- triángulo + función principal --- */
      var triPanel = H.el('<div class="tool-out" style="text-align:center"></div>');
      host.appendChild(triPanel);

      /* --- triple de sustitución --- */
      var triple = H.el('<div class="tool-out" style="margin-top:10px"></div>');
      host.appendChild(triple);

      /* --- ejemplo de referencia (uno por arquetipo) --- */
      var exampleBox = H.el('<div style="margin-top:14px"><div style="font-weight:700;margin-bottom:6px">📝 Desarrollo completo de referencia</div></div>');
      EJEMPLOS.forEach(function (ex, i) {
        var html =
          '<details class="ej-details" data-ej="' + i + '" style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin:8px 0;background:var(--bg-2)">' +
          '<summary style="cursor:pointer;font-weight:600">📝 ' + ex.titulo + "</summary>" +
          '<ol class="t-steps">' + ex.pasos.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol>" +
          '<div class="formula-box">' + math.raw("$$" + ex.answer + "$$") + "</div>" +
          '<div style="font-size:12.5px;color:var(--text-dim);margin-top:4px">💡 ' + ex.note + "</div>" +
          "</details>";
        exampleBox.appendChild(H.el(math.raw(html)));
      });
      host.appendChild(exampleBox);

      /* --- tabla de los tres arquetipos (siempre visible) --- */
      var tblHtml = '<div style="margin-top:14px"><div style="font-weight:700;margin-bottom:6px">🗂 Los tres arquetipos</div>' +
        '<div class="tbl-wrapper"><table class="tbl"><thead><tr><th>Radical</th><th>Sustitución</th><th>dx</th><th>Simplificación</th></tr></thead><tbody>' +
        '<tr><td>$\\sqrt{a^{2}-x^{2}}$</td><td>$x = a\\sin\\theta$</td><td>$dx = a\\cos\\theta\\,d\\theta$</td><td>$a\\cos\\theta$</td></tr>' +
        '<tr><td>$\\sqrt{x^{2}+a^{2}}$</td><td>$x = a\\tan\\theta$</td><td>$dx = a\\sec^{2}\\theta\\,d\\theta$</td><td>$a\\sec\\theta$</td></tr>' +
        '<tr><td>$\\sqrt{x^{2}-a^{2}}$</td><td>$x = a\\sec\\theta$</td><td>$dx = a\\sec\\theta\\tan\\theta\\,d\\theta$</td><td>$a\\tan\\theta$</td></tr>' +
        "</tbody></table></div></div>";
      host.appendChild(H.el(math.raw(tblHtml)));

      /* --- dominio: en el arquetipo secante, x arranca en a --- */
      function ajustarSlider() {
        var input = slX.el.querySelector("input");
        if (st.arch === 2) {
          input.min = st.a;
          if (st.x < st.a) { st.x = st.a; slX.set(st.a); }
        } else {
          input.min = 0;
        }
      }

      function draw() {
        var A = ARCH[st.arch];
        var a = st.a, x = st.x;
        var warning = "";
        var xEff = x;
        if (st.arch === 0 && x > a) {
          xEff = a;
          warning = '<div class="callout warn" style="margin:10px 0"><div class="callout-title">⚠️ Fuera del dominio</div>' +
            "Con el radical $\\sqrt{a^{2}-x^{2}}$ debe cumplirse $x \\leq a$. Aquí $x = " + x + "$ y $a = " + a + "$: el radical no es real. " +
            "Reduce x o aumenta a. (El triángulo se dibuja con el valor límite $x = a$.)</div>";
        } else if (st.arch === 2 && x < a) {
          xEff = a;
          warning = '<div class="callout warn" style="margin:10px 0"><div class="callout-title">⚠️ Fuera del dominio</div>' +
            "Con el radical $\\sqrt{x^{2}-a^{2}}$ debe cumplirse $x \\geq a$ (el slider de x arranca en a). Aquí $x = " + x + "$ y $a = " + a + "$.</div>";
        }
        warn.innerHTML = math.raw(warning || "");

        var s = A.sides(a, xEff);
        var lbl = A.labels(a, xEff, s);
        var thDeg = Math.atan2(s.opp, s.adj) * 180 / Math.PI;

        triPanel.innerHTML =
          triangleSvg(s, lbl) +
          '<div style="margin-top:10px"><b>Función principal:</b> ' + math.raw("$" + A.funcTex(a, xEff) + "$") +
          ' &nbsp;·&nbsp; θ ≈ ' + H.num(thDeg, 1) + "°</div>" +
          '<div style="font-size:12.5px;color:var(--text-dim);margin-top:2px">Dominio de la sustitución: ' + A.dominio + "</div>";

        triple.innerHTML =
          '<b>Triple de sustitución (general):</b><br>' + math.raw("$$" + A.tripleSym + "$$") +
          '<b>Con a = ' + a + ':</b><br>' + math.raw("$$" + A.triple(a) + "$$") +
          '<div style="font-size:12.5px;color:var(--text-dim);margin-top:4px">Identidad que elimina la raíz: ' + math.raw("$" + A.ident + "$") + "</div>";

        exampleBox.querySelectorAll(".ej-details").forEach(function (d) {
          d.style.display = d.getAttribute("data-ej") === String(st.arch) ? "" : "none";
        });

        window.renderMath && window.renderMath(host);
      }

      ajustarSlider();
      draw();
    },
  };
})();
