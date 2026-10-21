import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { guardAiRequest, AI_LIMITS, AI_REFUSAL_MESSAGES } from './_aiGuard.js';
import { ENT_PREFIX } from './_entitlements.js';
import { readFileSync } from 'node:fs';
import { usarTetosDeSpriteDeProducao, SPRITE_PRODUCAO, SPRITE_LIBERADO, SPRITE_VIGENTE } from '../../src/test/tetosSprite.js';

// O commit 372df3132 liberou os tetos de produção para os testes iniciais; estes testes provam a máquina do teto COM os números de produção (ver `src/test/tetosSprite.js`).
usarTetosDeSpriteDeProducao();

// O teto ANTIGO (`sprite: { perAccount: 20, global: 400 }`, os dois por DIA)
// não era um teto de orçamento: 400 × R$ 0,101 = R$ 40,40 POR DIA ⇒
// R$ 1.212/mês contra um orçamento declarado de R$ 200/mês — seis vezes. E
// `perAccount` sem teto vitalício deixava uma conta que pagou R$ 29,90 UMA vez
// gerar 600 imagens/mês, para sempre.
//
// Estes casos travam os três números novos. Se algum cair, ou a fatura voltou a
// ser aberta, ou o teto vitalício virou um teto diário com nome comprido.

const SAVE = 'abcdefgh12345678';
const req = () => new Request('https://soulmon.test/api/generate-sprite', { method: 'POST' });

function fakeEnv({ quebrado = false, lixo = false } = {}) {
  const store = new Map();
  const env = {
    DIGIAPP_SAVES: {
      get: async k => {
        if (quebrado) throw new Error('KV indisponível');
        if (lixo && k.startsWith('ai:')) return 'não-é-número';
        return store.has(k) ? store.get(k) : null;
      },
      put: async (k, v) => { store.set(k, v); },
    },
  };
  env._store = store;
  return env;
}

const gerar = (env, save = SAVE) => guardAiRequest(req(), env, 'sprite', save);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
});
afterEach(() => { vi.useRealTimers(); });

describe('sprite: os três tetos', () => {
  it('o valor VIGENTE é o de produção OU o liberado para os testes iniciais (dono, 21/10/2026) — voltar à produção não quebra nada', () => {
    expect([SPRITE_PRODUCAO, SPRITE_LIBERADO]).toContainEqual(SPRITE_VIGENTE);
    // Os números de produção seguem GRAVADOS no comentário de `_aiGuard.js` para quem for desfazer a liberação.
    const fonte = readFileSync('functions/api/_aiGuard.js', 'utf8');
    expect(fonte).toContain('Valores de produção: perAccount 6, perAccountLifetime 15, perFormLifetime 1.');
  });

  it('os números são os aprovados — 6/dia, 15 vitalício, 1 por forma, 800/mês e 40/dia global', () => {
    // Decisão do dono (11/10/2026): "o usuário NÃO pode ficar regerando o
    // Soulmon". UMA geração por forma; vitalício = 11 formas + 4 de folga para
    // a refeitura por recusa de conteúdo (que não conta na forma). Teto global
    // DIÁRIO de 40 (Higgsfield) volta, ao lado do mensal — não no lugar dele.
    expect(AI_LIMITS.sprite).toEqual({
      perAccount: 6, perAccountLifetime: 15, perFormLifetime: 1, globalMonth: 800, globalDay: 40,
    });
    expect(AI_LIMITS.sprite.perAccountLifetime).toBe(11 + 4);
    expect(AI_LIMITS.sprite.global).toBeUndefined();
  });

  it('teto DIÁRIO por conta: a 7ª do dia é 429', async () => {
    const env = fakeEnv();
    for (let i = 0; i < 6; i++) expect((await gerar(env)).ok).toBe(true);
    expect(await gerar(env)).toMatchObject({ ok: false, status: 429, reason: 'ai-daily-limit' });
  });

  it('teto VITALÍCIO atravessa a virada do dia — 26 no total, e aí 402 para sempre', async () => {
    const env = fakeEnv();
    let feitas = 0;
    // 6 por dia durante 5 dias = 30 tentativas, mas só 15 podem passar.
    for (let d = 0; d < 5; d++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + d).padStart(2, '0')}T12:00:00Z`));
      for (let i = 0; i < 6; i++) {
        const r = await gerar(env);
        if (r.ok) feitas++;
        else expect(r).toMatchObject({ status: 402, reason: 'sprite-lifetime-cap' });
      }
    }
    expect(feitas).toBe(15);

    // Um dia novo NÃO devolve nada: é vitalício, não diário.
    vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));
    expect(await gerar(env)).toMatchObject({ ok: false, status: 402, reason: 'sprite-lifetime-cap' });
    // E nem a virada do MÊS devolve.
    vi.setSystemTime(new Date('2027-03-01T12:00:00Z'));
    expect(await gerar(env)).toMatchObject({ ok: false, status: 402, reason: 'sprite-lifetime-cap' });
  });

  it('o contador vitalício mora em `ent:` (sem TTL), NÃO numa chave `ai:` que expira', async () => {
    const env = fakeEnv();
    await gerar(env);
    const ent = JSON.parse(env._store.get(ENT_PREFIX + SAVE));
    expect(ent.aiLifetime.sprite).toBe(1);

    // Simula o KV expirando TODAS as chaves `ai:*` (é para isso que elas têm
    // TTL). O teto vitalício tem que sobreviver a isso.
    for (const k of [...env._store.keys()]) if (k.startsWith('ai:')) env._store.delete(k);
    const ent2 = JSON.parse(env._store.get(ENT_PREFIX + SAVE));
    expect(ent2.aiLifetime.sprite).toBe(1);
  });

  it('a cota vitalícia de uma conta não vaza para outra', async () => {
    const env = fakeEnv();
    for (let d = 0; d < 5; d++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + d).padStart(2, '0')}T12:00:00Z`));
      for (let i = 0; i < 6; i++) await gerar(env);
    }
    expect(await gerar(env)).toMatchObject({ status: 402 });
    expect((await gerar(env, 'outraconta99xx')).ok).toBe(true);
  });

  // 800 no mês a 40/dia = 20 dias: o laço anda o relógio a cada 40.
  const encherMes = async env => {
    for (let i = 0; i < 800; i++) {
      vi.setSystemTime(new Date(`2026-08-${String(1 + Math.floor(i / 40)).padStart(2, '0')}T12:00:00Z`));
      expect((await gerar(env, `conta${String(i).padStart(9, '0')}`)).ok).toBe(true);
    }
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
  };

  it('teto GLOBAL é MENSAL: a 801ª do mês é 503, com saveId novo a cada chamada', async () => {
    const env = fakeEnv();
    await encherMes(env);
    expect(await gerar(env, 'maisumaconta12'))
      .toMatchObject({ ok: false, status: 503, reason: 'ai-monthly-budget-reached' });
  });

  it('teto GLOBAL DIÁRIO: a 41ª do dia é 503 ai-daily-budget-reached', async () => {
    const env = fakeEnv();
    for (let i = 0; i < 40; i++) expect((await gerar(env, `dia${String(i).padStart(11, '0')}`)).ok).toBe(true);
    expect(await gerar(env, 'maisumaconta12')).toMatchObject({ ok: false, status: 503, reason: 'ai-daily-budget-reached' });
    vi.setSystemTime(new Date('2026-08-11T12:00:00Z'));
    expect((await gerar(env, 'maisumaconta12')).ok).toBe(true);
  });

  it('a VIRADA DE MÊS abre a cota de novo — e a do mês anterior continua cheia', async () => {
    const env = fakeEnv();
    await encherMes(env);
    expect((await gerar(env, 'zzconta000001')).status).toBe(503);

    vi.setSystemTime(new Date('2026-09-01T00:05:00Z'));
    expect((await gerar(env, 'zzconta000001')).ok).toBe(true);
    expect(env._store.get('ai:sprite:@all:2026-08')).toBe('800');
    expect(env._store.get('ai:sprite:@all:2026-09')).toBe('1');
  });

  it('a chave global do mês NÃO expira antes do mês acabar', async () => {
    const env = fakeEnv();
    const ttls = [];
    env.DIGIAPP_SAVES.put = async (k, _v, o) => { ttls.push([k, o?.expirationTtl]); };
    await gerar(env);
    const mensal = ttls.find(([k]) => k === 'ai:sprite:@all:2026-08');
    expect(mensal[1]).toBeGreaterThan(31 * 24 * 60 * 60);
  });

  // --- FAIL-CLOSED. O `_aiGuard` antigo tratava dúvida como permissão. ---

  it('KV que EXPLODE na leitura recusa com 503 — não assume contador zerado', async () => {
    const r = await gerar(fakeEnv({ quebrado: true }));
    expect(r).toMatchObject({ ok: false, status: 503, reason: 'ai-quota-unavailable' });
  });

  it('contador com valor ILEGÍVEL recusa — `Number(lixo) || 0` era um reset grátis', async () => {
    const r = await gerar(fakeEnv({ lixo: true }));
    expect(r).toMatchObject({ ok: false, status: 503, reason: 'ai-quota-unavailable' });
  });

  it('falha ao DEBITAR recusa: débito que não gravou é chamada sem teto', async () => {
    const env = fakeEnv();
    env.DIGIAPP_SAVES.put = async () => { throw new Error('KV write falhou'); };
    expect(await gerar(env)).toMatchObject({ ok: false, status: 503, reason: 'ai-quota-unavailable' });
  });

  it('sem KV ligado recusa (não existe caminho sem contador)', async () => {
    const r = await guardAiRequest(req(), {}, 'sprite', SAVE);
    expect(r.ok).toBe(false);
  });

  // --- Uma requisição recusada não pode consumir cota nenhuma. ---

  it('recusa no vitalício NÃO gasta a cota mensal de todo mundo', async () => {
    const env = fakeEnv();
    for (let d = 0; d < 5; d++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + d).padStart(2, '0')}T12:00:00Z`));
      for (let i = 0; i < 6; i++) await gerar(env);
    }
    const antes = env._store.get('ai:sprite:@all:2026-08');
    for (let i = 0; i < 50; i++) expect((await gerar(env)).status).toBe(402);
    expect(env._store.get('ai:sprite:@all:2026-08')).toBe(antes);
  });

  it('recusa no mensal NÃO consome o vitalício de quem pagou', async () => {
    const env = fakeEnv();
    for (let i = 0; i < 800; i++) await gerar(env, `conta${String(i).padStart(9, '0')}`);
    expect((await gerar(env)).status).toBe(503);
    expect(env._store.get(ENT_PREFIX + SAVE)).toBeUndefined();
  });

  // --- A recusa chega a quem PAGOU. ---

  it('toda recusa de cota vem com texto PT-BR e EN, e nenhum deles cobra o jogador', async () => {
    const razoes = ['sprite-lifetime-cap', 'sprite-form-cap', 'ai-daily-limit', 'ai-monthly-budget-reached', 'ai-quota-unavailable'];
    for (const razao of razoes) {
      const m = AI_REFUSAL_MESSAGES[razao];
      expect(m['pt-BR'].length).toBeGreaterThan(20);
      expect(m.en.length).toBeGreaterThan(20);
      // Nenhuma mensagem culpa, ameaça ou fala em "limite excedido".
      expect(`${m['pt-BR']} ${m.en}`).not.toMatch(/excedid|abuso|bloquead|violaç|banid|blocked|abuse|exceeded|violation/i);
    }
    const env = fakeEnv();
    for (let i = 0; i < 6; i++) await gerar(env);
    const r = await gerar(env);
    expect(r.message['pt-BR']).toBeTruthy();
    expect(r.message.en).toBeTruthy();
  });
});

describe('chat e suggest: o mesmo buraco de agregado?', () => {
  it('continuam com teto global DIÁRIO e sem vitalício — e isso é proposital', () => {
    // O buraco do `sprite` era o CUSTO UNITÁRIO: R$ 0,101 por chamada. Chat e
    // suggest rodam em llama-3.1-8b (fração de centavo por chamada), então o
    // teto diário deles é um disjuntor, não um orçamento. Se o modelo ficar
    // caro, este teste é o lembrete de refazer a conta.
    // 300/dia desde 11/10/2026: o teto global do chat agora é o ORÇAMENTO do plano
    // gratuito Groq + Gemini (REGISTRO §32), não mais um disjuntor de custo.
    // 250 desde a release/beta-1 (cabe no gratuito somado com folga).
    expect(AI_LIMITS.chat.global).toBe(250);
    expect(AI_LIMITS.suggest.global).toBe(3000);
    expect(AI_LIMITS.chat.perAccountLifetime).toBeUndefined();
    expect(AI_LIMITS.suggest.perAccountLifetime).toBeUndefined();
  });

  it('chat e suggest também são fail-closed com contador ilegível', async () => {
    const env = fakeEnv({ lixo: true });
    expect(await guardAiRequest(req(), env, 'chat', SAVE))
      .toMatchObject({ ok: false, status: 503, reason: 'ai-quota-unavailable' });
  });
});

// ---------------------------------------------------------------------------
// Teto POR FORMA. O teto só por CONTA falha na ÚLTIMA forma — e quem o estoura é
// quem percorreu a árvore inteira, no `mega` do terceiro galho, a uma evolução
// do `ultra`. Estes casos travam a diferença: falhar LOCALMENTE, na forma que
// deu problema, sem levar as outras dez junto.
// ---------------------------------------------------------------------------
describe('sprite: teto por forma', () => {
  const gerarForma = (env, formId, save = SAVE) =>
    guardAiRequest(req(), env, 'sprite', save, 1, formId);
  const entDe = env => JSON.parse(env._store.get(ENT_PREFIX + SAVE));

  it('a forma A esgota em 1 (uma geração por forma) e a forma B continua gerando', async () => {
    const env = fakeEnv();
    expect((await gerarForma(env, 'mega-power')).ok).toBe(true);

    const bloqueada = await gerarForma(env, 'mega-power');
    expect(bloqueada).toMatchObject({ ok: false, status: 409, reason: 'sprite-form-cap' });

    // A 4ª de `mega-power` recusa, mas `mega-harmony` e `ultra` seguem inteiras.
    expect((await gerarForma(env, 'mega-harmony')).ok).toBe(true);
    expect((await gerarForma(env, 'ultra')).ok).toBe(true);
    expect(entDe(env).aiForms).toEqual({ 'mega-power': 1, 'mega-harmony': 1, ultra: 1 });
  });

  it('o teto por forma PERSISTE entre dias — teto que o reset devolve é teto nenhum', async () => {
    const env = fakeEnv();
    await gerarForma(env, 'champion-benevolence');

    // Dia novo (a cota diária volta) e MÊS novo (a global volta). A forma, não.
    vi.setSystemTime(new Date('2026-09-14T09:00:00Z'));
    expect(await gerarForma(env, 'champion-benevolence'))
      .toMatchObject({ ok: false, status: 409, reason: 'sprite-form-cap' });
    // E o contador continua no `ent:`, que não tem TTL.
    for (const k of [...env._store.keys()]) if (k.startsWith('ai:')) env._store.delete(k);
    expect(entDe(env).aiForms['champion-benevolence']).toBe(1);
    expect(await gerarForma(env, 'champion-benevolence')).toMatchObject({ status: 409 });
  });

  it('o teto por forma de uma conta não vaza para outra', async () => {
    const env = fakeEnv();
    await gerarForma(env, 'rookie');
    expect((await gerarForma(env, 'rookie')).status).toBe(409);
    expect((await gerarForma(env, 'rookie', 'outraconta99xx')).ok).toBe(true);
  });

  it('recusa por forma NÃO consome cota diária, mensal nem vitalícia', async () => {
    const env = fakeEnv();
    await gerarForma(env, 'ultimate-harmony');
    const diaria = env._store.get(`ai:sprite:${SAVE}:2026-08-10`);
    const mensal = env._store.get('ai:sprite:@all:2026-08');
    const vital = entDe(env).aiLifetime.sprite;

    for (let i = 0; i < 10; i++) expect((await gerarForma(env, 'ultimate-harmony')).status).toBe(409);

    expect(env._store.get(`ai:sprite:${SAVE}:2026-08-10`)).toBe(diaria);
    expect(env._store.get('ai:sprite:@all:2026-08')).toBe(mensal);
    expect(entDe(env).aiLifetime.sprite).toBe(vital);
  });

  it('`formId` fora das 11 formas da árvore recusa com 400 e não escreve nada', async () => {
    const env = fakeEnv();
    for (const lixo of ['mega-fogo', 'rookie; drop', '../ent:outro', 'x'.repeat(300), 42]) {
      expect(await gerarForma(env, lixo)).toMatchObject({ ok: false, status: 400, reason: 'invalid-form-id' });
    }
    expect(env._store.size).toBe(0);
  });

  it('sem `formId` no PORTÃO o teto por forma não aplica — mas o vitalício de 15 continua (a ROTA exige formId)', async () => {
    const env = fakeEnv();
    let feitas = 0;
    for (let d = 0; d < 5; d++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + d).padStart(2, '0')}T12:00:00Z`));
      for (let i = 0; i < 6; i++) if ((await gerar(env)).ok) feitas++;
    }
    expect(feitas).toBe(15);
    expect(entDe(env).aiForms).toEqual({});
  });

  it('a recusa por forma diz coisa DIFERENTE da recusa vitalícia, e nenhuma soa como punição', async () => {
    const forma = AI_REFUSAL_MESSAGES['sprite-form-cap'];
    const vida = AI_REFUSAL_MESSAGES['sprite-lifetime-cap'];
    expect(forma['pt-BR']).not.toBe(vida['pt-BR']);
    expect(forma.en).not.toBe(vida.en);
    // "essa forma falhou demais" ≠ "você chegou ao fim": a de forma precisa
    // dizer que o RESTO segue aberto.
    expect(forma['pt-BR']).toMatch(/outras formas/i);
    expect(forma.en).toMatch(/other form/i);

    const env = fakeEnv();
    await gerarForma(env, 'mega-benevolence');
    const r = await gerarForma(env, 'mega-benevolence');
    expect(r.message['pt-BR']).toBe(forma['pt-BR']);
    expect(r.message.en).toBe(forma.en);
  });

  it('renomeio de 29/09/2026: o contador gravado com o id ANTIGO continua valendo e é dobrado na chave nova', async () => {
    const env = fakeEnv();
    const antigo = 'mega-' + 'vir' + 'us';
    // Gravado com o id antigo = a forma JÁ foi gerada: com 1 por forma, recusa.
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiForms: { [antigo]: 1 } }));
    expect(await gerarForma(env, 'mega-power')).toMatchObject({ ok: false, status: 409, reason: 'sprite-form-cap' });
    // Sem antigo, a nova sai uma vez e é dobrada só na chave nova.
    const env2 = fakeEnv();
    env2._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiForms: { [antigo]: 0 } }));
    expect((await gerarForma(env2, 'mega-power')).ok).toBe(true);
    expect(entDe(env2).aiForms).toEqual({ 'mega-power': 1 });
  });

  it('contador por forma ILEGÍVEL recusa (fail-closed), não vale zero', async () => {
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiForms: { rookie: 'muitas' } }));
    expect(await gerarForma(env, 'rookie'))
      .toMatchObject({ ok: false, status: 503, reason: 'ai-quota-unavailable' });
  });
});
