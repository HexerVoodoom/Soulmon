// @vitest-environment jsdom
/**
 * O CAMINHO VIVO DO JOGADOR ATÉ O SOM — Configurações (canvas Conta §29).
 *
 * Achado do doc-mantenedor em 21/09/2026: o `SettingsModal` ("Ajustes
 * rápidos") ficou sem gatilho vivo, e com ele o mudo global e a trilha eram
 * inalcançáveis pela UI — a fiação existia, ninguém chegava nela. ⚰️ 21/09/2026
 * (decisão #37): o modal foi APAGADO; a SettingsPage é o único caminho. Este teste
 * prova que a `SettingsPage` (a tela que o jogador abre de verdade) expõe as
 * duas chaves, em PT e EN, e que cada toque chega ao dono certo: o mudo no
 * `onToggleSound` do App, a trilha em `ligarMusica`/`desligarMusica` (§129: UMA
 * preferência de música; o toque É o gesto).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';
import { esquecerTrilha, trilhaPreferida } from '../utils/trilha';
import { temaPreferido } from '../utils/tema';
import { musicaLigada } from '../utils/audioBus';
import { escolherFaixa } from '../utils/musica';

/** `matchMedia` não existe no jsdom (InstallPrompt/ThemeProvider chamam no 1º efeito). */
function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}


/** G2 (01/10/2026): os grupos das Configurações nascem FECHADOS; os testes
 *  que leem o conteúdo abrem todos antes (o fechado continua montado, mas
 *  `hidden` some da árvore de acessibilidade). */
function abrirGrupos() {
  document.querySelectorAll<HTMLButtonElement>('[data-group-toggle][aria-expanded="false"]').forEach(b => fireEvent.click(b));
}

function montar(language: 'pt-BR' | 'en-US', onToggleSound = () => {}, soundMuted = false) {
  const r = renderWithCss(
    <ThemeProvider>
      <SettingsPage
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        useAI={false}
        onToggleAI={() => {}}
        language={language}
        onChangeLanguage={() => {}}
        onOpenGuide={() => {}}
        onOpenGlossary={() => {}}
        notificationsEnabled={false}
        onToggleNotifications={() => {}}
        onRestoreFromCloud={async () => true}
        onLoginWithEmail={async () => 'loaded' as const}
      />
    </ThemeProvider>,
  );
  abrirGrupos();
  return r;
}

/** O nome acessível do `SwitchRow` é rótulo + hint; acho a linha pelo texto do rótulo. */
const switchDe = (rotulo: RegExp) =>
  screen.getAllByRole('switch', { hidden: true }).find(e => rotulo.test(e.textContent || '')) as HTMLElement;

describe('Configurações → Som: o jogador alcança o mudo e a música', () => {
  beforeEach(() => {
    installMatchMedia();
    localStorage.clear();
    esquecerTrilha();
  });

  it.each([
    ['pt-BR', /^Sons/, /^Música/],
    ['en-US', /^Sound effects/, /^Music/],
  ] as const)('%s: o mudo e UM interruptor de música, com rótulo no idioma (sem "Música-tema"/"Música de combate")', (language, sons, musica) => {
    montar(language);
    expect(switchDe(sons)).toBeTruthy();
    expect(switchDe(musica)).toBeTruthy();
    const rotulos = screen.getAllByRole('switch', { hidden: true }).map(e => e.textContent || '');
    expect(rotulos.filter(t => /^(Música|Music)/.test(t))).toHaveLength(1);
    expect(rotulos.some(t => /Música-tema|Música de combate|Theme music|Combat music/.test(t))).toBe(false);
  });

  it('§129: a música nasce LIGADA; um toque desliga tema + combate + Pesadelo, outro liga tudo', () => {
    montar('pt-BR');
    const sw = switchDe(/^Música/);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(musicaLigada()).toBe(true);
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(musicaLigada()).toBe(false);
    expect(temaPreferido()).toBe(false);
    expect(trilhaPreferida()).toBe(false);
    for (const f of ['casa', 'masmorra', 'pesadelo'] as const) expect(escolherFaixa(f, musicaLigada())).toBeNull();
    fireEvent.click(sw);
    expect(musicaLigada()).toBe(true);
    expect(temaPreferido()).toBe(true);
    expect(trilhaPreferida()).toBe(true);
    expect(escolherFaixa('casa', musicaLigada())).toBe('tema');
    expect(escolherFaixa('masmorra', musicaLigada())).toBe('combate');
    expect(escolherFaixa('pesadelo', musicaLigada())).toBe('pesadelo');
  });

  it('tocar em "Sons" chama o dono do mudo (o App), e o estado refletido é `!soundMuted`', () => {
    const onToggleSound = vi.fn();
    montar('pt-BR', onToggleSound, true);
    const sw = switchDe(/^Sons/);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(onToggleSound).toHaveBeenCalledTimes(1);
  });

  it('"Sons" (mudo) segue independente da música: tocar nele não mexe na preferência', () => {
    const onToggleSound = vi.fn();
    montar('pt-BR', onToggleSound);
    fireEvent.click(switchDe(/^Sons/));
    expect(onToggleSound).toHaveBeenCalledTimes(1);
    expect(musicaLigada()).toBe(true);
  });

  it('sem `onToggleSound` o grupo não aparece (nada de switch morto)', () => {
    renderWithCss(
      <ThemeProvider>
        <SettingsPage
          useAI={false}
          onToggleAI={() => {}}
          language="pt-BR"
          onChangeLanguage={() => {}}
          onOpenGuide={() => {}}
          onOpenGlossary={() => {}}
          notificationsEnabled={false}
          onToggleNotifications={() => {}}
          onRestoreFromCloud={async () => true}
          onLoginWithEmail={async () => 'loaded' as const}
        />
      </ThemeProvider>,
    );
    abrirGrupos();
    expect(screen.getAllByRole('switch').find(e => /^Sons/.test(e.textContent || ''))).toBeUndefined();
  });
});
