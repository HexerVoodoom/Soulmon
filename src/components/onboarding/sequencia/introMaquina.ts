import { CENAS } from './introCenas';
import { ehInterativo, type Posicao, type Progresso, type Quadro } from './introTipos';

/** Máquina de cenas linear: `idle → cena N (quadro k) → … → concluída` (`null`). Pura, sem React nem storage. */
export const INICIO: Posicao = { cena: 1, quadro: 0 };

export function quadroEm(p: Posicao, cenas: Quadro[][] = CENAS): Quadro | undefined {
  return cenas[p.cena - 1]?.[p.quadro];
}

/** Próxima posição; `null` = acabou a intro. */
export function proxima(p: Posicao, cenas: Quadro[][] = CENAS): Posicao | null {
  const cena = cenas[p.cena - 1];
  if (!cena) return null;
  if (p.quadro + 1 < cena.length) return { cena: p.cena, quadro: p.quadro + 1 };
  for (let c = p.cena; c < cenas.length; c++) if (cenas[c].length > 0) return { cena: c + 1, quadro: 0 };
  return null;
}

/**
 * Pular (N3): pula FALAS, nunca etapa jogável. Vai ao próximo quadro interativo depois de `p`;
 * sem mais nenhum, vai ao fim (`null`).
 */
export function aposPular(p: Posicao, cenas: Quadro[][] = CENAS): Posicao | null {
  let cur = proxima(p, cenas);
  while (cur) {
    const q = quadroEm(cur, cenas);
    if (q && ehInterativo(q)) return cur;
    cur = proxima(cur, cenas);
  }
  return null;
}

/**
 * Valida o que veio do armazenamento local: lixo, posição fora do mapa ou campo de tipo errado volta ao
 * começo (ou ao último quadro válido da cena), nunca lança.
 */
export function normalizar(raw: unknown, cenas: Quadro[][] = CENAS): Progresso {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cena = Number.isInteger(r.cena) ? (r.cena as number) : 1;
  if (cena < 1 || cena > cenas.length) return { ...INICIO };
  const max = Math.max(0, cenas[cena - 1].length - 1);
  const quadro = Number.isInteger(r.quadro) ? Math.min(Math.max(0, r.quadro as number), max) : 0;
  const out: Progresso = { cena, quadro };
  if (typeof r.tarefaId === 'string' && r.tarefaId) out.tarefaId = r.tarefaId;
  if (r.alimentou === true) out.alimentou = true;
  return out;
}
