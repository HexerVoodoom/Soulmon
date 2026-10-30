/**
 * A TORCIDA DO CHEFE DA FEIRA (30/10/2026, dono: torcida em TODA luta).
 *
 * O golpe do chefe é re-simulado pelo SERVIDOR (1x/dia, semente dele). A torcida entra assim: esta tela abre ANTES do ataque, com a
 * cena parada e o mascote; cada toque enche a barra de torcida e é contado por BALDE de tempo (`CHEER.bucketSeconds`, até
 * `CHEER.tapsCapPerBucket`, como no Duelo). Ao tocar em "Ir" (ou ao acabar a janela de `BOSS_CHEER_SECONDS`) os baldes vão na
 * requisição do ataque e o servidor os higieniza e os põe na janela de QUEM ataca: o resultado segue autoritativo e
 * determinístico. Sem tocar = o ataque de sempre. Mudo (R-NOVA).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { BattleStage, BATTLE_LAYER_STYLE, type StageFighter } from '../games/BattleStage';
import { TorcidaLayer } from '../games/TorcidaKit';
import { sm2Button } from '../form/FormKit';
import { CHEER } from '../../utils/combate/specials';
import { BOSS_ROSTER, bossArt, bossText } from '../../data/bossRoster';
import type { BossFightMe } from './BossFightScreen';
import type { Language } from '../../utils/i18n';

/** A janela do golpe, em s (o mesmo `FIGHT_SECONDS` do servidor): fora dela os toques não valem. */
export const BOSS_CHEER_SECONDS = 30;
export const BOSS_CHEER_BUCKETS = Math.ceil(BOSS_CHEER_SECONDS / CHEER.bucketSeconds);

/** Conta um toque no balde do instante `elapsedMs`, respeitando o teto por balde. Pura. */
export function addBossTap(taps: readonly number[], elapsedMs: number): number[] {
  const out = Array.from({ length: BOSS_CHEER_BUCKETS }, (_, i) => taps[i] ?? 0);
  const b = Math.floor(Math.max(0, elapsedMs) / 1000 / CHEER.bucketSeconds);
  if (b < BOSS_CHEER_BUCKETS && out[b] < CHEER.tapsCapPerBucket) out[b] += 1;
  return out;
}

export function BossCheerPrelude({ language, bossId, level, poolPct, me, busy, onGo }: {
  language: Language; bossId: string; level: number; poolPct: number; me: BossFightMe; busy?: boolean;
  /** Os toques por balde. Chamado uma vez. */
  onGo: (taps: number[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const entry = BOSS_ROSTER.find(b => b.id === bossId);
  const text = entry ? bossText(entry, isPt) : { name: bossId };
  const art = bossArt(bossId, 'corpo-inteiro') ?? bossArt(bossId) ?? '';
  const taps = useRef<number[]>(Array.from({ length: BOSS_CHEER_BUCKETS }, () => 0));
  const t0 = useRef(Date.now());
  const sent = useRef(false);
  const [n, setN] = useState(0);
  const go = useCallback(() => {
    if (sent.current) return;
    sent.current = true;
    onGo(taps.current.slice());
  }, [onGo]);
  useEffect(() => {
    const id = window.setTimeout(go, BOSS_CHEER_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [go]);
  const tap = () => { taps.current = addBossTap(taps.current, Date.now() - t0.current); setN(x => x + 1); };

  const meMax = me.maxHp ?? 100;
  const foe: StageFighter = { key: `boss-${bossId}`, sprite: art, name: text.name, hp: poolPct, maxHp: 100, element: entry?.elements[0]?.id ?? 'neutro' };
  const meF: StageFighter = { key: 'me', sprite: me.sprite, scale: me.scale, name: me.name, hp: meMax, maxHp: meMax, element: me.element };
  return (
    <TorcidaLayer onTap={tap} active={!busy} isPt={isPt} style={BATTLE_LAYER_STYLE} mascot cheerRatio={(n % CHEER.tapsFull) / CHEER.tapsFull}>
      <div data-boss-cheer style={{ display: 'contents' }} />
      <BattleStage
        me={meF} foes={[foe]} action={null} hit={[]}
        title={isPt ? 'Chefe da Feira' : 'Fair boss'}
        closeLabel={isPt ? 'Ir sem torcer' : 'Go without cheering'}
        onClose={go}
        isPt={isPt}
        boss={{ poolPct, name: text.name, levelLabel: isPt ? `Nv ${level}` : `Lv ${level}` }}
      >
        <p data-boss-cheer-hint style={{ position: 'absolute', left: 16, right: 16, bottom: 72, margin: 0, textAlign: 'center', color: 'var(--sm2-viewport-ink)', textShadow: '0 1px 2px rgba(0,0,0,.9)', pointerEvents: 'none' }}>
          {isPt ? 'Toque na tela para torcer pelo seu Soulmon!' : 'Tap the screen to cheer your Soulmon on!'}
        </p>
        <button type="button" data-boss-cheer-go disabled={busy} onClick={go} style={{ ...sm2Button('primary', !!busy), position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 6, pointerEvents: 'auto', minHeight: 44 }}>
          {isPt ? 'Ir!' : 'Go!'}
        </button>
      </BattleStage>
    </TorcidaLayer>
  );
}
