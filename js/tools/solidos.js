/* ===== tools/solidos.js — Sólidos de revolución en 3D ===== */
(function () {
  "use strict";

  const TAU = Math.PI * 2;

  /* ---- utilidades ---- */
  function linspace(a, b, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n);
    return out;
  }

  /* Superficie paramétrica P(u,v) -> [x,y,z]; devuelve matrices 2D para Plotly. */
  function surface(u0, u1, nu, v0, v1, nv, P) {
    const X = [], Y = [], Z = [];
    for (let i = 0; i <= nu; i++) {
      const u = u0 + (u1 - u0) * i / nu;
      const rx = [], ry = [], rz = [];
      for (let j = 0; j <= nv; j++) {
        const v = v0 + (v1 - v0) * j / nv;
        const p = P(u, v);
        rx.push(p[0]); ry.push(p[1]); rz.push(p[2]);
      }
      X.push(rx); Y.push(ry); Z.push(rz);
    }
    return { x: X, y: Y, z: Z };
  }

  function surfTrace(s, opts) {
    return Object.assign({
      type: "surface",
      x: s.x, y: s.y, z: s.z,
      showscale: false,
      hoverinfo: "skip",
      showlegend: false,
    }, opts);
  }

  /* ---- definición de los casos (disco / arandela / capas) ---- */
  function getCaso(st) {
    if (st.caso === "a") {
      if (st.curvaA === "x2") {
        return {
          modo: "disco", x0: 0, x1: 1,
          R: function (x) { return x * x; }, r: null, f: function (x) { return x * x; },
          titulo: "a) Discos: región bajo y = x² en [0,1] girando alrededor del eje x",
          met: "Método de los discos",
          shortDesc: "La región toca el eje de giro: cada corte perpendicular al eje x es un disco de radio $r = f(x) = x^2$.",
          formula: "V = \\pi\\int_0^1 (x^2)^2\\,dx = \\pi\\int_0^1 x^4\\,dx = \\pi\\left[\\frac{x^5}{5}\\right]_0^1",
          exact: Math.PI / 5,
          why: "La región toca el eje de giro en todo el intervalo: cada corte perpendicular al eje x es un disco macizo, sin hueco, de radio $r = f(x) = x^2$. Basta un único radio: $V = \\pi\\int_a^b [f(x)]^2\\,dx = \\pi\\int_0^1 x^4\\,dx = \\frac{\\pi}{5}$."
        };
      }
      return {
        modo: "disco", x0: 0, x1: 2,
        R: Math.sqrt, r: null, f: Math.sqrt,
        titulo: "a) Discos: región bajo y = √x en [0,2] girando alrededor del eje x",
        met: "Método de los discos",
        shortDesc: "La región toca el eje de giro: cada corte perpendicular al eje x es un disco de radio $r = f(x) = \\sqrt{x}$.",
        formula: "V = \\pi\\int_0^2 (\\sqrt{x})^2\\,dx = \\pi\\int_0^2 x\\,dx = \\pi\\left[\\frac{x^2}{2}\\right]_0^2",
        exact: 2 * Math.PI,
        why: "La región toca el eje de giro en todo el intervalo: cada corte perpendicular al eje x es un disco macizo, sin hueco, de radio $r = f(x) = \\sqrt{x}$. Basta un único radio: $V = \\pi\\int_a^b [f(x)]^2\\,dx = \\pi\\int_0^2 x\\,dx = 2\\pi \\approx 6.283$."
      };
    }
    if (st.caso === "b") {
      return {
        modo: "arandela", x0: 0, x1: 1,
        R: Math.sqrt, r: function (x) { return x; }, f: Math.sqrt,
        titulo: "b) Arandelas: región entre y = √x e y = x en [0,1] girando alrededor del eje x",
        met: "Método de las arandelas",
        shortDesc: "La región no toca el eje: cada corte es una arandela con radio externo $R = \\sqrt{x}$ e interno $r = x$.",
        formula: "V = \\pi\\int_0^1 \\left((\\sqrt{x})^2 - x^2\\right)dx = \\pi\\int_0^1 (x - x^2)\\,dx = \\pi\\left[\\frac{x^2}{2} - \\frac{x^3}{3}\\right]_0^1",
        exact: Math.PI / 6,
        why: "La región NO toca el eje de giro (solo en el origen): cada rebanada deja un hueco central y tiene forma de arandela. Se necesitan dos radios: externo $R = \\sqrt{x}$ e interno $r = x$. ¡Ojo! $V = \\pi\\int (R^2 - r^2)\\,dx$, nunca $\\pi\\int (R - r)^2\\,dx$: restar los radios no es restar sus cuadrados."
      };
    }
    return {
      modo: "capas", x0: 0, x1: 2,
      f: function (x) { return 2 * x - x * x; }, R: null, r: null,
      titulo: "c) Capas cilíndricas: región bajo y = 2x − x² en [0,2] girando alrededor del eje y",
      met: "Método de las capas cilíndricas",
      shortDesc: "El eje de giro es vertical: cada corte vertical barre una capa cilíndrica de radio $x$ y altura $f(x) = 2x - x^2$.",
      formula: "V = 2\\pi\\int_0^2 x(2x-x^2)\\,dx = 2\\pi\\int_0^2 (2x^2 - x^3)\\,dx = 2\\pi\\left[\\frac{2x^3}{3} - \\frac{x^4}{4}\\right]_0^2",
      exact: (8 * Math.PI) / 3,
      why: "El eje de giro es vertical (el eje y del problema). Con arandelas habría que despejar $x = h(y)$, lo que exige dos ramas: $x = 1 \\pm \\sqrt{1-y}$. Las capas integran en la variable nativa x: cada corte vertical barre una capa cilíndrica de radio $x$, altura $f(x)$ y volumen $2\\pi x\\,f(x)\\,dx$."
    };
  }

  /* ---- volumen aproximado por suma de tajadas (punto medio) ---- */
  function approxVolume(c, n) {
    const w = (c.x1 - c.x0) / n;
    let s = 0;
    for (let k = 0; k < n; k++) {
      const x = c.x0 + (k + 0.5) * w;
      if (c.modo === "disco") {
        s += Math.PI * c.R(x) * c.R(x) * w;
      } else if (c.modo === "arandela") {
        s += Math.PI * (c.R(x) * c.R(x) - c.r(x) * c.r(x)) * w;
      } else {
        s += 2 * Math.PI * x * c.f(x) * w;
      }
    }
    return s;
  }

  /* ---- construcción de las trazas 3D ---- */
  function buildData(c, st) {
    const data = [];
    const NU = 40, NV = 56;

    /* 1) superficie completa del sólido */
    if (c.modo === "capas") {
      data.push(surfTrace(
        surface(c.x0, c.x1, NU, 0, TAU, NV, function (u, v) {
          return [u * Math.cos(v), u * Math.sin(v), c.f(u)];
        }),
        { colorscale: "Viridis", opacity: 0.96, showlegend: true, name: "sólido completo" }
      ));
    } else {
      data.push(surfTrace(
        surface(c.x0, c.x1, NU, 0, TAU, NV, function (u, v) {
          return [u, c.R(u) * Math.cos(v), c.R(u) * Math.sin(v)];
        }),
        { colorscale: "Viridis", opacity: 0.96, showlegend: true, name: "superficie exterior" }
      ));
      if (c.modo === "arandela") {
        data.push(surfTrace(
          surface(c.x0, c.x1, NU, 0, TAU, NV, function (u, v) {
            return [u, c.r(u) * Math.cos(v), c.r(u) * Math.sin(v)];
          }),
          { colorscale: "Blues", opacity: 0.9, showlegend: true, name: "superficie interior (hueco)" }
        ));
      }
    }

    /* 2) tajadas (cilindros) — se visualizan hasta 12 representativas */
    if (st.showSlices) {
      const w = (c.x1 - c.x0) / st.n;
      const K = Math.min(st.n, 12);
      for (let j = 0; j < K; j++) {
        const k = Math.floor((j + 0.5) * st.n / K);
        const xk = c.x0 + (k + 0.5) * w;
        if (c.modo === "capas") {
          data.push(surfTrace(
            surface(0, c.f(xk), 6, 0, TAU, 24, function (u, v) {
              return [xk * Math.cos(v), xk * Math.sin(v), u];
            }),
            { colorscale: "Reds", opacity: 0.6 }
          ));
        } else {
          data.push(surfTrace(
            surface(xk - w / 2, xk + w / 2, 5, 0, TAU, 24, function (u, v) {
              return [u, c.R(xk) * Math.cos(v), c.R(xk) * Math.sin(v)];
            }),
            { colorscale: "Reds", opacity: 0.6 }
          ));
          if (c.modo === "arandela") {
            data.push(surfTrace(
              surface(xk - w / 2, xk + w / 2, 5, 0, TAU, 24, function (u, v) {
                return [u, c.r(xk) * Math.cos(v), c.r(xk) * Math.sin(v)];
              }),
              { colorscale: "Reds", opacity: 0.45 }
            ));
          }
        }
      }
    }

    /* 3) curva generatriz + eje de giro */
    const gx = [], gy = [], gz = [];
    for (let i = 0; i <= 80; i++) {
      const x = c.x0 + (c.x1 - c.x0) * i / 80;
      if (c.modo === "capas") {
        gx.push(x); gy.push(c.f(x)); gz.push(0);
      } else {
        gx.push(x); gy.push(c.R(x)); gz.push(0);
      }
    }
    data.push({
      type: "scatter3d", mode: "lines", x: gx, y: gy, z: gz,
      line: { color: "#fbbf24", width: 5 },
      name: c.modo === "capas" ? "curva generatriz y = f(x)" : "curva generatriz r = f(x)",
    });

    if (c.modo === "capas") {
      let fmax = 0;
      for (let i = 0; i <= 40; i++) {
        const x = c.x0 + (c.x1 - c.x0) * i / 40;
        fmax = Math.max(fmax, c.f(x));
      }
      data.push({
        type: "scatter3d", mode: "lines", x: [0, 0], y: [0, 0], z: [-0.15, fmax + 0.2],
        line: { color: "#6c8cff", width: 4 }, name: "eje de giro (eje y)",
      });
    } else {
      data.push({
        type: "scatter3d", mode: "lines", x: [c.x0 - 0.15, c.x1 + 0.15], y: [0, 0], z: [0, 0],
        line: { color: "#6c8cff", width: 4 }, name: "eje de giro (eje x)",
      });
      if (c.modo === "arandela") {
        const hx = [], hy = [], hz = [];
        for (let i = 0; i <= 80; i++) {
          const x = c.x0 + (c.x1 - c.x0) * i / 80;
          hx.push(x); hy.push(c.r(x)); hz.push(0);
        }
        data.push({
          type: "scatter3d", mode: "lines", x: hx, y: hy, z: hz,
          line: { color: "#34d399", width: 4 }, name: "curva interior r = g(x)",
        });
      }
    }

    return data;
  }

  window.TOOLS = window.TOOLS || {};
  window.TOOLS["solidos"] = {
    title: "Sólidos de revolución en 3D",
    description: "Gira una región plana alrededor de un eje y compara el volumen exacto con la suma de tajadas.",
    icon: "🔩",

    mount: function (host, cfg) {
      const st = { caso: "a", curvaA: "sqrt", n: 8, showSlices: true };

      /* --- controles --- */
      const controls = H.el('<div class="tool-controls"></div>');
      const selCaso = H.select("Caso", [
        { label: "a) Discos — la región toca el eje", value: "a" },
        { label: "b) Arandelas — región con hueco", value: "b" },
        { label: "c) Capas — giro alrededor del eje y", value: "c" },
      ], "a", function (v) { st.caso = v; toggleCurva(); draw(); });
      const selCurvaA = H.select("Curva (caso a)", [
        { label: "y = √x en [0, 2]", value: "sqrt" },
        { label: "y = x² en [0, 1]", value: "x2" },
      ], "sqrt", function (v) { st.curvaA = v; draw(); });

      let timerN = null;
      const slN = H.slider("Tajadas n", 4, 40, 1, 8, function (v) {
        st.n = v;
        clearTimeout(timerN);
        timerN = setTimeout(draw, 60);
      });

      const chkSlices = H.el('<label class="ctl" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" checked> Mostrar tajadas</label>');
      chkSlices.querySelector("input").addEventListener("change", function (e) { st.showSlices = e.target.checked; draw(); });

      controls.appendChild(selCaso.el);
      controls.appendChild(selCurvaA.el);
      controls.appendChild(slN.el);
      controls.appendChild(chkSlices);
      controls.appendChild(H.btn("Reiniciar", function () {
        st.caso = "a"; selCaso.set("a");
        st.curvaA = "sqrt"; selCurvaA.set("sqrt");
        st.n = 8; slN.set(8);
        st.showSlices = true; chkSlices.querySelector("input").checked = true;
        toggleCurva(); draw();
        window.trackToolUse && window.trackToolUse(cfg && cfg.unitId, "solidos");
      }, "ghost"));
      host.appendChild(controls);

      /* --- salidas --- */
      const resOut = H.resultPanel("");
      host.appendChild(resOut);
      const whyHost = H.el('<div style="margin:6px 0"></div>');
      host.appendChild(whyHost);
      const chart = H.chart();
      host.appendChild(chart.el);

      function toggleCurva() {
        selCurvaA.el.style.display = st.caso === "a" ? "" : "none";
      }

      /* --- dibujo --- */
      function draw() {
        const c = getCaso(st);
        const approx = approxVolume(c, st.n);
        const err = Math.abs(approx - c.exact);
        const ok = err < 0.02;

        resOut.innerHTML =
          "<b>" + c.met + ".</b> " + math.toHtml(c.shortDesc) + "<br>" +
          math.toHtml("$" + c.formula + " = " + H.num(c.exact, 5) + "\\;\\text{u}^3$") + "<br>" +
          "<b>Aproximación por tajadas</b> con n = " + st.n + ": " +
          math.toHtml("$V_n \\approx " + H.num(approx, 5) + "$") +
          " — error = " + H.num(err, 5) + " " +
          (ok ? "<b style='color:var(--ok)'>✔ convergencia lograda</b>" : "(sube n para converger)") + "<br>" +
          "<span style='font-size:12.5px;color:var(--text-dim)'>La suma de tajadas se aproxima al volumen exacto a medida que n crece (se visualizan hasta 12 tajadas representativas).</span>";
        window.renderMath && window.renderMath(resOut);

        whyHost.innerHTML = "";
        whyHost.appendChild(H.panel("Por qué este método", math.toHtml(c.why), "tip"));
        window.renderMath && window.renderMath(whyHost);

        chart.plot(buildData(c, st), {
          title: { text: c.titulo, font: { color: "#e8eaf6", size: 14 } },
          showlegend: true,
          legend: { orientation: "h", x: 0.02, y: 1.08, font: { size: 11 }, bgcolor: "rgba(0,0,0,0)" },
          margin: { l: 0, r: 0, t: 64, b: 0 },
          scene: {
            xaxis: { title: "x", gridcolor: "#242b4d", zerolinecolor: "#3a4270" },
            yaxis: { title: "y", gridcolor: "#242b4d", zerolinecolor: "#3a4270" },
            zaxis: { title: "z", gridcolor: "#242b4d", zerolinecolor: "#3a4270" },
            aspectmode: "data",
            camera: { eye: { x: 1.7, y: 1.7, z: 1.35 } },
            bgcolor: "rgba(0,0,0,0)",
          },
        });
      }

      /* --- inicialización --- */
      toggleCurva();
      draw();
    },
  };
})();
