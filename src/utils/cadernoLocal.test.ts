import { describe, it, expect } from 'vitest';
import { MAX_CHARS, MAX_ENTRIES, addEntry, formatoDoDia, normalizeEntries, removeEntry, sinaisDeSofrimento, CADERNO_FORMATOS } from './cadernoLocal';

describe('caderno — sanitização do storage', () => {
  it('lixo não derruba: tudo que não é lista vira vazio', () => {
    for (const x of [null, 3, 'a', {}, undefined]) expect(normalizeEntries(x)).toEqual([]);
  });
  it('descarta entrada sem id válido, dia, formato ou texto; corta texto longo; sem ids repetidos', () => {
    const ok = { id: 'a1', day: '2026-10-04', formato: 'livre', text: 'oi', at: 5 };
    const out = normalizeEntries([
      ok, ok,
      { ...ok, id: 'B C' }, { ...ok, id: 'x', day: '4/10' }, { ...ok, id: 'y', formato: 'outro' },
      { ...ok, id: 'z', text: '   ' }, { ...ok, id: 'w', at: 'n' }, null,
      { ...ok, id: 'long', text: 'x'.repeat(MAX_CHARS + 500), at: 9 },
    ]);
    expect(out.map(e => e.id)).toEqual(['long', 'a1']);
    expect(out[0].text.length).toBe(MAX_CHARS);
  });
  it('guarda no máximo MAX_ENTRIES, as mais novas', () => {
    const muitas = Array.from({ length: MAX_ENTRIES + 20 }, (_, i) => ({ id: `e${i}`, day: '2026-10-04', formato: 'livre', text: 't', at: i }));
    const out = normalizeEntries(muitas);
    expect(out.length).toBe(MAX_ENTRIES);
    expect(out[0].at).toBe(MAX_ENTRIES + 19);
  });
});

describe('caderno — escrita e apagar', () => {
  it('texto vazio não cria entrada; apagar tira só a escolhida', () => {
    expect(addEntry([], '2026-10-04', 'livre', '   ', 1)).toEqual([]);
    let l = addEntry([], '2026-10-04', 'gratidao', 'a', 1);
    l = addEntry(l, '2026-10-04', 'gratidao', 'b', 2);
    expect(l.length).toBe(2);
    expect(removeEntry(l, l[0].id).map(e => e.text)).toEqual(['a']);
  });
  it('o formato do dia é determinístico, válido e muda com o dia', () => {
    expect(formatoDoDia('2026-10-04')).toBe(formatoDoDia('2026-10-04'));
    const todos = new Set(Array.from({ length: 30 }, (_, i) => formatoDoDia(`2026-09-${String(i + 1).padStart(2, '0')}`)));
    for (const f of todos) expect(CADERNO_FORMATOS).toContain(f);
    expect(todos.size).toBeGreaterThan(1);
  });
});

describe('caderno — sinal de sofrimento é local e reaproveita o léxico do chat', () => {
  it('detecta o que o chat detecta e não acusa texto comum', () => {
    expect(sinaisDeSofrimento('hoje foi um bom dia, tomei café com a Ana')).toBe(false);
    expect(sinaisDeSofrimento('')).toBe(false);
    expect(sinaisDeSofrimento('nao quero mais viver')).toBe(true);
  });
});
