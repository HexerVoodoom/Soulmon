/**
 * WP2.15 — a fiação dos três eventos que existiam no schema e nunca saíam.
 *
 * `welcome_back`, `shield_used` e `bond_level` entraram no `EVENT_SCHEMA` pelo
 * WP0.5 e ficaram mudos: o ledger dizia VERIFICADO e a régua não existia. Este
 * guard trava os três pontos de emissão contra os dois modos de errar que já
 * aconteceram neste projeto — emitir de dentro de um updater (footgun 6, conta
 * em dobro no StrictMode) e emitir na montagem (que transformaria "abrir o app"
 * em evento).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EVENT_SCHEMA } from './telemetry';

const app = () => readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
/** O corpo do efeito que contém a emissão, do `useEffect(` anterior até o fecho. */
const efeitoDe = (src: string, evento: string) => {
  const i = src.indexOf(`track('${evento}'`);
  expect(i, `${evento} não é emitido por ninguém`).toBeGreaterThan(0);
  return src.slice(src.lastIndexOf('useEffect(() => {', i), src.indexOf('}, [', i));
};

describe('os três eventos da virada e do vínculo (WP2.15)', () => {
  it('os três continuam declarados com a forma que a política publicou', () => {
    expect(EVENT_SCHEMA.welcome_back).toEqual({ days: { min: 0, max: 3 } });
    expect(EVENT_SCHEMA.shield_used).toBeNull();
    expect(EVENT_SCHEMA.bond_level).toEqual({ level: { min: 1, max: 30 } });
  });

  it('`welcome_back` sai em FAIXA, nunca com o número de dias cru', () => {
    const corpo = efeitoDe(app(), 'welcome_back');
    // O que não pode é o valor CRU chegar ao payload: `days: d` seco, ou o
    // `Number(...)` direto. A forma aceita é a escada de faixas.
    expect(corpo, 'o dia exato de retorno começa a descrever uma pessoa')
      .not.toMatch(/days:\s*(d\s*[,}]|Number\()/);
    expect(corpo, 'a escada de faixas sumiu').toMatch(/days:\s*d <= 1 \? 0 : d <= 4 \? 1/);
  });

  it('`shield_used` sai da virada, e só quando algum escudo foi mesmo gasto', () => {
    const corpo = efeitoDe(app(), 'shield_used');
    expect(corpo).toMatch(/shieldsSpent/);
    expect(corpo).toMatch(/> 0/);
  });

  it('nenhum dos três é emitido de dentro de um updater', () => {
    // O efeito inteiro tem de estar limpo de `setGameState`: se a emissão
    // dividir corpo com um updater, cedo ou tarde alguém a move para dentro
    // dele — e no StrictMode ela passa a contar em dobro, sem erro nenhum.
    for (const e of ['welcome_back', 'shield_used', 'bond_level']) {
      expect(efeitoDe(app(), e), `o efeito de ${e} virou dono de estado`)
        .not.toMatch(/setGameState/);
    }
  });

  it('`bond_level` é DERIVADO e só sobe — nada de nível persistido', () => {
    const corpo = efeitoDe(app(), 'bond_level');
    expect(corpo, 'o nível voltou a sair do save em vez de ser derivado')
      .toMatch(/bondLevelFor\(gameState\.totalXP/);
    expect(corpo, 'sem a comparação, cada render viraria um evento').toMatch(/nivel > anterior/);
    expect(corpo, 'a montagem não é uma subida de nível').toMatch(/anterior !== null/);
  });

  it('a virada só conta UMA vez por dia, mesmo recarregando', () => {
    const corpo = efeitoDe(app(), 'welcome_back');
    expect(corpo).toMatch(/viradaContadaRef\.current === report\.date/);
  });
});
