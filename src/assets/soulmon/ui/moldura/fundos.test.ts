import { describe, it, expect } from 'vitest';
import { fundoDoLote, fundoDaTela, PEDRA_RUNAS_URL } from './fundos';

describe('fundos dos modais', () => {
  it('cada lote com prédio tem fundo; Perfil/Arquivo/sem lote usam a pedra (undefined)', () => {
    expect(fundoDoLote('mercado', 'itens')).toBeTruthy();
    expect(fundoDoLote('hall', 'guilda')).toBeTruthy();
    expect(fundoDoLote('laboratorio', 'amigos')).toBe(fundoDoLote('hall', 'guilda'));
    expect(fundoDoLote('laboratorio', 'perfil')).toBeUndefined();
    expect(fundoDoLote('laboratorio', 'pet')).toBeUndefined();
    expect(fundoDoLote('mercado', null)).toBeUndefined();
  });
  it('as quatro telas cheias têm fundo e a pedra com runas existe', () => {
    for (const t of ['fenda', 'calabouco', 'soulsmith-mapa', 'arena-livre'] as const) expect(fundoDaTela(t)).toBeTruthy();
    expect(PEDRA_RUNAS_URL).toBeTruthy();
  });
});
