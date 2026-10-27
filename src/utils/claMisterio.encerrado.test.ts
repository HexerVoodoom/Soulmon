import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** O Mistério da feira foi ENCERRADO no cliente (dono, 27/10/2026): nenhuma tarefa conta, nenhuma sala o desenha.
 *  O servidor só converte a recompensa pendente em Bits/Honra (`converterMisterio`, ver `_claMisterio.test.js`). */
const ler = (rel: string) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8');

describe('Mistério encerrado no cliente', () => {
  it('o App não conta mais tarefa no Mistério e a Feira não o desenha', () => {
    expect(ler('../App.tsx')).not.toMatch(/contarMisterio|countMisterioTask/);
    expect(ler('../components/guild/GuildSheet.tsx')).not.toMatch(/SalaMisterio|data-guild-card="misterio"/);
    expect(fs.existsSync(path.resolve(__dirname, '../components/guild/MisterioVisor.tsx'))).toBe(false);
  });
});
