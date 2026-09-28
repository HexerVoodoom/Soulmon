/**
 * NUMEROLOGIA — o vocabulário negativo nunca chega ao jogador
 * (`docs/PLANO-ORACULO.md` §7 risco 5, Fase 3; `plano-comportamento.md` §3.1
 * e §6.2). "Dívida cármica", "lição cármica", "desafio" são rótulos sobre a
 * PESSOA, e a bíblia (L1/L8/L9) proíbe o mundo de diagnosticar a pessoa.
 *
 * Medido na Fase 3: hoje NENHUM desses campos é renderizado — `oracle.ts` só
 * consome os 4 números centrais como afinidade de elemento e a `OraclePage`
 * (ferramenta de criação, sem entrada na navegação) imprime só os 4 números.
 * Esta régua existe para que continue assim, e para que qualquer exposição
 * nova passe pela tabela de tradução do cabeçalho de `numerology.ts`.
 *
 * Três pontas:
 *  1. nenhum componente (nem o `App.tsx`) lê os campos "pesados" do mapa;
 *  2. nenhum componente contém o vocabulário bruto, em PT ou EN;
 *  3. o próprio `numerology.ts` não carrega esse vocabulário em nenhuma
 *     string que já é LText (o que poderia virar texto já está traduzido).
 *
 * Lê FONTE, com comentário incluso — mesmo critério da régua da narrativa.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { computeNumerology } from './numerology';

const RAIZ = process.cwd();

function componentes(): string[] {
  const saida: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) { anda(cheio); continue; }
      if (!/\.tsx?$/.test(nome) || /\.(test|spec)\.tsx?$/.test(nome)) continue;
      saida.push(cheio);
    }
  };
  anda(join(RAIZ, 'src', 'components'));
  saida.push(join(RAIZ, 'src', 'App.tsx'));
  return saida;
}

/** Campos do `NumerologyMap` que carregam a leitura "pesada". */
const CAMPOS_PESADOS = ['karmicDebts', 'karmicLessons', 'karmicDebt', 'challenges', 'pinnacles', 'hiddenPassion'];
/** O vocabulário bruto, PT e EN. */
const VOCABULARIO_BRUTO: RegExp[] = [
  /c[áa]rmic/i, /karmic/i, /d[íi]vida c[áa]rmica/i, /karmic debt/i, /li[çc][ãa]o c[áa]rmica/i,
  /pin[áa]culo/i, /pinnacle/i, /paix[ãa]o oculta/i, /hidden passion/i,
];

describe('numerologia — o jogador nunca vê o vocabulário bruto', () => {
  it('nenhum componente lê os campos pesados do mapa', () => {
    const achados: string[] = [];
    for (const arquivo of componentes()) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const campo of CAMPOS_PESADOS) {
        const re = new RegExp(`\\.${campo}\\b`);
        const m = re.exec(texto);
        if (m) achados.push(`${relative(RAIZ, arquivo)}:${texto.slice(0, m.index).split('\n').length} → .${campo}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('nenhum componente contém o vocabulário bruto (PT/EN)', () => {
    const achados: string[] = [];
    for (const arquivo of componentes()) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const re of VOCABULARIO_BRUTO) {
        const m = re.exec(texto);
        if (m) achados.push(`${relative(RAIZ, arquivo)}:${texto.slice(0, m.index).split('\n').length} → ${m[0]}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('as strings LText do próprio mapa já estão na voz do app (travessia, não desafio)', () => {
    const map = computeNumerology('Ana Silva', '1990-11-25', 2026);
    for (const c of map.challenges) {
      expect(c.label.pt).not.toMatch(/desafio/i);
      expect(c.label.en).not.toMatch(/challenge/i);
      expect(c.label.pt).toMatch(/travessia/i);
      expect(c.label.en).toMatch(/crossing/i);
    }
  });
});
