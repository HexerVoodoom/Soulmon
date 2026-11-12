/**
 * O BOSQUE ESTÁ SOB ATAQUE? (beta12 §G, balão dourado do Bosque.)
 *
 * O sinal já existe no servidor e no cliente: `claPlantio` devolve `underAttack` (a planta está sob ataque hoje e ninguém protegeu
 * ainda; nunca diz QUEM ataca) — é o mesmo dado que o Bosque mostra ("atacada") e que sorteia a luta de proteger. Este hook só o LÊ,
 * com as mesmas regras do `useGroveWatch`: só quem já tem memória de roda NESTE aparelho (`readGroveLocal`) paga a requisição; consulta
 * ao montar e ao voltar ao app (`visibilitychange`), NUNCA em intervalo; chunk do cliente da Guilda carregado sob demanda
 * (`entradaEnxuta.contract`); com a folha da Guilda aberta, quem consulta é ela. Sem rede/sem login/sem roda = `false` (o balão não
 * aparece; nunca erro na cara). Nada vai para o save (`guildNoSave.contract`): é um fato do servidor.
 */
import { useEffect, useRef, useState } from 'react';
import type { PlayerDayAnchor } from '../utils/playerDay';
import { isGuildSheetOpen, readGroveLocal } from '../utils/groveLocal';

/** Só a leitura pura da vista: planta de pé, ainda não madura e atacada hoje. Exportada para teste. */
export const bosqueSobAtaque = (v: { planted: boolean; mature: boolean; underAttack: boolean; protectedToday: boolean } | null | undefined): boolean =>
  !!v && v.planted && !v.mature && v.underAttack && !v.protectedToday;

/** Intervalo mínimo entre duas consultas (voltar à Home várias vezes não vira rajada de requisições). */
export const GROVE_ATAQUE_MIN_MS = 60_000;

/** `reler` muda quando a Home volta à tela (quem passa sabe); a consulta respeita `GROVE_ATAQUE_MIN_MS`. */
export function useGroveAtaque({ saveId, playerDayTz, enabled = true, reler }: { saveId: string; playerDayTz?: PlayerDayAnchor; enabled?: boolean; reler?: unknown }): boolean {
  const [atacado, setAtacado] = useState(false);
  const tz = useRef(playerDayTz);
  const ultima = useRef(0);
  tz.current = playerDayTz;
  useEffect(() => {
    if (!enabled || !saveId) { setAtacado(false); return; }
    let vivo = true;
    const olhar = async () => {
      if (reler === false || document.hidden || isGuildSheetOpen() || !readGroveLocal()) return;
      if (Date.now() - ultima.current < GROVE_ATAQUE_MIN_MS) return;
      ultima.current = Date.now();
      try {
        const { getPlantio } = await import('../utils/claApi');
        const v = await getPlantio(saveId, tz.current);
        if (vivo) setAtacado(bosqueSobAtaque(v));
      } catch { /* sem rede / sem login / sem roda: sem balão */ }
    };
    void olhar();
    document.addEventListener('visibilitychange', olhar);
    return () => { vivo = false; document.removeEventListener('visibilitychange', olhar); };
  }, [saveId, enabled, reler]);
  return atacado;
}
