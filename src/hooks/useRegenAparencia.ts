/**
 * A FIAÇÃO do "Gerar de novo" a aparência (Laboratório › Perfil; rodada 5, Lane B; REGISTRO §34b).
 *
 * Aqui só mora o gesto: a regra de cota, tier e dinheiro é do SERVIDOR (`functions/api/_spriteRegen.js` — débito antes, idempotente por `opId`,
 * devolve se falhar) e a regra de tela é de `utils/spriteRegen.ts`. O hook faz UM pedido por gesto, com UM `opId` (a rede que cai é
 * reenviada uma vez com o MESMO id: o servidor não cobra de novo), e depois do pedido confere o saldo REAL no servidor para dizer a
 * verdade sobre o que aconteceu — nunca afirma "devolvido" sem o saldo mostrar isso.
 *
 * É um caminho de geração à parte do lote (`useSpriteGeneration`) de propósito: o lote nunca cobra; este só parte por toque, depois de
 * uma confirmação, e a trava `busy` impede dois ao mesmo tempo (um deles e o lote).
 */
import { useCallback, useRef, useState } from 'react';
import { creatureFormId } from '../utils/oracle/base';
import type { CreatureStage } from '../utils/oracle';
import { requestSprite, SpriteGenError } from '../utils/spriteGen';
import { discardNewSprite, recordSprite, tuneVisor, type SpriteLibrary } from '../utils/spriteLibrary';
import {
  markRegenUsed, newRegenOpId, regenAvailability, regenFailureWhy, regenMonthOf,
  type RegenAvailability, type RegenOutcome,
} from '../utils/spriteRegen';
import { fetchEntitlement } from '../utils/entitlements';
import { emitFeat } from '../utils/feats';

export type RegenWhy = Extract<RegenOutcome, { kind: 'not-charged' }>['why'];

export interface RegenNotice {
  why: RegenWhy;
  /** O saldo do servidor mostra que NADA ficou cobrado (igual ou maior que o de antes do pedido); `null` = não deu para conferir. */
  refunded: boolean | null;
}

export interface UseRegenAparenciaArgs {
  library: SpriteLibrary;
  updateLibrary: (fn: (prev: SpriteLibrary) => SpriteLibrary) => void;
  stages?: CreatureStage[];
  /** A forma ATUAL. */
  formId: string;
  accountTier: 'demo' | 'paid' | undefined;
  credits: number;
  /** O servidor devolveu o saldo real: a tela atualiza o espelho. */
  onCredits: (credits: number) => void;
  /** Sem saldo: abre os Créditos (o `CreditsModal`). */
  onNeedCredits: () => void;
  dayKey: string;
  /** Uma geração do lote está em andamento. */
  generatingOther: boolean;
}

export interface RegenAparencia {
  availability: RegenAvailability;
  /** `true` entre o toque de confirmar e a resposta. */
  working: boolean;
  /** `true` depois do 1º toque, antes de confirmar (a compra pede um segundo toque). */
  confirming: boolean;
  notice: RegenNotice | null;
  ask: () => void;
  cancel: () => void;
  confirm: () => void;
  keepCurrent: () => void;
  useNew: () => void;
}

export function useRegenAparencia(args: UseRegenAparenciaArgs): RegenAparencia {
  const { library, formId, accountTier, credits, generatingOther } = args;
  const [working, setWorking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<RegenNotice | null>(null);
  const argsRef = useRef(args);
  argsRef.current = args;
  /** Um gesto por vez, também contra toque duplo antes do re-render. */
  const emVoo = useRef(false);

  const availability = regenAvailability({ accountTier, credits, library, formId, busy: working || generatingOther });

  const ask = useCallback(() => {
    const a = argsRef.current;
    const av = regenAvailability({ accountTier: a.accountTier, credits: a.credits, library: a.library, formId: a.formId, busy: emVoo.current || a.generatingOther });
    setNotice(null);
    if (av === 'no-credits') { a.onNeedCredits(); return; }
    if (av === 'ok') setConfirming(true);
  }, []);

  const cancel = useCallback(() => setConfirming(false), []);

  const confirm = useCallback(() => {
    if (emVoo.current) return;
    const a = argsRef.current;
    const stage = (a.stages ?? []).find(s => creatureFormId(s) === a.formId);
    if (!stage) return;
    emVoo.current = true;
    setConfirming(false);
    setWorking(true);
    setNotice(null);
    const antes = a.credits;
    const opId = newRegenOpId();
    const mes = regenMonthOf();
    void (async () => {
      try {
        let res: Awaited<ReturnType<typeof requestSprite>> | null = null;
        for (let tentativa = 0; tentativa < 2 && !res; tentativa++) {
          try {
            res = await requestSprite(stage.imagePrompt, { promptFallback: stage.imagePromptFallback, formId: a.formId, regenPaid: { opId } });
          } catch (err) {
            // Rede que caiu: UM reenvio com o MESMO `opId` (o servidor devolve a imagem do gesto se ele já terminou, sem cobrar de novo).
            if (err instanceof SpriteGenError && err.status === 0 && tentativa === 0) continue;
            throw err;
          }
        }
        if (!res) throw new SpriteGenError('error', 0, 'network error');
        const image = res.image;
        const provider = res.provider;
        argsRef.current.updateLibrary(prev => markRegenUsed(
          recordSprite(prev, { url: image, formId: a.formId, provider, at: Date.now() }, { adopt: 'ask', dayKey: argsRef.current.dayKey }),
          a.formId,
          mes,
        ));
        emitFeat('regens');
        if (typeof res.credits === 'number') argsRef.current.onCredits(res.credits);
        else void fetchEntitlement().then(e => { if (e) argsRef.current.onCredits(e.credits); });
      } catch (err) {
        const status = err instanceof SpriteGenError ? err.status : 0;
        const code = err instanceof Error ? err.message : '';
        const why = regenFailureWhy(status, code);
        // O saldo REAL, para falar a verdade: igual ao de antes = nada ficou cobrado (o servidor já devolveu, se tinha cobrado).
        const ent = await fetchEntitlement();
        if (ent) argsRef.current.onCredits(ent.credits);
        if (why === 'month-used') argsRef.current.updateLibrary(prev => markRegenUsed(prev, a.formId, mes));
        if (why === 'no-credits') argsRef.current.onNeedCredits();
        setNotice({ why, refunded: ent ? ent.credits >= antes : null });
      } finally {
        emVoo.current = false;
        setWorking(false);
      }
    })();
  }, []);

  const keepCurrent = useCallback(() => {
    argsRef.current.updateLibrary(prev => discardNewSprite(prev, argsRef.current.formId));
  }, []);

  const useNew = useCallback(() => {
    argsRef.current.updateLibrary(prev => tuneVisor(prev, argsRef.current.formId));
  }, []);

  return { availability, working, confirming, notice, ask, cancel, confirm, keepCurrent, useNew };
}
