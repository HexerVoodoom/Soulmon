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

  if (!igual || velho) {
    await kv.put(chave, JSON.stringify({ ...registro, refreshedAt: Date.now() }), {
      expirationTtl: TTL_INSCRICAO,
    });
    return true;
  }
  return false;
}
