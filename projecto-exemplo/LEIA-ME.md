# Restaurante Kianda – projecto exemplo

Website de referência para o **Módulo 6 – Projecto Final** da formação *Programação Web – Nível Básico*.
Mostra o resultado esperado de um projecto que cumpre todos os requisitos mínimos.
O negócio, a morada e os contactos são fictícios.

## Requisitos e onde estão aplicados

| Requisito | Onde |
|---|---|
| 3 páginas com HTML semântico | `index.html`, `menu.html`, `contacto.html` (`header`, `nav`, `main`, `section`, `article`, `footer`) |
| Imagens com `alt` | Ilustrações SVG em `img/` |
| Lista | Vantagens (`ul`) e passos "Para levar" (`ol`) |
| Tabela | Horário em `contacto.html` |
| Formulário | Pedido de reserva em `contacto.html` |
| CSS externo com Flexbox e Grid | `css/estilo.css` (cabeçalho em Flexbox, cartões em Grid) |
| Media queries (mobile-first) | `min-width: 600px` e `min-width: 900px` |
| JavaScript | `js/script.js`: menu no telemóvel, filtro do menu, validação da reserva |

## Publicar no GitHub Pages

1. Criar um repositório público (ex.: `restaurante-kianda`).
2. **Add file > Upload files** e arrastar o **conteúdo** desta pasta (não a pasta).
3. **Commit changes**.
4. **Settings > Pages**: *Deploy from a branch*, `main`, `/ (root)`, **Save**.
5. Abrir `https://utilizador.github.io/restaurante-kianda/` após alguns minutos.
