// @vitest-environment jsdom
/**
 * A navegação Home ↔ Mapa → áreas (minimal-ui F1). Substitui o
 * `BottomNav.render.test.tsx`: a barra saiu, e cada guard dela ganhou o
 * equivalente na peça nova —
 *
 * 1. **Teto de destinos** (era "4 destinos + menu"): o Mapa tem EXATAMENTE as
 *    6 áreas decididas pelo dono, e cada tela de topo tem UM link de canto.
 *    A contagem é o que impede a navegação de crescer um item por vez.
 * 2. **Rótulo visível == rótulo acessível**, com par PT/EN completo e real.
 * 3. **Ícone nunca dentro de box**: o link de canto e o menu da Home são
 *    glifo pelado; o ÚNICO anel é o do voltar das áreas (exceção D1).
 * 4. **Um `<h1>` por tela**: o topo da área só vira heading quando a página
 *    de baixo não tem o seu.
 * 5. **O menu da Home tem o que morava no sanduíche** (D6), nos dois idiomas.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MapPage } from './MapPage';
import { CornerLink } from './CornerLink';
import { AreaTopBar } from './AreaTopBar';
import { HomeMenuSheet } from './HomeMenuSheet';

describe('MapPage', () => {
  it('teto: exatamente as 6 áreas, na ordem do dono', () => {
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={() => {}} />);
    const ids = Array.from(container.querySelectorAll('[data-map-area]')).map(b => b.getAttribute('data-map-area'));
    expect(ids).toEqual(['mercado', 'jogos', 'arena', 'exploracao', 'laboratorio', 'hall']);
  });

  it('par PT/EN: o rótulo visível É o nome acessível, e os idiomas diferem', () => {
    const nomes = (lang: 'en-US' | 'pt-BR') => {
      const r = renderWithCss(<MapPage language={lang} onOpenArea={() => {}} />);
      const out = Array.from(r.container.querySelectorAll('[data-map-area]'))
        .map(b => (b.querySelector('[data-map-label]')?.textContent ?? '').trim());
      const h1 = r.container.querySelector('h1')?.textContent;
      r.unmount();
      return { out, h1 };
    };
    const en = nomes('en-US');
    const pt = nomes('pt-BR');
    expect(en.h1).toBe('Map');
    expect(pt.h1).toBe('Mapa');
    expect(en.out).toEqual(['Market', 'Games', 'Arena', 'Exploration', 'Laboratory', 'Hall']);
    expect(pt.out).toEqual(['Mercado', 'Jogos', 'Arena', 'Exploração', 'Laboratório', 'Hall']);
  });

  it('tocar num cartão abre a área dele', () => {
    const onOpen = vi.fn();
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={onOpen} />);
    fireEvent.click(container.querySelector('[data-map-area="arena"]')!);
    expect(onOpen).toHaveBeenCalledWith('arena');
  });
});

describe('CornerLink', () => {
  it('um botão com nome acessível, glifo de 32 (papel nav) e SEM caixa', () => {
    const { container } = renderWithCss(
      <CornerLink icon="map" side="right" label="Map" onClick={() => {}} />,
    );
    const btn = container.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Map');
    expect(btn.style.background).toBe('transparent');
    expect(btn.style.border === 'none' || btn.style.border === '' || btn.style.borderStyle === 'none').toBe(true);
    // alvo ≥ 44 é do BOTÃO
    expect(parseFloat(btn.style.width)).toBeGreaterThanOrEqual(44);
    expect(parseFloat(btn.style.height)).toBeGreaterThanOrEqual(44);
    const svg = btn.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('32');
  });

  it('Home no canto ESQUERDO, Mapa no DIREITO', () => {
    const l = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} />);
    expect(l.container.querySelector('button')!.style.left).not.toBe('');
    l.unmount();
    const r = renderWithCss(<CornerLink icon="map" side="right" label="Map" onClick={() => {}} />);
    expect(r.container.querySelector('button')!.style.right).not.toBe('');
  });
});

describe('AreaTopBar', () => {
  it('voltar com nome que diz PARA ONDE, e o anel é traço (exceção D1), sem fundo', () => {
    const onBack = vi.fn();
    const { container } = renderWithCss(
      <AreaTopBar title="Arena" backLabel="Back to map" onBack={onBack} />,
    );
    const back = container.querySelector('[data-area-back]') as HTMLButtonElement;
    expect(back.getAttribute('aria-label')).toBe('Back to map');
    expect(back.style.borderRadius).toBe('50%');
    expect(back.style.background).toBe('transparent');
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('um <h1> por tela: vira heading só quando a página não tem o seu', () => {
    const a = renderWithCss(<AreaTopBar title="Market" backLabel="Back" onBack={() => {}} />);
    expect(a.container.querySelector('h1')?.textContent).toBe('Market');
    a.unmount();
    const b = renderWithCss(<AreaTopBar title="Games" backLabel="Back" onBack={() => {}} ownsHeading={false} />);
    expect(b.container.querySelector('h1')).toBeNull();
    const p = b.container.querySelector('p')!;
    expect(p.textContent).toBe('Games');
    expect(p.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('HomeMenuSheet (D6)', () => {
  const rows = (lang: 'en-US' | 'pt-BR') => {
    const r = renderWithCss(
      <HomeMenuSheet
        open
        onClose={() => {}}
        language={lang}
        onOpenPage={() => {}}
        onOpenGuide={() => {}}
        onOpenCredits={() => {}}
        onResetOnboarding={() => {}}
      />,
    );
    const out = Array.from(document.querySelectorAll('[data-menu-row] [data-menu-label]')).map(b => (b.textContent ?? '').trim());
    r.unmount();
    return out;
  };

  it('tudo que morava no sanduíche, nos dois idiomas', () => {
    expect(rows('en-US')).toEqual(['Settings', 'Oracle', 'Stats', 'Guide', 'Credits', 'Redo the ritual']);
    expect(rows('pt-BR')).toEqual(['Configurações', 'Oráculo', 'Estatísticas', 'Guia', 'Créditos', 'Refazer o ritual']);
  });

  it('cada linha fecha a folha e leva ao destino certo', () => {
    const onClose = vi.fn();
    const onOpenPage = vi.fn();
    const onOpenGuide = vi.fn();
    renderWithCss(
      <HomeMenuSheet open onClose={onClose} language="en-US" onOpenPage={onOpenPage} onOpenGuide={onOpenGuide} />,
    );
    const btn = (t: string) => Array.from(document.querySelectorAll('[data-menu-row]')).find(b => b.textContent?.includes(t))!;
    fireEvent.click(btn('Oracle'));
    expect(onOpenPage).toHaveBeenLastCalledWith('oracle');
    fireEvent.click(btn('Stats'));
    expect(onOpenPage).toHaveBeenLastCalledWith('stats');
    fireEvent.click(btn('Guide'));
    expect(onOpenGuide).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(3);
    // Sem os callbacks opcionais, as linhas deles não aparecem.
    expect(btn('Credits')).toBeUndefined();
  });

  it('é diálogo modal nomeado (foco preso, Escape fecha — `ModalSheet`)', () => {
    renderWithCss(<HomeMenuSheet open onClose={() => {}} language="pt-BR" onOpenPage={() => {}} onOpenGuide={() => {}} />);
    const dlg = document.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe('Menu');
  });
});
