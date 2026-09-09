/**
 * "Última sincronização: Invalid Date" — o valor cru do JavaScript na tela.
 *
 * `loadState` do overlay faz `{ ...defaults(), ...parsed }` e **não valida
 * campo nenhum** (é a convenção do cloud save do app: campo novo entra com
 * fallback). Então qualquer string em `lastSyncAt` no localStorage chegava
 * intacta ao `new Date(...).toLocaleString()`, e a tela de Configurações
 * imprimia `Invalid Date` — do mesmo jeito que o `TournamentPage` já registra
 * ter impresso `undefined partida(s) restante(s) hoje`.
 *
 * A formatação estava inline em `menu.ts`, que **nenhum teste em `node`
 * consegue importar** (ele toca o DOM no topo do módulo; está escrito no
 * `CLAUDE.md`). Movê-la para `state.ts` foi o que a tornou testável — e é a
 * direção que o projeto já seguiu com `care.ts`: tirar decisão do arquivo cego.
 *
 * A regra: data ilegível vira AUSÊNCIA de rótulo, nunca um rótulo quebrado.
 */
import { describe, it, expect } from 'vitest';
import { formatLastSync } from './state';

describe('🔴 data ilegível não vira rótulo', () => {
  it('nunca devolve "Invalid Date", em nenhuma entrada torta', () => {
    const tortas: Array<string | null | undefined> = [
      'ontem', 'não é data', '2026-13-45T99:99:99Z', '{}', '[]',
      'NaN', '0000-00-00', '   ', '',
      null, undefined,
      // O que um localStorage corrompido por escrita parcial produz.
      '2026-09-09T17:4',
    ];
    for (const v of tortas) {
      for (const isPt of [true, false]) {
        const r = formatLastSync(v, isPt);
        expect(r, `entrada ${JSON.stringify(v)}`).not.toMatch(/Invalid Date/i);
        expect(r, `entrada ${JSON.stringify(v)} deveria não render rótulo`).toBe('');
      }
    }
  });

  it('valor de tipo errado também não quebra — o campo vem de JSON.parse', () => {
    // `Partial<DesktopState>` é uma promessa de TIPO, e JSON não a cumpre:
    // `{"lastSyncAt": 12345}` é JSON válido e passa direto pelo `loadState`.
    for (const v of [12345, {}, [], true, 0] as unknown[]) {
      expect(formatLastSync(v as string, true)).toBe('');
    }
  });

  it('data VÁLIDA rende rótulo — senão tudo acima seria vácuo', () => {
    const iso = '2026-09-09T17:46:00.000Z';
    const pt = formatLastSync(iso, true);
    const en = formatLastSync(iso, false);
    expect(pt).toMatch(/^Última sincronização: .+/);
    expect(en).toMatch(/^Last sync: .+/);
    expect(pt).not.toMatch(/Invalid/);
    expect(en).not.toMatch(/Invalid/);
  });

  it('os dois idiomas usam o formato do PRÓPRIO idioma', () => {
    // O inglês usava `toLocaleString()` sem argumento, que segue o locale da
    // MÁQUINA: numa máquina brasileira, quem escolheu inglês lia dd/mm/aaaa.
    const iso = '2026-01-02T03:04:05.000Z';
    const pt = formatLastSync(iso, true);
    const en = formatLastSync(iso, false);
    expect(pt).not.toBe(en);
    // pt-BR põe o dia antes do mês; en-US, o contrário. Basta que difiram e
    // que nenhum dependa do relógio da máquina de quem roda o teste.
    expect(formatLastSync(iso, false)).toBe(en);
  });

});
