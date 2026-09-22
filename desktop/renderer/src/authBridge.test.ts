// A PONTE DE LOGIN DO DESKTOP — o pedaço que nunca rodou.
//
// `docs/PLANO-DESKTOP-STEAM.md` §3d registra o login do desktop como
// "⚠️ escrito, nunca executado, nem em teste". O motivo é real e NÃO é bug:
// `src/utils/auth.ts:175` faz `if (!bridge || !isAuthConfigured()) return;` e
// `isAuthConfigured()` (auth.ts:29-31) exige `VITE_FIREBASE_API_KEY`,
// `VITE_FIREBASE_AUTH_DOMAIN` e `VITE_FIREBASE_PROJECT_ID` — nenhuma existe
// neste repositório. É a guarda deliberada descrita em auth.ts:17-20, e é a
// "fatia 1" que depende do dono. Exercitar o Firebase de verdade daqui é
// impossível, e fingir com mock o SDK inteiro só provaria que o mock funciona.
//
// O que DÁ para exercitar de verdade, sem infra nenhuma: o outro lado da ponte.
// `desktop/electron/auth-preload.js` é código NOSSO, síncrono, sem rede e sem
// Firebase — ele só normaliza o payload que o app web publica e o manda por IPC.
// Todo o contrato entre os dois arquivos mora nele:
//
//   src/utils/auth.ts:159  lê  window.soulmonDesktopAuth        (a marca)
//   src/utils/auth.ts:185  chama bridge.publish({token,email,expiresAt})
//   auth-preload.js:27     manda ipc 'auth-token' {token,email,exp}
//   main.js:283-295        guarda a sessão e decide se ela expirou
//
// Este teste carrega o ARQUIVO DE PRODUÇÃO, sem cópia, com um `electron` falso
// no lugar do host. O host é o andaime; o sujeito sob teste é o nosso código.
import { describe, it, expect, beforeEach } from 'vitest';
// `?raw` e nao `node:fs`: `desktop/tsconfig.json` nao carrega os tipos do Node
// (`types: ["vite/client"]`, e de proposito -- o renderer e DOM). O `?raw` do
// Vite traz o arquivo como texto sem sair desse universo de tipos, e o gate
// `npx tsc -p desktop/tsconfig.json --noEmit` continua limpo.
import fontePreload from '../../electron/auth-preload.js?raw';
import fonteMain from '../../electron/main.js?raw';
import fonteJwt from '../../electron/jwtExp.js?raw';

/** `jwtExp.js` é CJS puro (sem `electron`); carregado do FONTE como o preload. */
function carregarJwtExp(): { expDoJwtMs: (t: unknown) => number | null } {
  const modulo = { exports: {} as { expDoJwtMs: (t: unknown) => number | null } };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('require', 'module', 'exports', 'Buffer', fonteJwt)(
    () => { throw new Error('jwtExp.js não pode depender de nada'); },
    modulo, modulo.exports, (globalThis as unknown as { Buffer: unknown }).Buffer,
  );
  return modulo.exports;
}

/** JWT de brincadeira: header.payload.assinatura com o payload dado. */
function jwtCom(payload: unknown): string {
  const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url('{"alg":"RS256"}')}.${b64url(JSON.stringify(payload))}.assinatura`;
}

type Sent = [channel: string, payload: unknown];

interface Bridge {
  isDesktop: true;
  publish(payload: unknown): void;
}

/**
 * Roda o auth-preload.js real com um `electron` de mentira e devolve
 * (a) o objeto que ele expôs em `window` e (b) a fila de mensagens IPC.
 */
function carregarPreload(): { chave: string; bridge: Bridge; enviados: Sent[] } {
  const enviados: Sent[] = [];
  let chave = '';
  let exposto: Bridge | undefined;

  const electronFalso = {
    contextBridge: {
      exposeInMainWorld(nome: string, api: Bridge) { chave = nome; exposto = api; },
    },
    ipcRenderer: {
      send(canal: string, payload: unknown) { enviados.push([canal, payload]); },
    },
  };

  const modulo = { exports: {} };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const rodar = new Function('require', 'module', 'exports', fontePreload);
  rodar(
    (id: string) => {
      if (id === './jwtExp.js') return carregarJwtExp();
      if (id !== 'electron') throw new Error(`preload pediu um módulo inesperado: ${id}`);
      return electronFalso;
    },
    modulo,
    modulo.exports,
  );

  if (!exposto) throw new Error('o preload não expôs nada em window');
  return { chave, bridge: exposto, enviados };
}

describe('ponte de login do desktop (auth-preload.js)', () => {
  let chave: string;
  let bridge: Bridge;
  let enviados: Sent[];

  beforeEach(() => { ({ chave, bridge, enviados } = carregarPreload()); });

  it('expõe exatamente o nome que src/utils/auth.ts:159 procura', () => {
    // Se este nome divergir, `desktopBridge()` devolve undefined e
    // `startDesktopAuthBridge` sai na primeira linha PARA SEMPRE — inclusive
    // depois de o dono configurar o Firebase. Divergiria em silêncio: nenhum
    // erro, o overlay só nunca receberia token.
    expect(chave).toBe('soulmonDesktopAuth');
    expect(bridge.isDesktop).toBe(true);
  });

  it('traduz o payload do app web para o formato que main.js:284 lê', () => {
    bridge.publish({ token: 'jwt-abc', email: 'eu@exemplo.com', expiresAt: 1_700_000_000_000 });
    expect(enviados).toEqual([
      ['auth-token', { token: 'jwt-abc', email: 'eu@exemplo.com', exp: 1_700_000_000_000 }],
    ]);
  });

  it('logout (token null) vira uma mensagem null — não uma sessão vazia', () => {
    // auth.ts:180 publica `{ token: null }` quando o usuário desloga.
    // main.js:284-286 só zera a sessão se o payload inteiro for falsy ou
    // .token for falsy; mandar `{token:null}` cru também zeraria, mas a
    // mensagem null é a que o preload documenta em :24.
    bridge.publish({ token: null });
    expect(enviados).toEqual([['auth-token', null]]);
  });

  it('recusa qualquer payload que não traga token de texto', () => {
    for (const lixo of [undefined, null, {}, { token: 123 }, { token: {} }, 'jwt']) {
      enviados.length = 0;
      bridge.publish(lixo);
      expect(enviados, JSON.stringify(lixo)).toEqual([['auth-token', null]]);
    }
  });

  it('e-mail ausente vira string vazia, e não `undefined` no IPC', () => {
    // auth.ts:187 manda `user.email`, que o Firebase deixa null em conta sem
    // e-mail. main.js:286 já faz `String(payload.email ?? '')`; aqui provamos
    // que a ponte não deixa `undefined` cruzar o IPC antes disso.
    bridge.publish({ token: 'jwt', email: null, expiresAt: 10 });
    bridge.publish({ token: 'jwt', expiresAt: 10 });
    expect(enviados.map(([, p]) => (p as { email: string }).email)).toEqual(['', '']);
  });

  describe('validade do token — desconhecida é "vence em 1h", nunca eterna', () => {
    // auth.ts manda `Date.parse(result.expirationTime)`. Se o Firebase devolver
    // algo que o Date.parse não entenda, isso é NaN. Até 22/09/2026 o preload
    // colapsava NaN em `exp: 0` e main.js lia 0 como "nunca expira": um overlay
    // aberto por dias mandava ID token vencido para /api/save em loop de 401.
    it('validade ilegível ou ausente vira "1h a partir de agora", nunca 0', () => {
      const antes = Date.now();
      for (const ruim of [Number.NaN, undefined, null, 'amanhã', 0, -5]) {
        enviados.length = 0;
        bridge.publish({ token: 'jwt', email: 'eu@exemplo.com', expiresAt: ruim });
        const exp = (enviados[0][1] as { exp: number }).exp;
        expect(exp, String(ruim)).toBeGreaterThan(antes);
        expect(exp - antes, String(ruim)).toBeLessThanOrEqual(60 * 60 * 1000 + 1_000);
      }
    });

    it('validade legível passa intacta', () => {
      bridge.publish({ token: 'jwt', expiresAt: 1_700_000_000_000 });
      expect((enviados[0][1] as { exp: number }).exp).toBe(1_700_000_000_000);
    });

    // QA rodada 2 (segurança §10): sem `expiresAt`, o `exp` vem do PRÓPRIO
    // token — não de um chute de 1h.
    it('sem `expiresAt`, lê `exp` (segundos) do payload do JWT e manda em ms', () => {
      bridge.publish({ token: jwtCom({ exp: 1_800_000_000, email: 'x' }), email: 'eu@exemplo.com' });
      expect((enviados[0][1] as { exp: number }).exp).toBe(1_800_000_000_000);
    });

    it('`expiresAt` legível vence o `exp` do token (o app sabe melhor)', () => {
      bridge.publish({ token: jwtCom({ exp: 1_800_000_000 }), expiresAt: 1_700_000_000_000 });
      expect((enviados[0][1] as { exp: number }).exp).toBe(1_700_000_000_000);
    });

    it('`expDoJwtMs`: base64url com padding faltando, token torto, payload sem exp, exp 0 → null', () => {
      const { expDoJwtMs } = carregarJwtExp();
      expect(expDoJwtMs(jwtCom({ exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
      // payload que gera `-`/`_` e comprimento não múltiplo de 4
      expect(expDoJwtMs(jwtCom({ exp: 1_800_000_000, sub: '???>>>~~~ééé' }))).toBe(1_800_000_000_000);
      expect(expDoJwtMs('jwt')).toBeNull();
      expect(expDoJwtMs('a.b')).toBeNull();
      expect(expDoJwtMs('a.!!!.c')).toBeNull();
      expect(expDoJwtMs(jwtCom({ iat: 1 }))).toBeNull();
      expect(expDoJwtMs(jwtCom({ exp: 0 }))).toBeNull();
      expect(expDoJwtMs(jwtCom({ exp: 'amanhã' }))).toBeNull();
      expect(expDoJwtMs(null)).toBeNull();
    });

    it('token sem `exp` legível E sem `expiresAt` cai no 1h — nunca em 0', () => {
      const antes = Date.now();
      bridge.publish({ token: jwtCom({ iat: 1 }) });
      const exp = (enviados[0][1] as { exp: number }).exp;
      expect(exp).toBeGreaterThan(antes);
      expect(exp - antes).toBeLessThanOrEqual(60 * 60 * 1000 + 1_000);
    });

    it('main.js não tem mais o ramo "exp falsy = nunca expira"', () => {
      // Guard textual no FONTE (mesmo padrão do widget): o `&&` que abria o
      // buraco não pode voltar, e a normalização para 1h tem que existir no
      // receptor também — a defesa fica nos dois lados da ponte.
      expect(fonteMain).not.toMatch(/authSession\.exp\s*&&\s*Date\.now\(\)/);
      expect(fonteMain).toMatch(/Date\.now\(\)\s*>=\s*authSession\.exp\s*-\s*30_000/);
      expect(fonteMain).not.toMatch(/exp:\s*Number\(payload\.exp\)\s*\|\|\s*0/);
      expect(fonteMain).toMatch(/Number\.isFinite\(expBruto\) && expBruto > 0/);
    });
  });
});
