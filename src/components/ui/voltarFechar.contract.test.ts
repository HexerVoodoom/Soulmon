/**
 * I3 (02/10/2026) — CONTRATO do padrão voltar/fechar (manual 03 §1.5).
 *
 *  · VOLTAR = seta no canto superior ESQUERDO, acima do título.
 *  · FECHAR de modal/folha simples = o MESMO lugar (`BackArrow icon="close"`).
 *  · FECHAR à DIREITA só para ENCERRAR uma atividade em andamento (luta,
 *    minijogo, run) — e então pede confirmação se sair perde progresso.
 *  · O ✕ de DISPENSAR um card/banner inline não é modal e pode ficar à direita.
 *
 * Quem cria um ✕ novo (`<Icon name="close">` / `icon="close"`) precisa entrar
 * na tabela abaixo, com a classe — é a hora de decidir onde ele mora.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = 'src';
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(n) && !/\.test\.tsx$/.test(n)) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(SRC, p).split('\\').join('/');
const FILES = walk(SRC).map(p => ({ path: rel(p), src: readFileSync(p, 'utf8') }));

type Classe = 'base-esquerda' | 'atividade-direita' | 'dispensar-inline';
/** Toda superfície que desenha um ✕ (ícone `close`) e a classe dela. */
const TABELA: Record<string, Classe> = {
  'components/ui/BackArrow.tsx': 'base-esquerda',
  'components/ritual/RitualKit.tsx': 'base-esquerda', // o ramo `end` é só do pesadelo (atividade)
  'components/form/FormKit.tsx': 'base-esquerda', // idem: `closeSide="end"` só para atividade
  'components/nav/AreaSheet.tsx': 'base-esquerda',
  'components/AdventureDiary.tsx': 'base-esquerda', // modal de tela cheia (rodada 7, I7): ✕ no topo ESQUERDO
  'components/home/Mochila.tsx': 'base-esquerda',
  'components/mercado/ShopItemSheet.tsx': 'base-esquerda', // lightbox: ✕ no topo ESQUERDO
  'components/SoulmonOnboarding.tsx': 'dispensar-inline', // card da oferta 13.1 + ferramenta de dev (BackArrow close)
  'components/games/GameKit.tsx': 'atividade-direita', // `GameHeader`: esquerda quando ocioso, direita em `activity`
  'components/games/BattleStage.tsx': 'atividade-direita',
  'App.tsx': 'dispensar-inline', // banners `sm2-notice-dismiss`
  'components/DailyReportModal.tsx': 'dispensar-inline', // × do convite dentro do relatório
  'components/CreateModal.tsx': 'dispensar-inline', // remover passo da lista
  'components/catalog/CatalogBrowserModal.tsx': 'dispensar-inline', // fechar a CAIXA de busca
};

const FECHA = /name="close"|icon="close"|name: 'close'/;

describe('voltar/fechar — contrato (I3)', () => {
  it('todo arquivo que desenha um ✕ está classificado na tabela', () => {
    const achados = FILES.filter(f => FECHA.test(f.src)).map(f => f.path);
    const sobras = achados.filter(p => !(p in TABELA));
    expect(sobras, `✕ novo fora da tabela (decida o lugar): ${sobras.join(', ')}`).toEqual([]);
  });

  it('✕ de base (folha/diálogo simples): nada de `right:` colado ao ícone', () => {
    for (const [path, classe] of Object.entries(TABELA)) {
      if (classe !== 'base-esquerda') continue;
      const f = FILES.find(x => x.path === path)!;
      const linhas = f.src.split(/\r?\n/);
      linhas.forEach((l, i) => {
        if (!FECHA.test(l)) return;
        const janela = linhas.slice(Math.max(0, i - 14), i + 1).join('\n');
        // a exceção é o ramo `end` explícito (atividade), nunca o padrão
        if (/side === 'end'|closeSide === 'end'|\/\* 44×44/.test(janela)) return;
        expect(janela, `${path}:${i + 1}`).not.toMatch(/\bright:\s*\d/);
      });
    }
  });

  it('o ✕ à direita das bases só existe atrás de `end` e só o pesadelo o pede', () => {
    const usos = FILES.filter(f => /closeSide=["']end["']|closeSide=\{['"]end['"]\}/.test(f.src)).map(f => f.path);
    expect(usos).toEqual(['components/NightmareBattle.tsx']);
    const ritual = FILES.find(f => f.path === 'components/ritual/RitualKit.tsx')!.src;
    const gate = ritual.indexOf("if (side === 'start')");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(ritual.indexOf('right: 4'));
  });

  it('modais corrigidos não têm botão de TEXTO Fechar/Voltar que duplica o ✕ do topo', () => {
    const duplica = />\s*\{[^{}]*'(Fechar|Voltar)'[^{}]*\}\s*<\/button>/;
    const corrigidos = [
      'components/GuideModal.tsx', 'components/HelpModal.tsx', 'components/PlayerDetailModal.tsx',
      'components/TriagePile.tsx', 'components/RebirthModal.tsx', 'components/GameTutorialFlow.tsx',
      'components/ArenaGame.tsx', 'components/SoulmonOnboarding.tsx',
    ];
    for (const p of corrigidos) {
      const f = FILES.find(x => x.path === p)!;
      expect(f.src, p).not.toMatch(duplica);
    }
  });

  it('o `GameHeader` tem as duas posições (ocioso à esquerda, atividade à direita)', () => {
    const kit = FILES.find(f => f.path === 'components/games/GameKit.tsx')!.src;
    expect(kit).toContain('data-game-close-start');
    expect(kit).toContain('data-game-close-end');
  });
});
