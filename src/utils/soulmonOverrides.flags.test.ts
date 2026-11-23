// REGISTRO §333: um export futuro que liga flutua/flip chega ao dado (o export de 13/11 não liga nenhuma).
import { describe, expect, it, vi } from 'vitest';

vi.mock('./soulmonOverrides.data', () => ({
  ATAQUE_TIPO_OVERRIDE_DATA: {},
  FLUTUA_DATA: ['embrit-rookie'],
  FLIP_DATA: ['bubbo-mega'],
}));

describe('flutua e flip ligados por um export', () => {
  it('só a forma marcada liga; as outras seguem desligadas', async () => {
    const { flutuaDe, flipDe, FLUTUA_ALTURA } = await import('./soulmonOverrides');
    expect(flutuaDe('embrit-rookie')).toBe(true);
    expect(flutuaDe('bubbo-mega')).toBe(false);
    expect(flipDe('bubbo-mega')).toBe(true);
    expect(flipDe('embrit-rookie')).toBe(false);
    expect(FLUTUA_ALTURA).toBeGreaterThan(0);
    expect(FLUTUA_ALTURA).toBeLessThan(0.25);
  });
});
