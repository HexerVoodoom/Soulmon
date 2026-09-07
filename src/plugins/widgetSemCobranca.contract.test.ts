import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// O WIDGET NÃO COBRA — e agora há régua.
//
// A auditoria de 06/09/2026 achou o WP2.6 com o aceite falhando: o widget
// mantinha as três frases que a spec do dossiê mandou REMOVER e recebia as
// duas chaves que ela VETOU. Nada ficava vermelho porque nenhum teste em
// `node` alcança Kotlin — a mesma cegueira que deixou o teto de carinho por
// aparelho (ver o footgun 9).
//
// Este teste lê o FONTE do renderer. É grosseiro de propósito: um guard que só
// sabe ler string ainda é infinitamente melhor que nenhum, e o que ele protege
// é vocabulário, que é justamente o que se lê.
//
// Por que o widget importa mais que qualquer tela: ele é visto dezenas de
// vezes por dia sem que a pessoa tenha decidido abrir nada. É a única
// superfície do produto que fala sem ser chamada.
// ---------------------------------------------------------------------------
const renderer = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/widget/WidgetRenderer.kt',
  'utf8',
);
const plugin = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonWidgetPlugin.kt',
  'utf8',
);

/** Só o código; os comentários CITAM as frases proibidas para explicar por que
 *  saíram, e essa citação é o registro que impede a reintrodução. */
const semComentarios = (fonte: string) =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('o widget não cobra', () => {
  const codigo = semComentarios(renderer);

  it('não conta o que falta', () => {
    // "N tarefas restantes" só aparece quando a razão é BAIXA — o placar
    // aparecendo justamente para quem está perdendo o dia.
    expect(codigo).not.toMatch(/task\(s\) left/);
    expect(codigo).not.toMatch(/total - completed/);
    expect(codigo).not.toMatch(/\$completed de \$total/);
  });

  it('não trata HP baixo como alarme', () => {
    // O HP representa o cuidado que a pessoa teve consigo mesma; um ⚠️ ali
    // converte culpa (reparável) em vergonha (motiva desinstalar).
    expect(codigo).not.toMatch(/Cuide de mim/);
    expect(codigo).not.toMatch(/I need some care/);
    expect(codigo).not.toMatch(/⚠️/);
  });

  it('não lê percentual cru nem escudo — as duas chaves vetadas', () => {
    expect(codigo).not.toMatch(/constancy_pct/);
    expect(codigo).not.toMatch(/"shields"/);
  });
});

describe('o bridge não grava o que a spec vetou', () => {
  const codigo = semComentarios(plugin);

  it('nenhum putInt de constância, escudo ou vínculo', () => {
    expect(codigo).not.toMatch(/putInt\("constancy_pct"/);
    expect(codigo).not.toMatch(/putInt\("shields"/);
    expect(codigo).not.toMatch(/putInt\("bond_level"/);
  });

  it('grava a FAIXA no lugar do número', () => {
    expect(codigo).toMatch(/putBoolean\("habit_steady"/);
  });

  it('as chaves antigas são REMOVIDAS, não só deixadas de escrever', () => {
    // Um aparelho que já rodou a versão anterior tem os valores gravados no
    // SharedPreferences: parar de escrever não apaga o que está lá.
    for (const chave of ['constancy_pct', 'shields', 'bond_level']) {
      expect(codigo).toMatch(new RegExp(`remove\\("${chave}"\\)`));
    }
  });
});
