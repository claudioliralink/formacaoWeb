/* Modo claro / escuro – Programação Web, Nível Básico
   Carregar no <head> (sem defer) para evitar o "piscar" de cor ao abrir a página.
   - Primeira visita: segue a preferência do sistema operativo.
   - Depois de o utilizador escolher, a escolha fica guardada neste navegador.
   - Qualquer elemento com o atributo data-tema-botao passa a alternar o tema. */
(function () {
  var CHAVE = "pwb-tema";
  var raiz = document.documentElement;

  function guardado() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function sistema() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  function aplicar(tema) {
    raiz.setAttribute("data-tema", tema);
    raiz.style.colorScheme = tema === "escuro" ? "dark" : "light";
    var botoes = document.querySelectorAll("[data-tema-botao]");
    for (var i = 0; i < botoes.length; i++) actualizarBotao(botoes[i], tema);
  }
  function actualizarBotao(b, tema) {
    var escuro = tema === "escuro";
    b.setAttribute("aria-pressed", String(escuro));
    b.setAttribute("aria-label", escuro ? "Mudar para modo claro" : "Mudar para modo escuro");
    b.title = escuro ? "Modo claro" : "Modo escuro";
    var txt = b.getAttribute("data-tema-botao") === "texto";
    b.textContent = txt ? (escuro ? "☀️ Modo claro" : "🌙 Modo escuro") : (escuro ? "☀️" : "🌙");
  }
  function alternar() {
    var novo = raiz.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
    try { localStorage.setItem(CHAVE, novo); } catch (e) {}
    aplicar(novo);
  }

  aplicar(guardado() || sistema());

  /* Se o utilizador nunca escolheu, acompanha mudanças do sistema */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var ouvir = function () { if (!guardado()) aplicar(sistema()); };
    if (mq.addEventListener) mq.addEventListener("change", ouvir); else if (mq.addListener) mq.addListener(ouvir);
  }

  function ligarBotoes() {
    var botoes = document.querySelectorAll("[data-tema-botao]");
    for (var i = 0; i < botoes.length; i++) {
      if (botoes[i].dataset.temaLigado) continue;
      botoes[i].dataset.temaLigado = "1";
      botoes[i].type = "button";
      botoes[i].addEventListener("click", alternar);
      actualizarBotao(botoes[i], raiz.getAttribute("data-tema"));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligarBotoes);
  else ligarBotoes();

  /* API mínima para outros scripts (ex.: barra das apresentações) */
  window.PWBTema = { alternar: alternar, ligarBotoes: ligarBotoes };
})();
