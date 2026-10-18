/**
 * As árvores e o panorama do Bosque (18/10/2026). Só `.webp` (as PNG de origem ficam fora do repo):
 * pixel art HD (v2): árvores webp lossless, alfa, 512 px de altura, base alinhada; panorama opaco 1700×1129 (q38, teto de imagem 400 KB).
 * `ARVORE_SRC[estacao][nivel]`, nível 1 (broto) .. 5 (aperfeiçoada).
 */
import { ESTACOES_BOSQUE, type EstacaoBosque } from '../../utils/bosqueArvores';
import panorama from './panorama-bosque.webp';

const arquivos = import.meta.glob<string>('./arvore-*-*.webp', { eager: true, query: '?url', import: 'default' });


export const ARVORE_SRC = Object.fromEntries(
  ESTACOES_BOSQUE.map(e => [e, Object.fromEntries([1, 2, 3, 4, 5].map(n => [n, arquivos[`./arvore-${e}-${n}.webp`]]))]),
) as Record<EstacaoBosque, Record<number, string>>;

export const PANORAMA_SRC: string = panorama;
