// @vitest-environment jsdom
/**
 * A HEROÍNA no vidro — canvas Pet (D-P2/D-P3/D-P4/D-P9, DECISÕES §22).
 *
 *  1. **Sprite 256² a 128, centrado** no vidro 192² (`left/top 32`) — a MESMA
 *     escala da Home. Antes esticava ao vidro (`inset: 0` = 192 = 0,75×).
 *  2. **Aura 96² a 2× (192 = o vidro inteiro) a opacidade 1** — nenhuma
 *     opacidade no aparelho (Home F1). Rodada 2 (R2-3, 21/09/2026): a 96²
 *     derivada substitui a 128² a 2× com corte de 32 px por lado.
 *  3. **Sigilo de classe a 48 no canto superior esquerdo (8,8)**, só quando a
 *     classe traz `sigilo`; classe sem sigilo (cache antigo) = nada no canto.
 *  4. **Forma anterior num vidro 80² sem anel, sprite a 64** (D-P9) — não mais
 *     um `<img 48>` solto no card.
 *  5. **Ícone de habilidade é Material** (`bolt` / `auto_awesome`), nunca
 *     `el-*.png` — o elemento já é dito pela aura (D-P6).
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { PetPage } from './PetPage';
import type { CreatureStage } from '../utils/oracle';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';

const rookie: CreatureStage = {
  stage: 'rookie', stageName: { pt: 'Desperto', en: 'Awakened' }, name: 'Pixel',
  description: { pt: 'Uma faísca.', en: 'A spark.' }, imagePrompt: '', imagePromptFallback: '',
};
const champion: CreatureStage = {
  stage: 'champion', branch: 'poder', stageName: { pt: 'Ascendente', en: 'Ascendant' }, name: 'Pixelion',
  description: { pt: 'Uma chama.', en: 'A flame.' }, imagePrompt: '', imagePromptFallback: '',
};

const classes = (sigilo?: string): Record<FichaStage, ClassTitle> => {
  const c: ClassTitle = { nome: { pt: 'Andarilho', en: 'Wanderer' }, origem: 'generico', ...(sigilo ? { sigilo } : {}) };
  return { rookie: c, champion: c, ultimate: c, mega: c, ultra: c };
};

const skill = (tipo: 'basica' | 'especial') => ({
  nome: { pt: 'Golpe', en: 'Strike' }, descricao: { pt: 'Um golpe.', en: 'A strike.' },
  tipo, custo: 'baixo' as const,
});
const skills = (): Record<FichaStage, StageSkills> => {
  const s = { basica: skill('basica'), especial: skill('especial') } as unknown as StageSkills;
  return { rookie: s, champion: s, ultimate: s, mega: s, ultra: s };
};

function montar(extra: Partial<Parameters<typeof PetPage>[0]> = {}) {
  return renderWithCss(
    <PetPage
      stages={[rookie, champion]}
      unlockedEvolutions={['rookie', 'champion-power']}
      currentStageId="champion-power"
      dominantElement="fogo"
      petName="Pixel"
      language="en-US"
      {...extra}
    />,
  );
}

describe('a heroína no vidro 192²', () => {
  it('sprite 256² a 128 CSS centrado (32,32) — não esticado ao vidro', () => {
    montar();
    const hero = document.querySelector<HTMLElement>('[data-hero]')!;
    expect(hero.style.width).toBe('128px');
    expect(hero.style.height).toBe('128px');
    expect(hero.style.left).toBe('32px');
    expect(hero.style.top).toBe('32px');
    expect(hero.style.inset).toBe('');
  });

  it('aura 96² a 2× (192 CSS = o vidro, a 0) e SEM opacidade', () => {
    montar();
    const aura = document.querySelector<HTMLElement>('[data-aura]')!;
    expect(aura).toBeTruthy();
    expect(aura.getAttribute('src')).toMatch(/-aura-96\.png$/);
    expect(aura.style.width).toBe('192px');
    expect(aura.style.left).toBe('0px');
    expect(aura.style.opacity).toBe('');
  });

  it('sigilo de classe a 48 no canto (8,8), dentro do vidro, só quando a classe traz sigilo', () => {
    montar({ savedClassTitles: classes('marcial') });
    const sigil = document.querySelector<HTMLElement>('[data-sigil]')!;
    expect(sigil).toBeTruthy();
    expect(sigil.getAttribute('data-sigil')).toBe('marcial');
    expect(sigil.style.width).toBe('48px');
    expect(sigil.style.left).toBe('8px');
    expect(sigil.style.top).toBe('8px');
    expect(sigil.closest('.sm2-viewport-screen')).toBeTruthy();
  });

  it('classe sem sigilo (cache antigo) ou sem arte = nada no canto, e a página fica de pé', () => {
    montar({ savedClassTitles: classes() });
    expect(document.querySelector('[data-sigil]')).toBeNull();
    document.body.innerHTML = '';
    montar({ savedClassTitles: classes('sigilo-que-nao-existe') });
    expect(document.querySelector('[data-sigil]')).toBeNull();
    expect(document.querySelector('[data-hero]')).toBeTruthy();
  });

  it('Arquivo: sem a seção "Quem seu Soulmon já foi" (formas anteriores saíram, Tarefa A)', () => {
    const { container } = montar();
    expect(container.querySelector('[data-form-sprite]')).toBeNull();
    expect(container.textContent ?? '').not.toMatch(/Quem seu Soulmon já foi|Who they used to be/);
    expect(document.querySelector('[data-hero]')).toBeTruthy();
  });

  it('habilidades: básica com o raio de status em pixel (04/10/2026), especial com `auto_awesome`, sem el-*.png', () => {
    const { container } = montar({ savedSkills: skills() });
    const texto = container.textContent ?? '';
    expect(container.querySelector('img[src*="status-raio"]')).not.toBeNull();
    expect(texto).toContain('auto_awesome');
    const srcs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => /el-[a-z]+\.png/.test(s))).toBe(false);
  });
});
