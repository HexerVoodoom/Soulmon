import type { CSSProperties } from 'react';
import { DUNGEON_PROP_ART } from '../../assets/soulmon/icones-ui';
import { formatEnergyEta } from '../../utils/hunger';
import type { Language } from '../../utils/i18n';

/**
 * A PLACA DE MADEIRA da Home: "In Dungeon" + o tempo que falta para ele voltar (beta-2 6.2; antes: "Estou na masmorra, volto logo",
 * pedido do dono de 11/10/2026, REGISTRO §36).
 *
 * Fica NO LUGAR do pet enquanto ele está na masmorra (`soulmonNaMasmorra`) — o contrato de encaixe com o cenário (frente A) é este:
 *  · a raiz é `data-pet-masmorra`, com a MESMA caixa de antes (largura fixa `SIGN_W`, altura fixa `SIGN_H` + haste): trocar o texto, o
 *    tempo ou o idioma NUNCA muda o tamanho (nada empurra o cenário nem o sprite);
 *  · `returnInMs` vem de `useDungeonReturn(gameState)` (src/hooks/useDungeonReturn.ts): é o fim projetado da descida a partir do estado
 *    PERSISTIDO — não é contagem de tela, não reinicia ao reabrir, e muda sozinho quando a energia/fome mudam a duração da descida.
 *    `null`/`undefined` = sem número (só o texto curto); `0` = já voltou (toque para recebê-lo).
 *  · é um botão (alvo de toque ≥ 44): tocar abre o aviso "Ele está na masmorra" com o caminho para trazê-lo de volta.
 *
 * Visual: madeira em CSS (veios, pregos, haste) com a porta da masmorra (`DUNGEON_PROP_ART`) como selo — nenhuma imagem nova. Cores da
 * madeira em variáveis locais com fallback; texto creme sobre marrom-escuro (contraste ~8:1). Sem animação, sem som, sem cobrança no texto.
 */
export const SIGN_W = 118;
export const SIGN_H = 46;

const sign: CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', width: SIGN_W, height: SIGN_H, padding: '4px 8px 4px 6px', margin: 0,
  color: 'var(--sm2-wood-ink, #f8ecd2)',
  // madeira: tábua com veios sutis (gradiente repetido) e luz no topo
  backgroundColor: 'var(--sm2-wood, #7a4c24)',
  backgroundImage: 'repeating-linear-gradient(176deg, rgba(0,0,0,0.00) 0 5px, rgba(0,0,0,0.10) 5px 6px), linear-gradient(180deg, rgba(255,255,255,0.14), rgba(0,0,0,0.18))',
  border: '2px solid var(--sm2-wood-edge, #4a2c12)', borderRadius: 6,
  boxShadow: '0 2px 0 var(--sm2-wood-edge, #4a2c12), inset 0 1px 0 rgba(255,255,255,0.16)',
  fontFamily: 'var(--sm2-font-text)', lineHeight: 1.15, textAlign: 'left', cursor: 'pointer',
};
const nail: CSSProperties = { position: 'absolute', width: 3, height: 3, borderRadius: 3, backgroundColor: 'var(--sm2-wood-edge, #4a2c12)', opacity: 0.85 };
const post: CSSProperties = { width: 6, height: 12, backgroundColor: 'var(--sm2-wood-edge, #4a2c12)', borderRadius: '0 0 2px 2px', margin: '0 auto' };

export function DungeonSign({ language, onTap, returnInMs }: { language: Language; onTap?: () => void; returnInMs?: number | null }) {
  const isPt = language === 'pt-BR';
  const label = isPt ? 'Na masmorra' : 'In Dungeon';
  const hasTime = typeof returnInMs === 'number' && Number.isFinite(returnInMs);
  const back = hasTime && (returnInMs as number) <= 0;
  const time = hasTime ? (back ? (isPt ? 'Voltou' : 'Back') : formatEnergyEta(returnInMs as number, isPt)) : null;
  const aria = `${label}${time ? `, ${back ? time : (isPt ? `volta em ${time}` : `back in ${time}`)}` : ''}. ${isPt ? 'Toque para ver' : 'Tap for details'}`;
  return (
    <div data-pet-masmorra style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
      <button type="button" data-dungeon-sign data-dungeon-return={hasTime ? Math.round(returnInMs as number) : undefined} onClick={onTap} aria-label={aria} style={sign}>
        <span aria-hidden="true" style={{ ...nail, top: 3, left: 3 }} />
        <span aria-hidden="true" style={{ ...nail, top: 3, right: 3 }} />
        <img src={DUNGEON_PROP_ART.porta} alt="" width={26} height={26} draggable={false} style={{ flexShrink: 0, imageRendering: 'pixelated' }} />
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span data-dungeon-sign-label style={{ fontSize: 'var(--sm2-text-sm, 12px)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          {time && <span data-dungeon-sign-time className="sm2-num" style={{ fontSize: 'var(--sm2-text-xs, 11px)', fontVariantNumeric: 'tabular-nums', opacity: 0.95, whiteSpace: 'nowrap' }}>{time}</span>}
        </span>
      </button>
      <span aria-hidden="true" style={post} />
    </div>
  );
}
