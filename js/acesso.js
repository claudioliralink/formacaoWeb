/* Acesso às páginas protegidas – Programação Web, Nível Básico
   Dois perfis, cada um com o seu código estático:
   • Formando (código da turma): abre a versão do formando de cada aula, só a partir da
     data/hora da aula. A chave do dia é publicada no site nesse momento, cifrada com o
     código da turma (../protegido/dia-N.chave). Sem o código, essa chave não serve de nada.
   • Formador (código do formador): abre a versão completa (notas, soluções, materiais do
     formador) a qualquer momento.
   Requer js/cofre.js. */
(function () {
  "use strict";
  const C = window.PWBCofre;
  const dadosEl = document.getElementById("pwb-dados");
  if (!dadosEl || !C) return;
  const D = JSON.parse(dadosEl.textContent);
  const ui = document.getElementById("pwb-acesso");
  const $ = sel => ui.querySelector(sel);
  const liberta = D.liberta ? new Date(D.liberta) : null;
  const fmt = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });

  function estado(html) { $("#pwb-estado").innerHTML = html; }
  function mostrarForm(v) { $("#pwb-form").hidden = !v; }

  /* ---------- Mostrar o conteúdo ---------- */
  function mostrar(conteudo, papel) {
    if (conteudo.html) {                      // apresentação ou página completa
      document.open();
      document.write(conteudo.html);
      document.close();
      return;
    }
    mostrarFicheiros(conteudo.ficheiros, papel);
  }

  async function abrirFormador(kek) {
    const chave = await C.desembrulhar(kek, D.chaveFormador);
    mostrar(await C.abrir(chave, D.formador), "formador");
  }

  /* ---------- Formando: código da turma + data ---------- */
  let relogio = null, tentativas = 0;
  function fluxoTurma(kek) {
    mostrarForm(false);
    if (!D.formando) {
      estado("🔐 Esta página é exclusiva do formador. <a href=\"#\" data-sair>Usar outro código</a>");
      return;
    }
    if (liberta && Date.now() < liberta) {
      const tick = () => {
        const falta = liberta - Date.now();
        if (falta <= 0) { clearInterval(relogio); buscarChave(kek); return; }
        const d = Math.floor(falta / 864e5), h = Math.floor(falta % 864e5 / 36e5), m = Math.floor(falta % 36e5 / 6e4), s = Math.floor(falta % 6e4 / 1e3);
        estado("✅ Código da turma aceite.<br>🔒 Esta aula abre <strong>" + fmt.format(liberta) + "</strong> (hora de Luanda) e aparece sozinha nesta página." +
          '<span class="pwb-contagem">Faltam ' + (d ? d + " d " : "") + String(h).padStart(2, "0") + " h " + String(m).padStart(2, "0") + " min " + String(s).padStart(2, "0") + " s</span>");
      };
      tick(); relogio = setInterval(tick, 1000);
    } else {
      buscarChave(kek);
    }
  }

  async function buscarChave(kek) {
    estado("⏳ A abrir a aula…");
    let emb;
    try {
      const r = await fetch("../protegido/dia-" + D.dia + ".chave?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error("ainda não publicada");
      const [iv, chave] = (await r.text()).trim().split(".");
      if (!iv || !chave) throw new Error("formato inválido");
      emb = { iv, chave };
    } catch (e) {
      tentativas++;
      if (location.protocol === "file:") { estado("📁 Ficheiro aberto directamente do computador: a libertação só funciona no site publicado."); return; }
      estado("⏳ A aula está a ser libertada. A página tenta de novo sozinha dentro de 1 minuto" + (tentativas > 1 ? " (tentativa " + tentativas + ")" : "") + ".");
      setTimeout(() => buscarChave(kek), 60000);
      return;
    }
    try {
      const chave = await C.desembrulhar(kek, emb);
      mostrar(await C.abrir(chave, D.formando), "formando");
    } catch (e) {
      estado("⚠️ Não foi possível abrir a aula com o código da turma guardado. <a href=\"#\" data-sair>Introduza o código de novo</a>.");
    }
  }

  /* ---------- Formulário ---------- */
  $("#pwb-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const campo = $("#pwb-codigo"), msg = $("#pwb-msg"), botao = $("#pwb-form button");
    if (!campo.value.trim()) { msg.textContent = "Escreva o código."; return; }
    botao.disabled = true; msg.className = "pwb-msg"; msg.textContent = "A verificar…";
    const papel = await C.identificar(campo.value, D.cfg);
    campo.value = "";
    botao.disabled = false;
    if (papel === "formador") { msg.textContent = ""; try { await abrirFormador(C.obter("formador")); } catch (e) { msg.textContent = "Erro ao abrir o conteúdo."; } }
    else if (papel === "turma") { msg.textContent = ""; fluxoTurma(C.obter("turma")); }
    else { msg.textContent = "Código incorrecto."; msg.className = "pwb-msg erro"; campo.focus(); }
  });

  ui.addEventListener("click", ev => {
    if (ev.target.matches("[data-sair]")) { ev.preventDefault(); C.esquecer(); location.reload(); }
  });

  /* ---------- Início ---------- */
  (async function iniciar() {
    if (!C.disponivel) { estado("⚠️ Este navegador não suporta a desencriptação. Use uma versão actual do Chrome, Edge, Firefox ou Safari."); mostrarForm(false); return; }
    const kf = C.obter("formador");
    if (kf) { try { await abrirFormador(kf); return; } catch (e) { C.esquecer(); } }
    const kt = C.obter("turma");
    if (kt) { fluxoTurma(kt); return; }
    if (!D.formando) estado("🔐 Página exclusiva do formador. Introduza o código do formador.");
    else if (liberta && Date.now() < liberta) estado("🔒 Esta aula abre <strong>" + fmt.format(liberta) + "</strong> (hora de Luanda). Introduza já o código da turma e a aula aparece sozinha nessa hora.");
    else estado("🔓 A aula já está disponível. Introduza o código da turma.");
  })();

  /* =================================================================
     Página dos ficheiros do exercício
     ================================================================= */
  function mostrarFicheiros(ficheiros, papel) {
    const zona = document.getElementById("pwb-ficheiros");
    ui.hidden = true;
    zona.hidden = false;
    const grupos = { inicio: [], solucao: [] };
    ficheiros.forEach(f => { const g = f.caminho.split("/")[0]; (grupos[g] = grupos[g] || []).push(f); });
    const secSol = document.getElementById("pwb-solucao");
    if (!grupos.solucao.length) {
      secSol.innerHTML = '<h2 style="margin-top:0">Solução</h2><p class="muted">A solução é apresentada pelo formador na correcção do exercício.</p>';
    }
    document.getElementById("pwb-perfil").textContent = papel === "formador" ? "Vista do formador (inclui a solução)" : "Vista do formando";

    ["inicio", "solucao"].forEach(g => {
      const lista = grupos[g] || [];
      const sec = document.getElementById("pwb-" + g);
      if (!sec || !lista.length) return;
      const ul = sec.querySelector("ul");
      lista.forEach(f => {
        const li = document.createElement("li");
        const code = document.createElement("code");
        code.textContent = f.caminho.slice(g.length + 1);
        li.append(code);
        ul.append(li);
      });
      sec.querySelector("[data-zip]").addEventListener("click", () => {
        const itens = lista.map(f => ({ nome: "exercicio-" + D.dia + "-" + g + "/" + f.caminho.slice(g.length + 1), dados: new TextEncoder().encode(f.conteudo) }));
        descarregar(criarZip(itens), "exercicio-" + D.dia + "-" + g + ".zip");
      });
      sec.querySelector("[data-ver]").addEventListener("click", () => preVisualizar(lista, g));
    });
    if (location.hash === "#solucao" && grupos.solucao.length) secSol.scrollIntoView();
  }

  function preVisualizar(lista, g) {
    const mapa = {};
    lista.forEach(f => mapa[f.caminho.slice(g.length + 1)] = f.conteudo);
    const principal = Object.keys(mapa).find(n => n.endsWith(".html"));
    if (!principal) return;
    let html = mapa[principal];
    html = html.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/g, (m, href) => mapa[href] !== undefined ? "<style>\n" + mapa[href] + "\n</style>" : m);
    let scripts = "";
    html = html.replace(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g, (m, src) => {
      if (mapa[src] === undefined) return m;
      scripts += "<script>\n" + mapa[src].replace(/<\/script/gi, "<\\/script") + "\n<\/script>\n";
      return "";
    });
    html = html.replace(/src="([^"]+\.svg)"/g, (m, src) => mapa[src] !== undefined ? 'src="data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(mapa[src]))) + '"' : m);
    html = html.includes("</body>") ? html.replace("</body>", scripts + "</body>") : html + scripts;
    document.getElementById("pwb-frame").srcdoc = html;
    document.getElementById("pwb-frame-titulo").textContent = "Pré-visualização: " + (g === "inicio" ? "ponto de partida" : "solução") + " (" + principal + ")";
    document.getElementById("pwb-pre").hidden = false;
    document.getElementById("pwb-pre").scrollIntoView({ behavior: "smooth" });
  }

  function descarregar(blob, nome) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ZIP sem compressão (método "store") */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function criarZip(itens) {
    const enc = new TextEncoder(), partes = [], central = [];
    let offset = 0;
    const agora = new Date();
    const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
    const data = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
    itens.forEach(it => {
      const nome = enc.encode(it.nome), crc = crc32(it.dados), tam = it.dados.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(10, hora, true); lh.setUint16(12, data, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, tam, true); lh.setUint32(22, tam, true); lh.setUint16(26, nome.length, true);
      partes.push(lh.buffer, nome, it.dados);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(12, hora, true); ch.setUint16(14, data, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, tam, true); ch.setUint32(24, tam, true); ch.setUint16(28, nome.length, true);
      ch.setUint32(42, offset, true);
      central.push(ch.buffer, nome);
      offset += 30 + nome.length + tam;
    });
    const tamCentral = central.reduce((s, p) => s + (p.byteLength !== undefined ? p.byteLength : p.length), 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, itens.length, true); fim.setUint16(10, itens.length, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, offset, true);
    return new Blob([...partes, ...central, fim.buffer], { type: "application/zip" });
  }
})();
