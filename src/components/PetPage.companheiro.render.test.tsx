// @vitest-environment jsdom
/**
 * O COMPANHEIRO visível e nomeado na Ficha — decisão 2 do dono
 * (`docs/PLANO-ORACULO.md` §9, 28/09/2026). Até a Fase 3, `selectCompanion`
 * era calculado e virava só a última frase da bio, com o nome em PT nas duas
 * línguas. Aqui se trava o que a tela mostra E o que ela não mostra:
 *
 *  · o nome no idioma certo (PT do snapshot, EN de `COMPANHEIRO_EN`);
 *  · nenhum número nem taxonomia do class-system (`poderBase`, afinidade,
 *    família) — ficha invisível, decisão 3;
 *  · sem companheiro no cache, a seção simplesmente não existe (nunca um
 *    "?" ou um placeholder).
 *
 * E o dono do nome: todas as 32 criaturas do registro têm par EN.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { PetPage } from './PetPage';
import type { CreatureStage } from '../utils/oracle';
import { CLASS_DATA } from '../utils/soulProfile/ficha/buildSheet';
import { COMPANHEIRO_EN, companheiroNome, companheiroVisivel } from '../utils/soulProfile/ficha/companheiro';
import { selectCompanion } from '../utils/soulProfile/ficha/capture';
import type { Ficha } from '../utils/soulProfile/ficha/types';

const rookie: CreatureStage = {
  stage: 'rookie', stageName: { pt: 'Desperto', en: 'Awakened' }, name: 'Pixel',
  description: { pt: 'Uma faísca.', en: 'A spark.' }, imagePrompt: '', imagePromptFallback: '',
};

function montar(language: 'pt-BR' | 'en-US', companheiro?: { id: string; nome: { pt: string; en: string } }) {
  return renderWithCss(
    <PetPage
      stages={[rookie]}
      unlockedEvolutions={['rookie']}
      currentStageId="rookie"
      petName="Pixel"
      language={language}
      savedCompanheiro={companheiro}
    />,
  );
}

describe('o companheiro na Ficha', () => {
  const lobo = { id: 'lobo', nome: companheiroNome('lobo') };

  it('PT: nome do snapshot, seção marcada pelo id, nada de número', () => {
    montar('pt-BR', lobo);
    const secao = document.querySelector('[data-companheiro="lobo"]');
    expect(secao).not.toBeNull();
    const texto = secao!.textContent ?? '';
    expect(texto).toContain('Lobo Cinzento');
    expect(texto).not.toMatch(/\d/);
    // taxonomia/mecânica do class-system nunca sobe à tela ("afinidade" na
    // frase de mundo é voz, não `afinidades[]`)
    expect(texto).not.toMatch(/besta|poderBase|poder base|vida|vigor|\bfam[ií]lia\b/i);
  });

  it('EN: nome traduzido, nunca o PT', () => {
    montar('en-US', lobo);
    const texto = document.querySelector('[data-companheiro="lobo"]')!.textContent ?? '';
    expect(texto).toContain('Grey Wolf');
    expect(texto).not.toContain('Lobo Cinzento');
  });

  it('sem companheiro no cache, a seção não existe', () => {
    montar('pt-BR');
    expect(document.querySelector('[data-companheiro]')).toBeNull();
  });
});

describe('o dono do nome', () => {
  it('todas as criaturas do registro têm par EN, e nenhum EN é igual ao PT por preguiça', () => {
    const ids = Object.keys(CLASS_DATA.criaturas);
    expect(ids.length).toBeGreaterThanOrEqual(32);
    for (const id of ids) {
      expect(COMPANHEIRO_EN[id], `sem EN para '${id}'`).toBeTruthy();
      const { pt, en } = companheiroNome(id);
      expect(pt).toBe(CLASS_DATA.criaturas[id as keyof typeof CLASS_DATA.criaturas].nome);
      expect(en).toBe(COMPANHEIRO_EN[id]);
    }
    // cognatos legítimos ficam iguais (Ghoul, Imp, Wyvern); o resto tem que diferir
    const iguais = ids.filter(id => companheiroNome(id).pt === companheiroNome(id).en);
    expect(iguais.sort()).toEqual(['ghoul', 'imp', 'wyvern']);
  });

  it('a redução ao visível descarta a mecânica: só id e nome', () => {
    // ficha mínima que captura de verdade: Evocação + afinidade em `vida`
    const ficha = { elementos: { vida: 3 }, escolas: { evocacao: 10 } } as unknown as Ficha;
    const captura = selectCompanion(ficha, 'pessoa-7');
    expect(captura).not.toBeNull();
    const visivel = companheiroVisivel(captura)!;
    expect(Object.keys(visivel).sort()).toEqual(['id', 'nome']);
    expect(visivel.id).toBe(captura!.id);
    expect(companheiroVisivel(null)).toBeUndefined();
  });
});
