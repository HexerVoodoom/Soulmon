import { useEffect, useState } from 'react';
import type { Language } from '../../utils/i18n';
import { EXPLORACAO_CHAVE_BOX } from '../../utils/areaLotGeometry';
import { formatEnergyCountdown } from '../../utils/hunger';
import chaveArt from '../../assets/soulmon/icones-ui/interacao/recompensa-chave.png';

/**
 * A CHAVE DO CALABOUÇO NO MAPA DA EXPLORAÇÃO (13/11/2026, dono): com a chave valendo, o ícone da chave (arte do dono,
 * `recompensa-chave.png`) e o relógio do quanto falta para ela expirar, na ponte entre o Passeio e o Calabouço.
 * Sem chave (ou quando o relógio zera), não desenha nada. Mora no palco da imagem (`AreaScene` › `palco`), em % da arte,
 * como os rótulos dos prédios pintados. Só visual: não recebe toque. O relógio anda sozinho (1 s); a regra é de `focusKey.ts`.
 */
export function DungeonKeyBadge({ expiresAt, language }: { expiresAt: number | null | undefined; language: Language }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (expiresAt == null) return null;
  const restante = expiresAt - now;
  if (restante <= 0) return null;
  const isPt = language === 'pt-BR';
  const relogio = formatEnergyCountdown(restante);
  const h = Math.floor(restante / 3_600_000);
  const min = Math.floor((restante % 3_600_000) / 60_000);
  const falado = isPt ? `Chave do Calabouço: expira em ${h} h ${min} min` : `Dungeon key: expires in ${h} h ${min} min`;
  const [l, t, r, b] = EXPLORACAO_CHAVE_BOX;
  return (
    <div
      data-dungeon-key-badge
      style={{
        position: 'absolute', left: `${l}%`, top: `${t}%`, width: `${r - l}%`, height: `${b - t}%`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100,
      }}
    >
      <span
        role="img"
        aria-label={falado}
        style={{
          // A mesma pílula dos rótulos dos prédios (`AreaScene`): fundo escuro, fio de cobre, ícone + texto.
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 5px', whiteSpace: 'nowrap',
          borderRadius: 999, background: 'color-mix(in srgb, #06171A 82%, transparent)', border: '1px solid rgba(200, 150, 80, .75)',
          boxShadow: '0 1px 4px rgba(0,0,0,.55)',
          fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xs)', fontWeight: 800, letterSpacing: '0.06em',
          color: '#E9F5F2', fontVariantNumeric: 'tabular-nums',
        }}
      >
        <img src={chaveArt} alt="" aria-hidden="true" draggable={false} width={24} height={24} style={{ width: 24, height: 24, display: 'block', flex: 'none', imageRendering: 'pixelated' }} />
        <span data-dungeon-key-timer aria-hidden="true">{relogio}</span>
      </span>
    </div>
  );
}
