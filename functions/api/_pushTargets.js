// Quem pode receber um Web Push deste projeto.
//
// O `endpoint` de uma subscription é uma URL que o NAVEGADOR entrega ao site, e
// o worker de push faz `fetch()` nela quatro vezes por dia, por um ano. Sem
// validar, qualquer um registrava um endereço arbitrário e transformava o
// scheduler num emissor de requisições para o host que quisesse — com um JWT
// VAPID assinado pela chave de produção no cabeçalho, e sem limite de quantas
// linhas plantava.
//
// A defesa é uma allowlist: só HTTPS, e só os hosts dos serviços de push que
// realmente existem. Vive num arquivo próprio porque precisa valer nos DOIS
// lados — na hora de aceitar (functions/api/subscribe.js) e na hora de enviar
// (workers/push-scheduler.js), para que as linhas já gravadas no KV antes desta
// correção também sejam recusadas.

/**
 * Sufixos de host aceitos. Um host casa se for exatamente igual a um destes
 * ou se terminar em `.` + um destes — comparação por rótulo de domínio, nunca
 * `endsWith` na string crua (`evil-fcm.googleapis.com.attacker.net` passaria).
 */
export const PUSH_HOST_SUFFIXES = [
  // `fcm.googleapis.com`, NÃO `googleapis.com`: o sufixo largo aceitava
  // `storage.googleapis.com`, `firebasestorage.googleapis.com` e qualquer
  // outro serviço do Google como alvo do fetch do worker — relay/amplificação
  // a partir da nossa infra, com JWT VAPID de produção no cabeçalho. O
  // endpoint real do Chrome é só este.
  'fcm.googleapis.com',          // FCM / Chrome
  'push.services.mozilla.com',   // Firefox
  'notify.windows.com',          // Edge / Windows
  'push.apple.com',              // Safari
];

/**
 * O endpoint é de um serviço de push de verdade?
 * Recusa qualquer coisa que não seja HTTPS, e qualquer host fora da lista.
 */
export function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  // `URL.port` vazio = porta padrão. Porta explícita indica alvo interno.
  if (url.port && url.port !== '443') return false;

  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
}
