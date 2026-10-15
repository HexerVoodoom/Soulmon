/**
 * QA rodada 3 — o parser da captura de uma linha (CreateModal › "Quick add") com entrada hostil.
 * Contrato do cabeçalho de `quickAdd.ts`: nunca lança, nunca devolve nome vazio (para entrada não vazia), e tudo
 * que devolve é VÁLIDO (data de calendário real, hora 00:00–23:59, esforço 1–3, n 1–365, alvo 1–7). Mais: nenhuma
 * entrada gigante/patológica trava o thread (ReDoS).
 */
import { describe, it, expect } from 'vitest';
import { parseQuickAdd } from './quickAdd';

const NOW = new Date(2026, 9, 15, 12, 0, 0); // 15/10/2026 12:00 local

// Mulberry32: determinístico, para o teste ser reproduzível.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FRAGS = [
  'pagar', 'boleto', 'comprar', '3', '12', '25', '99', '0', '00', '31', '30', '02', '/', ':', 'x', 'h', 'am', 'pm', 'a.m.', 'p.m.', '!', '!2', '!9', '!!',
  '#work', '#trabalho', '#', '##', '#saúde', 'amanhã', 'tomorrow', 'hoje', 'today', 'depois de amanhã', 'a cada', 'every', 'dias', 'days', 'após concluir',
  'after completion', 'semana', 'week', 'seg', 'qua', 'sex', 'sábado', 'sunday', 'dia', 'on the', '15th', '1st', 'às', 'at', 'todo dia', 'daily',
  '03/04', '30/02', '31/04', '15/03/2026', '00/00', '13/13', '2:30pm', '14h', '14h30', '24:00', '23:59', '9999999999', '\u0000', '‮', '😀', '\n', '\t', ' ',
  '(', ')', '[', ']', '\\', '$', '^', '.*', '+', '?', '{', '}', '|', 'ç', 'ã', 'İ', 'ß',
];

function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

describe('QA3 quickAdd: fuzz de propriedades', () => {
  for (const language of ['pt-BR', 'en'] as const) {
    it(`20 mil linhas aleatórias (${language}): nunca lança e tudo que devolve é válido`, () => {
      const r = rng(language === 'en' ? 7 : 11);
      const falhas: string[] = [];
      for (let i = 0; i < 20000; i++) {
        const n = 1 + Math.floor(r() * 9);
        let s = '';
        for (let k = 0; k < n; k++) s += FRAGS[Math.floor(r() * FRAGS.length)] + (r() < 0.8 ? ' ' : '');
        let res;
        try { res = parseQuickAdd(s, { now: NOW, language }); } catch (e) { falhas.push(`LANCOU ${JSON.stringify(s)}`); continue; }
        if (s.trim() && !res.name) falhas.push(`NOME VAZIO ${JSON.stringify(s)}`);
        if (res.date !== undefined && !isRealDate(res.date)) falhas.push(`DATA INVALIDA ${res.date} <- ${JSON.stringify(s)}`);
        if (res.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(res.time)) falhas.push(`HORA INVALIDA ${res.time} <- ${JSON.stringify(s)}`);
        if (res.effort !== undefined && ![1, 2, 3].includes(res.effort as number)) falhas.push(`ESFORCO ${res.effort} <- ${JSON.stringify(s)}`);
        const sc = res.schedule;
        if (sc?.kind === 'everyNDays' && !(sc.n >= 1 && sc.n <= 365)) falhas.push(`N ${sc.n} <- ${JSON.stringify(s)}`);
        if (sc?.kind === 'timesPerWeek' && !(sc.target >= 1 && sc.target <= 7)) falhas.push(`ALVO ${sc.target} <- ${JSON.stringify(s)}`);
        if (res.kind === 'activity' && !sc) falhas.push(`ATIVIDADE SEM AGENDA <- ${JSON.stringify(s)}`);
      }
      expect(falhas.slice(0, 10)).toEqual([]);
    });
  }

  it('hora fora de faixa com am/pm não vira hora válida por acidente ("25pm" não é 13:00)', () => {
    for (const s of ['reunião 25pm', 'reunião 13pm', 'reunião 99:99pm', 'reunião 0:75am']) {
      const res = parseQuickAdd(s, { now: NOW, language: 'en' });
      expect(res.time, s).toBeUndefined();
    }
  });

  it('entradas patológicas gigantes não travam (ReDoS): cada uma < 500 ms', () => {
    const casos = [
      '1 '.repeat(20000), 'a cada '.repeat(5000), '#'.repeat(50000), '!'.repeat(50000), '9'.repeat(50000),
      ('seg ').repeat(10000), '1/'.repeat(25000), ('2:3 pm ').repeat(8000), ' '.repeat(100000) + 'x', 'x'.repeat(100000),
      'every 5 days'.repeat(5000), '#a'.repeat(30000), 'dia '.repeat(20000),
    ];
    for (const s of casos) {
      const t0 = performance.now();
      const res = parseQuickAdd(s, { now: NOW, language: 'pt-BR' });
      const dt = performance.now() - t0;
      expect(res.name.length, 'nome não vazio').toBeGreaterThan(0);
      expect(dt, `${s.slice(0, 20)}… levou ${Math.round(dt)} ms`).toBeLessThan(500);
    }
  });
});
