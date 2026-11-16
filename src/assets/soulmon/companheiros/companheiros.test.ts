// Sprites fixos do companheiro invocado: 32 ids; asset ausente (o PNG chega em outro PR) é tolerado.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { CRIATURAS_COMPANHEIRO } from '../../../utils/companheiroInvocado';
import { COMPANHEIRO_SPRITES, spriteDoCompanheiro } from './index';

describe('sprites do companheiro', () => {
  it('lista os 32 ids esperados', () => {
    expect(CRIATURAS_COMPANHEIRO).toHaveLength(32);
  });

  it('só tem chave de id conhecido e cada chave tem arquivo em disco', () => {
    const emDisco = new Set(readdirSync(resolve(__dirname)).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)));
    for (const id of Object.keys(COMPANHEIRO_SPRITES)) {
      expect(CRIATURAS_COMPANHEIRO).toContain(id);
      expect(emDisco.has(id)).toBe(true);
    }
    // PNG em disco com nome fora das 32 = erro de digitação no lote
    for (const nome of emDisco) expect(CRIATURAS_COMPANHEIRO).toContain(nome);
  });

  // PR 1b: o dono escolhe entre 1ª geração e refeita; até lá os 32 PNG estão PENDENTES. Ao chegar o PNG de um id, tire-o daqui:
  // a presença passa a ser exigida (256x256 RGBA, < 150 KB). Lista vazia = os 32 obrigatórios.
  const PENDENTES: readonly string[] = [...CRIATURAS_COMPANHEIRO];

  it('PNG presente é 256x256 RGBA com alfa e < 150 KB; ausente só se estiver nos pendentes', () => {
    for (const id of CRIATURAS_COMPANHEIRO) {
      const arq = resolve(__dirname, `${id}.png`);
      if (!existsSync(arq)) {
        expect(PENDENTES, `${id} sumiu e não está pendente`).toContain(id);
        expect(spriteDoCompanheiro(id)).toBeUndefined();
        continue;
      }
      expect(PENDENTES, `${id} já existe: tire de PENDENTES`).not.toContain(id);
      expect(statSync(arq).size, id).toBeLessThan(150 * 1024);
      const b = readFileSync(arq);
      expect(b.subarray(1, 4).toString('latin1'), id).toBe('PNG');
      expect(b.readUInt32BE(16), `${id} largura`).toBe(256);
      expect(b.readUInt32BE(20), `${id} altura`).toBe(256);
      expect(b[25], `${id} color type RGBA`).toBe(6);
      expect(typeof spriteDoCompanheiro(id), id).toBe('string');
    }
    expect(Object.keys(COMPANHEIRO_SPRITES)).toHaveLength(CRIATURAS_COMPANHEIRO.length - PENDENTES.length);
  });

  it('id ausente, desconhecido ou lixo devolve undefined sem lançar', () => {
    expect(spriteDoCompanheiro('dragao_azul')).toBeUndefined();
    expect(spriteDoCompanheiro('__proto__')).toBeUndefined();
    expect(spriteDoCompanheiro(null)).toBeUndefined();
    expect(spriteDoCompanheiro(undefined)).toBeUndefined();
    for (const id of CRIATURAS_COMPANHEIRO) {
      const url = spriteDoCompanheiro(id);
      expect(url === undefined || typeof url === 'string').toBe(true);
    }
  });
});
