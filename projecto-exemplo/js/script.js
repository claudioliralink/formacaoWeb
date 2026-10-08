// =========================================================
// Restaurante Kianda – comportamento das páginas
// Usa apenas o que foi dado no Dia 4: variáveis, condições,
// funções, querySelector, classList, textContent e eventos.
// O mesmo ficheiro serve as três páginas. Por isso, antes de
// usar um elemento, confirmamos que ele existe nesta página.
// =========================================================

console.log("Restaurante Kianda: script carregado");

// ---------- 1. Menu no telemóvel (todas as páginas) ----------
const botaoMenu = document.querySelector("#botao-menu");
const menu = document.querySelector("#menu");

botaoMenu.addEventListener("click", function () {
  menu.classList.toggle("aberto");

  // Informa os leitores de ecrã se o menu está aberto ou fechado
  if (menu.classList.contains("aberto")) {
    botaoMenu.setAttribute("aria-expanded", "true");
    botaoMenu.textContent = "✕ Fechar";
  } else {
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.textContent = "☰ Menu";
  }
});

// ---------- 2. Ano actual no rodapé (todas as páginas) ----------
const ano = document.querySelector("#ano");
ano.textContent = new Date().getFullYear();

// ---------- 3. Filtro do menu (só na página menu.html) ----------
const grelhaMenu = document.querySelector("#grelha-menu");

if (grelhaMenu !== null) {
  let botaoActivo = document.querySelector("#filtro-todos");

  // Função reutilizada pelos quatro botões
  function filtrar(classe, botao) {
    grelhaMenu.className = "grelha " + classe;
    botaoActivo.classList.remove("activo");
    botao.classList.add("activo");
    botaoActivo = botao;
  }

  const fTodos = document.querySelector("#filtro-todos");
  const fEntradas = document.querySelector("#filtro-entradas");
  const fPratos = document.querySelector("#filtro-pratos");
  const fSobremesas = document.querySelector("#filtro-sobremesas");

  fTodos.addEventListener("click", function () { filtrar("", fTodos); });
  fEntradas.addEventListener("click", function () { filtrar("so-entradas", fEntradas); });
  fPratos.addEventListener("click", function () { filtrar("so-pratos", fPratos); });
  fSobremesas.addEventListener("click", function () { filtrar("so-sobremesas", fSobremesas); });
}

// ---------- 4. Formulário de reserva (só na página contacto.html) ----------
const formReserva = document.querySelector("#form-reserva");

if (formReserva !== null) {
  const aviso = document.querySelector("#aviso");

  // Mostra uma mensagem de erro ou de sucesso no parágrafo #aviso
  function mostrarAviso(texto, tipo) {
    aviso.textContent = texto;
    aviso.className = "aviso " + tipo;
  }

  formReserva.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = document.querySelector("#nome").value.trim();
    const telefone = document.querySelector("#telefone").value.trim();
    const pessoas = Number(document.querySelector("#pessoas").value);

    if (nome.length < 3) {
      mostrarAviso("Escreva o seu nome (pelo menos 3 letras).", "erro");
    } else if (telefone.length !== 9) {
      mostrarAviso("O telefone deve ter 9 dígitos, sem espaços.", "erro");
    } else if (pessoas < 1 || pessoas > 30) {
      mostrarAviso("Indique entre 1 e 30 pessoas.", "erro");
    } else {
      mostrarAviso("Obrigado, " + nome + "! Pedido de reserva para " + pessoas + " pessoa(s) recebido. Vamos ligar para confirmar.", "ok");
      formReserva.reset();
    }
  });
}
