/* Gerado por ferramentas/proteger.mjs – mostra no plano quando abre cada aula */
(function () {
  var AULAS = [{"dia":1,"liberta":"2026-10-12T07:30:00+01:00"},{"dia":2,"liberta":"2026-10-13T07:30:00+01:00"},{"dia":3,"liberta":"2026-10-14T07:30:00+01:00"},{"dia":4,"liberta":"2026-10-15T07:30:00+01:00"},{"dia":5,"liberta":"2026-10-16T07:30:00+01:00"}];
  var fmt = new Intl.DateTimeFormat("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });
  function marcar() {
    AULAS.forEach(function (a) {
      if (Date.now() >= new Date(a.liberta)) return;
      document.querySelectorAll('.deck-list a[href$="apresentacoes/dia-' + a.dia + '.html"]').forEach(function (l) {
        if (l.querySelector(".pwb-fechado")) return;
        var s = document.createElement("span");
        s.className = "pwb-fechado";
        s.textContent = "🔒 Abre " + fmt.format(new Date(a.liberta));
        s.style.cssText = "display:inline-block;margin-top:.5rem;font-size:.78rem;font-weight:700;padding:.15rem .6rem;border-radius:999px;background:color-mix(in srgb, var(--c) 16%, var(--white));color:var(--ink);align-self:flex-start";
        l.append(s);
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", marcar); else marcar();
})();
