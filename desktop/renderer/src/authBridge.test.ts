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

  describe('validade do token — o ponto cego desta ponte', () => {
    // auth.ts:188 manda `Date.parse(result.expirationTime)`. Se o Firebase
    // devolver algo que o Date.parse não entenda, isso é NaN.
    it('validade ilegível ou ausente colapsa em exp = 0', () => {
      for (const ruim of [Number.NaN, undefined, null, 'amanhã', 0]) {
        enviados.length = 0;
        bridge.publish({ token: 'jwt', email: 'eu@exemplo.com', expiresAt: ruim });
        expect((enviados[0][1] as { exp: number }).exp, String(ruim)).toBe(0);
      }
    });

    it('exp = 0 é lido por main.js:295 como "nunca expira" — está documentado, não consertado', () => {
      // A regra viva de main.js:295 é:
      //     if (authSession.exp && Date.now() >= authSession.exp - 30_000) return null;
      // Reproduzida aqui como PREDICADO, não como cópia de comportamento: o
      // teste existe para tornar visível que `exp: 0` cai no ramo "sem
      // validade conhecida" e a sessão é entregue para sempre.
      const expirou = (exp: number, agora: number) => !!exp && agora >= exp - 30_000;

      expect(expirou(0, Date.now())).toBe(false);              // <- o ponto cego
      expect(expirou(1_000_000, 1_000_000)).toBe(true);
      expect(expirou(1_000_000, 1_000_000 - 30_000)).toBe(true); // margem de 30s
      expect(expirou(1_000_000, 1_000_000 - 30_001)).toBe(false);
    });
  });
});
