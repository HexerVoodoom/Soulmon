// @vitest-environment jsdom
/**
 * Teste de render do `CompanionHUD` — a tela que o usuário abre.
 *
 * Duas coisas nunca tinham sido verificadas por nada: (a) que o botão
 * "Evoluir" só existe quando pode evoluir (o relatório da UI registrou este
 * item como "sem verificação visual" em DUAS rodadas seguidas, porque depende
 * de `canEvolve`, que ninguém conseguia semear na tela); (b) que a rede caída
 * não emudece o pet — a fala local vem primeiro e a IA só melhora.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { BASE_SLOTS } from '../utils/petStage';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: 'Oi!',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  useAI: false,
  language: 'pt-BR' as const,
};

beforeEach(() => {
  // O idle chama /api/chat a cada 3min. Nenhum teste de render deve tocar a
  // rede; se tocar, quero um erro alto e não uma requisição real pendurada.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('CompanionHUD', () => {
  it('monta sem tocar a rede (o idle tem guard; nada dispara no mount)', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(screen.getByAltText('rookie')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('REDE CAÍDA NÃO EMUDECE O PET: tocar nele fala local, com a IA ligada e o fetch falhando', () => {
    // O relatório da rodada 1 AFIRMOU isso lendo o código ("a fala local vem
    // primeiro e a IA só melhora"). Aqui é medido: `useAI` ligado, `fetch`
    // rejeitando, e mesmo assim o balão aparece com texto em PT.
    renderWithCss(<CompanionHUD {...base} useAI energyPoints={4} maxEnergyPoints={4} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const bubble = screen.getByText(
      /Cheio de energia!|Pronto para tudo!|Totalmente carregado!/,
    );
    expect(bubble).toBeTruthy();
  });

  it('a fala local sai em EN para quem escolheu EN (nada de PT vazando)', () => {
    renderWithCss(
      <CompanionHUD {...base} language="en-US" useAI energyPoints={4} maxEnergyPoints={4} />,
    );
    fireEvent.click(screen.getByAltText('rookie'));
    expect(screen.getByText(/Full power!|Ready for anything!|Fully charged!/)).toBeTruthy();
  });

  it('o botão Evoluir NÃO existe quando `canEvolve` é falso', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(screen.queryByRole('button', { name: 'Evoluir' })).toBeNull();
  });

  it('o botão Evoluir aparece quando `canEvolve` e dispara o pedido', () => {
    const onEvolveRequest = vi.fn();
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={onEvolveRequest} />);
    const btn = screen.getByRole('button', { name: 'Evoluir' });
    fireEvent.click(btn);
    expect(onEvolveRequest).toHaveBeenCalledTimes(1);
    // posicionamento crítico é INLINE de propósito (`left-1/2` não existe no
    // index.css pré-compilado — footgun 1). Se alguém trocar por classe, o
    // botão cai fora do centro do palco e este caso avisa.
    expect(btn.style.left).toBe('50%');
    expect(btn.style.transform).toBe('translateX(-50%)');
  });

  it('o botão Evoluir some quando o pet está dormindo', () => {
    renderWithCss(<CompanionHUD {...base} canEvolve isSleeping onEvolveRequest={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Evoluir' })).toBeNull();
  });

  it('par PT/EN do botão de evolução', () => {
    const pt = renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />);
    expect(screen.getByRole('button', { name: 'Evoluir' })).toBeTruthy();
    pt.unmount();
    renderWithCss(<CompanionHUD {...base} language="en-US" canEvolve onEvolveRequest={() => {}} />);
    expect(screen.getByRole('button', { name: 'Evolve' })).toBeTruthy();
  });

  it('o berço e o sprite do pet são arte NOSSA (src/assets/soulmon)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const srcs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => /nest-(base|cradle-wide)/.test(s))).toBe(true);
    // nenhuma arte de terceiro embarcada (docs/Attributions.md)
    expect(srcs.some(s => /_dmc\.png/.test(s))).toBe(false);
  });

  /* O berço só normaliza um sprite imprevisível se o pet estiver DENTRO dele.
     O defeito era mudo: o berço tinha `translateX(-50%)` e o pet não, então o
     pet nascia 62px à direita — nada quebrava, só ficava errado. Estes dois
     casos travam a composição (mesmo eixo, mesma origem vertical declarada). */
  it('pet e berço compartilham o eixo horizontal (o pet está NO berço)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const nest = container.querySelector('[data-nest]') as HTMLElement;
    const pet = container.querySelector('img[alt]:not([alt=""])')?.parentElement as HTMLElement;
    expect(nest.style.left).toBe(pet.style.left);
    expect(nest.style.transform).toContain('translateX(-50%)');
    expect(pet.style.transform).toContain('translateX(-50%)');
  });

  it('a geometria do berço vem do palco, não de número mágico no JSX', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const nest = container.querySelector('[data-nest]') as HTMLImageElement;
    expect(nest.style.width).toBe(`${BASE_SLOTS.nest.w}px`);
    expect(nest.style.height).toBe(`${BASE_SLOTS.nest.h}px`);
    expect(nest.style.marginTop).toBe(`${BASE_SLOTS.nest.yPx}px`);
  });

  /* ── O VISOR e a escala inteira ───────────────────────────────────────── */

  it('o sprite vive DENTRO do visor, e o visor é o elemento de marca', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const visor = container.querySelector('.sm2-viewport') as HTMLElement;
    expect(visor).toBeTruthy();
    // nome próprio, PT/EN — e é `role="img"`, então os CONTROLES (evoluir,
    // balão) têm que estar FORA dele, senão o leitor de tela os ignora.
    expect(visor.getAttribute('role')).toBe('img');
    expect(visor.getAttribute('aria-label')).toBe('Seu Soulmon');
    const tela = container.querySelector('.sm2-viewport-screen')!;
    expect(tela.querySelector('img[alt="rookie"]')).toBeTruthy();
  });

  it('o botão Evoluir e o balão de fala ficam FORA do `role="img"` do visor', () => {
    const { container } = renderWithCss(
      <CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />,
    );
    const visor = container.querySelector('.sm2-viewport')!;
    expect(visor.querySelector('button')).toBeNull();
    fireEvent.click(screen.getByAltText('rookie'));
    // `{ selector: 'p' }`: o texto do balão é o único `<p>` da árvore que casa
    // com o regex — desde 27/08/2026 o rótulo "Energia" do HUD compacto
    // (migrou para dentro do `.sm2-device`) também casa com /energia/i, mas
    // vive num `<span>`, não num `<p>`.
    const balao = screen.getByText(/Estômago vazio|Me alimenta|Com muita fome|fome|energia/i, { selector: 'p' });
    expect(visor.contains(balao)).toBe(false);
  });

  it('o sprite é renderizado em escala INTEIRA (2:1 ou 3:1), nunca fracionária', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(__dirname, '../assets/soulmon/lines');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    expect(files.length).toBeGreaterThan(10);

    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const pet = container.querySelector('img[alt="rookie"]') as HTMLImageElement;
    const render = parseFloat(pet.style.width);

    for (const f of files) {
      // largura/altura vêm do IHDR do PNG (bytes 16..24) — sem dependência.
      const b = fs.readFileSync(path.join(dir, f));
      const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      expect(w % render, `${f} (${w}×${h}) não é múltiplo de ${render}: escala fracionária`).toBe(0);
      expect(h % render, `${f} (${w}×${h}) não é múltiplo de ${render}: escala fracionária`).toBe(0);
    }
  });

  it('HP 0 continua renderizando a cena (degeneração não pode quebrar a tela)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} healthPoints={0} />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('HP fracionário (0.5, permitido pela regra) não quebra os corações', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} healthPoints={1.5} />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });
});
