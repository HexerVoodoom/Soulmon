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
import {
  pushCopy, eveningCopy, sleepReminderCopy, PUSH_HOURS_BRT, PUSH_HOURS_UTC,
} from '../functions/api/_pushCopy.js';

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
describe('o cliente IMPORTA a copy — não existe mais cópia para comparar', () => {
  const nm = ler('src/components/NotificationManager.tsx');

  /* WP3.4 — este bloco MUDOU DE PERGUNTA, e a mudança é a melhoria.
     Antes ele comparava as strings do cliente com as do dono, uma a uma: era
     o melhor possível enquanto o cliente REIMPLEMENTAVA a copy, mas guard de
     igualdade só pega quem edita um lado — não pega quem acrescenta uma
     notificação nova só no cliente, e não impede a cópia de existir.
     Agora o cliente importa `pushCopy`, e o guard cobra a AUSÊNCIA de cópia,
     que é uma pergunta mais forte. */

  it('o cliente importa o dono único', () => {
    expect(nm).toMatch(/import \{[^}]*pushCopy[^}]*\} from '\.\.\/\.\.\/functions\/api\/_pushCopy(\.js)?'/);
  });

  it('nenhum texto de notificação foi reescrito no cliente', () => {
    // Se alguém voltar a escrever a copy aqui, é aqui que quebra.
    const faltando = [];
    for (const h of PUSH_HOURS_BRT) {
      for (const lang of ['pt-BR', 'en-US']) {
        const { body } = pushCopy(h, 'PET', lang);
        if (nm.includes(body)) faltando.push(`${h}h/${lang}: o corpo foi copiado para o cliente`);
      }
    }
    expect(faltando).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: o guard enxerga o arquivo certo', () => {
    // Sem isto, um caminho errado deixaria os dois casos acima passarem
    // medindo uma string vazia.
    expect(nm.length).toBeGreaterThan(1000);
    expect(nm).toContain('showNotification');
  });

  it('o texto das 21h continua não existindo em lugar nenhum', () => {
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

// ---------------------------------------------------------------------------
// 5. WP1.17 — os primeiros dias têm voz própria
// ---------------------------------------------------------------------------
describe('a copy dos dias 1 e 2 (WP1.17)', () => {
  const dez = (idade, lang = 'pt-BR') => pushCopy(10, 'Bito', lang, idade);

  it('D1 e D2 falam da criatura, não da lista', () => {
    for (const idade of [1, 2]) {
      const c = dez(idade);
      expect(c.tag).toBe('pet-newborn');
      expect(c.title).toContain('Bito');
    }
    // E as duas frases são DIFERENTES: repetir a mesma no dia seguinte
    // desfaz a ideia de que alguma coisa está acontecendo ali.
    expect(dez(1).body).not.toBe(dez(2).body);
  });

  it('NUNCA no D0 — o dia do nascimento é o dia em que a pessoa está no app: nenhuma hora manda nada', () => {
    // Antes de 22/09/2026 o D0 caía na copy padrão e o push saía — o
    // comentário prometia uma trava que não existia. `null` é o contrato de
    // "não manda" (o scheduler devolve 'skipped').
    for (const hora of PUSH_HOURS_BRT) {
      expect(pushCopy(hora, 'Bito', 'pt-BR', 0), `D0 às ${hora}h`).toBeNull();
      expect(pushCopy(hora, 'Bito', 'en-US', 0), `D0 às ${hora}h (en)`).toBeNull();
    }
    // E a trava só age com CERTEZA: idade desconhecida não é D0.
    expect(pushCopy(10, 'Bito', 'pt-BR', undefined)).not.toBeNull();
    expect(pushCopy(10, 'Bito', 'pt-BR', null)).not.toBeNull();
  });

  it('do D3 em diante volta a copy de sempre', () => {
    expect(dez(3).tag).not.toBe('pet-newborn');
    expect(dez(40).tag).not.toBe('pet-newborn');
  });

  it('sem idade conhecida (inscrição antiga), copy de sempre — nunca meio texto', () => {
    expect(pushCopy(10, 'Bito', 'pt-BR').tag).not.toBe('pet-newborn');
    expect(pushCopy(10, 'Bito', 'pt-BR', null).tag).not.toBe('pet-newborn');
    expect(pushCopy(10, 'Bito', 'pt-BR', NaN).tag).not.toBe('pet-newborn');
  });

  it('só na hora da manhã: boas-vindas às 22h não são boas-vindas', () => {
    expect(pushCopy(22, 'Bito', 'pt-BR', 1).tag).toBe('pet-goodnight');
    expect(pushCopy(16, 'Bito', 'pt-BR', 1).tag).toBe('pet-nudge-16');
  });

  it('não cobra: nenhuma das duas fala de tarefa, meta ou atraso', () => {
    // No dia 1 não existe "atrasado", e a primeira notificação da vida do app
    // não pode ser uma cobrança.
    for (const idade of [1, 2]) {
      for (const lang of ['pt-BR', 'en-US']) {
        const t = `${dez(idade, lang).title} ${dez(idade, lang).body}`.toLowerCase();
        for (const p of ['tarefa', 'task', 'meta', 'goal', 'atras', 'late', 'falt']) {
          expect(t, `a copy do dia ${idade} cobra ("${p}")`).not.toContain(p);
        }
      }
    }
  });

  it('os dois idiomas existem', () => {
    expect(dez(1, 'en-US').body).not.toBe(dez(1, 'pt-BR').body);
    expect(dez(1, 'en-US').body).not.toMatch(/[áàâãéêíóôõúç]/i);
  });
});

describe('a idade vem da inscrição e morre com ela (WP1.17)', () => {
  it('`ageDaysOf` lê o `bornAt` da subscription', async () => {
    const { ageDaysOf } = await import('./push-scheduler.js');
    const agora = new Date('2026-09-08T13:00:00Z');
    expect(ageDaysOf({ bornAt: '2026-09-07' }, agora)).toBe(1);
    expect(ageDaysOf({ bornAt: '2026-09-08' }, agora)).toBe(0);
  });

  it('sem `bornAt`, ou com lixo, devolve null — nunca dia 0 por engano', () => {
    // Um `bornAt` torto viraria "dia 1" para sempre, e a pessoa receberia a
    // mensagem de recém-nascido todo dia.
    return import('./push-scheduler.js').then(({ ageDaysOf }) => {
      const agora = new Date('2026-09-08T13:00:00Z');
      expect(ageDaysOf({}, agora)).toBeNull();
      expect(ageDaysOf({ bornAt: 'ontem' }, agora)).toBeNull();
      // Data no futuro (relógio do aparelho errado) também não vira idade.
      expect(ageDaysOf({ bornAt: '2027-01-01' }, agora)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// A COPY DAS 20h, que sobreviveu inteira ao WP3.4 por morar em outro arquivo.
//
// O WP3.4 existe para haver UMA fonte de copy de push, e este teste de
// paridade compara as horas que `PUSH_HOURS_BRT` declara — 10, 16 e 22. O
// aviso das 20h é do CLIENTE (a condição depende da meta do dia, que o worker
// não conhece), vivia inline no `NotificationManager.tsx`, e por isso não
// existia hora 20 para comparar: o guard não podia vê-lo.
//
// É footgun 9 em estado puro — regra que diverge em silêncio por estar num
// arquivo que ninguém compara. A condição segue no cliente; o TEXTO veio para
// cá, e este teste garante que ele não volte.
// ---------------------------------------------------------------------------
describe('o aviso das 20h tem dono único', () => {
  const manager = readFileSync('src/components/NotificationManager.tsx', 'utf8');

  it('o cliente IMPORTA a copy em vez de escrevê-la', () => {
    expect(manager).toMatch(/import \{[^}]*eveningCopy[^}]*\} from '\.\.\/\.\.\/functions\/api\/_pushCopy\.js'/);
  });

  it('nenhuma das duas frases das 20h existe no componente', () => {
    expect(manager).not.toContain('está te esperando');
    expect(manager).not.toContain('is waiting for you');
    expect(manager).not.toContain('está meio pra baixo');
    expect(manager).not.toContain('energia cheia fecha o dia perfeito');
  });

  it('as duas variantes existem nos dois idiomas', () => {
    for (const lang of ['pt-BR', 'en-US']) {
      for (const hpBaixo of [true, false]) {
        const c = eveningCopy('Pixel', lang, hpBaixo);
        expect(c.title).toBeTruthy();
        expect(c.body).toBeTruthy();
        expect(c.tag).toBeTruthy();
      }
    }
    // Idiomas diferentes, textos diferentes: já houve título chegando em PT
    // para quem escolheu inglês (STATUS §2).
    expect(eveningCopy('Pixel', 'pt-BR', false).body)
      .not.toBe(eveningCopy('Pixel', 'en-US', false).body);
  });
});

describe('a noite não se contradiz', () => {
  it('o boa-noite das 22h não afirma que o pet já dormiu', () => {
    // As 22h são fixas (cron) e a janela de descanso é escolhida pela pessoa:
    // com a janela padrão (23:00) o lembrete de deitar sai às 22h30, MEIA HORA
    // depois de o app ter anunciado que o pet foi dormir.
    for (const lang of ['pt-BR', 'en-US']) {
      const c = pushCopy(22, 'Pixel', lang);
      expect(c.title).not.toMatch(/indo dormir|going to sleep/i);
    }
  });

  it('o aviso das 20h cede a vez quando existe janela de descanso', () => {
    // Três pushes em 2h30 produzem habituação, e desligar push é irreversível
    // na prática. O das 20h é o que cede porque é o único que pede EXECUÇÃO.
    const manager = readFileSync('src/components/NotificationManager.tsx', 'utf8');
    expect(manager).toContain('if (restWindowRef.current) return;');
  });
});

describe('🔴 o LEMBRETE DE DEITAR (WP3.11) — o único push desta mecânica', () => {
  /**
   * `sleepReminderCopy` estava EXPORTADA e sem uma referência em teste nenhum
   * (medido em 09/09/2026, varrendo toda a suíte). Ela não entra em
   * `pushCopy(hora)` porque a hora dela não é fixa — sai da janela que a PESSOA
   * escolheu, 30 min antes do início — e foi por ficar fora da tabela de horas
   * que o guard de paridade nunca a viu.
   *
   * As três travas abaixo são a regra da Janela de Descanso escrita no dono
   * único. Cada uma delas é uma frase que alguém pode "melhorar" sem perceber
   * que está desfazendo a mecânica: um push perto da hora de dormir que cobra,
   * ou que aponta o relógio, é exatamente o estímulo que atrapalha o sono que
   * ele alega proteger.
   */
  const nasDuasLinguas = f => ['pt-BR', 'en-US'].forEach(l => f(sleepReminderCopy('Pixel', l), l));

  /** "22h30", "22:30", "10 pm", "23h" — qualquer forma de apontar o relogio. */
  const RELOGIO = new RegExp(String.raw`\d{1,2}\s*[:h]\s*\d{2}|\d{1,2}\s*(?:h|hs|pm|am)\b`, 'i');

  it('AUTOVERIFICACAO: a regra do relogio pega mesmo uma hora escrita', () => {
    // Sem este caso, um erro de escapamento na expressao deixaria o caso
    // abaixo verde para sempre, medindo o vacuo. E o escapamento JA falhou
    // uma vez ao escrever este arquivo: o `\b` virou um byte de
    // backspace DENTRO da expressao, e nada ficou vermelho.
    for (const exemplo of ['Sao 22h30', 'It is 10:45', 'ate as 23h', 'at 9 pm']) {
      expect(RELOGIO.test(exemplo), exemplo).toBe(true);
    }
    expect(RELOGIO.test('Sem pressa. Daqui a pouco.')).toBe(false);
  });

  it('NÃO diz a hora — "são 22h30" é um relógio cobrando, não um convite', () => {
    nasDuasLinguas((c, l) => {
      const texto = `${c.title} ${c.body}`;
      expect(texto, l).not.toMatch(RELOGIO);
    });
  });

  it('NÃO fala de desempenho — todo feedback desta mecânica é de manhã, no app', () => {
    nasDuasLinguas((c, l) => {
      const texto = `${c.title} ${c.body}`.toLowerCase();
      for (const palavra of [
        'regularidade', 'constância', 'constancia', 'sequência', 'sequencia',
        'atras', 'tarde demais', 'streak', 'consistency', 'you slept', 'late',
      ]) {
        expect(texto.includes(palavra), `${l}: "${palavra}" fala de desempenho`).toBe(false);
      }
    });
  });

  it('NÃO condiciona a nada — não pergunta se a meta do dia foi cumprida', () => {
    nasDuasLinguas((c, l) => {
      const texto = `${c.title} ${c.body}`.toLowerCase();
      for (const palavra of ['tarefa', 'meta', 'complete', 'termine', 'task', 'goal', 'finish']) {
        expect(texto.includes(palavra), `${l}: "${palavra}" é cobrança`).toBe(false);
      }
    });
  });

  it('o nome do pet aparece, e sem nome cai no padrão — nunca "undefined"', () => {
    expect(sleepReminderCopy('Pixel', 'pt-BR').title).toContain('Pixel');
    for (const semNome of [undefined, '', null]) {
      for (const l of ['pt-BR', 'en-US']) {
        const c = sleepReminderCopy(semNome, l);
        expect(`${c.title} ${c.body}`).not.toContain('undefined');
        expect(c.title).toContain('Soulmon');
      }
    }
  });

  it('os dois idiomas existem de verdade — senão os casos acima passariam com uma língua só', () => {
    const pt = sleepReminderCopy('Pixel', 'pt-BR');
    const en = sleepReminderCopy('Pixel', 'en-US');
    expect(pt.title).not.toBe(en.title);
    expect(pt.body).not.toBe(en.body);
    // Idioma desconhecido cai em inglês, como no resto do dono único.
    expect(sleepReminderCopy('Pixel', 'fr').title).toBe(en.title);
  });

  it('a `tag` é PRÓPRIA — senão ele substitui a notificação de outra mecânica', () => {
    // Duas notificações com a mesma `tag` se sobrescrevem no sistema. Colidir
    // com o boa-noite das 22h faria uma das duas sumir sem erro nenhum.
    const dele = sleepReminderCopy('Pixel', 'pt-BR').tag;
    const outras = [
      pushCopy(10, 'Pixel', 'pt-BR').tag,
      pushCopy(16, 'Pixel', 'pt-BR').tag,
      pushCopy(22, 'Pixel', 'pt-BR').tag,
      pushCopy(10, 'Pixel', 'pt-BR', 1).tag,
      eveningCopy('Pixel', 'pt-BR', false).tag,
      eveningCopy('Pixel', 'pt-BR', true).tag,
    ];
    expect(dele).toBeTruthy();
    expect(outras).not.toContain(dele);
    // E as outras também não colidem entre si.
    expect(new Set(outras).size).toBe(outras.length);
  });

  it('ele NÃO é entregue pelo cron — a hora é de cada pessoa', () => {
    // Se um dia alguém plugar esta copy numa hora fixa do worker, ela vira o
    // que a mecânica proíbe: um horário do servidor mandando alguém dormir.
    for (const h of PUSH_HOURS_BRT) {
      expect(pushCopy(h, 'Pixel', 'pt-BR').tag).not.toBe(sleepReminderCopy('Pixel', 'pt-BR').tag);
    }
  });
});
