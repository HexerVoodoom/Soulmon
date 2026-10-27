/**
 * "Gerar a aparencia de novo" mora no CENTRO DE EVOLUCAO do Laboratorio (27/10/2026, pedido do dono), nao no Perfil.
 * Um unico componente (`RegenAparencia`), um unico ponto de uso.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ler = (p: string) => readFileSync(resolve(__dirname, '../..', p), 'utf8');

describe('RegenAparencia: lugar', () => {
  it('o Perfil NAO tem mais a secao', () => {
    const perfil = ler('components/perfil/SoulmonPerfil.tsx');
    expect(perfil).not.toMatch(/RegenAparencia/);
    expect(perfil).not.toMatch(/regen/);
  });

  it('o App a renderiza UMA vez, na aba do Centro de Evolucao', () => {
    const app = ler('App.tsx');
    const usos = app.match(/<RegenAparencia\b/g) ?? [];
    expect(usos).toHaveLength(1);
    const i = app.indexOf('<RegenAparencia');
    const antes = app.slice(Math.max(0, i - 400), i);
    expect(antes).toMatch(/labTab === 'evolution'/);
  });
});
