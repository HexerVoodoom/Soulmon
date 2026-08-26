// @vitest-environment jsdom
/**
 * F-1, LADO DOS COMPONENTES — a URL do sprite de OUTRO JOGADOR vira `<img src>`.
 *
 * O caminho, confirmado arquivo a arquivo:
 *   `GET /api/players` (KV `DIGIAPP_SAVES`, diretório PÚBLICO — qualquer um
 *   alimenta) → `listPlayers` (`utils/community.ts:44`) → `setPlayers(r.players ?? [])`
 *   (`LibraryPage.tsx:112`, estado `LibraryEntry[]` = `DirectoryPlayer & { spriteUrl?: string }`)
 *   → `src={p.spriteUrl ?? getSpriteForStage(p.stage)}` (`LibraryPage.tsx:264` e
 *   `PlayerDetailModal.tsx:82`).
 *
 * `spriteUrl` é campo EXTRA: `DirectoryPlayer` não o declara, então o TypeScript
 * não vê nada — mas o excedente do JSON viaja junto e o `??` o prefere ao asset
 * empacotado. Um `players[]` hostil rende UM GET por render entregando IP,
 * User-Agent, idioma e hora. NÃO é XSS (`<img src>` não é sink de navegação);
 * é BEACON, e o visor não tem estado de erro por spec — a vítima não vê nada.
 *
 * Os DOIS lados são medidos aqui, e o segundo é tão importante quanto o
 * primeiro: se a guarda recusasse o asset do Vite (`/assets/…` no build,
 * `/src/assets/…` sob vitest), o jogador perderia o sprite EM SILÊNCIO.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { getSpriteForStage, DUNGEON_LINE_SPRITES } from '../utils/sprites';
import type { DirectoryPlayer } from '../utils/community';
import { isSafeSpriteSrc, isSafeSpriteUrl } from '../utils/spriteLibrary';

// O beacon escolhido e RELATIVO A ESQUEMA: `//host` herda o `https:` da pagina,
// funciona igualzinho e e exatamente o caso que o ramo novo da guarda (caminho
// de raiz) NAO pode abrir. `http://` entra logo abaixo pelo mesmo motivo.
//
// ⚠️ LIMITE HERDADO, e ele continua aberto: `https://atacante.example/x.png`
// AINDA passa, porque `isSafeSpriteUrl` permite qualquer host https (limite
// declarado por escrito em `spriteLibrary.ts`). Fechar isso e a allowlist de
// HOST, que depende de decidir o host do provedor — proximo passo, com dono.
const BEACON = '//atacante.example/beacon.png?quem=1';
const BEACON_HTTP = 'http://atacante.example/beacon.png?quem=1';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return { ...real, listPlayers: vi.fn(), addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn() };
});

import { LibraryPage } from './LibraryPage';
import { PlayerDetailModal } from './PlayerDetailModal';
import { listPlayers } from '../utils/community';

/** O que o KV devolve — com o campo extra que o tipo não declara. */
const jogadorHostil = (over: Partial<DirectoryPlayer> = {}) => ({
  id: 'p-hostil', name: 'Vitima', petName: 'Bichinho',
  stage: 'rookie', unlockedStages: ['rookie'],
  pvpEnabled: false, rankPoints: 10, daysPlaying: 3, tasksDone: 5,
  spriteUrl: BEACON,
  ...over,
}) as DirectoryPlayer;

const propsLib = {
  saveId: 'save-1',
  friends: [] as string[],
  canGiftToday: false,
  onFriendsChange: () => {},
  onGiftSent: () => {},
  language: 'pt-BR' as const,
};

// `alt=""` deixa a imagem com papel de apresentacao, entao `getAllByRole('img')`
// nao a encontra — a consulta certa aqui e o proprio elemento.
const srcs = () => Array.from(document.querySelectorAll('img')).map(el => el.getAttribute('src') ?? '');

describe('LibraryPage — o sprite do diretorio publico', () => {
  beforeEach(() => {
    vi.mocked(listPlayers).mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('NAO faz o GET para a URL hostil que veio no players[] do KV', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [jogadorHostil()] });
    renderWithCss(<LibraryPage {...propsLib} />);
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText('Vitima')).toBeTruthy());

    // A trava: nenhum <img> do documento aponta para o host do atacante.
    expect(srcs().some(s => s.includes('atacante.example'))).toBe(false);
  });

  it('cai na arte de reserva do estagio quando a URL e recusada', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [jogadorHostil()] });
    renderWithCss(<LibraryPage {...propsLib} />);
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText('Vitima')).toBeTruthy());

    // Recusar NAO pode virar sprite vazio: o visor nao tem estado de erro.
    expect(srcs()).toContain(getSpriteForStage('rookie'));
  });

  it('NAO faz o GET para a variante em http: (beacon em texto claro)', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [jogadorHostil({ spriteUrl: BEACON_HTTP } as Partial<DirectoryPlayer>)] });
    renderWithCss(<LibraryPage {...propsLib} />);
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText('Vitima')).toBeTruthy());

    expect(srcs().some(s => s.includes('atacante.example'))).toBe(false);
    expect(srcs()).toContain(getSpriteForStage('rookie'));
  });

  it('MANTEM o asset empacotado do Vite dos NPCs (o outro lado da guarda)', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    renderWithCss(<LibraryPage {...propsLib} />);
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText('Pyraka')).toBeTruthy());

    const asset = DUNGEON_LINE_SPRITES.kaelen.champion;
    // Forma real do que o Vite entrega: caminho de RAIZ, same-origin.
    expect(asset.startsWith('/')).toBe(true);
    expect(asset.startsWith('//')).toBe(false);
    expect(srcs()).toContain(asset);
  });

  it('MANTEM a https do provedor legitimo', async () => {
    const legit = 'https://platform.higgsfield.ai/x/sprite.png';
    vi.mocked(listPlayers).mockResolvedValue({ players: [{ ...jogadorHostil(), spriteUrl: legit } as DirectoryPlayer] });
    renderWithCss(<LibraryPage {...propsLib} />);
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText('Vitima')).toBeTruthy());

    expect(srcs()).toContain(legit);
  });
});

describe('isSafeSpriteSrc — as bordas que o render nao alcanca', () => {
  it('aceita o caminho de raiz, e SO ele', () => {
    expect(isSafeSpriteSrc('/assets/ignar-rookie-C6FBPY0e.png')).toBe(true);
    expect(isSafeSpriteSrc('/src/assets/soulmon/rookie.png')).toBe(true);
    // `//host` herda o esquema da pagina; `/\host` o parser de URL do
    // navegador normaliza para `//host`. Os dois saem da origem.
    expect(isSafeSpriteSrc('//atacante.example/x.png')).toBe(false);
    expect(isSafeSpriteSrc('/\\atacante.example/x.png')).toBe(false);
    // Sem barra nenhuma nao e caminho de raiz.
    expect(isSafeSpriteSrc('assets/x.png')).toBe(false);
  });

  it('NAO afrouxa o que `isSafeSpriteUrl` ja recusava', () => {
    for (const mau of [
      'http://atacante.example/x.png',
      'javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<b>x',
      'data:image/svg+xml;base64,AAA',
      'file:///c:/x.png',
      'blob:https://atacante.example/abc',
    ]) {
      expect(isSafeSpriteUrl(mau), mau).toBe(false);
      expect(isSafeSpriteSrc(mau), mau).toBe(false);
    }
  });

  it('o ramo novo mora SO na guarda de componente — o save nao mudou', () => {
    expect(isSafeSpriteUrl('/assets/ignar-rookie-C6FBPY0e.png')).toBe(false);
  });
});

describe('PlayerDetailModal — o mesmo dado, na tela de perfil', () => {
  it('NAO faz o GET para a URL hostil, e cai na arte de reserva', () => {
    renderWithCss(
      <PlayerDetailModal player={jogadorHostil() as DirectoryPlayer & { spriteUrl?: string }} language="pt-BR" onClose={() => {}} />,
    );
    expect(srcs().some(s => s.includes('atacante.example'))).toBe(false);
    expect(srcs()).toContain(getSpriteForStage('rookie'));
  });

  it('MANTEM o asset empacotado do NPC', () => {
    const asset = DUNGEON_LINE_SPRITES.orrin.ultimate;
    renderWithCss(
      <PlayerDetailModal
        player={{ ...jogadorHostil(), stage: 'ultimate-data', spriteUrl: asset } as DirectoryPlayer & { spriteUrl?: string }}
        language="pt-BR"
        onClose={() => {}}
      />,
    );
    expect(srcs()).toContain(asset);
  });
});
