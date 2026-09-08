// @vitest-environment jsdom
/**
 * O diário de aventuras.
 *
 * O que estes testes protegem é o que separa um diário de um painel de
 * pendências — e a distinção é regra escrita do produto ("painel de pendências
 * é o Habitica: a pessoa abre o app e encontra uma fatura"):
 *
 *  1. **Não mostra o que falta.** Sem silhuetas, sem "3 de 24", sem barra.
 *  2. **Não mostra raridade.** Rotular a noite de ontem como "comum" é dizer à
 *     pessoa que ela valeu pouco.
 *  3. **O vazio é uma promessa, não uma falta.**
 *  4. **A data aparece** — é ela que faz a coleção ser história e não lista.
 *  5. **PT e EN.**
 */
import { describe, it, expect } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { AdventureDiary } from './AdventureDiary';
import { ADVENTURE_CATALOG } from '../utils/adventure';

const A = ADVENTURE_CATALOG[0];
const B = ADVENTURE_CATALOG[1];

describe('o diário mostra o que foi vivido', () => {
  it('lista os achados com título, texto e data', () => {
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getByText(A.titlePt)).toBeTruthy();
    expect(screen.getByText(A.textPt)).toBeTruthy();
    expect(screen.getByText('08/09')).toBeTruthy();
  });

  it('o mais recente vem primeiro — lê-se para reencontrar ontem', () => {
    renderWithCss(
      <AdventureDiary
        entries={[{ id: A.id, day: '2026-09-01' }, { id: B.id, day: '2026-09-08' }]}
        language="pt-BR"
      />,
    );
    const itens = screen.getAllByRole('listitem');
    expect(itens[0].textContent).toContain(B.titlePt);
    expect(itens[1].textContent).toContain(A.titlePt);
  });

  it('não muta a lista recebida', () => {
    const entries = [{ id: A.id, day: '2026-09-01' }, { id: B.id, day: '2026-09-08' }];
    renderWithCss(<AdventureDiary entries={entries} language="pt-BR" />);
    expect(entries[0].id).toBe(A.id);
  });

  it('id órfão some da lista em vez de derrubar a tela', () => {
    renderWithCss(
      <AdventureDiary
        entries={[{ id: 'adv-que-nao-existe', day: '2026-09-08' }, { id: A.id, day: '2026-09-09' }]}
        language="pt-BR"
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText(A.titlePt)).toBeTruthy();
  });
});

describe('o que o diário NÃO mostra', () => {
  it('nada de contagem, porcentagem ou barra de progresso', () => {
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    const texto = document.body.textContent ?? '';
    // "3 de 24" / "3 of 24" — a forma de contagem. A barra da DATA (08/09) é
    // legítima e por isso não entra no padrão.
    expect(texto).not.toMatch(/\d+\s+(de|of)\s+\d+/);
    expect(texto).not.toContain('%');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('nada de raridade', () => {
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    const texto = (document.body.textContent ?? '').toLowerCase();
    for (const r of ['comum', 'raro', 'lendário', 'common', 'rare', 'legendary']) {
      expect(texto.includes(r), `mostrou a raridade "${r}"`).toBe(false);
    }
  });

  it('não mostra o que ainda não foi encontrado', () => {
    // Um diário com lacunas visíveis vira lista de pendências.
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(B.titlePt)).toBeNull();
  });
});

describe('o vazio', () => {
  it('é uma promessa, não uma falta', () => {
    renderWithCss(<AdventureDiary entries={[]} language="pt-BR" />);
    expect(screen.getByText(/Ainda não há nada aqui/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('0');
  });
});

describe('idioma', () => {
  it('fala os dois', () => {
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getByText('Diário de aventuras')).toBeTruthy();
    expect(screen.getByText(A.textPt)).toBeTruthy();
    cleanup();
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="en-US" />);
    expect(screen.getByText('Adventure diary')).toBeTruthy();
    expect(screen.getByText(A.textEn)).toBeTruthy();
  });
});
