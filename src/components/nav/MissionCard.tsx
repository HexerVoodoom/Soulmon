import type { ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { buildingGateFor, buildingLockLine } from '../../utils/gates';
import type { GoTarget } from '../../utils/missionTargets';
import { Icon } from '../ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { MissionMark } from '../play/MissionMark';

/**
 * COMO UMA MISSÃO SE MOVE (dono, 14/10/2026, REGISTRO §60): quem renderiza a lista recebe isto e só pergunta por alvo.
 * `bondLevel` decide o bloqueio: prédio fechado NÃO navega — o cartão mostra o requisito.
 */
export interface MissionNav {
  bondLevel: number;
  /** Fecha a folha e leva ao prédio (ou à Home). */
  onGo: (target: Exclude<GoTarget, null>) => void;
}

/** O que o cartão faz com o alvo: `onGo` quando pode navegar, `lockNote` quando o prédio ainda está fechado. */
export function resolveGo(nav: MissionNav | undefined, target: GoTarget | undefined, language: Language): { onGo?: () => void; lockNote?: string } {
  if (!nav || !target) return {};
  if (target === 'home') return { onGo: () => nav.onGo('home') };
  const gate = buildingGateFor(target, nav.bondLevel);
  if (!gate.open) return { lockNote: buildingLockLine(gate.minBond, language) };
  return { onGo: () => nav.onGo(target) };
}

export type MissionCardStatus = 'open' | 'ready' | 'claimed';

/**
 * O CARTÃO DE MISSÃO — UM por missão, em todas as abas (dono, 14/10/2026). Mesmo padrão de cartão do app (borda `--sm2-line`,
 * fundo `--sm2-surface`, raio `--sm2-radius-lg`). Ícone: o "!" AMARELO da paleta (arte de quest, sem círculo) enquanto há o que
 * fazer; concluída vira o check. Título (vira botão "Ir" quando a missão tem lugar), descrição curta, progresso, recompensa e
 * estado. Estável em layout: altura mínima fixa e a ação sempre à direita.
 */
export function MissionCard({ language, attrs, status, title, desc, progress, reward, onGo, goAttr = 'data-mission-go', goValue = '', lockNote, action }: {
  language: Language;
  /** Atributos `data-*` do cartão (os ids que os testes e o manual citam). */
  attrs: Record<string, string>;
  status: MissionCardStatus;
  title: string;
  desc?: string;
  progress?: { cur: number; target: number } | null;
  /** Texto curto da recompensa (ex.: "+1 material"). */
  reward?: ReactNode;
  onGo?: () => void;
  goAttr?: string;
  goValue?: string;
  /** Prédio fechado: o requisito, no lugar do "Ir". */
  lockNote?: string;
  /** O botão de Resgatar (já pronto por quem chama) — só aparece com `status="ready"`. */
  action?: ReactNode;
}) {
  const isPt = language === 'pt-BR';
  const claimed = status === 'claimed';
  const titleStyle = { ...sm2Text, margin: 0, fontWeight: 600, color: claimed ? 'var(--sm2-muted)' : 'var(--sm2-ink)', textAlign: 'left' as const };
  return (
    <li
      data-mission-card=""
      data-status={status}
      {...attrs}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '10px 12px', boxSizing: 'border-box',
        borderRadius: 'var(--sm2-radius-lg)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
      }}
    >
      <span aria-hidden={claimed ? undefined : true} style={{ flex: 'none', width: 28, display: 'flex', justifyContent: 'center' }}>
        {claimed
          ? <Icon name="check_circle" size={24} fill={1} tone="primary" label={isPt ? 'resgatada' : 'claimed'} />
          : <MissionMark kind="available" tone="gold" size={28} isPt={isPt} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {onGo && !claimed ? (
          <button
            type="button" {...{ [goAttr]: goValue }} onClick={onGo}
            style={{ ...titleStyle, minHeight: 32, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            {title}
          </button>
        ) : <p style={titleStyle}>{title}</p>}
        {desc && <p style={{ ...sm2Hint, margin: 0 }}>{desc}</p>}
        {progress && progress.cur > 0 && status === 'open' && (
          <>
            <p className="sm2-num" style={{ ...sm2Hint, margin: 0 }}>{progress.cur}/{progress.target}</p>
            <span aria-hidden="true" className="sm2-shop-meter" style={{ width: 120 }}>
              <i style={{ width: `${Math.round(Math.min(1, progress.cur / progress.target) * 100)}%` }} />
            </span>
          </>
        )}
        {reward && !claimed && <p data-mission-reward-text style={{ ...sm2Hint, margin: 0 }}>{reward}</p>}
        {lockNote && !claimed && <p data-mission-lock style={{ ...sm2Hint, margin: 0 }}>{lockNote}</p>}
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        {status === 'ready' && <MissionMark kind="ready" tone="gold" size={24} isPt={isPt} />}
        {status === 'ready' && action}
        {claimed && <span style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>{isPt ? 'Resgatada' : 'Claimed'}</span>}
      </div>
    </li>
  );
}

/** A lista de cartões: um por linha, com espaçamento. */
export function MissionCardList({ children, attrs }: { children: ReactNode; attrs?: Record<string, string> }) {
  return <ul {...attrs} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</ul>;
}

/** O botão de Resgatar padrão. */
export function ClaimButton({ language, attrs, onClick }: { language: Language; attrs?: Record<string, string>; onClick: () => void }) {
  return <button type="button" style={sm2Button('primary', false, 'sm')} {...attrs} onClick={onClick}>{language === 'pt-BR' ? 'Resgatar' : 'Claim'}</button>;
}
