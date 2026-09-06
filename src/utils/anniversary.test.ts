/**
 * WP1.16 — a criatura ganha data de nascimento, e com ela duas coisas: o
 * aniversário e "dias juntos".
 *
 * O plano assumia que o campo existia; não existia. O único `createdAt` do
 * `GameState` é de `Task`, e três guardas diferentes tinham proposto medir
 * "há quanto tempo" de três jeitos — `bornAt`, `soulmonMeta.bornOn` e
 * `saveDaysLived`. Uma fonte só é o conserto, e é `bornAt`.
 *
 * As regras que este arquivo trava, e a alternativa que cada uma evita:
 *  · **sem `bornAt`, silêncio.** Save antigo não comemora e não exibe "N dias".
 *    Inferir a data de outra coisa produziria um número que parece verdade e
 *    não é — pior que a ausência.
 *  · **só marcos redondos.** "Faz 47 dias" é contador, não data.
 *  · **relógio que anda para trás não vira número negativo.**
 *
 * A decisão D17 do dono ("trocou de pele") vive fora daqui, no `App.tsx`: o
 * upgrade não reescreve `bornAt`. Quem joga há 40 dias continua tendo 40 dias
 * depois de comprar — comprar não pode zerar o único número que só sobe.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { anniversaryOn, daysTogether } from './anniversary';

describe('aniversário (WP1.16)', () => {
  it('um mês cheio é aniversário de mês', () => {
    expect(anniversaryOn('2026-03-10', '2026-04-10')).toBe('month');
    expect(anniversaryOn('2026-03-10', '2026-08-10')).toBe('month');
  });

  it('doze meses viram ANO, não "12 meses"', () => {
    expect(anniversaryOn('2026-03-10', '2027-03-10')).toBe('year');
    expect(anniversaryOn('2026-03-10', '2028-03-10')).toBe('year');
  });

  it('qualquer outro dia não é aniversário de nada', () => {
    expect(anniversaryOn('2026-03-10', '2026-04-09')).toBeNull();
    expect(anniversaryOn('2026-03-10', '2026-04-11')).toBeNull();
    expect(anniversaryOn('2026-03-10', '2026-03-25')).toBeNull();
  });

  it('o próprio dia do nascimento não comemora', () => {
    expect(anniversaryOn('2026-03-10', '2026-03-10')).toBeNull();
  });

  it('sem `bornAt` não há aniversário — e não se inventa uma data', () => {
    expect(anniversaryOn(undefined, '2026-04-10')).toBeNull();
    expect(anniversaryOn('', '2026-04-10')).toBeNull();
    expect(anniversaryOn('ontem', '2026-04-10')).toBeNull();
  });
});

describe('dias juntos (WP2.11)', () => {
  it('conta o próprio dia do nascimento como o primeiro', () => {
    expect(daysTogether('2026-03-10', '2026-03-10')).toBe(1);
    expect(daysTogether('2026-03-10', '2026-03-11')).toBe(2);
  });

  it('atravessa mês e ano', () => {
    expect(daysTogether('2026-12-30', '2027-01-02')).toBe(4);
  });

  it('só cresce: relógio que voltou devolve `null`, nunca negativo', () => {
    // É a propriedade que torna o número exibível: se ele pudesse descer,
    // viraria placar de desempenho e cairia na mesma proibição do rank.
    expect(daysTogether('2026-03-10', '2026-03-09')).toBeNull();
  });

  it('sem `bornAt` não há número', () => {
    expect(daysTogether(undefined, '2026-03-10')).toBeNull();
  });
});

describe('D17 — o upgrade não reescreve a data', () => {
  it('`handleUpgradeRevealed` não toca em `bornAt`', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    const i = app.indexOf('const handleUpgradeRevealed');
    expect(i).toBeGreaterThan(0);
    const corpo = app.slice(i, app.indexOf('}, [', i));
    // O comentário explica a ausência; o que não pode é uma ATRIBUIÇÃO.
    expect(corpo, 'comprar passou a zerar os dias juntos').not.toMatch(/bornAt:/);
  });

  it('o nascimento grava a data no dia do JOGADOR, não do aparelho', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    const gravacoes = app.match(/bornAt: [^,\n]+/g) ?? [];
    expect(gravacoes.length, 'os dois caminhos de nascimento gravam a data').toBe(2);
    for (const g of gravacoes) {
      expect(g, 'usou o dia do aparelho — dois celulares discordariam').toMatch(/playerDayKey/);
    }
  });
});
