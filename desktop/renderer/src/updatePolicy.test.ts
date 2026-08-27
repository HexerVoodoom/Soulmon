// O updater e um caminho de EXECUCAO DE CODIGO. Quem decide que ele roda
// autoriza o processo a baixar um instalador e executa-lo na proxima saida do
// app (`autoInstallOnAppQuit = true`). As duas auditorias de hoje declararam
// isso fora de escopo; esta e a cobertura.
//
// Duas camadas, pelo mesmo precedente de `navigationPolicy.test.ts`:
//  A) a DECISAO mora em `electron/updatePolicy.js`, pura, e e EXECUTADA aqui
//     de verdade — sem Electron, sem rede;
//  B) `main.js` nao e importavel em node (cria janela no corpo do modulo),
//     entao a FIACAO e o feed sao verificados por leitura do arquivo de
//     producao e do `desktop/package.json`, no mesmo padrao de `csp.test.ts`.
import { describe, it, expect } from 'vitest';
// `?raw` pelo mesmo motivo documentado em `authBridge.test.ts`: o
// `desktop/tsconfig.json` nao carrega tipos do Node.
import fontePolicy from '../../electron/updatePolicy.js?raw';
import fonteMain from '../../electron/main.js?raw';
import pkgDesktop from '../../package.json';

interface Policy {
  isSteamBuild(pkg: unknown): boolean;
  shouldAutoUpdate(ctx: { isPackaged?: unknown; pkg?: unknown }): boolean;
}

function carregarPolicy(): Policy {
  const modulo = { exports: {} as Policy };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const rodar = new Function('module', 'exports', fontePolicy);
  rodar(modulo, modulo.exports);
  return modulo.exports;
}

const policy = carregarPolicy();

describe('(A) a decisao pura — quem pode se auto-atualizar', () => {
  it('build empacotado e normal atualiza; dev nunca atualiza', () => {
    expect(policy.shouldAutoUpdate({ isPackaged: true, pkg: {} })).toBe(true);
    expect(policy.shouldAutoUpdate({ isPackaged: false, pkg: {} })).toBe(false);
    // `isPackaged` ausente ou "quase verdadeiro" nao vale: fail-safe.
    expect(policy.shouldAutoUpdate({ pkg: {} })).toBe(false);
    expect(policy.shouldAutoUpdate({ isPackaged: 1, pkg: {} })).toBe(false);
    expect(policy.shouldAutoUpdate({})).toBe(false);
  });

  it('a marcacao de Steam desliga o updater como BOOLEANO **e como STRING**', () => {
    // ESTE e o caso que a comparacao `=== true` de main.js:22 errava.
    // `desktop/STEAM.md` prova, lendo o asar de 26/ago/2026, que
    // `-c.extraMetadata.steamBuild=true` chega BOOLEANO — com o
    // electron-builder 25.1.8 e com aquela forma de invocar. A prova nao se
    // estende a versao futura nem a um `--config` em arquivo, onde `"true"`
    // e um valor perfeitamente possivel. E o erro tem lado: string virava
    // "nao e Steam", e o build da Steam se atualizaria pelo GitHub por cima
    // do que o SteamPipe instalou — sem ninguem ver.
    expect(policy.isSteamBuild({ steamBuild: true })).toBe(true);
    expect(policy.isSteamBuild({ steamBuild: 'true' })).toBe(true);
    expect(policy.shouldAutoUpdate({ isPackaged: true, pkg: { steamBuild: true } })).toBe(false);
    expect(policy.shouldAutoUpdate({ isPackaged: true, pkg: { steamBuild: 'true' } })).toBe(false);
  });

  it('so a marcacao afirmativa conta — o resto e build normal', () => {
    for (const v of [undefined, false, 'false', 0, 1, '', 'sim', null, {}]) {
      expect(policy.isSteamBuild({ steamBuild: v }), String(v)).toBe(false);
    }
    expect(policy.isSteamBuild(undefined)).toBe(false);
    expect(policy.isSteamBuild(null)).toBe(false);
    expect(policy.isSteamBuild('steamBuild')).toBe(false);
  });
});

describe('(B) a fiacao de main.js usa a decisao, e nao uma copia dela', () => {
  it('main.js chama shouldAutoUpdate e nao compara a marcacao na mao', () => {
    expect(fonteMain).toContain("require('./updatePolicy.js')");
    expect(fonteMain).toMatch(/if \(shouldAutoUpdate\(\{[^)]*isPackaged: app\.isPackaged/);
    // A regra copiada diverge em silencio: se voltar um `=== true` local,
    // o conserto acima vira decorativo.
    expect(fonteMain).not.toMatch(/steamBuild\s*===/);
  });

  it('o agendamento periodico esta DENTRO da guarda, nao fora dela', () => {
    // Um `setInterval(checkForUpdates, ...)` no corpo do modulo desligaria a
    // decisao inteira: o build de Steam voltaria a atualizar sozinho quatro
    // horas depois de aberto.
    const guarda = fonteMain.match(/if \(shouldAutoUpdate\([\s\S]*?\n {4}\}/)?.[0] ?? '';
    expect(guarda, 'AUTOVERIFICACAO: bloco da guarda encontrado').toContain('checkForUpdates');
    expect(guarda).toContain('setInterval');
    // Nao pode existir outra chamada de checkForUpdates fora do bloco alem da
    // propria declaracao da funcao.
    const foraDaGuarda = fonteMain.replace(guarda, '');
    expect(foraDaGuarda.match(/checkForUpdates\(/g) ?? []).toHaveLength(1); // so `function checkForUpdates(`
  });
});

describe('(C) de onde o binario vem — o feed do updater', () => {
  const publish = (pkgDesktop as { build?: { publish?: Record<string, unknown> } }).build?.publish;

  it('o feed e o GitHub Releases do repositorio proprio, por provider e nao por URL', () => {
    expect(publish, 'sem bloco publish o electron-updater nao tem feed').toBeTruthy();
    expect(publish!.provider).toBe('github');
    expect(publish!.owner).toBe('HexerVoodoom');
    expect(publish!.repo).toBe('Soulmon');
  });

  it('NAO existe feed generico nem URL de update escrita a mao', () => {
    // `provider: 'generic'` + `url` e o caminho pelo qual um endpoint proprio
    // (e, no pior caso, http://) viraria a origem do instalador. O provider
    // github resolve por api.github.com em https, sem URL configuravel aqui.
    expect(publish!.provider).not.toBe('generic');
    expect(JSON.stringify(publish)).not.toMatch(/http:\/\//);
    // `setFeedURL` em main.js sobreporia o bloco acima em silencio.
    expect(fonteMain).not.toContain('setFeedURL');
    // Downgrade permitido deixaria um "update" para versao anterior passar.
    expect(fonteMain).not.toMatch(/allowDowngrade\s*=\s*true/);
    expect(fonteMain).not.toMatch(/allowPrerelease\s*=\s*true/);
  });
});

describe('identidade do instalador (o Publisher que o Windows mostra)', () => {
  // O `nsis` usa `author` como PUBLISHER do instalador: e o nome que aparece no
  // aviso azul do Windows ("Editor: ...") e nas propriedades do .exe. Sem o
  // campo, o electron-builder so avisa `author is missed` no log -- e aviso de
  // build e exatamente a categoria de sinal que ninguem le (licao 12: o gate
  // morto do CI). O resultado silencioso e um instalador assinado por "Editor
  // desconhecido", que e a frase que faz o usuario cancelar e apagar.
  //
  // Guard aqui, e nao no build, porque o build do instalador nao roda no CI e
  // hoje nem roda nesta maquina (o electron-builder precisa de symlink, ver o
  // Modo de Desenvolvedor do Windows).
  const pkg = pkgDesktop as { author?: unknown; productName?: unknown };

  it('author existe e nao e vazio -- sem ele o Windows escreve Editor desconhecido', () => {
    expect(typeof pkg.author, 'author precisa ser string (ou {name}) para virar Publisher')
      .toBe('string');
    expect(String(pkg.author).trim()).not.toBe('');
  });

  it('author nao vaza e-mail -- este package.json esta num repositorio publico', () => {
    // O formato `Nome <email@dominio>` e idiomatico em Node e seria a escolha
    // natural de quem preenchesse sem pensar no repo. Decisao do dono: so o nome.
    expect(String(pkg.author ?? '')).not.toMatch(/@/);
    expect(String(pkg.author ?? '')).not.toMatch(/[<>]/);
  });

  it('o nome do produto continua sendo Soulmon', () => {
    // O Publisher e QUEM assina; o productName e O QUE se instala. Trocar um
    // pelo outro faz o instalador dizer que o editor e o proprio app.
    expect(pkg.productName).toBe('Soulmon');
    expect(pkg.author).not.toBe(pkg.productName);
  });
});
