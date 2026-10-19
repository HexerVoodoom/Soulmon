import type { CSSProperties } from 'react';
import { placaMadeira } from '../../assets/soulmon/icones-ui';
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
 * Visual (14/10/2026, dono: "deformada, cortada, texto enorme; tire o ícone da portinha"): só a placa pixel (`placa-madeira.png`, 60×35) em escala inteira 2× com `image-rendering: pixelated`, sem border-image e sem ícone; texto xs centrado na área lisa. Cores da
 * madeira em variáveis locais com fallback; texto creme sobre marrom-escuro (contraste ~8:1). Sem animação, sem som, sem cobrança no texto.
 */
/** Tamanho LÓGICO da placa (proporção 12:7). D-80 (19/10/2026): a arte agora é 480×280 (4× o tamanho lógico de 120×70, suavizada, sem `pixelated`); a caixa na tela continua 60×35 × 2 = 120×70, nunca esticada. */
export const SIGN_ART_W = 60;
export const SIGN_ART_H = 35;
export const SIGN_SCALE = 2;
export const SIGN_W = SIGN_ART_W * SIGN_SCALE;
export const SIGN_H = SIGN_ART_H * SIGN_SCALE;

const sign: CSSProperties = {
  position: 'relative', display: 'block', boxSizing: 'border-box', width: SIGN_W, height: SIGN_H, padding: 0, margin: 0, border: 'none', background: 'none',
  color: 'var(--sm2-wood-ink, #f8ecd2)', fontFamily: 'var(--sm2-font-text)', lineHeight: 1.1, textAlign: 'center', cursor: 'pointer',
};
// a arte ocupa a caixa inteira, sem deformar (SIGN_W/SIGN_H = arte × inteiro) e sem cortar
const art: CSSProperties = { position: 'absolute', inset: 0, width: SIGN_W, height: SIGN_H, imageRendering: 'auto', pointerEvents: 'none' };
// texto na área lisa: abaixo da folha do canto (topo) e dentro dos pregos/bordas
const text: CSSProperties = {
  position: 'absolute', left: 12, right: 12, top: 24, bottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
  textShadow: '0 1px 0 var(--sm2-wood-edge, #4a2c12)', overflow: 'hidden',
};
const post: CSSProperties = { width: 6, height: 12, backgroundColor: 'var(--sm2-wood-edge, #4a2c12)', borderRadius: '0 0 2px 2px', margin: '0 auto' };

export function DungeonSign({ language, onTap, returnInMs }: { language: Language; onTap?: () => void; returnInMs?: number | null }) {
  const isPt = language === 'pt-BR';
  const hasTime = typeof returnInMs === 'number' && Number.isFinite(returnInMs);
  const back = hasTime && (returnInMs as number) <= 0;
  // Já voltou: o TÍTULO muda (F2 do crítico: "In Dungeon" + "Back" se contradizia); a segunda linha completa a frase.
  const label = back ? (isPt ? 'Voltou' : 'Back') : (isPt ? 'Na masmorra' : 'In Dungeon');
  const time = hasTime ? (back ? (isPt ? 'da masmorra' : 'from the Dungeon') : formatEnergyEta(returnInMs as number, isPt)) : null;
  const aria = back
    ? `${label} ${time}. ${isPt ? 'Toque para receber' : 'Tap to welcome him'}`
    : `${label}${time ? `, ${isPt ? `volta em ${time}` : `back in ${time}`}` : ''}. ${isPt ? 'Toque para ver' : 'Tap for details'}`;
  return (
    <div data-pet-masmorra style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
      {/* alvo de toque ≥ 44: a placa tem 120×70 */}
      <button type="button" data-dungeon-sign data-dungeon-return={hasTime ? Math.round(returnInMs as number) : undefined} onClick={onTap} aria-label={aria} style={sign}>
        <img src={placaMadeira} alt="" width={SIGN_W} height={SIGN_H} draggable={false} style={art} />
        <span style={text}>
          <span data-dungeon-sign-label style={{ fontSize: 'var(--sm2-text-xs, 11px)', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
          {time && <span data-dungeon-sign-time className="sm2-num" style={{ fontSize: 'var(--sm2-text-xs, 11px)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{time}</span>}
        </span>
      </button>
      <span aria-hidden="true" style={post} />
    </div>
  );
}
