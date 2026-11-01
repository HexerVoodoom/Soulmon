import { useEffect, useState } from 'react';

/**
 * AVISO DE SOULMON DESGARRADO NA HOME (01/11/2026, REGISTRO §213 emenda): quem volta depois de 90+ dias encontra o próprio
 * Soulmon marcado como desgarrado — ele segue aparecendo para os outros até o dono completar todas as tarefas do dia em
 * 2 dias seguidos (o servidor recalcula a partir do save). Linha curta, âmbar (convite, não culpa), sem modal; some sozinha
 * quando o servidor responde que não há marca. Falha de rede = nada aparece.
 */
export interface StrayStatus { stray: boolean; progress: number; needed: number }

export function strayRecoveryText(s: StrayStatus, isPt: boolean): string {
  const n = Math.max(0, Math.min(s.needed, s.progress));
  return isPt
    ? `Seu Soulmon se desgarrou enquanto você esteve fora. Complete todas as tarefas do dia por ${s.needed} dias seguidos para trazê-lo de volta (${n}/${s.needed}).`
    : `Your Soulmon went stray while you were away. Complete all of the day's tasks ${s.needed} days in a row to bring it back (${n}/${s.needed}).`;
}

export function StrayRecoveryNotice({ saveId, language, disabled = false, refreshKey }: { saveId: string; language: string; disabled?: boolean; refreshKey?: unknown }) {
  const isPt = language === 'pt-BR';
  const [status, setStatus] = useState<StrayStatus | null>(null);
  useEffect(() => {
    if (disabled || !saveId) return;
    let vivo = true;
    import('../../utils/community')
      .then(m => m.getStrayStatus(saveId))
      .then(r => { if (vivo && r && typeof r.stray === 'boolean') setStatus({ stray: r.stray, progress: Number(r.progress) || 0, needed: Number(r.needed) || 2 }); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [saveId, disabled, refreshKey]);
  if (!status?.stray) return null;
  return (
    <p role="status" className="sm2-lib-alert" data-stray-recovery={`${status.progress}/${status.needed}`}>
      {strayRecoveryText(status, isPt)}
    </p>
  );
}
