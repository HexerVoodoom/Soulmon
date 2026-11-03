import { useRef, useState, type CSSProperties } from 'react';
import { nextDungeonSpeed, sanitizeDungeonSpeed, type DungeonSpeed } from '../../utils/dungeonIdle';
import { readLocal, writeLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';

/**
 * A VELOCIDADE PADRÃO DOS COMBATES (pedido do dono, 03/11/2026): todo combate que o jogador assiste tem o MESMO botão, "1x" ↔ "Fast"
 * (o fator interno segue 3×, `DUNGEON_SPEEDS`). A preferência é UMA só por aparelho (`STORAGE_KEYS.DUNGEON_SPEED`), compartilhada por
 * Masmorra, Pesadelo, Arena, Fenda e Bosque. Só encurta o relógio da cena (`useGroupBattle.speed`): o núcleo decide a luta pela
 * semente, então o resultado é o mesmo em qualquer velocidade. O Torneio ranqueado e os replays de servidor (PvP/Chefe) não usam.
 */
export function useBattleSpeed(): { speed: DungeonSpeed; speedRef: { current: DungeonSpeed }; cycle: () => void } {
  const [speed, setSpeed] = useState<DungeonSpeed>(() => sanitizeDungeonSpeed(readLocal(STORAGE_KEYS.DUNGEON_SPEED)));
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const cycle = () => {
    const n = nextDungeonSpeed(speedRef.current);
    speedRef.current = n;
    setSpeed(n);
    writeLocal(STORAGE_KEYS.DUNGEON_SPEED, String(n));
  };
  return { speed, speedRef, cycle };
}

/** O rótulo na tela: "1x" ou "Fast" (nas duas línguas, pedido do dono). */
export const battleSpeedLabel = (speed: DungeonSpeed): string => (speed > 1 ? 'Fast' : '1x');

const BASE_STYLE: CSSProperties = {
  pointerEvents: 'auto', background: 'none', border: 'none', boxShadow: 'none', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer',
  color: 'var(--sm2-viewport-ink)', fontSize: 'var(--sm2-text-md, 16px)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.8)',
  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
};

/** O botão. `corner` o prende no canto inferior direito da cena (quando a tela não tem um slot próprio para ele). */
export function BattleSpeedButton({ speed, onCycle, isPt, corner = false, attr = 'data-battle-speed' }: {
  speed: DungeonSpeed; onCycle: () => void; isPt: boolean; corner?: boolean; attr?: string;
}) {
  const fast = speed > 1;
  const attrs = { [attr]: speed } as Record<string, number>;
  return (
    <button
      type="button" {...attrs} data-battle-speed={speed} onClick={onCycle}
      aria-label={isPt ? `Avanço rápido: ${fast ? 'ligado' : 'desligado'}. Toque para ${fast ? 'desligar' : 'ligar'}.` : `Fast forward: ${fast ? 'on' : 'off'}. Tap to turn ${fast ? 'off' : 'on'}.`}
      className="sm2-num"
      style={corner ? { ...BASE_STYLE, position: 'absolute', right: 8, bottom: 8, zIndex: 5 } : BASE_STYLE}
    >
      {battleSpeedLabel(speed)}
    </button>
  );
}
