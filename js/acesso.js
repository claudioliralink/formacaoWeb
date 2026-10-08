/* Acesso às aulas protegidas – Programação Web, Nível Básico
   O conteúdo de cada dia está cifrado (AES-256-GCM). Há duas formas de o abrir:
   1. Libertação por data: a partir da data/hora da aula, o site publica a chave do dia
      em ../protegido/dia-N.chave (feito automaticamente pela GitHub Action).
   2. Código do formador: desbloqueia qualquer dia, a qualquer momento (PBKDF2 + AES-GCM).
   Nenhuma chave nem conteúdo legível existe nos ficheiros antes da libertação. */
(function () {
  "use strict";
  const dadosEl = document.getElementById("pwb-dados");
  if (!dadosEl) return;
  const D = JSON.parse(dadosEl.textContent);
  const ui = document.getElementById("pwb-acesso");
  const CHAVE_SESSAO = "pwb-chave-dia-" + D.dia;
  const subtle = window.crypto && window.crypto.subtle;

  const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64e = u => { let s = ""; u.forEach(b => s += String.fromCharCode(b)); return btoa(s); };
  const $ = sel => ui.querySelector(sel);

  /* ---------- Criptografia ---------- */
  async function decifrar(chaveBruta) {
    const k = await subtle.importKey("raw", chaveBruta, "AES-GCM", false, ["decrypt"]);
    const claro = await subtle.decrypt({ name: "AES-GCM", iv: b64d(D.iv) }, k, b64d(D.dados));
    return JSON.parse(new TextDecoder().decode(claro));
  }
  async function chaveDoCodigo(codigo) {
    const base = await subtle.importKey("raw", new TextEncoder().encode(codigo.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
    const kek = await subtle.deriveKey(
      { name: "PBKDF2", salt: b64d(D.formador.sal), iterations: D.formador.iteracoes, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const bruta = await subtle.decrypt({ name: "AES-GCM", iv: b64d(D.formador.iv) }, kek, b64d(D.formador.chave));
    return new Uint8Array(bruta);
  }

  /* ---------- Abrir o conteúdo ---------- */
  async function abrir(chaveBruta, origem) {
    const conteudo = await decifrar(chaveBruta);           // falha se a chave estiver errada
    try { sessionStorage.setItem(CHAVE_SESSAO, b64e(chaveBruta)); } catch (e) {}
    if (D.tipo === "slides") {
      document.open();
      document.write(conteudo.slides);
      document.close();
    } else {
      mostrarFicheiros(conteudo.ficheiros, origem);
    }
  }

  /* ---------- Estados do ecrã de bloqueio ---------- */
  const liberta = new Date(D.liberta);
  const fmt = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });

  function estado(html) { $("#pwb-estado").innerHTML = html; }

  let relogio = null;
  function contagem() {
    const falta = liberta - Date.now();
    if (falta <= 0) { clearInterval(relogio); tentarLibertada(); return; }
    const d = Math.floor(falta / 864e5), h = Math.floor(falta % 864e5 / 36e5), m = Math.floor(falta % 36e5 / 6e4), s = Math.floor(falta % 6e4 / 1e3);
    const partes = (d ? d + " d " : "") + String(h).padStart(2, "0") + " h " + String(m).padStart(2, "0") + " min " + String(s).padStart(2, "0") + " s";
    estado('🔒 Esta aula abre <strong>' + fmt.format(liberta) + '</strong> (hora de Luanda).<span class="pwb-contagem">Faltam ' + partes + '</span>');
  }

  let tentativas = 0;
  async function tentarLibertada() {
    estado("⏳ A verificar se a aula já foi libertada…");
    try {
      const r = await fetch("../protegido/dia-" + D.dia + ".chave?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error("ainda não publicada");
      const txt = (await r.text()).trim();
      await abrir(b64d(txt), "data");
    } catch (e) {
      tentativas++;
      if (location.protocol === "file:") {
        estado("📁 Está a abrir o ficheiro directamente do computador. A libertação automática só funciona no site publicado. Use o código do formador.");
        return;
      }
      estado("⏳ A aula está a ser libertada. A página tenta de novo automaticamente dentro de 1 minuto" + (tentativas > 1 ? " (tentativa " + tentativas + ")" : "") + ".");
      setTimeout(tentarLibertada, 60000);
    }
  }

  /* ---------- Formulário do código ---------- */
  $("#pwb-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const campo = $("#pwb-codigo");
    const msg = $("#pwb-msg");
    const botao = $("#pwb-form button");
    if (!campo.value.trim()) { msg.textContent = "Escreva o código."; return; }
    botao.disabled = true; msg.textContent = "A verificar…"; msg.className = "pwb-msg";
    try {
      const k = await chaveDoCodigo(campo.value.trim());
      campo.value = "";
      await abrir(k, "codigo");
    } catch (e) {
      msg.textContent = "Código incorrecto.";
      msg.className = "pwb-msg erro";
      botao.disabled = false;
      campo.select();
    }
  });

  /* ---------- Início ---------- */
  async function iniciar() {
    if (!subtle) {
      estado("⚠️ Este navegador não suporta a desencriptação. Use uma versão actual do Chrome, Edge, Firefox ou Safari, num endereço https.");
      return;
    }
    let guardada = null;
    try { guardada = sessionStorage.getItem(CHAVE_SESSAO); } catch (e) {}
    if (guardada) {
      try { await abrir(b64d(guardada), "sessao"); return; } catch (e) { try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e2) {} }
    }
    if (Date.now() >= liberta) tentarLibertada();
    else { contagem(); relogio = setInterval(contagem, 1000); }
  }
  iniciar();

  /* =================================================================
     Visualizador de ficheiros dos exercícios
     ================================================================= */
  function mostrarFicheiros(ficheiros, origem) {
    const zona = document.getElementById("pwb-ficheiros");
    ui.hidden = true;
    zona.hidden = false;
    const grupos = { inicio: [], solucao: [] };
    ficheiros.forEach(f => { const g = f.caminho.split("/")[0]; (grupos[g] = grupos[g] || []).push(f); });

    ["inicio", "solucao"].forEach(g => {
      const lista = grupos[g] || [];
      const sec = document.getElementById("pwb-" + g);
      if (!sec) return;
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
    if (location.hash === "#solucao") document.getElementById("pwb-solucao").scrollIntoView();
  }

  /* Junta HTML, CSS, JS e imagens num só documento para pré-visualizar */
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
    const frame = document.getElementById("pwb-frame");
    const titulo = document.getElementById("pwb-frame-titulo");
    frame.srcdoc = html;
    titulo.textContent = "Pré-visualização: " + (g === "inicio" ? "ponto de partida" : "solução") + " (" + principal + ")";
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

  /* ZIP sem compressão (método "store"), suficiente para ficheiros pequenos */
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
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, hora, true); lh.setUint16(12, data, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, tam, true); lh.setUint32(22, tam, true); lh.setUint16(26, nome.length, true); lh.setUint16(28, 0, true);
      partes.push(lh.buffer, nome, it.dados);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, hora, true); ch.setUint16(14, data, true); ch.setUint32(16, crc, true);
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
