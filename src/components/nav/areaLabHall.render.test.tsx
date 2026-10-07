// @vitest-environment jsdom
/**
 * LABORATÓRIO E HALL (minimal-ui F5) — o conteúdo real dentro do molde da F4.
 *
 * O que estava suspenso na F4 (`!area` nas condições do `App.tsx`: a página de
 * Evolução, a ficha do Soulmon e a Biblioteca) volta para DENTRO da folha do
 * lote. Estes testes substituem a garantia que as páginas antigas davam por
 * existirem: nenhuma delas pode ficar inalcançável de novo, e nenhuma regra é
 * reimplementada no caminho — a cerimônia de evolução continua sendo a do
 * `handleEvolveRequest`, e o social continua sendo a `LibraryPage`.
 *
 * Metade é CONTRATO no fonte (o `App` inteiro não monta em jsdom sem arrastar
 * o jogo todo), metade é render dos componentes que ganharam prop nova.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaScene } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { areaNpcVoice } from '../../utils/areaNpcVoice';

vi.mock('../../utils/community', async (orig) => {
  const real = await orig<typeof import('../../utils/community')>();
  return { ...real, listPlayers: vi.fn(async () => []), getPlayer: vi.fn() };
});

import { LibraryPage } from '../LibraryPage';
import { PetPage } from '../PetPage';

const APP = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
const AREA_VIEW = readFileSync(resolve(__dirname, './AreaView.tsx'), 'utf8');

/** O trecho entre `const <nome> = (` e a próxima declaração de topo. */
function bloco(nome: string): string {
  const i = APP.indexOf(`const ${nome} = (`);
  expect(i, `const ${nome} some do App.tsx`).toBeGreaterThan(-1);
  const fim = APP.indexOf('\n  const ', i + 10);
  return APP.slice(i, fim === -1 ? undefined : fim);
}

describe('Laboratório — a árvore de Evolução dentro da folha', () => {
  it('a folha do Laboratório abre o labContent; a do Hall, o hallContent (via AreaView)', () => {
    // Consolidado (F5): o App monta um `<AreaView>` só e entrega o conteúdo
    // pronto; quem escolhe a folha por área é o `AreaView`.
    expect(APP).toContain('labContent={labContent}');
    expect(APP).toContain('hallContent={hallContent}');
    expect(AREA_VIEW).toContain('{props.labContent}');
    expect(AREA_VIEW).toContain("props.hallContent('directory')");
    expect(AREA_VIEW).toContain("props.hallContent('friends')");
  });

  it('labContent monta a EvolutionPath com a cerimônia manual de sempre (sem regra nova)', () => {
    const lab = bloco('labContent');
    expect(lab).toContain('<EvolutionPath');
    // O gesto de evoluir é o MESMO do HUD — nunca um handler paralelo.
    expect(lab).toContain('onEvolveRequest={handleEvolveRequest}');
    expect(lab).toContain('onToggleEvolutionLock={handleToggleEvolutionLock}');
    expect(lab).toContain('evolutionLocked={gameState.evolutionLocked ?? false}');
    // Renascimento, convites e o registro seguem morando na página de Evolução.
    expect(lab).toContain('canRebirth(gameState)');
    expect(lab).toContain("rebirthRefusal(gameState) === 'not-paid'");
    expect(lab).toContain('<UnlockNudge');
  });

  it('as três partes viraram construções do mapa (sem abas): cada uma escolhe labTab e monta algo', () => {
    const lab = bloco('labContent');
    expect(lab).not.toContain('role="tablist"');
    expect(lab).toContain("labTab === 'evolution'");
    expect(lab).toContain("labTab === 'pet' && (");
    expect(lab).toContain("labTab === 'stats' && statsPage");
    expect(AREA_VIEW).toContain("{ evolucao: 'evolution', pet: 'pet', stats: 'stats' }");
    expect(AREA_VIEW).toContain('props.onLabTab(tabOf[l.id])');
    // Dentro da folha o `<h1>` é o do AreaTopBar: a ficha desce para h2.
    expect(lab).toMatch(/<PetPage\s+headingLevel=\{2\}/);
  });

  it('nenhuma página do Laboratório ou do Hall ficou presa atrás de `!area` (a suspensão da F4 acabou)', () => {
    for (const p of ['evolution', 'pet', 'library']) {
      expect(APP, p).not.toMatch(new RegExp(`pane === '${p}'[^\\n]*!area`));
    }
    // G2 (02/10/2026): Estatísticas NÃO é mais página do menu da Home — só o Santuário do Vínculo.
    expect(APP).not.toContain("pane === 'stats' && !area");
  });
});

describe('Hall — a Biblioteca (D4) com a saudação da Lumi', () => {
  it('hallContent é a LibraryPage de sempre, embutida', () => {
    const hall = bloco('hallContent');
    expect(hall).toContain('<LibraryPage');
    expect(hall).toContain('embedded');
    expect(hall).toContain("onVisitPlayer={() => contarMissao('friend-visit')}");
  });

  it('a Lumi recebe no Hall, nos dois idiomas, sem prometer o que já existe como "em breve"', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const { name, line } = areaNpcVoice('hall', lang);
      expect(name).toContain('Lumi');
      expect(line).not.toMatch(/em breve|soon/i);
      // A Lumi é o NPC do lote único do Hall (`biblioteca`) — mora dentro da
      // folha aberta, não mais num anfitrião fixo da cena.
      const r = renderWithCss(
        <AreaScene areaId="hall" language={lang} lots={[]}>
          <AreaSheet areaId="hall" lotId="biblioteca" language={lang} title="Biblioteca" closeLabel="x" open onClose={() => {}}>
            <p>x</p>
          </AreaSheet>
        </AreaScene>,
      );
      expect(r.container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain(line);
      r.unmount();
    }
  });

  it('LibraryPage embutida não repete o <h1> (a folha já nomeia a Biblioteca); solta, mantém', () => {
    const base = {
      saveId: 's', friends: [], canGiftToday: false,
      onFriendsChange: () => {}, onGiftSent: () => {}, language: 'pt-BR' as const,
    };
    const solta = renderWithCss(<LibraryPage {...base} />);
    expect(solta.container.querySelector('h1')?.textContent).toContain('Biblioteca');
    solta.unmount();
    const dentro = renderWithCss(<LibraryPage {...base} embedded />);
    expect(dentro.container.querySelector('h1')).toBeNull();
    // a legenda foi para o "?" (varredura K6): abre o tooltip antes de ler
    fireEvent.click(dentro.getByRole('button', { name: 'Sobre a Biblioteca' }));
    expect(document.body.textContent).toContain('Veja outros jogadores');
    dentro.unmount();
  });
});

describe('PetPage headingLevel', () => {
  it('padrão h1; com headingLevel=2 o nome/estado vazio vira h2 e não há h1', () => {
    const a = renderWithCss(<PetPage stages={[]} unlockedEvolutions={[]} currentStageId="rookie" language="pt-BR" />);
    expect(a.container.querySelector('h1')).not.toBeNull();
    a.unmount();
    const b = renderWithCss(<PetPage stages={[]} unlockedEvolutions={[]} currentStageId="rookie" language="pt-BR" headingLevel={2} />);
    expect(b.container.querySelector('h1')).toBeNull();
    expect(b.container.querySelector('h2')?.textContent).toContain('Seu Soulmon');
    b.unmount();
  });
});
