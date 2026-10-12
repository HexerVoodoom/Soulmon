import type { CSSProperties } from 'react';
import { DUNGEON_PROP_ART } from '../../assets/soulmon/icones-ui';
import type { Language } from '../../utils/i18n';

/**
 * A PLAQUINHA da Home: "Estou na masmorra, volto logo" (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * Fica NO LUGAR do pet enquanto ele está na masmorra (`soulmonNaMasmorra`). Não há arte de placa no repo, então é um componente
 * de CSS com a identidade do app (tokens `--sm2-*`, borda de pixel, a porta da masmorra de `DUNGEON_PROP_ART` como selo) — nada
 * de imagem nova. É um botão: tocar abre o aviso "Ele está na masmorra" com o caminho para trazê-lo de volta. Sem animação
 * (movimento reduzido já está respeitado por não haver nenhuma), sem som, sem cobrança no texto.
 */
const sign: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', width: 118, padding: '5px 7px', margin: 0,
  backgroundColor: 'var(--sm2-surface)', color: 'var(--sm2-ink)', border: '2px solid var(--sm2-line)', borderRadius: 6,
  boxShadow: '0 2px 0 var(--sm2-line)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs, 11px)', lineHeight: 1.2,
  textAlign: 'left', cursor: 'pointer', minHeight: 44,
};
const post: CSSProperties = {
  width: 6, height: 12, backgroundColor: 'var(--sm2-line)', borderRadius: '0 0 2px 2px', margin: '0 auto',
};

export function DungeonSign({ language, onTap }: { language: Language; onTap?: () => void }) {
  const isPt = language === 'pt-BR';
  const text = isPt ? 'Estou na masmorra, volto logo' : 'I’m in the dungeon, back soon';
  return (
    <div data-pet-masmorra style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
      <button type="button" data-dungeon-sign onClick={onTap} aria-label={`${text}. ${isPt ? 'Toque para ver' : 'Tap for details'}`} style={sign}>
        <img src={DUNGEON_PROP_ART.porta} alt="" width={24} height={24} draggable={false} style={{ flexShrink: 0, imageRendering: 'pixelated' }} />
        <span style={{ minWidth: 0 }}>{text}</span>
      </button>
      <span aria-hidden="true" style={post} />
    </div>
  );
}
