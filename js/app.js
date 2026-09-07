/* ===== app.js — SPA: navegación, render de unidades, quiz, examen ===== */
(function () {
  "use strict";
  const C = window.CONTENT;
  const M = window.math;
  const nav = document.getElementById("nav");
  const content = document.getElementById("content");
  const topbarTitle = document.getElementById("topbar-title");
  const topbarProgress = document.getElementById("topbar-progress");

  let state = { route: "home", unitId: null, sub: null };
  const LS_KEY = "integrales-progress-v1";

  /* ---------- persistencia ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) { /* noop */ }
  }
  let progress = loadProgress();

  function unitQuizKey(unitId) { return "quiz-" + unitId; }
  function examKey() { return "exam"; }

  function isUnitMastered(unitId) {
    const q = progress[unitQuizKey(unitId)];
    if (!q || !q.total) return false;
    return q.correct / q.total >= 0.8;
  }

  /* ---------- helpers de render ---------- */
  function el(html) { return H.el(html); }

  function renderTheoryBlock(b) {
    switch (b.type) {
      case "heading":
        return "<h3>" + M.toHtml(b.text) + "</h3>";
      case "paragraph":
        return "<p>" + M.toHtml(b.text) + "</p>";
      case "formula":
        return '<div class="formula-box">' + M.raw(b.latex) +
          (b.caption ? '<div class="formula-caption">' + M.toHtml(b.caption) + "</div>" : "") + "</div>";
      case "callout":
        return '<div class="callout ' + (["tip", "warn", "note"].indexOf(b.variant) >= 0 ? b.variant : "note") + '">' +
          '<div class="callout-title">' + (b.title || "") + "</div>" +
          M.toHtml(b.text) + "</div>";
      case "table": {
        let t = '<div class="tbl-wrapper"><table class="tbl"><thead><tr>' +
          b.headers.map(function (h) { return "<th>" + M.toHtml(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>";
        t += b.rows.map(function (r) {
          return "<tr>" + r.map(function (c) { return "<td>" + M.toHtml(c) + "</td>"; }).join("") + "</tr>";
        }).join("");
        t += "</tbody></table></div>";
        if (b.caption) t += '<div class="table-caption">' + M.toHtml(b.caption) + "</div>";
        return t;
      }
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        const cls = b.ordered ? "t-steps" : "t-list";
        return "<" + tag + ' class="' + cls + '">' +
          b.items.map(function (it) { return "<li>" + M.toHtml(it) + "</li>"; }).join("") +
          "</" + tag + ">";
      }
      default:
        return "";
    }
  }

  /* ---------- gráficas de ejemplos (visual) ----------
     Cada ejemplo puede llevar ex.visual = { spec } con:
       type: "area"     → área bajo f entre a y b
             "between"  → área entre f (superior) y g (inferior)
             "curve"    → curva f + puntos de interés
             "solid-disks" / "solid-shells" → región 2D que genera el sólido
       f/g:  cadena con función JS de x (segura: solo Math sen/co/…)
       a,b:  rango x; yMax opcional; pts: [[x, y, etiqueta], ...]
  */
  function safeExpr(expr) {
    if (!expr) return null;
    return new Function("x", "with (Math) { return (" + expr + "); }");
  }

  function renderExampleVisuals(unit) {
    const holders = content.querySelectorAll(".example-visual");
    const examples = unit.workedExamples || [];
    holders.forEach(function (holder, idx) {
      const ex = examples[idx];
      if (!ex || !ex.visual) return;
      drawExampleVisual(holder, ex.visual);
    });
  }

  function drawExampleVisual(holder, v) {
    const chart = H.chart();
    holder.appendChild(chart.el);
    const f = safeExpr(v.f), g = v.g ? safeExpr(v.g) : null;
    const a = v.a, b = v.b;
    const NPTS = 400;
    const xs = [], yf = [], yg = [];
    for (let i = 0; i <= NPTS; i++) {
      const x = a + (b - a) * i / NPTS;
      xs.push(x);
      if (f) yf.push(f(x));
      if (g) yg.push(g(x));
    }
    const data = [];
    const accent = "rgba(108,140,255,0.35)";
    const accentLine = "#6c8cff";
    if (v.type === "area" && f) {
      data.push({
        type: "scatter", mode: "lines", x: xs, y: yf,
        fill: "tozeroy", fillcolor: accent,
        line: { color: accentLine, width: 3 },
        name: v.fname || "f(x)", hovertemplate: "x=%{x:.3f}<br>f=%{y:.3f}<extra></extra>",
      });
    } else if (v.type === "between" && f && g) {
      data.push({
        type: "scatter", mode: "lines", x: xs, y: yf,
        fill: "tozeroy", fillcolor: accent,
        line: { color: accentLine, width: 2.5 }, name: v.fname || "f(x)", hoverinfo: "skip",
      });
      data.push({
        type: "scatter", mode: "lines", x: xs, y: yg,
        fill: "tonexty", fillcolor: "rgba(56,189,248,0.28)",
        line: { color: "#38bdf8", width: 2.5, dash: "dash" },
        name: v.gname || "g(x)", hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<extra></extra>",
      });
    } else if (v.type === "riemann" && f) {
      // rectángulos de una suma de Riemann + curva
      const n = v.n || 4;
      const dx = (b - a) / n;
      const method = v.method || "right"; // left | right | mid
      const rx = [], ry = [];
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        let xi;
        if (method === "left") xi = x0;
        else if (method === "mid") xi = x0 + dx / 2;
        else xi = x0 + dx;
        rx.push(x0, x0 + dx, x0 + dx, x0);
        ry.push(0, 0, f(xi), f(xi));
      }
      data.push({
        type: "scatter", mode: "lines", x: rx, y: ry,
        fill: "toself", fillcolor: "rgba(108,140,255,0.25)",
        line: { color: "rgba(108,140,255,0.9)", width: 1.2 },
        name: "rectángulos", hoverinfo: "skip", showlegend: false,
      });
      data.push({
        type: "scatter", mode: "lines", x: xs, y: yf,
        line: { color: accentLine, width: 3 },
        name: v.fname || "f(x)", hovertemplate: "x=%{x:.3f}<br>f=%{y:.3f}<extra></extra>",
      });
    } else {
      // "curve" por defecto
      data.push({
        type: "scatter", mode: "lines", x: xs, y: yf,
        line: { color: accentLine, width: 3 },
        name: v.fname || "f(x)", hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<extra></extra>",
      });
      if (g) data.push({
        type: "scatter", mode: "lines", x: xs, y: yg,
        line: { color: "#38bdf8", width: 2.5, dash: "dash" },
        name: v.gname || "g(x)", hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<extra></extra>",
      });
    }
    // rango y de la vista: si no se indica, inferir de los datos con margen
    let yMin = (v.yRange && v.yRange[0] !== undefined) ? v.yRange[0] : null;
    let yMax = (v.yRange && v.yRange[1] !== undefined) ? v.yRange[1] : null;
    if (yMin === null || yMax === null) {
      let lo = Infinity, hi = -Infinity;
      yf.forEach(function (yy) { if (isFinite(yy)) { lo = Math.min(lo, yy); hi = Math.max(hi, yy); } });
      if (g) yg.forEach(function (yy) { if (isFinite(yy)) { lo = Math.min(lo, yy); hi = Math.max(hi, yy); } });
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const pad = Math.max(0.08 * (hi - lo), 0.05);
      if (v.type === "area" || v.type === "between") { lo = Math.min(lo, 0) - pad * 0.4; }
      if (yMin === null) yMin = lo - pad;
      if (yMax === null) yMax = hi + pad;
    }
    // rectas verticales de límites
    data.push({
      type: "scatter", mode: "lines", x: [a, a], y: [yMin, yMax],
      line: { color: "#3a4270", width: 1.5, dash: "dot" }, name: "a", hoverinfo: "skip", showlegend: false,
    });
    data.push({
      type: "scatter", mode: "lines", x: [b, b], y: [yMin, yMax],
      line: { color: "#3a4270", width: 1.5, dash: "dot" }, name: "b", hoverinfo: "skip", showlegend: false,
    });
    // puntos de interés
    (v.pts || []).forEach(function (p) {
      data.push({
        type: "scatter", mode: "markers+text", x: [p[0]], y: [p[1]],
        marker: { color: "#fbbf24", size: 11, line: { color: "#fff", width: 1.5 } },
        text: [p[2] || ""], textposition: "top center",
        textfont: { color: "#e8eaf6", size: 13 },
        name: "punto", hoverinfo: "skip", showlegend: false,
      });
    });
    const layout = {
      title: { text: v.title || "", font: { color: "#e8eaf6", size: 14 } },
      showlegend: !!v.legend || (data.length > 3),
      xaxis: { title: { text: v.xlabel || "x" }, zeroline: true },
      yaxis: { title: { text: v.ylabel || "y" }, zeroline: true, range: [yMin, yMax] },
    };
    chart.plot(data, layout);
  }

  function renderExample(ex, idx) {
    return '<div class="example">' +
      '<div class="example-head"><span>📝</span><span>' + M.toHtml(ex.title || ("Ejemplo " + (idx + 1))) + "</span></div>" +
      '<div class="example-body">' +
      '<div class="example-statement">' + M.toHtml(ex.statement) + "</div>" +
      '<ol class="t-steps example-steps">' +
      ex.steps.map(function (s) { return "<li>" + M.toHtml(s) + "</li>"; }).join("") +
      "</ol>" +
      (ex.answer ? '<div class="example-answer"><span class="lbl">Solución</span><div>' + M.raw(ex.answer) + "</div></div>" : "") +
      (ex.visual ? '<div class="example-visual" data-visual="1"></div>' : "") +
      (ex.meaning ? '<div class="callout tip" style="margin-top:14px"><div class="callout-title">🔎 ¿Qué significa en el contexto del problema?</div>' +
        M.toHtml(ex.meaning) + "</div>" : "") +
      (ex.note ? '<div class="example-note">💡 ' + M.toHtml(ex.note) + "</div>" : "") +
      "</div></div>";
  }

  function renderExercise(ex, idx) {
    const id = "ex-" + idx;
    let html = '<div class="exercise">' +
      '<div class="exercise-head"><span>🏋️</span><span class="diff">Dificultad: ' + "●".repeat(ex.difficulty || 1) + "○".repeat(3 - (ex.difficulty || 1)) + "</span></div>" +
      '<div>' + M.toHtml(ex.prompt) + "</div>" +
      '<div class="actions">' +
      (ex.hint ? '<button class="btn small" data-act="hint">💡 Pista</button>' : "") +
      '<button class="btn small" data-act="answer">✅ Solución</button>' +
      "</div>" +
      '<div class="hint-box hidden"></div>' +
      '<div class="answer-box hidden"></div>' +
      "</div>";
    return html;
  }

  function renderErrorPair(err, idx) {
    return '<div class="error-pair">' +
      '<div class="side wrong"><span class="tag wrong">✘ Error típico</span><div>' + M.toHtml(err.wrong) + "</div></div>" +
      '<div class="side right"><span class="tag right">✔ Enfoque correcto</span><div>' + M.toHtml(err.right) + "</div></div>" +
      '<div class="why">¿Por qué falla? ' + M.toHtml(err.reason || "") + "</div>" +
      "</div>";
  }

  function renderQuiz(unit, opts) {
    opts = opts || {};
    const container = el("<div></div>");
    const key = unitQuizKey(unit.id);
    const prev = progress[key] || { answers: {}, correct: 0, total: unit.quiz.length };
    const saved = prev.answers || {};

    unit.quiz.forEach(function (q, qi) {
      const box = el(
        '<div class="quiz-q">' +
        '<div class="q-text">' + M.toHtml(q.q) + "</div>" +
        '<div class="quiz-options"></div>' +
        '<div class="quiz-explain hidden"></div>' +
        "<div></div>" +
        "</div>"
      );
      const optsWrap = box.querySelector(".quiz-options");
      const explain = box.querySelector(".quiz-explain");
      const letters = ["A", "B", "C", "D", "E"];

      q.options.forEach(function (opt, oi) {
        const o = el('<div class="quiz-option"><span class="opt-letter">' + letters[oi] + ".</span><span></span></div>");
        o.querySelector("span:last-child").innerHTML = M.toHtml(opt);
        const chosen = saved[qi];
        if (chosen !== undefined) {
          if (oi === q.answer) o.classList.add("correct");
          else if (oi === chosen) o.classList.add("incorrect");
        } else {
          o.addEventListener("click", function () {
            const all = optsWrap.querySelectorAll(".quiz-option");
            all.forEach(function (n) { n.style.pointerEvents = "none"; });
            all[q.answer].classList.add("correct");
            if (oi !== q.answer) o.classList.add("incorrect");
            const correct = oi === q.answer;
            const rec = progress[key] || { answers: {}, correct: 0, total: unit.quiz.length };
            rec.answers[qi] = oi;
            if (correct) rec.correct++;
            progress[key] = rec;
            saveProgress(progress);
            const fb = box.querySelector(".quiz-feedback") || (function () {
              const f = el('<div class="quiz-feedback"></div>');
              box.appendChild(f);
              return f;
            })();
            fb.textContent = correct ? "¡Correcto! ✔" : "Incorrecto ✘";
            fb.className = "quiz-feedback " + (correct ? "ok" : "no");
            explain.classList.remove("hidden");
            explain.innerHTML = "<b>Explicación:</b> " + M.toHtml(q.explain || "");
            updateProgressBar(true);
          });
        }
        optsWrap.appendChild(o);
      });

      if (saved[qi] !== undefined && saved[qi] !== null) {
        const fb = el('<div class="quiz-feedback ' + (saved[qi] === q.answer ? "ok" : "no") + '">' +
          (saved[qi] === q.answer ? "¡Correcto! ✔" : "Incorrecto ✘") + "</div>");
        box.appendChild(fb);
        explain.classList.remove("hidden");
        explain.innerHTML = "<b>Explicación:</b> " + M.toHtml(q.explain || "");
      }
      box.querySelectorAll(".quiz-option").forEach(function (n) {
        if (saved[qi] !== undefined && saved[qi] !== null) n.style.pointerEvents = "none";
      });
      container.appendChild(box);
    });

    const resetBtn = el('<div style="margin-top:14px"></div>');
    const rb = H.btn("↺ Repetir quiz", function () {
      delete progress[key];
      saveProgress(progress);
      const panel = container.closest(".quiz-panel");
      if (panel) renderQuizInto(panel, unit);
      updateProgressBar(true);
    }, "small");
    resetBtn.appendChild(rb);
    container.appendChild(resetBtn);
    return container;
  }

  function renderQuizInto(panel, unit) {
    panel.innerHTML = "";
    panel.appendChild(renderQuiz(unit));
  }

  /* ---------- herramientas ---------- */
  // Crea el "cascarón" visual de la herramienta (sin montarla todavía).
  function buildToolShell(unit) {
    const t = unit.tool;
    const tool = window.TOOLS && window.TOOLS[t.id];
    return el('<div class="tool-shell"><div class="tool-head">' +
      '<span style="font-size:20px">' + (tool && tool.icon ? tool.icon : "🛠️") + "</span>" +
      "<div><div class='tool-title'>" + (tool ? tool.title : t.title) + "</div>" +
      '<div class="tool-desc">' + (tool ? tool.description : t.description) + "</div></div></div>" +
      '<div class="tool-body"></div></div>');
  }

  // Monta la herramienta. IMPORTANTE: el host YA debe estar en el documento,
  // porque Plotly v3.x lanza "Cannot read properties of null (reading
  // 'namespaceURI')" si newPlot recibe un contenedor desconectado.
  function mountTool(host, unit) {
    const t = unit.tool;
    const tool = window.TOOLS && window.TOOLS[t.id];
    const body = host.querySelector(".tool-body");
    if (tool && typeof tool.mount === "function") {
      try {
        tool.mount(body, { unitId: unit.id });
      } catch (e) {
        body.innerHTML = '<div class="tool-out">⚠️ Error al inicializar la herramienta: ' + String(e.message) + "</div>";
      }
    } else {
      body.innerHTML = '<div class="tool-out">⚠️ Herramienta "' + t.id + '" no encontrada.</div>';
    }
    return host;
  }

  function renderTool(unit) {
    return buildToolShell(unit);
  }

  /* ---------- vistas ---------- */
  function renderSubNav(unit, currentSub) {
    const subs = [
      ["teoria", "📖 Teoría"],
      ["ejemplos", "📝 Ejemplos"],
      ["ejercicios", "🏋️ Ejercicios"],
      ["errores", "⚠️ Errores comunes"],
      ["quiz", "🧠 Quiz"],
      ["herramienta", "🧪 Herramienta"],
    ];
    return '<div class="nav-item-row" style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 16px">' +
      subs.map(function (s) {
        return '<button class="btn ' + (currentSub === s[0] ? "primary" : "") + ' small" data-sub="' + s[0] + '">' + s[1] + "</button>";
      }).join("") + "</div>";
  }

  function renderUnit(unitId, sub) {
    const unit = C.units.find(function (u) { return u.id === unitId; });
    if (!unit) return renderHome();
    sub = sub || "teoria";
    let html = "";
    html += '<button class="btn small ghost" data-go="home">← Inicio</button>';
    html += '<h1 class="unit-title">' + unit.icon + " " + unit.title + "</h1>";
    html += '<div class="unit-subtitle">' + M.toHtml(unit.subtitle) + "</div>";
    html += '<div class="meta-chips">' +
      '<span class="chip">⏱️ <b>' + unit.duration + "</b></span>" +
      '<span class="chip">Orden: <b>' + unit.order + "/12</b></span>" +
      (isUnitMastered(unit.id) ? '<span class="chip" style="border-color:rgba(52,211,153,0.5)">🏆 <b>Dominada</b></span>' : "") +
      "</div>";
    html += renderSubNav(unit, sub);

    if (sub === "teoria") {
      html += "<h2>Objetivos de aprendizaje</h2>";
      html += '<div class="objectives">' + unit.objectives.map(function (o) {
        return '<div class="objective"><span class="obj-ico">🎯</span><span>' + M.toHtml(o) + "</span></div>";
      }).join("") + "</div>";
      html += "<h2>Teoría</h2>";
      html += unit.theory.map(renderTheoryBlock).join("");
    } else if (sub === "ejemplos") {
      html += "<h2>Ejemplos resueltos</h2>";
      html += "<p class='section-lead'>Cada ejemplo está desglosado paso a paso. Lee cada paso antes de mirar la solución final.</p>";
      html += unit.workedExamples.map(renderExample).join("");
    } else if (sub === "ejercicios") {
      html += "<h2>Ejercicios de práctica</h2>";
      html += "<p class='section-lead'>Intenta resolver antes de pedir pista o solución. La dificultad se muestra con puntos.</p>";
      html += unit.exercises.map(renderExercise).join("");
    } else if (sub === "errores") {
      html += "<h2>Errores comunes de esta unidad</h2>";
      html += "<p class='section-lead'>Estos son los patrones de error más frecuentes detectados en estudiantes de cálculo integral.</p>";
      html += unit.commonErrors.map(renderErrorPair).join("");
    } else if (sub === "quiz") {
      html += '<h2>Quiz de la unidad</h2>';
      html += "<p class='section-lead'>5 preguntas. Consigue al menos 4/5 para dominar la unidad. El progreso se guarda en tu navegador.</p>";
      html += '<div class="quiz-panel"></div>';
    } else if (sub === "herramienta") {
      html += "<h2>Herramienta interactiva</h2>";
      html += "<p class='section-lead'>Explora el concepto con esta simulación interactiva.</p>";
    }

    content.innerHTML = html;

    // wire nav
    content.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    content.querySelectorAll("[data-sub]").forEach(function (b) {
      b.addEventListener("click", function () { renderUnit(unit.id, b.getAttribute("data-sub")); });
    });

    // ejercicios
    content.querySelectorAll(".exercise").forEach(function (node, idx) {
      const ex = unit.exercises[idx];
      node.querySelectorAll("[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const act = btn.getAttribute("data-act");
          if (act === "hint") {
            const hb = node.querySelector(".hint-box");
            if (ex.hint) { hb.innerHTML = "<b>Pista:</b> " + M.toHtml(ex.hint); hb.classList.remove("hidden"); }
          } else if (act === "answer") {
            const ab = node.querySelector(".answer-box");
            ab.innerHTML = "<b>Solución:</b> " + M.toHtml(ex.answer);
            ab.classList.remove("hidden");
          }
        });
      });
    });

    // quiz
    const quizPanel = content.querySelector(".quiz-panel");
    if (quizPanel) quizPanel.appendChild(renderQuiz(unit));

    // gráficas de los ejemplos (visual)
    if (sub === "ejemplos") renderExampleVisuals(unit);

    // herramienta: primero insertar el cascarón en el documento y LUEGO montar
    // (Plotly exige contenedor conectado; ver mountTool).
    if (sub === "herramienta") {
      const shell = buildToolShell(unit);
      content.appendChild(shell);
      mountTool(shell, unit);
    }

    topbarTitle.textContent = unit.title;
    updateProgressBar();
    updateNav();
    window.scrollTo(0, 0);
  }

  function renderHome() {
    const totalQ = C.units.reduce(function (a, u) { return a + (u.quiz ? u.quiz.length : 0); }, 0);
    const done = C.units.filter(isUnitMastered).length;
    const answers = Object.keys(progress).filter(function (k) { return k.indexOf("quiz-") === 0; })
      .reduce(function (a, k) { return a + (progress[k].answers ? Object.keys(progress[k].answers).length : 0); }, 0);

    let html = "";
    html += '<div class="hero">' +
      "<h1>∫ Cálculo Integral Interactivo</h1>" +
      "<p>" + M.toHtml(C.meta.subtitle) + "</p>" +
      "<p>Curso completo con teoría, ejemplos resueltos, ejercicios, errores típicos, simuladores interactivos y exámenes.</p>" +
      "</div>";
    html += '<div class="stats-row">' +
      '<div class="stat"><div class="stat-num">' + C.units.length + "</div><div class='stat-lbl'>Unidades</div></div>" +
      '<div class="stat"><div class="stat-num">' + totalQ + "</div><div class='stat-lbl'>Preguntas de quiz</div></div>" +
      '<div class="stat"><div class="stat-num">' + done + "/" + C.units.length + "</div><div class='stat-lbl'>Unidades dominadas</div></div>" +
      '<div class="stat"><div class="stat-num">' + answers + "</div><div class='stat-lbl'>Respuestas dadas</div></div>" +
      "</div>";
    html += "<h2>Ruta de aprendizaje</h2>";
    html += '<div class="unit-card-grid">';
    html += C.units.map(function (u) {
      return '<button class="unit-card" data-go="' + u.id + '">' +
        '<div class="uc-t">' + u.icon + " " + u.title + (isUnitMastered(u.id) ? " <span style='color:var(--ok)' title='Dominada'>🏆</span>" : "") + "</div>" +
        '<div class="uc-s">' + M.toHtml(u.subtitle) + "</div>" +
        '<div class="uc-meta"><span>⏱️ ' + u.duration + "</span><span>🧠 " + u.quiz.length + " preguntas</span><span>🛠️ " + u.tool.title + "</span></div>" +
        "</button>";
    }).join("");
    html += "</div>";

    html += '<div class="stats-row" style="margin-top:26px">' +
      '<button class="btn primary" data-go="formulario" style="padding:12px 22px;font-size:15px">📋 Formulario de referencia</button>' +
      '<button class="btn primary" data-go="glosario" style="padding:12px 22px;font-size:15px">📚 Glosario</button>' +
      '<button class="btn primary" data-go="examen" style="padding:12px 22px;font-size:15px">🏁 Examen final</button>' +
      "</div>";

    content.innerHTML = html;
    content.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    topbarTitle.textContent = "Inicio";
    updateProgressBar();
    updateNav();
    window.scrollTo(0, 0);
  }

  function renderFormulario() {
    const f = C.formulario || { secciones: [] };
    let html = '<button class="btn small ghost" data-go="home">← Inicio</button>';
    html += '<h1 class="unit-title">📋 Formulario de referencia</h1>';
    html += '<p class="section-lead">Todas las fórmulas del curso en un solo lugar, organizadas por sección.</p>';
    html += f.secciones.map(function (sec) {
      let t = "<h2>" + M.toHtml(sec.title) + "</h2>";
      t += '<div class="tbl-wrapper"><table class="tbl"><thead><tr><th>Expresión</th><th>Fórmula</th><th>Notas</th></tr></thead><tbody>';
      t += sec.items.map(function (it) {
        return "<tr><td>" + M.toHtml(it.name) + "</td><td>" + M.raw(it.formula) + "</td><td>" + M.toHtml(it.notes || "") + "</td></tr>";
      }).join("");
      t += "</tbody></table></div>";
      return t;
    }).join("");
    content.innerHTML = html;
    content.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-go")); }); });
    topbarTitle.textContent = "Formulario";
    updateNav();
  }

  function renderGlosario() {
    const g = C.glosario || { terms: [] };
    const idx = { letters: {}, current: null };
    let html = '<button class="btn small ghost" data-go="home">← Inicio</button>';
    html += '<h1 class="unit-title">📚 Glosario</h1>';
    html += '<p class="section-lead">' + g.terms.length + " términos clave del curso, en orden alfabético.</p>";
    g.terms.forEach(function (t) {
      const letter = t.term[0].toUpperCase();
      if (idx.current !== letter) {
        idx.current = letter;
        html += '<h3 style="background:var(--bg-3);padding:4px 12px;border-radius:8px">' + letter + "</h3>";
      }
      html += '<div class="term-row"><div class="term-t">' + M.toHtml(t.term) + '</div><div>' + M.toHtml(t.def) + "</div></div>";
    });
    content.innerHTML = html;
    content.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-go")); }); });
    topbarTitle.textContent = "Glosario";
    updateNav();
  }

  /* ---------- examen ---------- */
  let exam = null;

  function renderExam() {
    const key = examKey();
    const prev = progress[key];
    if (!exam) {
      const pool = C.units.flatMap(function (u) {
        return u.quiz.map(function (q, qi) { return { unit: u.id, q: q, qi: qi }; });
      });
      const sampleN = (C.meta.exam && C.meta.exam.sample) || 20;
      const shuffled = pool.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      exam = {
        questions: shuffled.slice(0, Math.min(sampleN, shuffled.length)),
        answers: {},
        done: false,
        correct: 0,
      };
    }

    let html = '<button class="btn small ghost" data-go="home">← Inicio</button>';
    html += '<h1 class="unit-title">🏁 Examen final</h1>';
    html += '<p class="section-lead">' + exam.questions.length + " preguntas aleatorias de todo el curso. Aprueba con 60% o más.</p>";

    if (exam.done) {
      const pct = Math.round((exam.correct / exam.questions.length) * 100);
      const passed = exam.correct / exam.questions.length >= 0.6;
      html += '<div class="hero exam-hero">' +
        '<div class="score-big">' + exam.correct + " / " + exam.questions.length + "</div>" +
        '<div class="score-lbl">Calificación: ' + pct + "% — " + (passed ? "✅ Aprobado" : "❌ Inténtalo de nuevo") + "</div>" +
        '<div class="progressbar"><div style="width:' + pct + '%"></div></div>' +
        '<button class="btn primary" data-act="restart-exam">↺ Nuevo examen</button>' +
        "</div>";
      exam.questions.forEach(function (item, i) {
        const chosen = exam.answers[i];
        html += '<div class="quiz-q"><div class="q-text">' + (i + 1) + ". " + M.toHtml(item.q.q) + "</div>" +
          '<div class="quiz-options">' + item.q.options.map(function (o, oi) {
            return '<div class="quiz-option ' + (oi === item.q.answer ? "correct" : oi === chosen ? "incorrect" : "") + '"><span class="opt-letter">' +
              ["A", "B", "C", "D", "E"][oi] + ".</span><span>" + M.toHtml(o) + "</span></div>";
          }).join("") + "</div>" +
          '<div class="quiz-explain"><b>Explicación:</b> ' + M.toHtml(item.q.explain || "") + "</div></div>";
      });
      // guardar en progreso
      progress[key] = { correct: exam.correct, total: exam.questions.length, pct: pct, done: true };
      saveProgress(progress);
    } else {
      const i = Object.keys(exam.answers).length;
      const item = exam.questions[i];
      if (!item) {
        exam.done = true;
        progress[key] = { correct: exam.correct, total: exam.questions.length, done: true };
        saveProgress(progress);
        return renderExam();
      }
      html += '<div class="hero exam-hero">' +
        '<div class="progressbar"><div style="width:' + (i / exam.questions.length * 100) + '%"></div></div>' +
        'Pregunta <b>' + (i + 1) + "</b> de " + exam.questions.length + '<div style="height:8px"></div>' +
        '<div style="background:var(--bg-2);border-radius:10px;padding:16px 18px;font-size:16.5px">' + M.toHtml(item.q.q) + "</div>" +
        "</div>";
      html += '<div class="quiz-options">' + item.q.options.map(function (o, oi) {
        return '<button class="quiz-option" data-opt="' + oi + '" style="width:100%"><span class="opt-letter">' +
          ["A", "B", "C", "D", "E"][oi] + ".</span><span>" + M.toHtml(o) + "</span></button>";
      }).join("") + "</div>";
    }

    content.innerHTML = html;
    content.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-go")); }); });
    const restart = content.querySelector('[data-act="restart-exam"]');
    if (restart) restart.addEventListener("click", function () {
      exam = null;
      delete progress[key];
      saveProgress(progress);
      renderExam();
    });
    content.querySelectorAll("[data-opt]").forEach(function (b) {
      b.addEventListener("click", function () {
        const oi = parseInt(b.getAttribute("data-opt"), 10);
        const i = Object.keys(exam.answers).length;
        exam.answers[i] = oi;
        if (oi === exam.questions[i].q.answer) exam.correct++;
        renderExam();
      });
    });
    topbarTitle.textContent = "Examen final";
    updateNav();
  }

  /* ---------- navegación y progreso ---------- */
  function buildNav() {
    let html = '<div class="nav-section">Inicio</div>';
    html += '<button class="nav-item" data-nav="home"><span class="nav-ico">🏠</span>Inicio</button>';
    html += '<div class="nav-section">Unidades</div>';
    html += C.units.map(function (u) {
      return '<button class="nav-item" data-nav="' + u.id + '">' +
        '<span class="nav-ico">' + u.icon + "</span>" +
        "<span>" + u.order + ". " + u.title + "</span>" +
        (isUnitMastered(u.id) ? '<span class="nav-check">🏆</span>' : "") +
        "</button>";
    }).join("");
    html += '<div class="nav-section">Recursos</div>';
    html += '<button class="nav-item" data-nav="formulario"><span class="nav-ico">📋</span>Formulario</button>';
    html += '<button class="nav-item" data-nav="glosario"><span class="nav-ico">📚</span>Glosario</button>';
    html += '<button class="nav-item" data-nav="examen"><span class="nav-ico">🏁</span>Examen final</button>';
    nav.innerHTML = html;
    updateNav();
  }

  function updateNav() {
    nav.querySelectorAll("[data-nav]").forEach(function (b) {
      const navTo = b.getAttribute("data-nav");
      const active = state.route === "unit" ? state.unitId === navTo :
        state.route === navTo;
      b.classList.toggle("active", !!active);
    });
  }

  function updateProgressBar(silent) {
    const done = C.units.filter(isUnitMastered).length;
    const total = C.units.length;
    topbarProgress.textContent = "🏆 " + done + "/" + total + " unidades";
  }

  function go(route) {
    if (route === "home") { state = { route: "home" }; renderHome(); }
    else if (route === "formulario") { state = { route: "formulario" }; renderFormulario(); }
    else if (route === "glosario") { state = { route: "glosario" }; renderGlosario(); }
    else if (route === "examen") { state = { route: "examen" }; renderExam(); }
    else if (C.units.some(function (u) { return u.id === route; })) {
      state = { route: "unit", unitId: route, sub: "teoria" };
      renderUnit(route, "teoria");
    }
    document.getElementById("sidebar").classList.remove("open");
    try { history.replaceState(null, "", "#" + route); } catch (e) { /* noop */ }
  }

  /* ---------- init ---------- */
  function init() {
    buildNav();
    // navegación del sidebar
    nav.addEventListener("click", function (e) {
      const b = e.target.closest("[data-nav]");
      if (b) go(b.getAttribute("data-nav"));
    });
    document.getElementById("menu-btn").addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("open");
    });
    document.getElementById("btn-reset-progress").addEventListener("click", function () {
      if (confirm("¿Borrar todo el progreso guardado (quiz y examen)?")) {
        progress = {};
        saveProgress(progress);
        exam = null;
        go("home");
      }
    });
    // hash inicial
    const h = location.hash.replace("#", "");
    if (h && C.units.some(function (u) { return u.id === h || u.slug === h; })) {
      const u = C.units.find(function (x) { return x.id === h || x.slug === h; });
      go(u.id);
    } else if (h === "formulario" || h === "glosario" || h === "examen") {
      go(h);
    } else {
      go("home");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
