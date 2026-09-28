// @vitest-environment jsdom
/**
 * A RÉGUA "A CLASSE NUNCA APARECE AO JOGADOR" — `docs/PLANO-ORACULO.md` §2,
 * decisão 3 do dono (28/09/2026): *"A classe nunca aparece ao jogador. Age
 * por trás."* Risco de produto #2 do mesmo plano: *"classe vazar numa tela
 * nova — régua automática em CI (Fase 3)"*. Esta é a régua.
 *
 * ## Por que em duas pontas
 *
 * 1. **Fonte**: nenhum componente (`src/components/**\/*.tsx`, testes de fora)
 *    contém o NOME de um arquétipo do class-system — os 79 em PT, lidos AO VIVO
 *    do motor (`vendor/class-system`, `ARQUETIPOS`), e os 79 em EN de
 *    `CLASS_TITLE_EN` — nem os prefixos das classes de fallback
 *    (`Aspirante a …`/`… Aspirant`, `Adepto de …`/`… Adept`). Lê fonte, não
 *    tela, com o mesmo raciocínio da régua da narrativa
 *    (`src/narrativa.contract.test.ts`): comentário vira texto na próxima
 *    refatoração, e o falso positivo custa uma linha aqui enquanto o falso
 *    negativo custa a palavra na tela.
 * 2. **Tela**: a classe é DADO (`ClassTitle.nome`, cache `soulmonClassTitles`
 *    no save), então uma varredura de literais não pega `{L(classe.nome)}`.
 *    Por isso a Ficha (`PetPage`) é renderizada com uma classe conhecida nos
 *    dois idiomas, e o texto da página não pode conter o nome — enquanto o
 *    **sigilo** (que é forma, não palavra: "raridade comunicada por NPC/forma,
 *    nunca selo", decisão 4) continua no canto do visor.
 *
 * ⚰️ Achado da Fase 3: até aqui a `PetPage` escrevia `· Necromante` ao lado do
 * estágio na forma atual E em cada forma anterior — o cabeçalho dela dizia,
 * por escrito, "agora ela aparece". A régua nasce junto com o conserto.
 *
 * ## O que ela NÃO alcança
 *
 * - Texto que vem do servidor (`/api/chat`) ou montado por concatenação.
 * - Componentes fora de `src/components` (o `App.tsx` é varrido à parte, pelo
 *   mesmo critério de fonte).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { PetPage } from './PetPage';
import { CLASS_TITLE_EN, type ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { CreatureStage } from '../utils/oracle';

// `process.cwd()` e não `import.meta.url`: sob `jsdom` a URL do módulo não é
// `file:` e `fileURLToPath` lança. O vitest roda da raiz do repositório.
const RAIZ = process.cwd();

function componentes(): string[] {
  const saida: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) { anda(cheio); continue; }
      if (!/\.tsx$/.test(nome) || /\.(test|spec)\.tsx$/.test(nome)) continue;
      saida.push(cheio);
    }
  };
  anda(join(RAIZ, 'src', 'components'));
  saida.push(join(RAIZ, 'src', 'App.tsx'));
  return saida;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Palavra inteira, com letras acentuadas contando como letra. */
const comoPalavra = (nome: string) => new RegExp(`(?<!\\p{L})${escapar(nome)}(?!\\p{L})`, 'u');

describe('classe nunca visível — fonte', () => {
  it('nenhum componente cita o nome de um arquétipo (79 PT do motor + 79 EN) nem os prefixos de fallback', async () => {
    const { ARQUETIPOS } = await import('class-system');
    const nomesPt = Object.values(ARQUETIPOS).map(a => a.nome);
    const nomesEn = Object.values(CLASS_TITLE_EN);
    expect(nomesPt.length).toBeGreaterThanOrEqual(79);
    expect(nomesEn.length).toBe(nomesPt.length);

    const proibidos = [...new Set([...nomesPt, ...nomesEn, 'Aspirante a ', 'Adepto de ', ' Aspirant', ' Adept'])];
    const achados: string[] = [];
    for (const arquivo of componentes()) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const nome of proibidos) {
        const m = comoPalavra(nome).exec(texto);
        if (!m) continue;
        const linha = texto.slice(0, m.index).split('\n').length;
        achados.push(`${relative(RAIZ, arquivo)}:${linha} → "${nome.trim()}"`);
      }
    }
    expect(achados, 'nome de classe do class-system em componente').toEqual([]);
  });
});

const rookie: CreatureStage = {
  stage: 'rookie', stageName: { pt: 'Desperto', en: 'Awakened' }, name: 'Pixel',
  description: { pt: 'Uma faísca.', en: 'A spark.' }, imagePrompt: '', imagePromptFallback: '',
};
const champion: CreatureStage = {
  stage: 'champion', branch: 'poder', stageName: { pt: 'Ascendente', en: 'Ascendant' }, name: 'Pixelion',
  description: { pt: 'Uma chama.', en: 'A flame.' }, imagePrompt: '', imagePromptFallback: '',
};
const CLASSE: ClassTitle = { nome: { pt: 'Necromante', en: 'Necromancer' }, origem: 'arquetipo', sigilo: 'marcial' };
const classes: Record<FichaStage, ClassTitle> = { rookie: CLASSE, champion: CLASSE, ultimate: CLASSE, mega: CLASSE, ultra: CLASSE };

describe('classe nunca visível — tela (a Ficha do Pet)', () => {
  for (const language of ['pt-BR', 'en-US'] as const) {
    it(`${language}: a forma atual e as anteriores mostram o estágio, nunca o nome da classe; o sigilo fica`, () => {
      renderWithCss(
        <PetPage
          stages={[rookie, champion]}
          unlockedEvolutions={['rookie', 'champion-virus']}
          currentStageId="champion-virus"
          dominantElement="fogo"
          petName="Pixel"
          language={language}
          savedClassTitles={classes}
        />,
      );
      const texto = document.body.textContent ?? '';
      expect(texto).not.toContain('Necromante');
      expect(texto).not.toContain('Necromancer');
      // o estágio continua nomeado — a régua tira a classe, não a palavra
      expect(texto).toContain(language === 'pt-BR' ? 'Ascendente' : 'Ascendant');
      expect(texto).toContain(language === 'pt-BR' ? 'Desperto' : 'Awakened');
      // e o sigilo (forma, não palavra) segue no canto do visor
      expect(document.querySelector('[data-sigil="marcial"]')).not.toBeNull();
    });
  }
});
