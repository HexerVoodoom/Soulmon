/**
 * Guard: existe UM dono do prompt de sprite, e toda variante dele carrega a
 * cláusula anti-franquia.
 *
 * Até 07/09/2026 havia dois compositores. `src/utils/oracle.ts`
 * (`composeSpritePrompts`) era o vivo — duas variantes, com e sem citar
 * referências de gênero, ambas terminando em "Do not copy any existing
 * franchise character". `src/utils/spritePrompts.ts` era o outro: 112 linhas,
 * cadeia rookie→champion→…→ultra com pool de traços por branch, **zero
 * consumidores** e **zero ocorrências da cláusula**.
 *
 * Inerte não é inofensivo. O cabeçalho de `functions/api/generate-sprite.js`
 * mandava o leitor para o arquivo morto: quem fosse ligar a cadeia de
 * referência de imagem partiria do compositor SEM a trava, e o sprite vai
 * para o app de um usuário real. É o footgun 9 na forma mais cara — a cópia
 * não diverge um pouco, diverge exatamente na linha que protege o produto.
 *
 * O teste de `oracle` já garante o conteúdo das duas variantes. Este guarda a
 * outra metade, que nenhum teste de conteúdo pega: que não exista uma
 * TERCEIRA fonte.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const UTILS = join(process.cwd(), 'src', 'utils');
const CLAUSULA = 'Do not copy any existing franchise character';

/**
 * Assinatura de quem MONTA prompt de sprite. É a frase que o `oracle.ts`
 * realmente escreve, copiada de lá — e não um palpite de vocabulário.
 *
 * A primeira versão deste guard inventou três frases plausíveis
 * ('game sprite on transparent background', 'full body sprite', …) e a
 * autoverificação reprovou o PRÓPRIO dono vivo: nenhuma delas existe no
 * código. É o mesmo erro do guard de docs escrito hoje mais cedo. Heurística
 * que adivinha texto passa por não achar ninguém, que é o pior modo de falha
 * possível para um guard.
 */
const COMPOE_PROMPT = /transparent background:|pixel art, no background/i;

describe('um dono só para o prompt de sprite', () => {
  it('AUTOVERIFICAÇÃO: o dono vivo é reconhecido pela própria assinatura', () => {
    // Se a heurística parar de casar com o `oracle.ts`, ela parou de casar
    // com qualquer coisa — e o guard passaria por não encontrar ninguém.
    const oracle = readFileSync(join(UTILS, 'oracle', 'motor.ts'), 'utf8'); // o dono mora em oracle/motor.ts desde 04/10/2026
    expect(COMPOE_PROMPT.test(oracle)).toBe(true);
    expect(oracle).toContain(CLAUSULA);
  });

  it('nenhum outro módulo de src/utils monta prompt de sprite', () => {
    const outros: string[] = [];
    for (const nome of readdirSync(UTILS)) {
      if (!nome.endsWith('.ts') || nome.includes('.test.') || nome === 'oracle.ts') continue;
      const src = readFileSync(join(UTILS, nome), 'utf8');
      if (COMPOE_PROMPT.test(src)) outros.push(nome);
    }
    // Um segundo compositor não é proibido por gosto: é proibido porque a
    // cláusula anti-franquia teria que ser mantida em dois lugares, e o
    // arquivo que morreu aqui provou que o segundo lugar não a mantém.
    expect(outros).toEqual([]);
  });

  it('o compositor apagado não voltou, e o gerador aponta para o dono certo', () => {
    // O ponteiro errado foi o dano real: o módulo morto nunca rodou, mas o
    // cabeçalho do gerador mandava começar por ele.
    expect(existsSync(join(UTILS, 'spritePrompts.ts'))).toBe(false);
    const gerador = readFileSync(
      join(process.cwd(), 'functions', 'api', 'generate-sprite.js'), 'utf8',
    );
    expect(gerador).toMatch(/composeSpritePrompts/);
    // ⚠️ NÃO se exige que o nome do arquivo morto suma do texto: o comentário
    // -lápide o cita de propósito, para ninguém recriá-lo achando que é uma
    // ideia nova. Mesma decisão do guard dos nomes da Bandai, que varre o
    // BUNDLE e não o fonte, pelo mesmo motivo.
  });
});
