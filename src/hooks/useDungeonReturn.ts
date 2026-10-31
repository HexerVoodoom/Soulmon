import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../contexts/GameStateContext';
import { DUNGEON_AWAY_MAX_MS, sanitizeDungeonAway } from '../utils/dungeonIdle';

/**
 * O INSTANTE DE RETORNO do Soulmon que está na masmorra (beta-2 6.2) — para a plaquinha "In Dungeon" da Home.
 *
 * É função do ESTADO PERSISTIDO, nunca de um contador de tela: o instante em que a descida (`dungeonAway`) acaba rejogada pela MESMA conta
 * que vai acertá-la ao voltar (`applyDungeonAway`, determinística), com o teto de `DUNGEON_AWAY_MAX_MS` a partir de `since`.
 *  · Fechar o app, navegar ou reabrir NÃO reinicia: `since` e o resto vêm do save, e a conta dá o mesmo número.
 *  · Muda quando o estado muda de verdade (comer → energia regenera mais depressa → a descida dura mais), e só então.
 *  · Enquanto a projeção carrega (o motor de combate é um chunk à parte), vale o TETO `since + 8 h` — o limite superior honesto.
 *
 * Devolve `returnAt` (epoch ms) ou `null` sem descida em andamento. Recalcula a projeção quando o registro, a energia, a fome ou o
 * contador de camadas mudam — não a cada segundo (`everyMs` só reavalia o "agora" para o texto).
 */
export function useDungeonReturn(state: GameState, everyMs = 30_000): { returnAt: number | null; msLeft: number | null } {
  const away = state.dungeonAway ? sanitizeDungeonAway(state.dungeonAway) : undefined;
  const [now, setNow] = useState(() => Date.now());
  const [projected, setProjected] = useState<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!away) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [!!away, everyMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // a chave da projeção: tudo que a conta lê e que pode mudar o fim da descida
  const key = away
    ? JSON.stringify([away, state.energyPoints, state.energyClock, state.hunger, state.dungeonDaily, state.dungeonDepthRecord, state.totalXP])
    : '';

  useEffect(() => {
    if (!away || away.pausedAt !== undefined) { setProjected(null); return; }
    let vivo = true;
    void import('../utils/dungeonAway').then(({ applyDungeonAway }) => {
      if (!vivo) return;
      try {
        const cap = Math.min(away.since + DUNGEON_AWAY_MAX_MS, away.until ?? Infinity);
        const { report } = applyDungeonAway(state, cap);
        // no fim do foco o `retired` é só o relógio chegando: o retorno é o próprio `cap`; antes disso, o que a conta disser
        const at = report && report.ended && report.ended !== 'retired' ? away.since + report.elapsedMs : cap;
        setProjected({ key, at });
      } catch {
        setProjected(null); // sem projeção: vale o teto
      }
    });
    return () => { vivo = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    if (!away) return { returnAt: null, msLeft: null };
    if (away.pausedAt !== undefined) return { returnAt: null, msLeft: null }; // foco pausado: sem retorno marcado (não há relógio correndo)
    const returnAt = projected && projected.key === key ? projected.at : Math.min(away.since + DUNGEON_AWAY_MAX_MS, away.until ?? Infinity);
    return { returnAt, msLeft: Math.max(0, returnAt - now) };
    // `key` já carrega o `away` serializado: o objeto sai das deps porque o `sanitizeDungeonAway` cria um novo a cada
    // render, e com ele o memo nunca segurava nada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projected, key, now]);
}
