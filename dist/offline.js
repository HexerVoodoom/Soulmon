/*
 * Comportamento da página de erro de rede do APK (public/offline.html).
 * Roda em https://localhost (origem local do Capacitor), por isso a URL do
 * app é absoluta. Contrato: src/deploy/offlinePage.contract.test.ts compara
 * SOULMON_URL com `server.url` do capacitor.config.json.
 * Sem dado do usuário, sem rede, sem biblioteca.
 */
(function () {
  'use strict';
  var SOULMON_URL = 'https://soulmon.mateus-sprnd.workers.dev';
  var TEXTOS = {
    'pt-BR': {
      titulo: 'Sem conexão',
      corpo: 'O Soulmon não conseguiu chegar à internet agora. Confira seu Wi-Fi ou os dados móveis e tente de novo.',
      botao: 'Tentar de novo',
      tentando: 'Tentando…',
      salvo: 'Seu progresso está salvo, no aparelho e na sua conta. Nada se perde por ficar sem internet.',
    },
    en: {
      titulo: 'No connection',
      corpo: "Soulmon can't reach the internet right now. Check your Wi-Fi or mobile data and try again.",
      botao: 'Try again',
      tentando: 'Trying…',
      salvo: 'Your progress is saved, on this device and in your account. Nothing is lost while you are offline.',
    },
  };

  var lang = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
  var pt = lang.indexOf('pt') === 0;
  var t = pt ? TEXTOS['pt-BR'] : TEXTOS.en;
  document.documentElement.setAttribute('lang', pt ? 'pt-BR' : 'en');
  document.title = 'Soulmon';
  document.getElementById('titulo').textContent = t.titulo;
  document.getElementById('corpo').textContent = t.corpo;
  document.getElementById('salvo').textContent = t.salvo;

  var botao = document.getElementById('tentar');
  botao.textContent = t.botao;

  function recarregar() {
    botao.disabled = true;
    botao.textContent = t.tentando;
    // Se a rede continuar fora, o Capacitor reabre esta página e o botão volta.
    window.location.replace(SOULMON_URL + '/');
  }
  botao.addEventListener('click', recarregar);
  // A rede voltou sozinha: não faz o usuário apertar nada.
  window.addEventListener('online', recarregar);
  botao.focus();
})();
