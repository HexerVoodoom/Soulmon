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
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { AdventureDiary } from './AdventureDiary';
import { ADVENTURE_CATALOG } from '../utils/adventure';

/** Rodada 7 (I7): o diário é um modal de tela cheia — o teste abre pelo card do Laboratório. */
function abrirDiario(el: React.ReactElement) {
  const r = renderWithCss(el);
  const b = document.querySelector('[data-adventure-open]');
  if (b) fireEvent.click(b);
  return r;
}

const A = ADVENTURE_CATALOG[0];
const B = ADVENTURE_CATALOG[1];

describe('o diário mostra o que foi vivido', () => {
  it('lista os achados com título, texto e data', () => {
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getByText(A.titlePt)).toBeTruthy();
    expect(screen.getByText(A.textPt)).toBeTruthy();
    expect(screen.getByText('08/09')).toBeTruthy();
  });

  it('o mais recente vem primeiro — lê-se para reencontrar ontem', () => {
    abrirDiario(
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
    abrirDiario(<AdventureDiary entries={entries} language="pt-BR" />);
    expect(entries[0].id).toBe(A.id);
  });

  it('id órfão some da lista em vez de derrubar a tela', () => {
    abrirDiario(
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
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    const texto = document.body.textContent ?? '';
    // "3 de 24" / "3 of 24" — a forma de contagem. A barra da DATA (08/09) é
    // legítima e por isso não entra no padrão.
    expect(texto).not.toMatch(/\d+\s+(de|of)\s+\d+/);
    expect(texto).not.toContain('%');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('nada de raridade', () => {
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    const texto = (document.body.textContent ?? '').toLowerCase();
    for (const r of ['comum', 'raro', 'lendário', 'common', 'rare', 'legendary']) {
      expect(texto.includes(r), `mostrou a raridade "${r}"`).toBe(false);
    }
  });

  it('não mostra o que ainda não foi encontrado', () => {
    // Um diário com lacunas visíveis vira lista de pendências.
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(B.titlePt)).toBeNull();
  });
});

describe('o vazio', () => {
  it('é uma promessa, não uma falta', () => {
    abrirDiario(<AdventureDiary entries={[]} language="pt-BR" />);
    expect(screen.getByText(/Ainda não há nada aqui/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('0');
  });
});

describe('tela cheia (rodada 7, I7)', () => {
  it('no Laboratório é só a entrada; tocar abre o modal com a cena, o Soulmon e a historinha, e um "i" só', () => {
    renderWithCss(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="en-US" spriteUrl="/x.png" sceneId="bg-forest" />);
    expect(document.querySelector('[data-adventure-screen]')).toBeNull();
    fireEvent.click(document.querySelector('[data-adventure-open]')!);
    const tela = document.querySelector<HTMLElement>('[data-adventure-screen]')!;
    expect(tela.getAttribute('role')).toBe('dialog');
    expect(tela.style.position).toBe('fixed');
    expect(tela.querySelector('[data-adventure-pet]')).toBeTruthy();
    expect(screen.getByText(A.textEn)).toBeTruthy();
    expect(tela.querySelectorAll('[data-info-tip]')).toHaveLength(1);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(document.querySelector('[data-adventure-screen]')).toBeNull();
  });
});

describe('idioma', () => {
  it('fala os dois', () => {
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="pt-BR" />);
    expect(screen.getAllByText('Diário de aventuras').length).toBeGreaterThan(0);
    expect(screen.getByText(A.textPt)).toBeTruthy();
    cleanup();
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="en-US" />);
    expect(screen.getAllByText('Adventure diary').length).toBeGreaterThan(0);
    expect(screen.getByText(A.textEn)).toBeTruthy();
  });
});

describe('identidade (canvas Pet, D-P8)', () => {
  it('o texto em 1ª pessoa é CONTEÚDO: Rubik 14 ink, não legenda 12 muted', () => {
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="en-US" />);
    const texto = document.querySelector<HTMLElement>('[data-adventure-text]')!;
    expect(texto.textContent).toBe(A.textEn);
    expect(texto.style.fontSize).toBe('var(--sm2-text-sm)');
    expect(texto.style.color).toBe('var(--sm2-ink)');
    expect(texto.style.fontFamily).toBe('var(--sm2-font-text)');
    const data = document.querySelector<HTMLElement>('[data-adventure-date]')!;
    expect(data.textContent).toBe('Sep 8');
    expect(data.style.fontSize).toBe('var(--sm2-text-xs)');
    expect(data.classList.contains('sm2-num')).toBe(true);
  });

  it('a arte 96² a 48 num vidro 48² sem anel — nunca um <img 24> solto', () => {
    abrirDiario(<AdventureDiary entries={[{ id: A.id, day: '2026-09-08' }]} language="en-US" />);
    const li = screen.getByRole('listitem');
    const vidro = li.querySelector<HTMLElement>('[data-mini-glass]')!;
    expect(vidro.style.width).toBe('48px');
    expect(vidro.classList.contains('sm2-viewport-screen')).toBe(true);
    expect(vidro.closest('.sm2-viewport')).toBeNull();
    const img = li.querySelector('img');
    if (img) {
      expect(img.getAttribute('width')).toBe('48');
      expect(img.closest('[data-mini-glass]')).toBeTruthy();
    }
  });
});
