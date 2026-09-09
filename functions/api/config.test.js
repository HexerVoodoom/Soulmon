/**
 * `/api/config` — 27 linhas, e a ÚNICA rota do projeto sem um teste sequer
 * (medido em 09/09/2026, varrendo `functions/**` e `workers/**` por importação
 * em arquivo de teste).
 *
 * Ela é pequena e por isso parecia não precisar. Precisa: é ela que diz ao app
 * de desktop se ele deve EXIGIR login ou se ainda pode aceitar um e-mail
 * digitado (modo de migração, ver `_auth.js`). Os dois erros possíveis são
 * caros e silenciosos:
 *
 *  · **`authRequired` falso quando o servidor exige token** → o desktop deixa
 *    o campo de e-mail livre, o jogador digita, e a primeira chamada de save
 *    volta 403 sem explicação nenhuma.
 *  · **`authRequired` verdadeiro quando o servidor não tem Firebase** → o
 *    desktop pede um login que não existe, e não há caminho para frente.
 *
 * O valor é DERIVADO de `FIREBASE_PROJECT_ID`, que é a mesma variável que o
 * `requireVerifiedOwner` consulta para decidir entre negar e liberar. Um
 * `!!` que virasse `!` ou uma variável renomeada de um lado só faz o desktop
 * mentir sem que nada fique vermelho — footgun 9 entre duas leituras da MESMA
 * variável.
 */
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestOptions } from './config.js';
import { requireVerifiedOwner } from './_auth.js';

const ler = async env => (await onRequestGet({ env })).json();

describe('/api/config — o que o desktop decide a partir daqui', () => {
  it('com Firebase configurado, `authRequired` é true', async () => {
    expect(await ler({ FIREBASE_PROJECT_ID: 'soulmon-app' })).toEqual({ authRequired: true });
  });

  it('sem Firebase, `authRequired` é false — e é o modo de migração', async () => {
    expect(await ler({})).toEqual({ authRequired: false });
    expect(await ler({ FIREBASE_PROJECT_ID: '' })).toEqual({ authRequired: false });
    expect(await ler({ FIREBASE_PROJECT_ID: undefined })).toEqual({ authRequired: false });
  });

  it('o campo é BOOLEANO, e não o id do projeto vazando na resposta', async () => {
    const corpo = await ler({ FIREBASE_PROJECT_ID: 'soulmon-app' });
    expect(typeof corpo.authRequired).toBe('boolean');
    expect(JSON.stringify(corpo)).not.toContain('soulmon-app');
  });

  it('nada além de `authRequired` sai daqui — a rota é PÚBLICA e sem auth', async () => {
    // O `env` de uma Pages Function carrega TODOS os segredos do projeto. Uma
    // resposta que crescesse por descuido (`...env`, um campo de depuração)
    // publicaria chave de API numa rota anônima com cache de 5 minutos.
    const corpo = await ler({
      FIREBASE_PROJECT_ID: 'soulmon-app',
      GROQ_API_KEY: 'gsk_segredo',
      VAPID_JWK: '{"d":"segredo"}',
      SEASON_ADMIN_KEY: 'admin-segredo',
    });
    expect(Object.keys(corpo)).toEqual(['authRequired']);
    expect(JSON.stringify(corpo)).not.toMatch(/segredo/);
  });
});

describe('🔴 a MESMA variável decide as duas coisas', () => {
  it('quando `config` diz `authRequired: false`, o portão real está indisponível', async () => {
    // Este é o par que importa: se as duas leituras divergirem, o desktop
    // mostra uma tela e o servidor aplica outra regra — e o sintoma aparece
    // longe daqui, como um 403 sem explicação no primeiro save.
    const env = {};
    const { authRequired } = await ler(env);
    const portao = await requireVerifiedOwner(new Request('https://x.dev/'), env, 'a'.repeat(32));

    expect(authRequired).toBe(false);
    expect(portao).toEqual({ ok: false, status: 503, reason: 'auth-unavailable' });
  });

  it('e quando diz `true`, o portão EXIGE token — nega quem chega sem ele', async () => {
    // Sem `Authorization`, `verifyIdToken` não vai à rede: devolve null antes.
    const env = { FIREBASE_PROJECT_ID: 'soulmon-app' };
    const { authRequired } = await ler(env);
    const portao = await requireVerifiedOwner(new Request('https://x.dev/'), env, 'a'.repeat(32));

    expect(authRequired).toBe(true);
    expect(portao.ok).toBe(false);
    // 401 (falta credencial), não 503 (indisponível): a diferença é o que o
    // cliente usa para decidir entre "peça login" e "desista".
    expect(portao.status).toBe(401);
  });
});

describe('cabeçalhos', () => {
  it('o cache é de 5 minutos — um deploy que liga o Firebase demora isso para valer', async () => {
    // Não é um número mágico a defender, é um número a TORNAR VISÍVEL: enquanto
    // ele existir, ligar ou desligar o login não vale na hora para quem já
    // carregou a resposta. Mudar aqui é escolha, não acidente.
    const res = await onRequestGet({ env: {} });
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('CORS aberto no GET e no OPTIONS — o desktop não tem a nossa origem', async () => {
    const res = await onRequestGet({ env: {} });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const pre = await onRequestOptions();
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('o preflight não devolve corpo', async () => {
    expect(await (await onRequestOptions()).text()).toBe('');
  });
});
