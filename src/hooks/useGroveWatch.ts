/**
 * O App OLHA o Bosque (`docs/PLANO-GUILDA.md` §4): a cerimônia de marco e o aviso
 * da Home precisam saber que o estágio subiu sem a pessoa abrir o Salão.
 *
 * Três decisões:
 *  · **Só pergunta ao servidor quem já tem roda NESTE aparelho** (existe memória
 *    em `groveLocal`): quem nunca abriu a Guilda não paga uma requisição a cada
 *    abertura do app. A folha (`GuildSheet`) e este hook escrevem a mesma memória
 *    pela mesma função (`observeGuildView`), e é o evento `soulmon:grove` que os
 *    junta na mesma aba.
 *  · **Sem timer.** Consulta ao montar e ao voltar ao app (`visibilitychange`),
 *    nunca em intervalo (footgun de re-render/cloud save documentado).
 *  · **Cenários vão para o SAVE** (`onScenes`, chamado fora de updater): é o que
 *    faz o que se ganhou ficar com quem sai (G12). **Só com a confirmação do servidor**
 *    (`mine.groveScenes` da vista que ACABOU de chegar) — nunca do `scenes` guardado no
 *    aparelho, que é um número editável (L3-codigo B1).
 *  · **Uma consulta por volta** (L3-codigo M5): com a folha da Guilda aberta ela mesma
 *    consulta ao voltar ao app, e este hook fica quieto (`isGuildSheetOpen`).
 */
import { useEffect, useRef, useState } from 'react';
import { getGuild } from '../utils/community';
import { playerDayKey, type PlayerDayAnchor } from '../utils/playerDay';
import {
  GROVE_EVENT, groveSceneIds, isGuildSheetOpen, observeGuildView, readGroveLocal, trackGuildStageOnce, type GroveLocal,
} from '../utils/groveLocal';

export function useGroveWatch({ saveId, playerDayTz, onScenes }: {
  saveId: string;
  playerDayTz?: PlayerDayAnchor;
  onScenes: (ids: string[]) => void;
}): GroveLocal | null {
  const [local, setLocal] = useState<GroveLocal | null>(readGroveLocal);
  const tz = useRef(playerDayTz);
  tz.current = playerDayTz;
  const entregar = useRef(onScenes);
  entregar.current = onScenes;

  // A memória mudou (a folha viu um estágio, a cerimônia fechou, a pessoa saiu).
  useEffect(() => {
    const reler = () => setLocal(readGroveLocal());
    window.addEventListener(GROVE_EVENT, reler);
    window.addEventListener('storage', reler);
    return () => {
      window.removeEventListener(GROVE_EVENT, reler);
      window.removeEventListener('storage', reler);
    };
  }, []);

  // Ao montar e ao voltar ao app: só com memória de roda e com a página visível.
  useEffect(() => {
    let vivo = true;
    const olhar = async () => {
      if (document.hidden || isGuildSheetOpen() || !readGroveLocal()) return;
      try {
        const view = await getGuild(saveId, tz.current);
        if (!vivo) return;
        const obs = observeGuildView(view, playerDayKey(new Date(), tz.current));
        trackGuildStageOnce(obs?.firstSeenStage);
        // Cenário liberado → save, mas SÓ o que o servidor confirmou agora (`mine.groveScenes`).
        if (view?.mine.groveScenes) entregar.current(groveSceneIds(view.bosque.stageIndex));
      } catch { /* sem rede / sem login: fica a memória que já existe */ }
    };
    void olhar();
    document.addEventListener('visibilitychange', olhar);
    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', olhar);
    };
  }, [saveId]);

  return local;
}
