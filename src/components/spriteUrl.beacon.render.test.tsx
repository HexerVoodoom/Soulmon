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
    await waitFor(() => expect(screen.getByText('Kaelen')).toBeTruthy());

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
        player={{ ...jogadorHostil(), stage: 'ultimate-harmony', spriteUrl: asset } as DirectoryPlayer & { spriteUrl?: string }}
        language="pt-BR"
        onClose={() => {}}
      />,
    );
    expect(srcs()).toContain(asset);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWLIST DE HOST — o que a guarda de ESQUEMA nunca alcançou.
//
// A guarda anterior parava `javascript:`, `http:`, `data:` não-imagem, `file:`,
// `blob:` e `//host`, e o comentário dela declarava o buraco que sobrava:
// `https://atacante.example/x.png` PASSAVA. Não é ataque de código — é
// **beacon**: o `<img>` de um perfil hostil do diretório público faz o
// navegador de quem está olhando bater num servidor de terceiro, entregando IP,
// User-Agent e o momento exato em que a pessoa abriu a Biblioteca.
//
// Medido em 27/08 a partir de uma geração real (`higgsfield.ai/s/...`): o
// arquivo NÃO é servido pelo host da API. O `og:image` aponta para
// `d8j0ntlcm91z4.cloudfront.net`, e a página usa `images.higgs.ai` como proxy
// de otimização — o que importa porque `generate-sprite.js` lê
// `results.raw.url || results.min.url`, e a variante `min` é candidata natural
// a vir do proxy.
//
// ⚠️ A LISTA É AMPLA DE PROPÓSITO, e o motivo é honesto: há UMA amostra, e ela
// veio do `og:image` de uma página de compartilhamento, não do corpo que a API
// devolve ao servidor. `platform.higgsfield.ai` fica na lista porque o teste
// "MANTEM a https do provedor legitimo" acima já o declara legítimo — tirá-lo
// seria afirmar, sem medir, que a API nunca serve o arquivo.
//
// 🔴 E POR QUE ISTO PODE SER AMPLO SEM CUSTO: esta guarda vale SÓ nos dois
// pontos que exibem sprite de TERCEIRO (`LibraryPage`, `PlayerDetailModal`), e
// os dois já caem em `getSpriteForStage(stage)` quando ela recusa. Se a lista
// estiver errada, o sprite dos OUTROS vira o desenho genérico do estágio — a
// arte PRÓPRIA de ninguém quebra, porque o caminho próprio nem passa por aqui.
// Foi essa assimetria que permitiu fechar o beacon com uma amostra só.
describe('isSafeSpriteSrc — allowlist de HOST no caminho de terceiro', () => {
  it('recusa https de host desconhecido — o beacon que a guarda de esquema deixava passar', () => {
    expect(isSafeSpriteSrc('https://atacante.example/x.png')).toBe(false);
    expect(isSafeSpriteSrc('https://evil.test/pixel.gif')).toBe(false);
    // Um CloudFront QUALQUER não serve: a distribuição é de quem a criou, e
    // criar uma leva minutos. Fixar `*.cloudfront.net` seria teatro.
    expect(isSafeSpriteSrc('https://d111111abcdef8.cloudfront.net/x.png')).toBe(false);
  });

  it('aceita os hosts do provedor, incluindo o CDN medido', () => {
    expect(isSafeSpriteSrc('https://d8j0ntlcm91z4.cloudfront.net/user_abc/hf_20260827_x.png')).toBe(true);
    expect(isSafeSpriteSrc('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fx&w=1280')).toBe(true);
    expect(isSafeSpriteSrc('https://platform.higgsfield.ai/x/sprite.png')).toBe(true);
    // Host não diferencia maiúscula de minúscula.
    expect(isSafeSpriteSrc('https://IMAGES.HIGGS.AI/x.png')).toBe(true);
  });

  it('os truques de host que um regex ingenuo deixaria passar', () => {
    // `userinfo@`: o host REAL é o que vem DEPOIS do arroba. É o clássico, e a
    // razão de esta guarda parsear a URL em vez de casar texto.
    expect(isSafeSpriteSrc('https://images.higgs.ai@atacante.example/x.png')).toBe(false);
    // Sufixo não é host: `...cloudfront.net.atacante.example` é do atacante.
    expect(isSafeSpriteSrc('https://d8j0ntlcm91z4.cloudfront.net.atacante.example/x.png')).toBe(false);
    // Prefixo também não.
    expect(isSafeSpriteSrc('https://images.higgs.ai.evil.test/x.png')).toBe(false);
    // O host permitido dentro da QUERY não torna a URL permitida.
    expect(isSafeSpriteSrc('https://atacante.example/?u=https://images.higgs.ai/x.png')).toBe(false);
    // Subdomínio de um host permitido NÃO é o host permitido.
    expect(isSafeSpriteSrc('https://x.images.higgs.ai/x.png')).toBe(false);
  });

  it('os dois outros ramos continuam intactos — asset do Vite e data: de imagem', () => {
    expect(isSafeSpriteSrc('/assets/ignar-rookie-C6FBPY0e.png')).toBe(true);
    // O fallback Gemini devolve `data:` e ele NAO faz requisicao externa: nao
    // ha beacon a fechar aqui, e recusa-lo desligaria o provedor secundario.
    expect(isSafeSpriteSrc('data:image/png;base64,AAAA')).toBe(true);
  });

  it('o SAVE nao foi endurecido junto — a allowlist de host mora so na guarda de componente', () => {
    // `isSafeSpriteUrl` guarda o acervo PRÓPRIO do jogador, e ali um host
    // desconhecido pode ser o provedor tendo mudado de CDN. Endurecer os dois
    // com uma amostra só é exatamente o chute que apagaria a arte de todo mundo
    // em silêncio (o visor não tem estado de erro, por spec).
    expect(isSafeSpriteUrl('https://atacante.example/x.png')).toBe(true);
  });
});
