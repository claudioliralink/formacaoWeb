/* Motor das apresentações – Programação Web, Nível Básico
   Teclas: setas / espaço (navegar), Home / End, I (índice), N (notas), F (ecrã inteiro), T (tema claro/escuro), Esc (fechar) */
(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  if (!total) return;
  let cur = 0;

  function make(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* Barra de progresso */
  const prog = make("div", "progress");
  document.body.append(prog);

  /* Painel de notas do formador */
  const notes = make("div", "notes-panel");
  notes.setAttribute("aria-live", "polite");
  document.body.append(notes);

  /* Índice */
  const idx = make("nav", "index-panel");
  idx.setAttribute("aria-label", "Índice dos diapositivos");
  idx.append(make("h2", "", "Índice"));
  const ol = make("ol");
  const idxButtons = slides.map((s, i) => {
    const t = s.querySelector("h1, h2");
    const li = make("li");
    const b = make("button", "", t ? t.textContent.replace(/\s+/g, " ").trim() : "Diapositivo " + (i + 1));
    b.type = "button";
    b.addEventListener("click", () => { go(i); toggleIndex(false); });
    li.append(b);
    ol.append(li);
    return b;
  });
  idx.append(ol);
  document.body.append(idx);

  /* Barra de controlo */
  const bar = make("div", "bar");
  const plan = make("a", "", "Plano");
  plan.href = "../index.html#plano";
  const prev = make("button", "", "Anterior");
  const next = make("button", "", "Seguinte");
  const title = make("span", "title-txt hide-sm", document.body.dataset.day || "");
  const count = make("span", "count");
  count.setAttribute("aria-live", "polite");
  const bIdx = make("button", "", "Índice");
  const bNotes = make("button", "hide-sm", "Notas do formador");
  const bFull = make("button", "hide-sm", "Ecrã inteiro");
  [prev, next, bIdx, bNotes, bFull].forEach(b => b.type = "button");
  bIdx.setAttribute("aria-pressed", "false");
  bNotes.setAttribute("aria-pressed", "false");
  const bTema = make("button", "tema-btn");
  bTema.setAttribute("data-tema-botao", "");
  /* O botão das notas só aparece quando a apresentação tem notas (versão do formador) */
  const temNotas = !!document.querySelector("aside.notes");
  bar.append(plan, prev, next, title, count, bIdx);
  if (temNotas) bar.append(bNotes);
  bar.append(bFull, bTema);
  if (window.PWBTema) window.PWBTema.ligarBotoes();
  document.body.append(bar);

  prev.addEventListener("click", () => go(cur - 1));
  next.addEventListener("click", () => go(cur + 1));
  bIdx.addEventListener("click", () => toggleIndex());
  bNotes.addEventListener("click", () => toggleNotes());
  bFull.addEventListener("click", toggleFull);

  function go(n) {
    cur = Math.max(0, Math.min(total - 1, n));
    slides.forEach((s, i) => {
      const on = i === cur;
      s.classList.toggle("active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      idxButtons[i].setAttribute("aria-current", on ? "true" : "false");
    });
    slides[cur].scrollTop = 0;
    count.textContent = (cur + 1) + " / " + total;
    prog.style.width = ((cur + 1) / total * 100) + "%";
    prev.disabled = cur === 0;
    next.disabled = cur === total - 1;
    const n2 = slides[cur].querySelector("aside.notes");
    notes.innerHTML = "<strong>Notas do formador:</strong> " + (n2 ? n2.innerHTML : "sem notas para este diapositivo.");
    if (history.replaceState) history.replaceState(null, "", "#" + (cur + 1));
  }

  function toggleIndex(force) {
    const open = force !== undefined ? force : !idx.classList.contains("open");
    idx.classList.toggle("open", open);
    bIdx.setAttribute("aria-pressed", String(open));
    if (open) idxButtons[cur].focus();
  }
  function toggleNotes(force) {
    const show = force !== undefined ? force : !notes.classList.contains("show");
    notes.classList.toggle("show", show);
    bNotes.setAttribute("aria-pressed", String(show));
  }
  function toggleFull() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* Teclado */
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    if ((e.key === " " || e.key === "Enter") && t.closest && t.closest("button, a")) return;
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": e.preventDefault(); go(cur + 1); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); go(cur - 1); break;
      case "Home": go(0); break;
      case "End": go(total - 1); break;
      case "i": case "I": toggleIndex(); break;
      case "n": case "N": if (temNotas) toggleNotes(); break;
      case "f": case "F": toggleFull(); break;
      case "t": case "T": if (window.PWBTema) window.PWBTema.alternar(); break;
      case "Escape": toggleIndex(false); toggleNotes(false); break;
    }
  });

  /* Toque (deslizar em telemóvel e tablet) */
  let x0 = null;
  const deck = document.querySelector(".deck");
  deck.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  /* Blocos de código: copiar e, quando marcado com data-run, ver o resultado */
  document.querySelectorAll("pre.code").forEach(pre => {
    const tools = make("div", "code-tools");
    const copy = make("button", "", "Copiar código");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.textContent); copy.textContent = "Copiado"; }
      catch (err) { copy.textContent = "Seleccione e copie manualmente"; }
      setTimeout(() => { copy.textContent = "Copiar código"; }, 1800);
    });
    tools.append(copy);

    if (pre.hasAttribute("data-run")) {
      const run = make("button", "", "Ver resultado");
      run.type = "button";
      let frame = null;
      run.addEventListener("click", () => {
        if (!frame) {
          frame = make("iframe", "demo-frame");
          frame.title = "Resultado do exemplo";
          frame.setAttribute("sandbox", "allow-scripts allow-modals allow-forms");
          frame.srcdoc = pre.textContent;
          tools.after(frame);
          run.textContent = "Esconder resultado";
        } else {
          frame.remove();
          frame = null;
          run.textContent = "Ver resultado";
        }
      });
      tools.prepend(run);
    }
    pre.after(tools);
  });

  /* Perguntas com resposta escondida */
  document.querySelectorAll(".reveal").forEach(b => {
    b.type = "button";
    b.addEventListener("click", () => {
      const a = b.nextElementSibling;
      if (!a) return;
      a.hidden = !a.hidden;
      b.textContent = a.hidden ? "Mostrar resposta" : "Esconder resposta";
    });
  });

  /* Início: lê o número do diapositivo do endereço (#3) */
  function fromHash() {
    const n = parseInt(location.hash.replace("#", ""), 10);
    return isNaN(n) ? 0 : n - 1;
  }
  window.addEventListener("hashchange", () => go(fromHash()));
  go(fromHash());
})();
