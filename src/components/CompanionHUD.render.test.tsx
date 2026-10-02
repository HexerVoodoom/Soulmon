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
import { PET_VOICE_LINES } from '../utils/petVoice';

/** Casa qualquer uma das frases do kind — o texto vem de `PET_VOICE_LINES`,
 *  nunca de literal copiado aqui (22/09/2026, QA R2 `07` §2.9). */
const regexDasFalas = (linhas: string[]) =>
  new RegExp(linhas.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));

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
    // 22/09/2026: energia cheia → kind `energized`, frases do dono da voz.
    const bubble = screen.getByText(regexDasFalas(PET_VOICE_LINES.energized.pt));
    expect(bubble).toBeTruthy();
  });

  it('a fala local sai em EN para quem escolheu EN (nada de PT vazando)', () => {
    renderWithCss(
      <CompanionHUD {...base} language="en-US" useAI energyPoints={4} maxEnergyPoints={4} />,
    );
    fireEvent.click(screen.getByAltText('rookie'));
    expect(screen.getByText(regexDasFalas(PET_VOICE_LINES.energized.en))).toBeTruthy();
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
    // posicionamento crítico é INLINE de propósito (footgun 1: utilitário que
    // não está no index.css pré-compilado não aplica nada). B3 (02/10/2026):
    // CENTRALIZADO no ALTO da área do pet (`left: 50%` + `top`), com o
    // acabamento `EvolveButton` (`.sm2-evolve-btn`), alvo ≥ 44 e rótulo vivo.
    expect(btn.style.left).toBe('50%');
    expect(btn.style.top).not.toBe('');
    expect(btn.style.bottom).toBe('');
    expect(btn.className).toContain('sm2-evolve-btn');
    expect(btn.querySelector('.sm2-evolve-label')?.textContent).toBe('Evoluir');
    expect(parseFloat(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
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

  it('o sprite do pet é arte NOSSA (src/assets/soulmon) — o berço saiu (H8)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const srcs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => /nest-(base|cradle-wide)/.test(s))).toBe(false);
    // nenhuma arte de terceiro embarcada (docs/Attributions.md)
    expect(srcs.some(s => /_dmc\.png/.test(s))).toBe(false);
  });

  /* H8 (02/10/2026): o berço/ninho saiu da Home. O pet pousa direto no cenário,
     e nenhum `<img data-nest>` pode voltar a ser desenhado. */
  it('a Home não desenha o berço (ninho removido)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-nest]')).toBeNull();
    const pet = container.querySelector('img[alt]:not([alt=""])')?.parentElement as HTMLElement;
    expect(pet.style.transform).toContain('translateX(-50%)');
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
    // 22/09/2026: sem energia nos props a escada cai em `starving`, e o texto
    // vem do DONO da voz (`PET_VOICE_LINES`), não de literal do componente.
    const balao = screen.getByText(regexDasFalas(PET_VOICE_LINES.starving.pt), { selector: 'p' });
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
