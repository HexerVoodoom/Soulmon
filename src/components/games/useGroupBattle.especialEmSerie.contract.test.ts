/**
 * ESPECIAIS EM SÉRIE na luta em grupo (Arena, Masmorra, Pesadelo) — 11/10/2026, pedido do dono: "enquanto rola um
 * especial, PARE os ataques dos dois e retome depois. Especiais são usados UM DE CADA VEZ."
 *
 * O `useGroupBattle` já era sequencial (o `cast` PAUSA o relógio: anel do pet, esquiva do inimigo; um `await` por vez),
 * mas depois da BATIDA o golpe seguinte (de qualquer lado) podia começar na hora e CORTAR a cauda do efeito do
 * especial — `setAction` troca a ação em curso. O conserto é esperar a cauda (`specialTailMs`) com o relógio da luta
 * parado, nos DOIS ramos do `cast`. Como o hook é um laço assíncrono de ~200 linhas dentro de um `useEffect`, o guard
 * lê o FONTE (precedente: `widgetSemCobranca.contract.test.ts`): ele pega o defeito que aconteceu — a espera sumir de
 * um dos ramos ao refatorar. A parte de ORDEM e PAUSA é medida de ponta a ponta no Duelo
 * (`DuelScreen.especialEmSerie.render.test.tsx`) e no portão puro (`specialGate.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fonte = readFileSync(join(__dirname, 'useGroupBattle.ts'), 'utf-8');
const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('useGroupBattle — a cauda do especial é esperada antes do próximo golpe', () => {
  it('importa a janela do dono único (combatFx), sem número escrito à mão', () => {
    expect(codigo).toMatch(/specialTailMs[\s\S]*from '\.\.\/\.\.\/utils\/combatFx'/);
    expect(codigo).not.toMatch(/wait\(\s*\d{3}\s*\)/); // nenhum `wait(520)` solto
  });

  it('os DOIS ramos do `cast` (o do pet e o do inimigo) esperam a cauda depois de aplicar o golpe e o status', () => {
    const esperas = [...codigo.matchAll(/await wait\(specialTailMs\(reduced\(\)\)\)/g)];
    expect(esperas.length).toBe(2);
    // cada espera vem DEPOIS de um `startStatus(` e ANTES do `ev = pull()` que libera o evento seguinte
    for (const e of esperas) {
      const antes = codigo.slice(0, e.index);
      const depois = codigo.slice(e.index! + e[0].length);
      expect(antes.lastIndexOf('startStatus(')).toBeGreaterThan(antes.lastIndexOf('ev = pull()'));
      expect(depois.indexOf('ev = pull()')).toBeGreaterThanOrEqual(0);
      const proximo = depois.indexOf('startStatus(');
      if (proximo >= 0) expect(depois.indexOf('ev = pull()')).toBeLessThan(proximo);
    }
  });

  it('o relógio da luta não anda durante a espera (é `wait`, não `waitTo`): nada é pulado, só retomado depois', () => {
    expect(codigo).not.toMatch(/waitTo\(\s*specialTailMs/);
  });

  it('o hook continua sem tocar no núcleo: só `pull`/`apply` existentes, nenhum evento reordenado ou descartado', () => {
    expect(codigo).not.toMatch(/queue\.(sort|reverse|splice)\(/);
  });
});
