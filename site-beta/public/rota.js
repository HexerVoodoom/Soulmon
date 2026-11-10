/* Desktop = versão A, celular = versão B (dono, 09/11). Roda no <head>, antes de pintar.
   ?v=a ou ?v=b fixa a escolha (testes); ?v=auto limpa. Só a página A redireciona: sem loop. */
(function () {
  var s = document.currentScript, alvo = s && s.getAttribute('data-b'), v = null;
  try {
    var q = new URLSearchParams(location.search).get('v');
    if (q === 'a' || q === 'b') localStorage.setItem('sm-v', q);
    else if (q === 'auto') localStorage.removeItem('sm-v');
    v = localStorage.getItem('sm-v');
  } catch (e) {}
  if (!alvo || v === 'a') return;
  var celular = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse) and (max-width: 1023px)').matches;
  if (v === 'b' || celular) location.replace(alvo + location.hash);
})();
