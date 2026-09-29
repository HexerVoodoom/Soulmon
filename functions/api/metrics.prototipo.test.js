import { describe, it, expect } from 'vitest';
import { sanitizeRecord, applyAggregate } from './metrics.js';

/** M4 (L2-backend): nome de membro do protótipo não passa pela allowlist de props. */
describe('props com chave do protótipo', () => {
  const d = new Date().toISOString().slice(0, 10);
  for (const k of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    it(`recusa ${k}`, () => {
      const p = JSON.parse(`{"size":5,"${k}":3}`);
      expect(sanitizeRecord({ e: 'guild_join', d, p }, d)).toBeNull();
    });
  }
  it('o agregado da Guilda só cria contadores do schema', () => {
    const agg = applyAggregate({}, [{ e: 'guild_join', d, p: Object.assign(Object.create(null), { size: 5, constructor: 9 }) }]);
    const chaves = JSON.stringify(agg);
    expect(chaves).toContain('guild_join.size_5');
    expect(chaves).not.toContain('constructor');
  });
});
