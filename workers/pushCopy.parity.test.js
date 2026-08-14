/**
 * GUARD DE DERIVA `workers/` ↔ `functions/` ↔ `src/`.
 *
 * As duas árvores de servidor têm ciclos de deploy DIFERENTES:
 *   - `functions/` e `src/` sobem sozinhos no push da `main` (Cloudflare Pages);
 *   - `workers/` é deploy MANUAL (`wrangler deploy`), e nada no CI compara.
 *
 * Já divergiu: a auditoria de tom removeu o nudge das 21h ("⏰ está preocupado!
 * Ainda dá tempo! Complete suas tarefas antes de dormir 🌙") do cliente e ele
 * continuou vivo em `workers/push-scheduler.js` + no cron do `wrangler.toml`,
 * disparando todo dia para todo mundo com push — e, ao contrário da versão do
 * cliente, SEM nem checar se a pessoa já tinha cumprido a meta.
 *
 * Estes testes são o único lugar onde as três árvores se encontram.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import worker from './push-scheduler.js';
import { pushCopy, PUSH_HOURS_BRT, PUSH_HOURS_UTC } from '../functions/api/_pushCopy.js';

const RAIZ = resolve(__dirname, '..');
const ler = p => readFileSync(resolve(RAIZ, p), 'utf8');

// ---------------------------------------------------------------------------
// 1. CRON (workers/wrangler.toml) ↔ horas declaradas (functions/api/_pushCopy.js)
// ---------------------------------------------------------------------------
describe('as horas do cron são as horas que o código sabe responder', () => {
  const toml = ler('workers/wrangler.toml');
  const crons = (toml.match(/^crons\s*=\s*\[(.*)\]/m)?.[1] ?? '')
    .split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

  it('AUTOVERIFICAÇÃO: o parser realmente leu os crons do arquivo', () => {
    // Sem este caso, um regex quebrado deixaria `crons` vazio e a comparação
    // abaixo passaria comparando nada com nada.
    expect(crons.length).toBeGreaterThan(0);
    for (const c of crons) expect(c).toMatch(/^\d+ \d+ \* \* \*$/);
  });

  it('cada cron dispara numa hora que `pushCopy` responde', () => {
    for (const c of crons) {
      const utc = Number(c.split(' ')[1]);
      const brt = (utc - 3 + 24) % 24;
      expect(pushCopy(brt, 'Bito', 'pt-BR'), `cron "${c}" → ${brt}h BRT sem texto declarado`).not.toBeNull();
    }
  });

  it('e toda hora declarada tem um cron que a dispare', () => {
    const utcDoCron = crons.map(c => Number(c.split(' ')[1])).sort((a, b) => a - b);
    expect(utcDoCron).toEqual(PUSH_HOURS_UTC);
  });

  it('AUTOVERIFICAÇÃO: o guard vê um cron órfão (o caso real das 21h)', () => {
    const crons21 = [...crons, '0 0 * * *']; // 21h BRT — o que estava lá
    const orfaos = crons21.filter(c => !pushCopy((Number(c.split(' ')[1]) - 3 + 24) % 24, 'x', 'en-US'));
    expect(orfaos).toEqual(['0 0 * * *']);
  });
});

// ---------------------------------------------------------------------------
// 2. O worker realmente NÃO manda nada às 21h (comportamento, não leitura)
// ---------------------------------------------------------------------------
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', cursor, limit = 100 } = {}) => {
      const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const start = cursor ? all.indexOf(cursor) : 0;
      const page = all.slice(start, start + limit);
      const next = start + limit < all.length ? all[start + limit] : undefined;
      return { keys: page.map(name => ({ name })), cursor: next, list_complete: !next };
    },
  };
}

let SUB_KEYS;
let VAPID;
const brt = h => ({ scheduledTime: Date.UTC(2026, 7, 14, (h + 3) % 24, 0, 0) });

beforeAll(async () => {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  SUB_KEYS = { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  VAPID = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey));
});
afterEach(() => { vi.unstubAllGlobals(); });

async function enviosNaHora(h) {
  const enviados = [];
  vi.stubGlobal('fetch', vi.fn(async url => { enviados.push(String(url)); return new Response('', { status: 201 }); }));
  const env = {
    PUSH_SUBSCRIPTIONS: fakeKV({
      'push:1': JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        keys: SUB_KEYS, petName: 'Bito', language: 'pt-BR',
      }),
    }),
    VAPID_JWK: VAPID,
  };
  await worker.scheduled(brt(h), env);
  return { enviados, sobrou: env.PUSH_SUBSCRIPTIONS.store.size };
}

describe('o worker não cobra tarefa na hora de dormir', () => {
  it('às 21h BRT NADA é enviado — e a inscrição não é apagada por engano', async () => {
    const { enviados, sobrou } = await enviosNaHora(21);
    expect(enviados).toEqual([]);
    expect(sobrou).toBe(1);
  });

  it('AUTOVERIFICAÇÃO: o mesmo harness ENVIA às 10h (senão o teste acima é vazio)', async () => {
    const { enviados } = await enviosNaHora(10);
    expect(enviados).toHaveLength(1);
  });

  it('nenhuma hora declarada usa o texto de cobrança que foi removido', () => {
    for (const h of PUSH_HOURS_BRT) {
      for (const lang of ['pt-BR', 'en-US']) {
        const t = JSON.stringify(pushCopy(h, 'Bito', lang));
        expect(t, `${h}h/${lang}`).not.toMatch(/preocupado|worried|ainda dá tempo|still time|antes de dormir/i);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. O cliente (src/) e o worker dizem a MESMA coisa
// ---------------------------------------------------------------------------
describe('cliente e servidor entregam o mesmo texto', () => {
  const nm = ler('src/components/NotificationManager.tsx');

  it('cada string de `_pushCopy` existe literalmente no NotificationManager', () => {
    const faltando = [];
    for (const h of PUSH_HOURS_BRT) {
      for (const lang of ['pt-BR', 'en-US']) {
        const { title, body } = pushCopy(h, 'PET', lang);
        // O nome do pet é interpolado nos dois lados; comparamos os pedaços
        // FIXOS do título em volta dele, e o corpo inteiro.
        for (const trecho of [...title.split('PET').map(s => s.trim()), body]) {
          if (trecho && !nm.includes(trecho)) faltando.push(`${h}h/${lang}: ${JSON.stringify(trecho)}`);
        }
      }
    }
    expect(faltando).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: o guard reprova um texto que o cliente NÃO tem', () => {
    expect(nm.includes('Ainda dá tempo! Complete suas tarefas antes de dormir 🌙')).toBe(false);
  });

  it('o cliente também não agenda nada às 21h', () => {
    // O AlarmManager nativo só pode CANCELAR o alarme antigo das 21h (usuários
    // que já têm o alarme gravado no aparelho) — nunca agendá-lo.
    expect(nm).not.toMatch(/scheduleAlarm\(\{[^}]*pet-nudge-21/s);
    expect(nm).toMatch(/cancelAlarm\(\{\s*id:\s*'pet-nudge-21'/);
    expect(nm).not.toMatch(/hh === 21/);
  });
});

// ---------------------------------------------------------------------------
// 4. Nenhuma OUTRA regra copiada entre as duas árvores
// ---------------------------------------------------------------------------
describe('regras compartilhadas são importadas, nunca copiadas', () => {
  const ARQUIVOS_WORKER = ['workers/push-scheduler.js', 'workers/fcm.js', 'workers/webpush.js'];

  it('a allowlist de endpoint de push só existe em `_pushTargets.js`', () => {
    const dono = ler('functions/api/_pushTargets.js');
    const hosts = [...dono.matchAll(/['"]([a-z0-9.-]*\.(?:googleapis|mozilla|windows|apple)\.com)['"]/g)].map(m => m[1]);
    expect(hosts.length, 'AUTOVERIFICAÇÃO: o extrator achou hosts no dono').toBeGreaterThan(0);

    for (const arq of [...ARQUIVOS_WORKER, 'functions/api/subscribe.js', 'functions/api/fcm-subscribe.js']) {
      const src = ler(arq).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
      for (const h of hosts) {
        // `fcm.js` fala com a API HTTP v1 do FCM (fcm.googleapis.com/v1/...),
        // que é destino de ENVIO, não item de allowlist — por isso a checagem
        // é sobre a lista, e não sobre o host solto.
        if (arq === 'workers/fcm.js') continue;
        expect(src.includes(`'${h}'`) || src.includes(`"${h}"`), `${arq} repete o host ${h} da allowlist`).toBe(false);
      }
    }
  });

  it('o prefixo de KV que o worker LÊ é o que as functions ESCREVEM', () => {
    const escritor = { 'push:': 'functions/api/subscribe.js', 'fcm:': 'functions/api/fcm-subscribe.js' };
    const leitor = ler('workers/push-scheduler.js');
    for (const [prefixo, arq] of Object.entries(escritor)) {
      expect(ler(arq), `${arq} escreve ${prefixo}`).toContain(`\`${prefixo}\${`);
      expect(leitor, `o worker lê ${prefixo}`).toContain(`'${prefixo}'`);
    }
  });

  it('o worker não reimplementa `getNotification` por baixo do módulo', () => {
    const src = ler('workers/push-scheduler.js');
    expect(src).not.toMatch(/function\s+getNotification/);
    expect(src).toMatch(/import \{ pushCopy \} from '\.\.\/functions\/api\/_pushCopy\.js'/);
  });
});
