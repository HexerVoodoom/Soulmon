import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BASE_ELEMENT_LABELS_EN, elementLabel } from './elementLabels';
import { baseElementLabel, essenceEn } from './soulProfile/essenceLabels';
import { elementoNomeDe } from './soulProfile/ficha/elementoNome';
import { COSMETICOS_PLANEJADOS } from './cosmeticosNovos';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';

// 16/11/2026: o nome EN do elemento `vileza` e "Fel"; o PT segue "Vileza". O id nunca muda.
// Allowlist: "Vile Eye" (criatura Olho Vil) e "Lord of the Vile Dead" (titulo de classe) sao adjetivos, nao o elemento.
const PROIBIDO = /vileness|\bmalice\b/i;

describe('elemento vileza: nome EN "Fel"', () => {
  it('as tabelas de nome EN do elemento dizem Fel; o PT continua Vileza', () => {
    expect(BASE_ELEMENT_LABELS_EN.vileza).toBe('Fel');
    expect(elementLabel('vileza', false)).toBe('Fel');
    expect(elementLabel('vileza', true)).toBe('Vileza');
    expect(baseElementLabel('vileza', false)).toBe('Fel');
    expect(elementoNomeDe('vileza')).toEqual({ pt: 'Vileza', en: 'Fel' });
  });

  it('nenhum nome EN de elemento (base, derivado ou cosmetico) usa o nome antigo', () => {
    const textos: string[] = [...Object.values(BASE_ELEMENT_LABELS_EN)];
    for (const d of DERIVED_ELEMENT_PAIRS) textos.push(essenceEn(d.id) ?? '', elementoNomeDe(d.id).en);
    for (const c of COSMETICOS_PLANEJADOS) textos.push(c.nameEn, c.descEn);
    expect(textos.filter(t => PROIBIDO.test(t))).toEqual([]);
  });

  it('cosmeticos do elemento derivam o nome de Fel', () => {
    const bg = COSMETICOS_PLANEJADOS.find(c => c.id === 'bg-el-vileza');
    expect(bg?.nameEn).toBe('Fel Realm');
    expect(COSMETICOS_PLANEJADOS.find(c => c.id === 'frame-el-vileza')?.nameEn).toBe('Fel Ring');
  });

  it('o codigo-fonte nao reintroduz "Vileness" como texto (so este teste cita)', () => {
    const raiz = path.resolve(__dirname, '..');
    const achados: string[] = [];
    const ler = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { ler(p); continue; }
        if (!/\.(ts|tsx)$/.test(e.name) || e.name === 'felRename.test.ts') continue;
        if (/vileness/i.test(fs.readFileSync(p, 'utf8'))) achados.push(path.relative(raiz, p));
      }
    };
    ler(raiz);
    expect(achados).toEqual([]);
  });
});
