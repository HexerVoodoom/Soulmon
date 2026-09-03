// DONO ÚNICO do texto e do HORÁRIO das notificações agendadas do Soulmon.
//
// Por que este arquivo existe (footgun 9 do CLAUDE.md, "regra copiada = regra
// que diverge em silêncio"):
//
// A mesma notificação é entregue por TRÊS caminhos e cada um vive numa árvore
// diferente do repositório:
//   1. `src/components/NotificationManager.tsx` — web/PWA (poll de 1 min) e
//      Android nativo (AlarmManager, via DigiAlarm);
//   2. `workers/push-scheduler.js` — Web Push + FCM, disparado por cron;
//   3. `workers/wrangler.toml` — as HORAS do cron.
//
// (1) fica na `main` e sobe sozinho no push (Cloudflare Pages). (2) e (3) são
// **deploy manual** (`wrangler deploy`). Nada no CI compara os dois, e foi
// assim que a auditoria de tom removeu o nudge das 21h ("está preocupado!
// Complete suas tarefas antes de dormir") em (1) e o deixou vivo em (2): quem
// tinha push instalado continuou recebendo, todo dia, incondicionalmente — sem
// nem a checagem de "já cumpriu a meta" que a versão do cliente tinha.
//
// O CLAUDE.md declara a essência: o Soulmon "encoraja — NUNCA um cobrador".
// Toda cópia daqui é escrita sob essa regra. Se um horário ou um texto mudar,
// muda AQUI. `workers/pushCopy.parity.test.js` trava as três árvores.

/**
 * Horas (BRT, UTC-3) em que existe notificação agendada.
 * 21h saiu de propósito: nada deve pedir uma quarta visita ao app, e cobrar
 * tarefa na hora de dormir é o oposto de um companheiro.
 */
export const PUSH_HOURS_BRT = [10, 16, 22];

/** Horas de cron em UTC, derivadas — o `wrangler.toml` tem que bater com isto. */
export const PUSH_HOURS_UTC = PUSH_HOURS_BRT.map(h => (h + 3) % 24).sort((a, b) => a - b);

/**
 * Texto da notificação para uma hora BRT.
 *
 * Devolve `null` quando a hora não tem notificação — quem chama NÃO deve
 * inventar um texto de fallback: mandar algo genérico numa hora não prevista é
 * como o nudge das 21h voltaria.
 */
export function pushCopy(brtHour, petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';

  if (brtHour === 22) {
    return {
      // O título já chegou em PT para quem escolheu inglês (STATUS §2).
      title: pt ? `🌙 ${name} está indo dormir` : `🌙 ${name} is going to sleep`,
      body: pt
        ? 'Boa noite. O que ficou pra trás fica pra amanhã. 😴'
        : "Good night. What's left can wait for tomorrow. 😴",
      tag: 'pet-goodnight',
    };
  }
  if (brtHour === 16) {
    return {
      title: pt ? `${name} pensou em você` : `${name} thought of you`,
      body: pt
        ? 'Se sobrar um minuto hoje, seu Soulmon adora companhia.'
        : 'If you get a minute today, it loves the company.',
      tag: 'pet-nudge-16',
    };
  }
  if (brtHour === 10) {
    return {
      title: pt ? `${name} passou pra dizer oi` : `${name} stopped by to say hi`,
      body: pt ? 'Tem algo do seu dia que você já fez?' : 'Anything from your day you already did?',
      tag: 'pet-nudge-10',
    };
  }
  return null;
}
