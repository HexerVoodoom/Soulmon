import type { LeituraNuvem } from './cloudSave';

/**
 * ADR-004 (D2/D3) — a decisão, pura, do que fazer depois de LER a nuvem.
 *
 *  · `409`     — o servidor recusou o POST (outro aparelho escreveu antes);
 *  · `boot`    — abertura do app com revisão gravada (D2);
 *  · `visivel` — app voltou ao primeiro plano depois de >= 5 min escondido (D2).
 *
 * Resultado:
 *  · `adotar`   — a nuvem vence: backup do local, hidrata, grava a revisão;
 *  · `liberar`  — nuvem vazia: esquece a revisão e libera o POST;
 *  · `esperar`  — não deu para ler: mantém o POST suspenso e tenta de novo;
 *  · `excluida` — 410: `reagirContaExcluida`;
 *  · `ignorar`  — nada a fazer (só D2).
 *
 * Sem heurística de XP: o renascimento baixa XP de propósito. Só a revisão.
 */
export type MotivoReconciliacao = '409' | 'boot' | 'visivel';
export type DecisaoReconciliacao = 'adotar' | 'liberar' | 'esperar' | 'excluida' | 'ignorar';

export function decidirReconciliacao(p: {
  motivo: MotivoReconciliacao;
  leitura: LeituraNuvem;
  revisaoLocal: number | null;
  pendente: boolean;
  /**
   * Só no '409': a revisão que o servidor informou no próprio 409. O GET que vem depois pode ler
   * uma réplica atrasada (KV eventual, ~60 s entre PoPs) e devolver revisão MENOR; adotar isso
   * e postar daria 409 de novo a cada ~3 s. Leitura abaixo dela = 'esperar' (tenta de novo com recuo).
   */
  revisaoMinima?: number;
}): DecisaoReconciliacao {
  const { motivo, leitura, revisaoLocal, pendente, revisaoMinima } = p;
  if (leitura.estado === 'excluida') return 'excluida';
  if (motivo === '409') {
    if (leitura.estado === 'encontrado') {
      if (revisaoMinima !== undefined && leitura.revision !== undefined && leitura.revision < revisaoMinima) return 'esperar';
      return 'adotar';
    }
    if (leitura.estado === 'vazio') return 'liberar';
    return 'esperar';
  }
  // D2: só adota o que a revisão prova ser mais novo, e só sem mudança pendente
  // (com pendência quem decide é o 409 do próximo POST).
  if (leitura.estado !== 'encontrado') return 'ignorar';
  if (pendente || revisaoLocal === null || leitura.revision === undefined) return 'ignorar';
  return leitura.revision > revisaoLocal ? 'adotar' : 'ignorar';
}
