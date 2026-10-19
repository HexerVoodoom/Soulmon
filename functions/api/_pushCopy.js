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

import { MEAL_KEYS, seededIndex } from './_mealRhythm.js';

/**
 * Horas (BRT, UTC-3) em que existe notificação agendada.
 * 21h saiu de propósito: nada deve pedir uma quarta visita ao app, e cobrar
 * tarefa na hora de dormir é o oposto de um companheiro.
 */
export const PUSH_HOURS_BRT = [10, 16, 22];

/** Horas de cron em UTC, derivadas — o `wrangler.toml` tem que bater com isto. */
export const PUSH_HOURS_UTC = PUSH_HOURS_BRT.map(h => (h + 3) % 24).sort((a, b) => a - b);

/**
 * WP3.11 — O LEMBRETE DE DEITAR, e é o ÚNICO push que esta mecânica manda.
 *
 * A hora dele não é fixa: sai da janela que a PESSOA escolheu
 * (`sleepReminderAt`, `src/utils/restWindow.ts`), 30 min antes do início. Por
 * isso ele não entra em `pushCopy(hora)` — a copy fica aqui, no mesmo dono, e
 * quem tem a hora é quem tem a janela.
 *
 * Três coisas que ele NÃO faz, e as três são a regra da Janela de Descanso:
 *  · **não diz a hora.** "São 22h30" é um relógio cobrando; o convite é o
 *    convite.
 *  · **não fala de desempenho.** Nada de "sua regularidade caiu", nada de
 *    "você dormiu tarde" — todo feedback desta mecânica é de MANHÃ, dentro do
 *    app, em forma de sonho colecionado.
 *  · **não condiciona a nada.** Não pergunta se a meta do dia foi cumprida:
 *    um push de cobrança perto da hora de dormir é exatamente o estímulo que
 *    atrapalha o sono que ele alega proteger.
 */
export function sleepReminderCopy(petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  return {
    title: pt ? `${name} está ficando com sono` : `${name} is getting sleepy`,
    body: pt
      ? 'Daqui a pouco é a sua hora também. Sem pressa.'
      : 'Your time is coming up too. No rush.',
    tag: 'pet-sleep-reminder',
  };
}

/**
 * Texto da notificação para uma hora BRT.
 *
 * Devolve `null` quando a hora não tem notificação — quem chama NÃO deve
 * inventar um texto de fallback: mandar algo genérico numa hora não prevista é
 * como o nudge das 21h voltaria.
 */
/**
 * O aviso das 20h — a copy que ficou de FORA deste arquivo até 06/09/2026.
 *
 * ⚠️ Ela vivia inline no `NotificationManager.tsx`, e por isso sobreviveu
 * inteira ao WP3.4, que existe justamente para haver uma fonte só de copy de
 * push (footgun 9). O teste de paridade não podia vê-la: ele compara as horas
 * que `PUSH_HOURS_BRT` declara, e não existe hora 20 para comparar.
 *
 * A CONDIÇÃO continua no cliente, e tem de continuar: o worker não sabe se a
 * meta do dia foi cumprida (a assinatura guarda só endpoint, chaves, nome e
 * idioma), e foi assim que o nudge das 21h passou a cobrar quem já tinha feito
 * tudo. Aqui mora só o TEXTO.
 *
 * `hpBaixo` troca o pedido por acolhimento — com um coração, o que a pessoa
 * menos precisa é de mais uma tarefa na frase.
 */
export function eveningCopy(petName, language, hpBaixo) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  if (hpBaixo) {
    return {
      /* 22/09/2026 (QA R2 `02-narrativa` A13): "meio pra baixo" atribuía humor
         da criatura ao HP, que caiu pelo dia ruim — L11 pela porta do placar.
         Ela fala do corpo dela agora, sem dizer por quê. */
      title: pt ? `${name} está quieto hoje` : `${name} is quiet today`,
      body: pt
        ? 'Se der, marque o que você já fez hoje. Se não der, amanhã seu Soulmon ainda vai estar aqui.'
        : "If you can, log what you did today. If not, it'll still be here tomorrow.",
      tag: 'hp-critical-evening',
    };
  }
  return {
    /* 22/09/2026 (QA R2 `02-narrativa` A5, BLOQUEANTE): "está te esperando"
       é a palavra que §14.3 tirou de `welcomeBack.ts` e que R1 tirou da ficha
       — e aqui ia por push, condicionado a meta NÃO cumprida: espera +
       cobrança, à noite (bíblia §13, coluna ❌). "Fecha o dia completo" às 20h
       para quem não vai fechar é a fatura do dia. */
    title: pt ? `🌙 ${name} ainda está acordado` : `🌙 ${name} is still up`,
    body: pt
      ? 'Se fez algo hoje, marque. A comida vem daí.'
      : 'If you did something today, log it. The food comes from that.',
    tag: 'evening-reminder',
  };
}

export function pushCopy(brtHour, petName, language, ageDays) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';

  /* WP1.17 — OS PRIMEIROS DIAS TÊM VOZ PRÓPRIA.
     A frase padrão ("tem algo do seu dia que você já fez?") pressupõe uma
     rotina que quem tem a criatura há um dia ainda não tem. Nos dias 1 e 2 o
     que existe é a criatura nova, e é dela que a notificação fala.

     Três travas, e as três importam:
      · **nunca no D0.** O dia do nascimento é o dia em que a pessoa está
        dentro do app; mandar push nele é interromper quem já está aqui.
        Isto vale para TODAS as horas, não só para a copy de recém-nascido:
        até 22/09/2026 o texto prometia isso e o código só desviava a copy do
        D0 para a frase padrão das 10h/16h/22h — o push saía do mesmo jeito
        (QA rodada 1). Agora idade 0 devolve `null`, e quem chama trata
        `null` como "não manda" (o scheduler já faz isso: `'skipped'`).
        Não há decisão do dono em contrário no `REGISTRO-DE-DECISOES.md`
        (§vínculo só proíbe cobrança; o D0 sem push é a regra escrita aqui).
        Quem não sabe a idade (inscrição sem `bornAt`) não é D0: recebe a
        copy de sempre — a trava só age quando há certeza.
      · **sem condição de meta.** Estas duas não perguntam se a pessoa fez
        alguma coisa — no dia 1 não existe "atrasado", e cobrar aqui é a
        forma mais rápida de a primeira notificação da vida do app ser uma
        cobrança.
      · **só na hora da manhã.** Uma frase de boas-vindas às 22h não é
        boas-vindas.
     `ageDays` é opcional: quem não sabe a idade (subscription antiga) recebe
     a copy de sempre, nunca um texto pela metade. */
  const idade = Number.isFinite(ageDays) ? ageDays : null;
  if (idade === 0) return null;
  if (brtHour === 10 && (idade === 1 || idade === 2)) {
    return {
      title: pt ? `${name} acordou` : `${name} woke up`,
      body: idade === 1
        ? (pt ? 'Primeiro dia inteiro por aqui. Vem ver.' : 'First full day here. Come see.')
        : (pt ? 'Já está reconhecendo você.' : 'They are starting to recognize you.'),
      tag: 'pet-newborn',
    };
  }

  if (brtHour === 22) {
    return {
      /* ⚠️ O título dizia "está indo dormir", e às 22h isso CONTRADIZ o
         lembrete de deitar: a janela padrão começa às 23h, então o lembrete
         sai às 22h30 — meia hora DEPOIS de o app ter anunciado que o pet já
         foi dormir. As 22h são fixas (cron do worker) e a janela é escolhida
         pela pessoa, então a frase não pode afirmar o horário de ninguém.
         Agora ela fecha o dia sem alegar hora — vale antes ou depois.
         (O título já chegou em PT para quem escolheu inglês — STATUS §2.) */
      title: pt ? `🌙 ${name} te deseja boa noite` : `🌙 ${name} says good night`,
      body: pt
        ? 'Boa noite. O que ficou pra trás fica pra amanhã. 😴'
        : "Good night. What's left can wait for tomorrow. 😴",
      tag: 'pet-goodnight',
    };
  }
  if (brtHour === 16) {
    return {
      /* 22/09/2026 (QA R2 `02-narrativa` A13): "pensou em você" com a janela
         fechada contradiz o sensório (sem contato não há leitura; o corpo não
         guarda a pessoa — §5.10, livrinho §VII) e L11; "adora companhia" era a
         necessidade da criatura como motivo para abrir (§17 item 16). */
      title: pt ? `${name} está por aí` : `${name} is around`,
      body: pt
        ? 'Se sobrar um minuto, a janela está aberta.'
        : 'If you get a minute, the window is open.',
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

// ---------------------------------------------------------------------------
// O RITMO DAS REFEIÇÕES — convites de depois do café, do almoço e do jantar.
//
// UMA fonte de texto para o push (Web Push + FCM, via worker), para o alarme do
// APK e para o cartão que aparece DENTRO do app: o cartão e o push dizem a mesma
// coisa em tons que só diferem no que o app sabe (o push não sabe se há cocô na
// tela; o cartão sabe). A TAG é uma por refeição (`meal-<refeição>`) — é ela
// que impede a duplicata entre o alarme local e o FCM (CLAUDE.md, linha de push).
//
// Regras de escrita (docs/NARRATIVA-E-UNIVERSO.md): a criatura nota o que está
// ao alcance AGORA e convida; nunca sente falta, nunca cobra, nunca relata
// desempenho (L2/L11), nunca diz "você perdeu" nem conta nada que desce (L4/L6).
// "Fome" não aparece como NECESSIDADE dela — comida é ocasião (§5.3) e a criatura
// que passa fome por ausência é a culpa pela porta dos fundos. Ela está PERTO da
// pastinha; a pessoa decide o resto.
// ---------------------------------------------------------------------------

/** Os tipos de convite. `poop` só existe no cartão do app (o push não sabe se há cocô). */
export const MEAL_INVITE_KINDS = ['snack', 'poop', 'pet', 'tenSeconds'];

/** O que um PUSH pode sortear: só o que é verdade sem olhar o save. */
export const MEAL_PUSH_KINDS = ['snack', 'pet', 'tenSeconds'];

/** As tags de toda a família — uma por refeição. */
export const MEAL_PUSH_TAGS = ['meal-breakfast', 'meal-lunch', 'meal-dinner'];

const SNACK_BODY = {
  breakfast: { en: 'Breakfast crumbs, if there are any.', pt: 'Migalhas de café da manhã, se tiver.' },
  lunch: { en: "A midday bite, if there's one in there.", pt: 'Uma beliscada de meio-dia, se tiver alguma aí.' },
  dinner: { en: "An evening bite, if there's one in there.", pt: 'Uma beliscada da noite, se tiver alguma aí.' },
};

export function mealInviteCopy(meal, kind, petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  const tag = `meal-${MEAL_KEYS.includes(meal) ? meal : 'lunch'}`;
  switch (kind) {
    case 'poop':
      return {
        title: pt ? `${name} está perto do chuveiro` : `${name} is by the shower`,
        body: pt ? 'Tem o que enxaguar.' : "There's something to rinse off.",
        tag,
      };
    case 'pet':
      return {
        title: pt ? `${name} está por perto` : `${name} is nearby`,
        body: pt ? 'Um carinho rápido é bem-vindo.' : 'A quick pat is welcome.',
        tag,
      };
    case 'tenSeconds':
      return {
        title: pt ? `${name} tem uma coisinha` : `${name} has a small thing`,
        body: pt ? 'Dez segundos, um toque. Quando der.' : 'Ten seconds, one tap. Whenever.',
        tag,
      };
    case 'snack':
    default: {
      const line = SNACK_BODY[meal] ?? SNACK_BODY.lunch;
      return {
        title: pt ? `${name} está perto da pastinha` : `${name} is at the pantry`,
        body: pt ? line.pt : line.en,
        tag,
      };
    }
  }
}

/**
 * O tipo que o PUSH daquele dia/refeição sorteia. Determinístico por
 * (dia, refeição): o alarme local do APK e o FCM do mesmo dia dizem a MESMA
 * frase, então a tag que os funde não troca um texto pelo outro. Variado de um
 * dia para o outro, que é o que impede o convite de virar papel de parede.
 */
export function mealPushKind(meal, dayKey) {
  return MEAL_PUSH_KINDS[seededIndex(`${dayKey}|${meal}`, MEAL_PUSH_KINDS.length)];
}

// ---------------------------------------------------------------------------
// PUSH DE EVENTOS DO BICHO (REGISTRO §113): fome na faixa mediana, energia
// cheia, cocô e o fechamento do dia. Quem decide QUANDO é o planejador do
// cliente (`src/utils/petPushEvents.ts`, com o teto de `_pushBudget.js`); aqui
// mora só o TEXTO, numa fonte só (footgun 9).
//
// A regra "nunca notificação de culpa ou medo" (REGISTRO, presença fora do app)
// vence qualquer pedido de tom:
//  · FOME é CONVITE — "tem comida na pastinha", em voz de ocasião. Nunca diz
//    que a criatura precisa, sofre ou espera; não cita a palavra "fome", número
//    nem coração. Só sai quando a pastinha TEM comida (o texto é verdade).
//  · COCÔ diz o fato e o remédio ("um banho resolve"); não fala de dreno,
//    coração nem prazo.
//  · PROGRESSO descreve o dia em voz de convite; nunca sequência, nunca
//    contagem, nunca "você ainda não".
// ---------------------------------------------------------------------------

/** Tags fixas das famílias de evento (o cocô leva o índice: `poop-event-<i>`, a mesma do aviso dentro do app). */
export const EVENT_PUSH_TAGS = {
  hunger: 'pet-pantry',
  energyFull: 'pet-energy-full',
  progress: 'pet-progress',
};

/** D-02 — a fome cruzou a faixa mediana: convite, e só com comida na pastinha. */
export function hungerInviteCopy(petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  return {
    title: pt ? `${name} deu uma olhada na pastinha` : `${name} peeked at the pantry`,
    body: pt ? 'Tem comida lá, quando você quiser.' : 'There is food in there, whenever you like.',
    tag: EVENT_PUSH_TAGS.hunger,
  };
}

/** D-03 — a energia chegou ao máximo (uma vez). */
export function energyFullCopy(petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  return {
    title: pt ? `${name} está cheio de energia` : `${name} is full of energy`,
    body: pt ? 'Pronto para o que vier. Sem pressa.' : 'Ready for whatever comes. No rush.',
    tag: EVENT_PUSH_TAGS.energyFull,
  };
}

/** D-04 — o cocô agendado apareceu. `index` = posição na agenda (a tag funde com o aviso de dentro do app). */
export function poopPushCopy(petName, language, index = 0) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  return {
    title: pt ? `🚽 ${name} fez cocô` : `🚽 ${name} pooped`,
    body: pt ? 'Um banho resolve. 🚿' : 'A quick shower does it. 🚿',
    tag: `poop-event-${Number.isInteger(index) && index >= 0 ? index : 0}`,
  };
}

/** D-06 — o fechamento do dia, no máximo 1×/dia: sem sequência, sem contagem, sem cobrança. */
export function progressCopy(petName, language) {
  const pt = language === 'pt-BR';
  const name = petName || 'Soulmon';
  return {
    title: pt ? `${name} tem novidades do dia` : `${name} has news from today`,
    body: pt ? 'Dá uma olhada em como o dia está indo.' : 'Take a look at how the day is going.',
    tag: EVENT_PUSH_TAGS.progress,
  };
}
