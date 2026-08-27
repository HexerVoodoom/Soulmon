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
// Estatico no topo pelo motivo medido em `src/test/tsAst.ts`: carregar o
// compilador DENTRO do caso pagaria ~490 ms do orcamento do proprio teste, que
// e a assinatura mecanica do flake documentado em
// `sweeper/flake-assets-contract.md`. Aqui o custo cai na fase de import, que
// nenhum dos relogios do vitest governa.
import ts from 'typescript';

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

// ---------------------------------------------------------------------------
// Por que a camada (B) deixou de ser texto.
//
// A versao anterior deste bloco perguntava `fonteMain.toContain('will-navigate')`.
// O proprio cabecalho admitia que "teste de configuracao nao e teste de
// comportamento" — mas o buraco era pior do que o admitido: **comentario e
// texto**. Estas duas linhas passavam no guard antigo, com a trava REMOVIDA:
//
//     // TODO: religar o will-navigate e o setWindowOpenHandler
//     // (usava shell.openExternal, vindo do require do electron)
//
// Ou seja, o guard podia ser satisfeito por quem estivesse DESLIGANDO a trava e
// explicando o motivo no comentario. Guard que o comentario satisfaz nao e guard.
//
// Comentario nao e no de AST. Aqui o `main.js` e PARSEADO, e cada assercao
// pergunta por um no de codigo: a string literal, a chamada, o vinculo do
// `shell`, o parametro do handler. Mesmo padrao dos cinco guards de elo do
// `src/` (ver `src/test/tsAst.ts`), e pelo mesmo motivo.
//
// O `main.js` continua nao sendo importavel (cria janela no corpo do modulo),
// entao ele e lido — mas lido como ARVORE, nao como string.
// ---------------------------------------------------------------------------

/** A arvore do `main.js`, montada uma vez. `ScriptKind.JS` porque o arquivo e
 *  `.js`: passar TSX seria a divergencia silenciosa que `tsAst.ts` descreve. */
const arvoreMain = ts.createSourceFile(
  'main.js', fonteMain, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.JS,
);

/** Todos os nos que satisfazem `pred`, em profundidade. */
function nos(raiz: ts.Node, pred: (n: ts.Node) => boolean): ts.Node[] {
  const achados: ts.Node[] = [];
  const visita = (n: ts.Node): void => { if (pred(n)) achados.push(n); n.forEachChild(visita); };
  visita(raiz);
  return achados;
}

/** O nome do metodo numa chamada `alvo.metodo(...)` — vazio se nao for isso. */
const metodoDe = (n: ts.Node): string =>
  ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : '';

/** Existe `nome(...)` ou `algo.nome(...)` em algum lugar dentro de `raiz`? */
const chamaDentro = (raiz: ts.Node | undefined, nome: string): boolean =>
  !!raiz && nos(raiz, (n) => {
    if (!ts.isCallExpression(n)) return false;
    if (metodoDe(n) === nome) return true;
    return ts.isIdentifier(n.expression) && n.expression.text === nome;
  }).length > 0;

/** O texto do primeiro argumento string de uma chamada — undefined se nao houver. */
const arg0Str = (n: ts.Node): string | undefined => {
  if (!ts.isCallExpression(n)) return undefined;
  const a = n.arguments[0];
  return a && ts.isStringLiteral(a) ? a.text : undefined;
};

const txt = (n: ts.Node) => n.getText(arvoreMain);

describe('F-2 (B) — a fiacao no main.js, verificada por AST', () => {
  it('main.js delega ao modulo de politica, e o require e um VINCULO real', () => {
    // Nao basta o texto do caminho aparecer: tem que existir uma chamada
    // `require('./navigationPolicy...')` de verdade na arvore.
    const requires = nos(arvoreMain, (n) =>
      ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'require');
    const alvos = requires.map(arg0Str);
    expect(alvos.some((a) => !!a && /\.\/navigationPolicy(\.js)?$/.test(a))).toBe(true);
  });

  it('os dois eventos de navegacao existem como STRING no codigo, nao em comentario', () => {
    // `will-redirect` acompanha `will-navigate` porque um 302 para outra origem
    // NAO passa pelo primeiro. Se alguem apagar um dos dois, isto fica vermelho —
    // e um comentario mencionando o nome nao salva, porque comentario nao e no.
    const strings = nos(arvoreMain, ts.isStringLiteral).map((n) => (n as ts.StringLiteral).text);
    expect(strings).toContain('will-navigate');
    expect(strings).toContain('will-redirect');
  });

  it('a navegacao barrada CONSULTA a politica e chama preventDefault', () => {
    const comPolitica = nos(arvoreMain, (n) =>
      ts.isCallExpression(n) && metodoDe(n) === 'on'
      && chamaDentro((n as ts.CallExpression).arguments[1], 'decideNavigation'));
    expect(comPolitica.length).toBeGreaterThan(0);
    for (const c of comPolitica) {
      const cb = (c as ts.CallExpression).arguments[1];
      // Consultar a politica e ignorar a resposta seria trava decorativa.
      expect(chamaDentro(cb, 'preventDefault'), txt(c).slice(0, 80)).toBe(true);
      expect(chamaDentro(cb, 'openExternal'), txt(c).slice(0, 80)).toBe(true);
    }
  });

  it('setWindowOpenHandler e uma CHAMADA que consulta a politica e NEGA a janela', () => {
    const handlers = nos(arvoreMain, (n) =>
      ts.isCallExpression(n) && metodoDe(n) === 'setWindowOpenHandler');
    expect(handlers).toHaveLength(1);
    const cb = (handlers[0] as ts.CallExpression).arguments[0];
    expect(chamaDentro(cb, 'decideWindowOpen')).toBe(true);
    expect(chamaDentro(cb, 'openExternal')).toBe(true);
    // O retorno tem que ser deny: uma janela aberta por target=_blank nao pode
    // nascer dentro do Electron, sem barra de endereco.
    const action = (nos(cb!, ts.isPropertyAssignment) as ts.PropertyAssignment[])
      .find((p) => txt(p.name) === 'action');
    expect(action).toBeDefined();
    expect(ts.isStringLiteral(action!.initializer) && action!.initializer.text).toBe('deny');
  });

  it('shell vem do require do electron por VINCULO — nao e um identificador solto', () => {
    // O guard antigo checava isto com um regex ancorado numa linha inteira. Uma
    // quebra de linha ou outra ordem no destructuring apagaria a checagem sem
    // apagar a protecao — ou o contrario, que e pior.
    const doElectron = (nos(arvoreMain, ts.isVariableDeclaration) as ts.VariableDeclaration[])
      .filter((d) => !!d.initializer && ts.isCallExpression(d.initializer)
        && ts.isIdentifier(d.initializer.expression)
        && d.initializer.expression.text === 'require'
        && arg0Str(d.initializer) === 'electron');
    const ligados = doElectron.flatMap((d) =>
      ts.isObjectBindingPattern(d.name) ? d.name.elements.map((e) => txt(e.name)) : []);
    expect(ligados).toContain('shell');

    // E o openExternal tem que ser chamado SOBRE esse shell.
    const saidas = nos(arvoreMain, (n) =>
      ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
      && n.expression.name.text === 'openExternal'
      && txt(n.expression.expression) === 'shell');
    expect(saidas.length).toBeGreaterThan(0);
  });

  it('o handler de auth-token olha a origem do FRAME remetente', () => {
    const ipc = nos(arvoreMain, (n) =>
      ts.isCallExpression(n) && metodoDe(n) === 'on' && arg0Str(n) === 'auth-token');
    expect(ipc).toHaveLength(1);
    const cb = (ipc[0] as ts.CallExpression).arguments[1];
    expect(chamaDentro(cb, 'isTrustedAuthSender')).toBe(true);
    // senderFrame, nao sender: um iframe de terceiro compartilha o sender da
    // janela, entao olhar sender deixaria a injecao passar.
    expect(nos(cb!, (n) => ts.isPropertyAccessExpression(n) && n.name.text === 'senderFrame').length)
      .toBeGreaterThan(0);
    // O parametro do evento nao pode voltar a ser descartado.
    const params = (cb as ts.ArrowFunction).parameters;
    expect(params.length).toBeGreaterThan(0);
    expect(txt(params[0].name)).not.toMatch(/^_/);
  });

  it('as tres travas de webPreferences continuam apertadas, lidas como PROPRIEDADE', () => {
    const props = nos(arvoreMain, ts.isPropertyAssignment) as ts.PropertyAssignment[];
    const valores = (nome: string) =>
      props.filter((p) => txt(p.name) === nome).map((p) => txt(p.initializer));

    expect(valores('contextIsolation')).toContain('true');
    expect(valores('contextIsolation')).not.toContain('false');
    expect(valores('nodeIntegration')).toContain('false');
    expect(valores('nodeIntegration')).not.toContain('true');
    // Estas duas nao podem aparecer afrouxadas em NENHUMA janela do arquivo.
    expect(valores('webSecurity')).not.toContain('false');
    expect(valores('allowRunningInsecureContent')).toHaveLength(0);
  });
});
