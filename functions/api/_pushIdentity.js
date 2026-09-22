// DONO ÚNICO da identidade de uma inscrição de push — os campos que o cliente
// manda e que vão parar, sem passar por mais ninguém, dentro do TÍTULO de uma
// notificação guardada por um ANO na KV.
//
// Por que este arquivo existe: `subscribe.js` (Web Push) e `fcm-subscribe.js`
// (Android nativo) são a MESMA rota escrita duas vezes, no mesmo namespace de
// KV, lidas pelo mesmo `push-scheduler.js`. Em 08/09/2026 a primeira ganhou
// teto de apelido, lista fechada de idioma, validação de chave, limite de taxa
// e escrita-só-quando-muda. A segunda não ganhou nada — e ninguém percebeu,
// porque não havia um lugar só onde a regra morasse. É o footgun 9 no seu
// formato mais caro: regra copiada = regra que diverge em silêncio.
//
// Tudo que as duas rotas têm em comum mora AQUI. O que é específico de cada
// canal (o formato do endpoint, o formato do token) fica em cada uma.

/**
 * TETO DE 24, o mesmo do resto do projeto: o campo do app tem `maxLength={24}`
 * e o apelido do perfil é cortado em 24 no `community.js`. Sem isto o campo era
 * gravado como veio — texto de cliente sem teto, guardado por um ano e
 * interpolado no título da notificação.
 */
export function nomeDePet(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Soulmon';
}

/**
 * Dois valores possíveis, e só. `_pushCopy.js` só pergunta se é `pt-BR`, então
 * qualquer outra coisa já caía em inglês — mas gravar a string crua guardava
 * texto de cliente sem teto num registro de um ano.
 */
export function idiomaDePush(v) {
  return v === 'pt-BR' ? 'pt-BR' : 'en-US';
}

/**
 * WP1.17 — a idade da criatura, para a copy dos dias 1 e 2. É `YYYY-MM-DD` e só
 * isso. Formato inválido é DESCARTADO em vez de corrigido: um `bornAt` torto
 * viraria dia 1 para sempre.
 */
export function dataDeNascimento(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) ? v : undefined;
}

/**
 * Token de registro do FCM. O formato do Google não é publicado como contrato,
 * então o teste aqui é de FORMA e de TETO, não de validade: o que ele precisa
 * impedir é `{token: {}}`, `{token: []}` e um megabyte de lixo virarem uma
 * linha de KV de um ano que o cron vai tentar entregar três vezes por dia.
 *
 * Os valores observados ficam na casa dos 140–200 caracteres; a faixa é larga
 * de propósito, porque um token legítimo recusado aqui é push que nunca chega,
 * e esse é o modo de falha caro. Quem decide se o token PRESTA é o FCM — e
 * agora `push-scheduler.js` apaga a linha quando ele diz que não presta.
 */
export function ehTokenFcm(v) {
  return typeof v === 'string' && v.length >= 32 && v.length <= 512
    && /^[A-Za-z0-9_:.-]+$/.test(v);
}

/**
 * Escrever só quando mudou troca uma ESCRITA de KV (cara) por uma leitura
 * (barata e cacheada na borda) — o cliente reenvia a inscrição a cada abertura
 * do app.
 *
 * O TTL é de 1 ano e só renova na escrita: se a comparação sozinha decidisse,
 * um jogador ativo com a inscrição inalterada perderia o push exatamente no
 * aniversário dela — silenciosamente, que é o pior modo de falha deste canal.
 * Por isso a gravação também acontece quando o registro está velho.
 */
export const TTL_INSCRICAO = 60 * 60 * 24 * 365;

/**
 * O teto das DUAS rotas de inscrição, num lugar só. Cada canal tem seu próprio
 * balde (um não gasta o do outro); o que é compartilhado é o NÚMERO, para que
 * apertar um lado não deixe o outro frouxo em silêncio.
 */
export const LIMITE_INSCRICAO = { limit: 10, windowMs: 60_000 };
const REFRESCA_APOS_MS = 30 * 24 * 60 * 60 * 1000;

export async function gravarSeMudou(kv, chave, registro) {
  let anterior = null;
  try {
    anterior = JSON.parse((await kv.get(chave)) || 'null');
  } catch {
    anterior = null;
  }
  const igual =
    anterior &&
    JSON.stringify({ ...anterior, refreshedAt: undefined }) ===
      JSON.stringify({ ...registro, refreshedAt: undefined });
  const velho = !anterior?.refreshedAt || Date.now() - anterior.refreshedAt > REFRESCA_APOS_MS;

  let gravou = false;
  if (!igual || velho) {
    await kv.put(chave, JSON.stringify({ ...registro, refreshedAt: Date.now() }), {
      expirationTtl: TTL_INSCRICAO,
    });
    gravou = true;
  }
  // O índice roda MESMO quando o registro não mudou: é assim que uma inscrição
  // gravada antes do índice existir (com `saveId`, sem `pushidx:`) se indexa
  // sozinha na próxima abertura do app, sem script de migração.
  if (typeof registro?.saveId === 'string' && registro.saveId) {
    await indexarInscricao(kv, registro.saveId, chave);
  }
  return gravou;
}

// ---------------------------------------------------------------------------
// ÍNDICE INVERSO `pushidx:<saveId>` → chaves de inscrição da conta.
//
// Por que existe (QA rodada 1, `03-arquitetura-r1.md` §2): a chave de uma
// inscrição é o HASH do endpoint/token, então "quais inscrições são desta
// conta?" só tinha resposta por VARREDURA do namespace inteiro, com um `get`
// por chave — `account.js` › `deletePushSubscriptions` estourava o teto de
// subrequests do Worker em ~900 inscrições totais, e estourava DEPOIS de o
// save já ter sido apagado. Com o índice a exclusão custa <= 1 + 16x2 + 1
// operações, fixo, independente de quantas pessoas usam push.
//
// Forma: `{ v: 1, keys: { 'push:<hash>': <epoch ms>, 'fcm:<hash>': ... }, updatedAt }`.
//  - TETO de 16 entradas — uma pessoa tem poucos aparelhos; 16 é folga de 5x.
//    Ao exceder, sai a mais VELHA. O teto é o que mantém a exclusão em O(1)
//    mesmo contra um cliente que grava lixo com o mesmo `saveId`.
//  - TTL `TTL_INSCRICAO` (1 ano), renovado a cada escrita: o índice nunca vive
//    mais que a inscrição mais nova que aponta. Entrada MORTA (o cron apagou a
//    inscrição num 410; a rota DELETE falhou no meio) é inofensiva: quem lê
//    faz `get` do membro, acha `null` e pula.
//  - Escreve só quando precisa: chave ausente do índice, ou índice mais velho
//    que `REFRESCA_APOS_MS` (mesma constante de `gravarSeMudou`). Custo por
//    abertura do app: +1 `get`; +1 `put` por aparelho novo ou por mês.
//  - RMW sem CAS (KV não tem): dois aparelhos da mesma conta inscrevendo no
//    mesmo minuto podem perder uma entrada. AUTOCURA: o cliente reenvia a
//    inscrição a cada abertura, e a chave ausente é regravada. Declarado.
//  - O cron (`push-scheduler.js`) NÃO toca o índice: pagar 2 ops por inscrição
//    morta não compensa; a entrada morta é pulada na leitura.
//
// Registros SEM `saveId` (anteriores a 21/09/2026) não são indexáveis — o
// valor não tem a conta, e nenhum backfill consegue ligá-los a alguém sem
// adivinhar. Eles se regravam com `saveId` (e se indexam) na próxima abertura
// do aparelho, ou morrem no TTL/410. `account.js` mantém a varredura como
// FALLBACK só quando o índice não existe, e declara em `NOT_INCLUDED`.
// ---------------------------------------------------------------------------

export const PUSHIDX_PREFIX = 'pushidx:';
export const PUSHIDX_MAX = 16;

export function chaveDoIndice(saveId) {
  return `${PUSHIDX_PREFIX}${saveId}`;
}

/** Lê o índice; qualquer coisa ilegível ou fora da forma vira índice vazio. */
export async function lerIndice(kv, saveId) {
  let idx = null;
  try {
    idx = JSON.parse((await kv.get(chaveDoIndice(saveId))) || 'null');
  } catch {
    idx = null;
  }
  const keys = idx && idx.keys && typeof idx.keys === 'object' && !Array.isArray(idx.keys) ? idx.keys : null;
  if (!keys) return { existe: false, keys: {}, updatedAt: 0 };
  /** @type {Record<string, number>} */
  const limpo = {};
  for (const [k, t] of Object.entries(keys)) {
    if (typeof k === 'string' && (k.startsWith('push:') || k.startsWith('fcm:'))) {
      limpo[k] = Number.isFinite(t) ? t : 0;
    }
  }
  return { existe: true, keys: limpo, updatedAt: Number(idx.updatedAt) || 0 };
}

async function gravarIndice(kv, saveId, keys) {
  await kv.put(
    chaveDoIndice(saveId),
    JSON.stringify({ v: 1, keys, updatedAt: Date.now() }),
    { expirationTtl: TTL_INSCRICAO },
  );
}

/**
 * Acrescenta `chave` ao índice da conta. Melhor-esforço: falha aqui não pode
 * derrubar a inscrição (o push da pessoa vale mais que o índice; a próxima
 * abertura tenta de novo).
 * @returns {Promise<boolean>} `true` se escreveu.
 */
export async function indexarInscricao(kv, saveId, chave) {
  try {
    const idx = await lerIndice(kv, saveId);
    const agora = Date.now();
    const jaTem = Object.prototype.hasOwnProperty.call(idx.keys, chave);
    const velho = !idx.updatedAt || agora - idx.updatedAt > REFRESCA_APOS_MS;
    if (jaTem && !velho) return false;

    const keys = { ...idx.keys, [chave]: agora };
    // Teto: sai a mais velha até caber — e a INSCRIÇÃO expulsa é apagada
    // junto. INVARIANTE (QA rodada 2, `00-skeptic-r2` #2): toda inscrição viva
    // com `saveId` está no índice. Sem isto, a 17ª reinstalação de PWA (caso
    // benigno) deixava a inscrição real fora do índice, e a exclusão de conta
    // não a alcançava mais — push continuando depois de "apaguei". Apagar a
    // expulsa é o que mantém o custo da exclusão fixo E completo. Como só o
    // dono provado consegue indexar (`subscribe.js` › `saveIdAutorizado`),
    // a expulsão é sempre de um aparelho da própria pessoa.
    const ordenadas = Object.entries(keys).sort((a, b) => a[1] - b[1]);
    const expulsas = [];
    while (ordenadas.length > PUSHIDX_MAX) {
      const fora = ordenadas.shift();
      if (fora) expulsas.push(fora[0]);
    }
    await gravarIndice(kv, saveId, Object.fromEntries(ordenadas));
    for (const k of expulsas) {
      if (k === chave) continue;
      try { await kv.delete(k); } catch { /* entrada morta fica; inofensiva */ }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove `chave` do índice da conta dona do registro. Chamado pelas rotas
 * DELETE ANTES de apagar a inscrição (precisa ler o registro para saber a
 * conta). Melhor-esforço: entrada que sobrar é morta e inofensiva.
 * @returns {Promise<boolean>} `true` se mexeu no índice.
 */
export async function desindexarInscricao(kv, chave) {
  try {
    const registro = JSON.parse((await kv.get(chave)) || 'null');
    const saveId = registro?.saveId;
    if (typeof saveId !== 'string' || !saveId) return false;
    const idx = await lerIndice(kv, saveId);
    if (!idx.existe || !Object.prototype.hasOwnProperty.call(idx.keys, chave)) return false;
    const resto = { ...idx.keys };
    delete resto[chave];
    if (Object.keys(resto).length === 0) {
      await kv.delete(chaveDoIndice(saveId));
    } else {
      await gravarIndice(kv, saveId, resto);
    }
    return true;
  } catch {
    return false;
  }
}
