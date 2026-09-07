import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DUNGEON_LINE_SPRITES, getDungeonEnemySprite } from './sprites';

/**
 * WP4.9 — o roster da masmorra é `DUNGEON_LINE_SPRITES` (6 linhas NOSSAS).
 *
 * ⚠️ Este arquivo importava `LEGACY_FORM_TIERS` para provar que o sorteio não
 * a usava. A tabela foi APAGADA em 07/09/2026: eram 57 ids de espécie de outra
 * franquia que iam no bundle de produção, justificados por uma compatibilidade
 * de save para jogadores que nunca existiram (o dono confirmou que ninguém
 * usou o app em produção).
 *
 * O guard ficou mais forte por causa disso: em vez de provar que UMA função
 * não lê UMA tabela, ele varre o `src/` inteiro atrás dos nomes. É a regra do
 * `CLAUDE.md` ("nada de terceiro entra no bundle") virando teste — antes ela
 * era só uma frase, e a tabela viveu meses debaixo dela.
 */
describe('roster da masmorra (WP4.9)', () => {
  const lines = Object.keys(DUNGEON_LINE_SPRITES);

  it('tem exatamente 6 linhas, cada uma com as 4 artes', () => {
    expect(lines).toHaveLength(6);
    for (const l of lines) {
      for (const stage of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(typeof DUNGEON_LINE_SPRITES[l][stage]).toBe('string');
      }
    }
  });

  it('getDungeonEnemySprite só devolve linhas nossas, com nome, para todo tier', () => {
    for (const tier of ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega', 'ultra']) {
      for (let i = 0; i < 30; i++) {
        const e = getDungeonEnemySprite(tier);
        expect(lines).toContain(e.line);
        expect(e.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('excludeLine tira a linha do jogador do sorteio', () => {
    for (let i = 0; i < 50; i++) expect(getDungeonEnemySprite('rookie', 'ignar').line).not.toBe('ignar');
  });
});

/** Amostra dos nomes que estavam em `LEGACY_FORM_TIERS`. Não é a lista toda
 *  de propósito — a lista toda em teste é a lista toda no repositório. */
const NOMES_DE_FRANQUIA = [
  'agumon', 'gabumon', 'greymon', 'garurumon', 'patamon', 'veemon', 'tapirmon',
  'salamon', 'gatomon', 'angemon', 'angewomon', 'devimon', 'ladydevimon',
  'imperialdramon', 'gaioumon', 'mastemon', 'ophanimon', 'etemon', 'numemon',
];

describe('nada de terceiro entra no bundle', () => {
  /**
   * ⚠️ O guard olha o BUNDLE (`dist/`), não o fonte, e a diferença é o ponto:
   * comentário é apagado no build, então um comentário-lápide que CITA o nome
   * proibido (há vários, de propósito — é assim que se registra o que não pode
   * voltar) não é risco nenhum. O que vai para a Cloudflare e para a Play
   * Store é o `.js` compilado, e é ele que precisa estar limpo.
   *
   * `dist/` é commitado (ver CLAUDE.md), e o gate manda rodar `npm run build`
   * antes de todo commit — então o artefato aqui é sempre o do commit atual.
   */
  const bundles = (() => {
    try {
      return readdirSync('dist/assets')
        .filter(f => f.endsWith('.js'))
        .map(f => join('dist/assets', f));
    } catch {
      return [];
    }
  })();

  it('existe bundle para conferir', () => {
    // Sem isto, o teste passaria vazio e diria "limpo" sobre nada.
    expect(bundles.length).toBeGreaterThan(0);
  });

  it('nenhum nome de franquia foi servido ao usuário', () => {
    const achados: string[] = [];
    for (const arquivo of bundles) {
      const texto = readFileSync(arquivo, 'utf8').toLowerCase();
      for (const nome of NOMES_DE_FRANQUIA) {
        // `\b` não basta: "soulmon" contém "mon" e o bundle é minificado.
        if (new RegExp(`\\b${nome}\\b`).test(texto)) achados.push(`${arquivo}: ${nome}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('e nenhum sprite da franquia sobrou no APK', () => {
    // Outra ÁRVORE, e foi por isso que ela passou meses despercebida: o
    // `Attributions.md` declarava que a arte da Bandai "saiu tudo", e tinha
    // saído só do bundle web. `android/res/drawable` guardava 40 sprites, e
    // `resolveSprite` caía em `triceramon_dot` para TODO usuário, sempre.
    const drawables = readdirSync('android/app/src/main/res/drawable');
    const proibidos = drawables.filter(f =>
      NOMES_DE_FRANQUIA.some(n => f.toLowerCase().includes(n)));
    expect(proibidos).toEqual([]);
  });
});
