/* Cofre – funções de criptografia partilhadas (Programação Web, Nível Básico)
   - Códigos (formador e turma) são transformados em chaves com PBKDF2-SHA256.
   - Os conteúdos são cifrados com AES-256-GCM.
   - Depois de um código ser aceite, a chave derivada fica guardada só neste separador
     (sessionStorage), para não ter de o escrever em cada página. */
(function () {
  "use strict";
  const subtle = window.crypto && window.crypto.subtle;
  const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64e = u => { let s = ""; new Uint8Array(u).forEach(b => s += String.fromCharCode(b)); return btoa(s); };
  const SESSAO = { formador: "pwb-kek-formador", turma: "pwb-kek-turma" };

  async function derivar(codigo, sal, iteracoes) {
    const base = await subtle.importKey("raw", new TextEncoder().encode(codigo.trim().normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits({ name: "PBKDF2", salt: b64d(sal), iterations: iteracoes, hash: "SHA-256" }, base, 256);
    return new Uint8Array(bits);
  }
  async function aesDecifrar(chaveBruta, iv, dados) {
    const k = await subtle.importKey("raw", chaveBruta, "AES-GCM", false, ["decrypt"]);
    return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: b64d(iv) }, k, b64d(dados)));
  }
  /* Abre uma chave embrulhada: { iv, chave } */
  const desembrulhar = (kek, emb) => aesDecifrar(kek, emb.iv, emb.chave);
  /* Abre um conteúdo cifrado: { iv, dados } → objecto JSON */
  async function abrir(chave, pacote) {
    const claro = await aesDecifrar(chave, pacote.iv, pacote.dados);
    return JSON.parse(new TextDecoder().decode(claro));
  }

  function guardar(papel, kek) { try { sessionStorage.setItem(SESSAO[papel], b64e(kek)); } catch (e) {} }
  function obter(papel) { try { const v = sessionStorage.getItem(SESSAO[papel]); return v ? b64d(v) : null; } catch (e) { return null; } }
  function esquecer() { try { Object.values(SESSAO).forEach(k => sessionStorage.removeItem(k)); } catch (e) {} }

  /* Identifica o código: tenta primeiro como código do formador, depois como código da turma.
     cfg = { iteracoes, salFormador, salTurma, verifFormador:{iv,dados}, verifTurma:{iv,dados} } */
  async function identificar(codigo, cfg) {
    const kf = await derivar(codigo, cfg.salFormador, cfg.iteracoes);
    try { await abrir(kf, cfg.verifFormador); guardar("formador", kf); return "formador"; } catch (e) {}
    const kt = await derivar(codigo, cfg.salTurma, cfg.iteracoes);
    try { await abrir(kt, cfg.verifTurma); guardar("turma", kt); return "turma"; } catch (e) {}
    return null;
  }

  window.PWBCofre = { disponivel: !!subtle, b64d, b64e, derivar, desembrulhar, abrir, guardar, obter, esquecer, identificar };
})();
