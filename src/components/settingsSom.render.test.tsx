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
 * `onToggleSound` do App, a trilha em `ligarTrilha`/`desligarTrilha` (S2: o
 * toque É o gesto).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';
import { esquecerTrilha, trilhaPreferida } from '../utils/trilha';
import { temaPreferido } from '../utils/tema';

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

describe('Configurações → Som: o jogador alcança o mudo e a trilha', () => {
  beforeEach(() => {
    installMatchMedia();
    localStorage.clear();
    esquecerTrilha();
  });

  it.each([
    ['pt-BR', /^Sons/, /^Música de masmorra e arena/, /^Música-tema/],
    ['en-US', /^Sound effects/, /^Dungeon & arena music/, /^Theme music/],
  ] as const)('%s: as três chaves existem, com rótulo no idioma', (language, sons, trilha, tema) => {
    montar(language);
    expect(switchDe(sons)).toBeTruthy();
    expect(switchDe(trilha)).toBeTruthy();
    expect(switchDe(tema)).toBeTruthy();
  });

  it('S17: a música-tema nasce LIGADA (decisão do dono, 07/10/2026), persiste e desliga/religa por toque', () => {
    montar('en-US');
    const sw = switchDe(/^Theme music/);
    expect(temaPreferido()).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(temaPreferido()).toBe(false);
    fireEvent.click(sw);
    expect(temaPreferido()).toBe(true);
  });

  it('S17 emendada (11/10/2026): as duas preferências CONVIVEM — tema na Home, música de masmorra e arena nas lutas', () => {
    montar('en-US');
    fireEvent.click(switchDe(/^Dungeon & arena music/));
    expect(trilhaPreferida()).toBe(true);
    expect(temaPreferido()).toBe(true); // antes: ligar a trilha desligava o tema; agora o diretor alterna por superfície
    fireEvent.click(switchDe(/^Theme music/));
    expect(temaPreferido()).toBe(false);
    expect(trilhaPreferida()).toBe(true);
  });

  it('tocar em "Sons" chama o dono do mudo (o App), e o estado refletido é `!soundMuted`', () => {
    const onToggleSound = vi.fn();
    montar('pt-BR', onToggleSound, true);
    const sw = switchDe(/^Sons/);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(onToggleSound).toHaveBeenCalledTimes(1);
  });

  it('tocar em "Música de masmorra e arena" liga a chave PRÓPRIA (S2: nasce desligada; o toque é o gesto) e desliga de novo', () => {
    montar('pt-BR');
    const sw = switchDe(/^Música de masmorra e arena/);
    expect(trilhaPreferida()).toBe(false);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(trilhaPreferida()).toBe(true);
    fireEvent.click(sw);
    expect(trilhaPreferida()).toBe(false);
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
