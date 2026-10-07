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
 * 5. **O avatar da Home substituiu o sanduíche** (Tarefa C): o que morava no menu foi para as Configurações.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MapPage } from './MapPage';
import { CornerLink } from './CornerLink';
import { CORNER_RING_TOP, CORNER_RING_SIDE } from './cornerAnchor';
import { AreaTopBar } from './AreaTopBar';
import { ProfileAvatarButton } from '../perfil/ProfileAvatarButton';
import { MENU_SHOWS_RITUAL_TOOLS } from '../SettingsPage';
import { AREAS } from '../../navigation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mapProps = { bits: 260, emblems: 12, credits: 3 };

describe('MapPage', () => {
  it('teto: exatamente as 6 áreas, na ordem do dono', () => {
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={() => {}} {...mapProps} />);
    const ids = Array.from(container.querySelectorAll('[data-map-area]')).map(b => b.getAttribute('data-map-area'));
    expect(ids).toEqual(['mercado', 'jogos', 'arena', 'exploracao', 'laboratorio', 'hall']);
  });

  it('par PT/EN: o rótulo visível É o nome acessível, e os idiomas diferem', () => {
    const nomes = (lang: 'en-US' | 'pt-BR') => {
      const r = renderWithCss(<MapPage language={lang} onOpenArea={() => {}} {...mapProps} />);
      const out = Array.from(r.container.querySelectorAll('[data-map-area]'))
        .map(b => (b.querySelector('[data-map-label]')?.textContent ?? '').trim());
      const ariaOut = Array.from(r.container.querySelectorAll('[data-map-area]'))
        .map(b => b.getAttribute('aria-label'));
      const h1 = r.container.querySelector('h1')?.textContent;
      r.unmount();
      return { out, ariaOut, h1 };
    };
    const en = nomes('en-US');
    const pt = nomes('pt-BR');
    expect(en.h1).toBe('Map');
    expect(pt.h1).toBe('Mapa');
    expect(en.out).toEqual(['Market', 'Games', 'Arena', 'Exploration', 'Laboratory', 'Hall']);
    expect(pt.out).toEqual(['Mercado', 'Jogos', 'Arena', 'Exploração', 'Laboratório', 'Hall']);
    // rótulo visível == nome acessível (aria-label do botão)
    expect(en.ariaOut).toEqual(en.out);
    expect(pt.ariaOut).toEqual(pt.out);
  });

  it('tocar num cartão abre a área dele', () => {
    const onOpen = vi.fn();
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={onOpen} {...mapProps} />);
    fireEvent.click(container.querySelector('[data-map-area="arena"]')!);
    expect(onOpen).toHaveBeenCalledWith('arena');
  });

  it('as 6 áreas navegam para a rota certa (reusa AREAS de navigation.ts)', () => {
    const onOpen = vi.fn();
    const { container } = renderWithCss(<MapPage language="pt-BR" onOpenArea={onOpen} {...mapProps} />);
    for (const id of AREAS) {
      fireEvent.click(container.querySelector(`[data-map-area="${id}"]`)!);
    }
    expect(onOpen.mock.calls.map(c => c[0])).toEqual([...AREAS]);
  });

  it('menu discreto de moedas: as 3, com o saldo passado por prop', () => {
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={() => {}} {...mapProps} />);
    const menu = container.querySelector('[data-map-currencies]')!;
    expect(menu.textContent).toContain('260');
    expect(menu.textContent).toContain('Bits');
    expect(menu.textContent).toContain('12');
    expect(menu.textContent).toContain('Honor');
    expect(menu.textContent).toContain('3');
    expect(menu.textContent).toContain('Credits');
  });

  it('fundo isométrico real (imagem de cena, não placeholder de ícone)', () => {
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={() => {}} {...mapProps} />);
    const bg = container.querySelector('[data-map-page] > img')!;
    expect(bg.getAttribute('aria-hidden')).toBe('true');
    // cada área carrega arte própria (não é mais só um glifo do Material)
    const arts = Array.from(container.querySelectorAll('[data-map-area] img'));
    expect(arts.length).toBe(6);
  });
});

describe('CornerLink', () => {
  it('um botão com nome acessível, ícone de arte de 32 (papel nav) e SEM caixa', () => {
    const { container } = renderWithCss(
      <CornerLink icon="mapa" side="right" label="Map" onClick={() => {}} />,
    );
    const btn = container.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Map');
    expect(btn.style.background).toBe('transparent');
    expect(btn.style.border === 'none' || btn.style.border === '' || btn.style.borderStyle === 'none').toBe(true);
    // alvo ≥ 44 é do BOTÃO
    expect(parseFloat(btn.style.width)).toBeGreaterThanOrEqual(44);
    expect(parseFloat(btn.style.height)).toBeGreaterThanOrEqual(44);
    // o ícone é a ARTE do squad de arte (pixel art, alfa real), 32 = papel nav,
    // decorativo (o nome é do botão) — e pelado: nenhuma caixa em volta dele
    const img = btn.querySelector('img[data-pixel-icon="mapa"]') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(btn.querySelector('svg')).toBeNull();
  });

  it('brilho claro por PADRÃO (H9: a casinha perdeu o brilho), desligável, sem virar caixa', () => {
    const padrao = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} />);
    expect(padrao.container.querySelector('button')!.style.filter).toContain('drop-shadow');
    padrao.unmount();
    const semGlow = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} glow={false} />);
    expect(semGlow.container.querySelector('button')!.style.filter).toBeFalsy();
    semGlow.unmount();
    const comGlow = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} glow />);
    const btn = comGlow.container.querySelector('button')!;
    expect(btn.style.filter).toContain('drop-shadow');
    expect(btn.style.background).toBe('transparent');
    expect(btn.style.border === 'none' || btn.style.border === '' || btn.style.borderStyle === 'none').toBe(true);
  });

  it('B2: os dois links moram no TOPO (nunca embaixo), respeitando a área segura', () => {
    const r = renderWithCss(<CornerLink icon="mapa" side="right" label="Map" onClick={() => {}} />);
    const btn = r.container.querySelector('button')!;
    expect(btn.style.top).toContain('safe-area-inset-top');
    expect(btn.style.bottom).toBe('');
  });

  it('Home no canto ESQUERDO, Mapa no DIREITO', () => {
    const l = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} />);
    expect(l.container.querySelector('button')!.style.left).not.toBe('');
    l.unmount();
    const r = renderWithCss(<CornerLink icon="mapa" side="right" label="Map" onClick={() => {}} />);
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

  it('H9: o voltar fica FIXO na âncora do canto — a mesma do anel da casinha, em qualquer tela', () => {
    const casinha = renderWithCss(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} ring />);
    const caixa = casinha.container.querySelector('button')!;
    const anel = casinha.container.querySelector('[data-corner-ring]') as HTMLElement;
    expect(caixa.style.top).toContain('safe-area-inset-top');
    // o jsdom normaliza `calc()`: compara pelo MESMO caminho de normalização
    const norm = (prop: 'top' | 'left', v: string) => { const el = document.createElement('div'); el.style[prop] = v; return el.style[prop]; };
    expect(anel.style.width).toBe('44px');
    for (const overScene of [true, false]) {
      const r = renderWithCss(<AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} icon={overScene ? 'map' : 'arrow_back'} overScene={overScene} />);
      const back = r.container.querySelector('[data-area-back]') as HTMLButtonElement;
      expect(back.style.position).toBe('fixed');
      expect(back.style.top).toBe(norm('top', CORNER_RING_TOP));
      expect(back.style.left).toBe(norm('left', CORNER_RING_SIDE));
      expect(back.style.width).toBe('44px');
      expect(back.style.height).toBe('44px');
      r.unmount();
    }
    // o anel da casinha = caixa de 56 + 6px de folga → mesmas coordenadas do voltar
    expect(CORNER_RING_TOP).toContain('+ 12px');
    expect(CORNER_RING_SIDE).toContain('+ 6px');
  });

  it('glifo do voltar: mapa nas ÁREAS, seta por padrão (Pet/Biblioteca/menu da Home)', () => {
    const glyph = (props: Record<string, unknown>) => {
      const r = renderWithCss(<AreaTopBar title="T" backLabel="Voltar ao mapa" onBack={() => {}} {...props} />);
      const svg = r.container.querySelector('[data-area-back]')!.innerHTML;
      r.unmount();
      return svg;
    };
    const seta = glyph({});
    const mapa = glyph({ icon: 'map' });
    expect(seta).not.toBe(mapa);
    // o ícone ILUSTRADO `mapa` (o mesmo do CornerLink da Home, 32px), e a seta não o contém
    expect(mapa).toContain('data-pixel-icon="mapa"');
    expect(mapa).toContain('width="32"');
    expect(mapa).not.toContain('<svg');
    expect(seta).not.toContain('data-pixel-icon');
    expect(seta).toContain('<svg');
    // fiação: só a área troca o glifo e fica sobre a cena
    const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
    expect(app).toContain("icon={area ? 'map' : 'arrow_back'}");
    expect(app).toContain('overScene={!!area}');
  });

  it('sobre a cena: tinta clara, scrim, alvo 44px e aria-label do destino', () => {
    const { container } = renderWithCss(
      <AreaTopBar title="Mercado" backLabel="Voltar ao mapa" onBack={() => {}} icon="map" overScene />,
    );
    const back = container.querySelector('[data-area-back]') as HTMLButtonElement;
    expect(back.getAttribute('aria-label')).toBe('Voltar ao mapa');
    expect(back.style.width).toBe('44px');
    expect(back.style.color).toBe('rgb(233, 245, 242)');
    expect(container.querySelector('[data-area-topbar-scrim]')).not.toBeNull();
    expect((container.querySelector('h1') as HTMLElement).style.color).toBe('rgb(233, 245, 242)');
    const sem = renderWithCss(<AreaTopBar title="Pet" backLabel="Voltar ao início" onBack={() => {}} />);
    expect(sem.container.querySelector('[data-area-topbar-scrim]')).toBeNull();
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

describe('Botão de avatar da Home (Tarefa C, substitui o sanduíche)', () => {
  it('é UM botão de 44 com nome acessível PT/EN, sem barras de sanduíche, e abre a ação', () => {
    const onClick = vi.fn();
    const en = renderWithCss(<ProfileAvatarButton language="en-US" seed="s1" onClick={onClick} />);
    const btn = en.container.querySelector('[data-profile-avatar-btn]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Settings and profile');
    expect(btn.style.width).toBe('44px');
    expect(en.container.querySelector('[data-menu-bars]')).toBeNull();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
    en.unmount();
    const pt = renderWithCss(<ProfileAvatarButton language="pt-BR" seed="s1" onClick={() => {}} />);
    expect(pt.container.querySelector('[data-profile-avatar-btn]')!.getAttribute('aria-label')).toBe('Configurações e perfil');
  });

  it('Oráculo e "Refazer o ritual" seguem ocultos (G1) — a flag mora nas Configurações', () => {
    expect(MENU_SHOWS_RITUAL_TOOLS).toBe(false);
  });
});
