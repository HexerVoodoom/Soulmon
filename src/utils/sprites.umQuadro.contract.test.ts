import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * D5 (decisão do dono, 15/09 e reafirmada em 20/09/2026): CADA criatura tem UM
 * ÚNICO sprite — nunca spritesheet, nunca variação de pose. A expressão vem
 * por deformação CSS (bounce/squash), os efeitos vêm de `animArt` AO REDOR.
 *
 * Régua anti-tira: a projeção horizontal do alfa de todo `lines/*.png` tem
 * UMA corrida larga de colunas opacas. Três arquivos da Serah eram tiras de
 * 4 quadros num 256² (achado das críticas de Estatísticas/Social, 20/09) e
 * a masmorra desenhava quatro pintinhos — consertado em `7ea27825`.
 */
const LINES = path.resolve(__dirname, '../assets/soulmon/lines');

async function corridas(arquivo: string): Promise<number> {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const col = new Int32Array(info.width);
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 200) col[x]++;
  // "quadro" = corrida de colunas com ≥2 px opacos e largura ≥ 15 % da imagem;
  // vãos de até 12 colunas não separam (um tridente afastado do corpo não é
  // um segundo quadro — uma tira tem quadros de largura parecida e vãos limpos).
  const runs: number[] = [];
  let ini = -1, vazio = 0;
  for (let x = 0; x < info.width; x++) {
    if (col[x] >= 2) { if (ini < 0) ini = x; vazio = 0; }
    else if (ini >= 0 && ++vazio > 12) { runs.push(x - vazio - ini); ini = -1; vazio = 0; }
  }
  if (ini >= 0) runs.push(info.width - ini);
  return runs.filter(w => w >= info.width * 0.15).length;
}

describe('D5 — um sprite por criatura (anti-tira)', () => {
  const arquivos = fs.readdirSync(LINES).filter(f => f.endsWith('.png'));
  it('há sprites para medir', () => { expect(arquivos.length).toBeGreaterThan(30); });
  it('nenhum `lines/*.png` é uma tira de quadros (uma corrida larga por arquivo)', async () => {
    const tiras: string[] = [];
    for (const f of arquivos) if ((await corridas(path.join(LINES, f))) > 1) tiras.push(f);
    expect(tiras, 'tiras de quadros — cada criatura tem UM sprite (D5)').toEqual([]);
  });
});
