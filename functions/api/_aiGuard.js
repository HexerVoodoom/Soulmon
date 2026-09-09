// Portão das rotas que gastam DINHEIRO em API de terceiros (Groq, Higgsfield,
// Gemini).
//
// O problema que isto resolve: `/api/chat`, `/api/suggest-tasks` e
// `/api/generate-sprite` aceitavam qualquer requisição, de qualquer origem, sem
// identificação e sem teto. Um `curl` em loop gerava imagens e texto com as
// NOSSAS chaves — exatamente o custo que a monetização existe para cobrir. Pior
// no `generate-sprite`: o prompt vem do cliente, então também era um jeito de
// alguém gerar o que quisesse na nossa conta.
//
// TRÊS travas, porque duas não bastavam:
//
//  1. **Cota por conta e por DIA** (`ai:<bucket>:<saveId>:<dia>`). Disjuntor de
//     loop. Vale de verdade quando `FIREBASE_PROJECT_ID` estiver ligado — aí o
//     saveId é provado por token e ninguém roda em nome de outro.
//  2. **Teto por conta VITALÍCIO** (`ent:<saveId>.aiLifetime.<bucket>`, só
//     `sprite` hoje). Vive no registro que só o servidor escreve. É o único
//     número que casa custo (recorrente enquanto a conta viver) com receita
//     (única, de R$ 29,90). Ver
//     `squad-alpha-runs/soulmon-02/custo-geracao-sprite.md` §3.
//     ⚠️ Até 26/08/2026 esta linha dizia que o registro **não tem TTL**, e o
//     argumento era "teto vitalício que expira não é vitalício". O argumento
//     continua certo; o fato mudou. Desde a decisão de retenção (item 3.1 do
//     GUIA-DO-DONO) o `ent:` tem TTL de 5 anos — mas ele é **RENOVADO A CADA
//     ESCRITA**, e todo débito daqui é uma escrita. Para quem joga, o teto
//     segue vitalício: o registro só expira depois de 5 anos de silêncio
//     absoluto, e aí some inteiro (tier pago junto), não só o contador. Quem
//     volta depois disso é, para todos os efeitos, uma conta nova. O
//     raciocínio inteiro está em `_entitlements.js:RETENTION_TTL_SECONDS`.
//     **Não "conserte" isso pondo o contador numa chave `ai:*`**: lá o TTL é
//     de dia/mês e o teto viraria mesmo um teto diário com nome comprido.
//  2b. **Teto por FORMA, vitalício** (`ent:<saveId>.aiForms.<formId>`, mesmo
//     registro e mesmo prazo renovável). Um teto só por CONTA falha na ÚLTIMA forma — e quem o estoura é
//     o jogador que percorreu a árvore inteira, no `mega` do terceiro galho, a
//     uma evolução do `ultra`. Um teto por forma falha LOCALMENTE: a forma que
//     deu problema cai na arte de reserva e as outras dez continuam. É este o
//     disjuntor que importa; o vitalício por conta vira o de segundo nível, e o
//     que ele passa a pegar é bug de cliente, não jogador dedicado.
//     Ver `spec-geracao-incremental.md` §3.4.
//  3. **Teto global**, por DIA para texto e por **MÊS** para imagem
//     (`ai:<bucket>:@all:<dia>` / `ai:<bucket>:@all:<AAAA-MM>`). Enquanto o
//     login não for exigido, o saveId é só um hash de e-mail: um atacante
//     inventa um novo a cada chamada e a cota por conta não segura nada. O teto
//     global não impede o abuso, mas limita o PREJUÍZO.
//
// Por que o global de imagem é MENSAL: `global: 400` por DIA equivalia a
// R$ 1.212/mês (400 × R$ 0,101) contra um orçamento declarado de R$ 200/mês —
// seis vezes. `globalMonth: 800` é exatamente a cota do plano Higgsfield
// Starter (US$ 15 ≈ R$ 81/mês, fixos), o que transforma o orçamento num
// **pré-pago**: ao acabar, o servidor devolve 503 e o cliente cai na arte de
// reserva, que já é um estado desenhado. Pré-pago não estoura.
//
// **FAIL-CLOSED, e isso é a regra.** Contador que não dá para ler RECUSA (503).
// O fail-open do `_auth.js` (`if (!projectId) return { ok: true }`) é o defeito
// que a auditoria achou: variável desligada virou porta aberta. Numa rota que
// queima dinheiro real, a dúvida nega.

import { VALID_ID, readEntitlement, writeEntitlement } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';
import { kv, kvOrThrow } from './_kv.js';

/**
 * Tetos. Chat é barato (llama-8b) e acontece o tempo todo; geração de imagem é
 * cara, rara e permanente — por isso só ela tem teto vitalício e janela mensal.
 *
 * - `perAccount`      → por conta, por DIA.
 * - `perAccountLifetime` → por conta, PARA SEMPRE (opcional; só `sprite`).
 * - `global`          → todas as contas, por DIA.
 * - `globalMonth`     → todas as contas, por MÊS (substitui `global` quando existe).
 */
export const AI_LIMITS = {
  chat: { perAccount: 120, global: 20000 },
  suggest: { perAccount: 30, global: 3000 },
  // 6/dia = o maior lote possível (empate triplo = 3) + retentativas do dia.
  //
  // 26 vitalício: o 20 anterior foi calibrado contra "14 gerações por save", que
  // é a árvore ERRADA. `ultra` exige as TRÊS megas (`dailyReset.ts:86-88`), então
  // o caminho completo percorre as 11 formas distintas que existem
  // (1 rookie + 3 champion + 3 ultimate + 3 mega + 1 ultra, `progression.ts:51-55`),
  // com quedas e re-subidas no meio. 11 × 2 (tentativa + possível refeitura por
  // recusa de conteúdo, que custa DUAS imagens) + 4 de folga = 26.
  // ⇒ 26 × R$ 0,101 = R$ 2,63 por conta, para sempre — 8,8 % de R$ 29,90.
  // O teto de 20 não era caro demais: era CURTO demais, e encurtava no clímax.
  //
  // 3 por forma = 1 tentativa + 1 refeitura por recusa + 1 retentativa. A forma
  // que falhou três vezes fica na arte de reserva; as outras seguem inteiras.
  sprite: { perAccount: 6, perAccountLifetime: 26, perFormLifetime: 3, globalMonth: 800 },
};

const day = (now = new Date()) => now.toISOString().slice(0, 10);
/** Janela MENSAL — `2026-08`. A virada de mês troca a chave, e o contador
 *  antigo morre sozinho pelo TTL. Nada de "reset" a rodar em lugar nenhum. */
const month = (now = new Date()) => now.toISOString().slice(0, 7);

/** Some um pouco mais de um dia, para o contador diário sumir sozinho do KV. */
const TTL_SECONDS = 60 * 60 * 30;
/** Um mês + folga: a chave do mês precisa sobreviver ao mês inteiro. */
const MONTH_TTL_SECONDS = 60 * 60 * 24 * 40;

/**
 * Mensagens de recusa. Chegam a alguém que **pagou** — então são honestas sobre
 * o que aconteceu e nunca soam como punição (CLAUDE.md: o Soulmon encoraja,
 * nunca cobra). PT-BR + EN, sempre os dois.
 */
export const AI_REFUSAL_MESSAGES = {
  'sprite-lifetime-cap': {
    'pt-BR': 'Seu Soulmon já recebeu toda a arte que esta jornada guardava para ele. As formas que vierem aparecem com a arte de reserva — e ela vale igual.',
    en: 'Your Soulmon has already received all the art this journey held for it. Any forms from here on show up with their reserve art — and it counts just the same.',
  },
  'sprite-form-cap': {
    'pt-BR': 'Esta forma resistiu ao lápis do Oráculo — ele tentou tudo que sabia e ela vai ficar com a arte de reserva. As outras formas do seu caminho continuam abertas, do jeito que sempre estiveram.',
    en: "This form resisted the Oracle's pencil — it tried everything it knows, and this one will keep its reserve art. Every other form on your path is still open, just as it always was.",
  },
  'ai-daily-limit': {
    'pt-BR': 'Por hoje já desenhamos bastante para o seu Soulmon. Amanhã a gente continua de onde parou.',
    en: "We've drawn plenty for your Soulmon today. Tomorrow we pick up right where we left off.",
  },
  'ai-monthly-budget-reached': {
    'pt-BR': 'O ateliê está descansando até o mês virar. Seu Soulmon segue inteiro com a arte de reserva, sem perder nada do caminho.',
    en: 'The studio is resting until the month turns over. Your Soulmon carries on whole with its reserve art, losing nothing along the way.',
  },
  'ai-daily-budget-reached': {
    'pt-BR': 'O ateliê já rendeu bastante hoje. Amanhã ele abre de novo.',
    en: 'The studio has given plenty today. It opens again tomorrow.',
  },
  'ai-quota-unavailable': {
    'pt-BR': 'Não conseguimos conferir a sua cota agora, e preferimos não arriscar cobrar você duas vezes. Tente de novo daqui a pouco.',
    en: "We couldn't check your quota right now, and we'd rather not risk charging you twice. Please try again in a little while.",
  },
};

/**
 * Uma recusa. O `ok` é anotado como o LITERAL `false` porque o spread
 * condicional da mensagem faz o TS inferir `boolean`, e aí a recusa deixa de
 * casar com o lado negativo da união que `guardAiRequest` devolve.
 * @returns {{ ok: false, status: number, reason: string, message?: object }}
 */
const refuse = (status, reason) => ({
  ok: false,
  status,
  reason,
  ...(AI_REFUSAL_MESSAGES[reason] ? { message: AI_REFUSAL_MESSAGES[reason] } : {}),
});

/**
 * Lê um contador do KV. **Lança** quando o valor existe e não é número — dado
 * ilegível é o mesmo que contador ausente, e contador ausente não libera nada.
 */
async function readCounter(env, key) {
  const raw = await kvOrThrow(env).get(key);
  if (raw === null || raw === undefined) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`contador ilegível em ${key}: ${raw}`);
  return n;
}

/** Quantas unidades este bucket já gastou VITALICIAMENTE nesta conta. */
function lifetimeUsed(ent, bucket) {
  const n = Number(ent?.aiLifetime?.[bucket] ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error('contador vitalício ilegível');
  return n;
}

/**
 * As ONZE formas da árvore, e só elas (`src/types/progression.ts:51-55`).
 *
 * O `formId` vem do CLIENTE, e o contador por forma mora dentro do registro de
 * entitlement — aceitar texto livre aqui seria deixar o cliente inflar um
 * registro que só o servidor escreve, uma chave por requisição. Conjunto
 * fechado: o pior caso do dicionário são 11 entradas, para sempre.
 */
export const VALID_FORM_ID = /^(?:rookie|ultra|(?:champion|ultimate|mega)-(?:virus|data|vaccine))$/;

/** Quantas unidades esta FORMA já gastou vitaliciamente nesta conta. */
function formUsed(ent, formId) {
  const n = Number(ent?.aiForms?.[formId] ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error('contador por forma ilegível');
  return n;
}

/**
 * Libera (ou não) uma chamada de IA — e, quando libera, **debita**.
 *
 * A ordem é: lê os três contadores → confere os três → só então incrementa.
 * Conferir e incrementar em cascata faria uma requisição recusada no 3º teto
 * já ter consumido os dois primeiros — cota queimada por chamada que não
 * aconteceu.
 *
 * O vitalício é conferido PRIMEIRO porque é o único irreversível: uma conta que
 * já estourou não pode consumir a cota mensal (que é a fatura de todo mundo)
 * batendo na porta que já fechou.
 *
 * @param {'chat'|'suggest'|'sprite'} bucket
 * @param {string|undefined} saveId  vem do corpo da requisição
 * @param {number} units  quantas gerações esta chamada vai custar (a recusa de
 *   conteúdo refaz o pedido com `promptFallback` e por isso custa 2).
 * @param {string|null|undefined} formId  a forma da árvore que está sendo
 *   desenhada. Quando vem, o teto POR FORMA (`perFormLifetime`) vale — e é ele
 *   o disjuntor de loop de retentativa numa forma só. Quando NÃO vem, os outros
 *   três tetos continuam valendo inteiros; a conta segue limitada a
 *   `perAccountLifetime`, então omitir `formId` não destrava geração nenhuma a
 *   mais — só perde a granularidade. **O cliente ENVIA hoje**, pelos dois
 *   caminhos que geram sprite: `src/utils/spriteGen.ts` põe `formId` no corpo
 *   do POST (`requestSprite`), alimentado pela geração incremental
 *   (`src/hooks/useSpriteGeneration.ts`) e pela `OraclePage`. Contrato travado
 *   em `src/utils/spriteGen.contract.test.ts`. ⚠️ **Não "simplifique" o ramo
 *   `hasFormCap` abaixo por achar que ele nunca liga** — ele é o disjuntor que
 *   impede um loop de retentativa numa forma só de consumir o vitalício de
 *   26 gerações da conta inteira. (Até 26/08/2026 este JSDoc afirmava o
 *   contrário — que o cliente não mandava o campo. Ficou falso na fatia 2 e
 *   virou a 9ª divergência doc↔código do projeto, a 1ª criada pela própria
 *   squad. Há guard: `src/utils/spriteGen.contract.test.ts`, achado X-8.)
 * @returns {Promise<{ ok: true, release: (motivo: string) => Promise<void> } | { ok: false, status: number, reason: string, message?: object }>}
 *   O `release` é o outro lado do par: a unidade sai debitada (a reserva precisa
 *   estar escrita para valer contra concorrência), e o chamador a DEVOLVE quando
 *   a geração não aconteceu. Ver `makeRelease` — recusa de conteúdo não devolve.
 */
export async function guardAiRequest(request, env, bucket, saveId, units = 1, formId = null) {
  if (!kv(env)) return refuse(500, 'storage-not-bound');

  const limits = AI_LIMITS[bucket];
  if (!limits) return refuse(500, 'unknown-bucket');

  if (!saveId || !VALID_ID.test(saveId)) {
    return refuse(400, 'missing-save-id');
  }

  // Quando o login estiver ligado, isto amarra a chamada à conta de verdade.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return { ok: false, status: auth.reason === 'forbidden' ? 403 : 401, reason: auth.reason };
  }

  const now = new Date();
  const today = day(now);
  const thisMonth = month(now);
  const usesMonth = typeof limits.globalMonth === 'number';
  const globalKey = usesMonth
    ? `ai:${bucket}:@all:${thisMonth}`
    : `ai:${bucket}:@all:${today}`;
  const globalLimit = usesMonth ? limits.globalMonth : limits.global;
  const globalTtl = usesMonth ? MONTH_TTL_SECONDS : TTL_SECONDS;
  const accountKey = `ai:${bucket}:${saveId}:${today}`;
  const hasLifetime = typeof limits.perAccountLifetime === 'number';
  // Forma só entra na conta se for uma forma que existe. Texto livre recusa —
  // numa rota que queima dinheiro, entrada que não dá para validar não passa.
  if (formId !== null && formId !== undefined) {
    if (typeof formId !== 'string' || !VALID_FORM_ID.test(formId)) {
      return refuse(400, 'invalid-form-id');
    }
  }
  const hasFormCap =
    typeof limits.perFormLifetime === 'number' && typeof formId === 'string' && formId.length > 0;

  let ent = null;
  let usedLifetime = 0;
  let usedForm = 0;
  let usedGlobal = 0;
  let usedAccount = 0;
  try {
    if (hasLifetime || hasFormCap) {
      ent = await readEntitlement(env, saveId);
      if (hasLifetime) usedLifetime = lifetimeUsed(ent, bucket);
      if (hasFormCap) usedForm = formUsed(ent, formId);
    }
    usedGlobal = await readCounter(env, globalKey);
    usedAccount = await readCounter(env, accountKey);
  } catch (err) {
    // Não deu para saber quanto já foi gasto → não gasta mais. FAIL-CLOSED.
    console.error('aiGuard: contador ilegível, recusando', err?.message);
    return refuse(503, 'ai-quota-unavailable');
  }

  if (hasLifetime && usedLifetime + units > limits.perAccountLifetime) {
    return refuse(402, 'sprite-lifetime-cap');
  }
  // Depois do vitalício (que é o irreversível) e ANTES do diário: a forma que
  // já esgotou não pode queimar a cota do dia das formas que ainda podem sair.
  //
  // 409 e não 402 de propósito. O contrato do 402 (custo-geracao-sprite.md §5) é
  // "para para sempre NESTA CONTA". Aqui o que acabou é UMA forma; a conta
  // continua inteira. Reusar o 402 ensinaria o cliente a desligar a árvore toda
  // por causa de um galho — que é exatamente a punição no clímax que este teto
  // existe para evitar.
  if (hasFormCap && usedForm + units > limits.perFormLifetime) {
    return refuse(409, 'sprite-form-cap');
  }
  if (usedAccount + units > limits.perAccount) {
    return refuse(429, 'ai-daily-limit');
  }
  if (usedGlobal + units > globalLimit) {
    return refuse(503, usesMonth ? 'ai-monthly-budget-reached' : 'ai-daily-budget-reached');
  }

  try {
    if (hasLifetime || hasFormCap) {
      // Os dois contadores vitalícios vivem no MESMO registro e vão numa
      // escrita só: dois `put` aqui abririam uma janela em que a conta debitou
      // e a forma não (ou o contrário).
      if (hasLifetime) ent.aiLifetime = { ...(ent.aiLifetime || {}), [bucket]: usedLifetime + units };
      if (hasFormCap) ent.aiForms = { ...(ent.aiForms || {}), [formId]: usedForm + units };
      await writeEntitlement(env, saveId, ent);
    }
    await kvOrThrow(env).put(globalKey, String(usedGlobal + units), { expirationTtl: globalTtl });
    await kvOrThrow(env).put(accountKey, String(usedAccount + units), { expirationTtl: TTL_SECONDS });
  } catch (err) {
    // Débito que não gravou é chamada sem teto. Recusa.
    console.error('aiGuard: falha ao debitar cota, recusando', err?.message);
    return refuse(503, 'ai-quota-unavailable');
  }

  return { ok: true, release: makeRelease(env, { saveId, bucket, units, formId, hasLifetime, hasFormCap, globalKey, globalTtl, accountKey }) };
}

/**
 * Devolve a unidade RESERVADA quando a geração não aconteceu (achado **X-1** do
 * gate da fatia 2).
 *
 * Por que o débito continua vindo ANTES da chamada: o KV não tem transação, e
 * conferir-agora-debitar-depois abriria a janela em que duas requisições
 * simultâneas passam pelo mesmo teto. A reserva tem de ser escrita para valer
 * como reserva. O que faltava era o outro lado do par — a CONFIRMAÇÃO: sem ela,
 * três 500 transitórios do provedor queimavam 3 das 26 gerações vitalícias e
 * fechavam uma das 11 formas para sempre (`perFormLifetime: 3`), por uma imagem
 * que nunca existiu e sem botão de recuperar.
 *
 * Regras desta devolução, todas deliberadas:
 *
 *  - **Recusa de conteúdo NÃO devolve.** O provedor foi chamado e cobrou; o teto
 *    por forma existe justamente para limitar o loop de recusa. Quem decide é o
 *    chamador — aqui só existe o mecanismo.
 *  - **Idempotente.** Chamar duas vezes devolve uma vez só. Um `release` que
 *    roda em dois caminhos de erro sobrepostos creditaria de graça.
 *  - **Nunca abaixo de zero.** Relê o contador atual em vez de restaurar o valor
 *    lido na reserva: entre a reserva e a devolução, outra requisição pode ter
 *    debitado, e reescrever o valor antigo apagaria o débito dela.
 *  - **Falha em silêncio, com log.** Devolução que não gravou deixa a unidade
 *    queimada — é ruim, mas é o lado seguro: o erro que a causou já está a
 *    caminho do cliente, e estourar aqui trocaria um 500 informativo por um
 *    genérico.
 */
function makeRelease(env, ctx) {
  let devolvida = false;
  return async function release(motivo) {
    if (devolvida) return;
    devolvida = true;
    const { saveId, bucket, units, formId, hasLifetime, hasFormCap, globalKey, globalTtl, accountKey } = ctx;
    const menos = (n) => Math.max(0, n - units);
    try {
      if (hasLifetime || hasFormCap) {
        // Mesma escrita única da reserva, pelo mesmo motivo: dois `put` abririam
        // a janela em que a conta devolveu e a forma não.
        const ent = await readEntitlement(env, saveId);
        if (hasLifetime) ent.aiLifetime = { ...(ent.aiLifetime || {}), [bucket]: menos(lifetimeUsed(ent, bucket)) };
        if (hasFormCap) ent.aiForms = { ...(ent.aiForms || {}), [formId]: menos(formUsed(ent, formId)) };
        await writeEntitlement(env, saveId, ent);
      }
      const [g, a] = [await readCounter(env, globalKey), await readCounter(env, accountKey)];
      await kvOrThrow(env).put(globalKey, String(menos(g)), { expirationTtl: globalTtl });
      await kvOrThrow(env).put(accountKey, String(menos(a)), { expirationTtl: TTL_SECONDS });
      console.warn(`aiGuard: ${units} unidade(s) devolvida(s) em ${bucket}/${formId ?? '-'} — ${motivo}`);
    } catch (err) {
      console.error('aiGuard: falha ao devolver cota reservada', err?.message);
    }
  };
}
