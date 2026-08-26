// F-2 da auditoria do cliente: a janela do app completo (`openFullApp`) nao
// tinha trava de navegacao NENHUMA — zero `will-navigate`, zero
// `setWindowOpenHandler`, zero `shell.openExternal` — e o `ipcMain.on
// ('auth-token')` gravava a sessao sem olhar de onde a mensagem veio.
//
// O ataque nao e roubo de token: `auth-preload.js` so expoe canal de SAIDA e
// isso esta certo. O ataque e INJECAO — uma origem hostil carregada naquela
// janela publica o token da conta DELA, e o overlay da vitima passa a
// sincronizar habito, tarefa e cuidado para a conta do atacante.
//
// Duas camadas de teste, pelo mesmo motivo de f6fb5f30 (`care.ts`):
//  A) a DECISAO mora em `electron/navigationPolicy.js`, puro, e e EXECUTADA
//     aqui de verdade — sem Electron, sem janela, sem rede;
//  B) `main.js` nao e importavel em node (cria janela no corpo do modulo),
//     entao a FIACAO e verificada por leitura do arquivo de producao, no
//     mesmo padrao que `csp.test.ts` usa para a CSP. Teste de configuracao
//     nao e teste de comportamento, e nao finge ser: ele afirma que a
//     chamada existe e passa a decisao para o modulo testado em (A).
import { describe, it, expect } from 'vitest';
// `?raw` pelo mesmo motivo documentado em `authBridge.test.ts`: o
// `desktop/tsconfig.json` nao carrega tipos do Node.
import fontePolicy from '../../electron/navigationPolicy.js?raw';
import fonteMain from '../../electron/main.js?raw';

interface Policy {
  DEFAULT_APP_URL: string;
  appOrigin(raw: string | undefined | null): string;
  decideNavigation(url: string, origem: string): { allow: boolean; openExternal: string | null };
  decideWindowOpen(url: string): { allow: boolean; openExternal: string | null };
  isTrustedAuthSender(senderUrl: string | undefined | null, origem: string): boolean;
}

function carregarPolicy(): Policy {
  const modulo = { exports: {} as Policy };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const rodar = new Function('module', 'exports', fontePolicy);
  rodar(modulo, modulo.exports);
  return modulo.exports;
}

const policy = carregarPolicy();
const APP = 'https://soulmon.mateus-sprnd.workers.dev';

describe('F-2 (A) — a decisao pura de navegacao', () => {
  it('a origem legitima sai da URL do app, com ou sem caminho', () => {
    expect(policy.appOrigin(APP)).toBe(APP);
    expect(policy.appOrigin(`${APP}/jogo?x=1#y`)).toBe(APP);
  });

  it('SOULMON_APP_URL invalida ou de esquema opaco NAO vira origem — cai no default', () => {
    // O ponto perigoso: `new URL('file:///x').origin` e a string 'null', e uma
    // origem 'null' compararia igual a qualquer outra origem opaca. Se isso
    // passasse, a trava inteira viraria decorativa por causa de uma env var.
    for (const lixo of ['', '   ', 'nao-e-url', 'file:///c:/x.html', 'data:text/html,<b>', 'javascript:alert(1)']) {
      expect(policy.appOrigin(lixo), lixo).toBe(APP);
    }
    expect(policy.appOrigin(undefined)).toBe(APP);
    expect(policy.appOrigin(null)).toBe(APP);
  });

  it('env legitima e respeitada: outro host https, e http so em localhost', () => {
    expect(policy.appOrigin('https://staging.exemplo.dev/app')).toBe('https://staging.exemplo.dev');
    expect(policy.appOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
    // http em host remoto seria login em claro: nao vira origem confiavel.
    expect(policy.appOrigin('http://soulmon.mateus-sprnd.workers.dev')).toBe(APP);
  });

  it('navegacao de topo: mesma origem passa, o resto nao entra na janela com preload', () => {
    const origem = policy.appOrigin(APP);
    // O login por LINK DE E-MAIL volta na mesma origem com query e hash
    // (`signInWithEmailLink` le `window.location.href`). Se isto fosse negado,
    // o login quebraria — e e o cenario que a tarefa manda nao quebrar.
    expect(policy.decideNavigation(`${APP}/?apiKey=x&oobCode=y#/login`, origem))
      .toEqual({ allow: true, openExternal: null });

    expect(policy.decideNavigation('https://exemplo-hostil.test/', origem))
      .toEqual({ allow: false, openExternal: 'https://exemplo-hostil.test/' });
    for (const url of ['file:///c:/windows/system32/x.html', 'data:text/html,<script>1</script>', 'javascript:alert(1)', 'smb://servidor/share']) {
      expect(policy.decideNavigation(url, origem), url).toEqual({ allow: false, openExternal: null });
    }
  });

  it('window.open nunca abre dentro do Electron; https vai para o navegador do sistema', () => {
    expect(policy.decideWindowOpen('https://exemplo.test/ajuda').allow).toBe(false);
    expect(policy.decideWindowOpen('https://exemplo.test/ajuda').openExternal).toBe('https://exemplo.test/ajuda');
    expect(policy.decideWindowOpen('file:///c:/x.exe')).toEqual({ allow: false, openExternal: null });
  });

  it('IPC auth-token: so a origem do app injeta sessao', () => {
    const origem = policy.appOrigin(APP);
    expect(policy.isTrustedAuthSender(`${APP}/qualquer/rota`, origem)).toBe(true);
    // O ataque do F-2, literal: payload perfeito, origem errada.
    expect(policy.isTrustedAuthSender('https://exemplo-hostil.test/', origem)).toBe(false);
    // Prefixo nao e origem: `...workers.dev.exemplo-hostil.test` nao passa.
    expect(policy.isTrustedAuthSender(`${APP}.exemplo-hostil.test/`, origem)).toBe(false);
    expect(policy.isTrustedAuthSender('file:///c:/x.html', origem)).toBe(false);
    expect(policy.isTrustedAuthSender('', origem)).toBe(false);
    expect(policy.isTrustedAuthSender(undefined, origem)).toBe(false);
  });
});

describe('F-2 (B) — a fiacao no main.js (processo principal, nao importavel)', () => {
  it('main.js usa o modulo de politica em vez de decidir sozinho', () => {
    expect(fonteMain).toMatch(/require\(['"]\.\/navigationPolicy(\.js)?['"]\)/);
  });

  it('as tres ausencias que a auditoria contou agora existem', () => {
    expect(fonteMain).toContain("will-navigate");
    expect(fonteMain).toContain("setWindowOpenHandler");
    expect(fonteMain).toContain("shell.openExternal");
    // `shell` precisa vir do require do electron, senao o de cima e so texto.
    expect(fonteMain).toMatch(/require\(['"]electron['"]\)[\s\S]{0,200}/);
    expect(fonteMain).toMatch(/^const \{[^}]*\bshell\b[^}]*\} = require\('electron'\);$/m);
  });

  it('o handler de auth-token consulta a origem do frame remetente', () => {
    const handler = fonteMain.slice(fonteMain.indexOf("ipcMain.on('auth-token'"));
    expect(handler).not.toBe('');
    expect(handler.slice(0, 900)).toContain('isTrustedAuthSender');
    expect(handler.slice(0, 900)).toMatch(/senderFrame/);
    // O parametro do evento nao pode continuar descartado como `_event`.
    expect(handler.slice(0, 120)).not.toMatch(/\(\s*_event/);
  });

  it('as tres travas que ja estavam apertadas continuam apertadas', () => {
    // A auditoria confirmou as tres; mexer nelas seria trocar um furo por outro.
    expect(fonteMain).toContain('contextIsolation: true');
    expect(fonteMain).toContain('nodeIntegration: false');
    expect(fonteMain).not.toMatch(/webSecurity\s*:\s*false/);
    expect(fonteMain).not.toMatch(/contextIsolation\s*:\s*false/);
    expect(fonteMain).not.toMatch(/nodeIntegration\s*:\s*true/);
    expect(fonteMain).not.toMatch(/allowRunningInsecureContent/);
  });
});
