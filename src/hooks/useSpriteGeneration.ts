/**
 * A FIAÇÃO da geração incremental de sprite — quando o lote parte, e só isso.
 *
 * A regra não mora aqui (footgun 9 do `CLAUDE.md`): o gatilho é de
 * `utils/spriteTrigger.ts`, o acervo é de `utils/spriteLibrary.ts`, a execução
 * é de `utils/spriteRunner.ts`. Este hook é o agendador, e ele obedece às
 * **quatro regras de janela** do §3.3 da spec:
 *
 *  1. **Depois do primeiro paint**, nunca antes — o app desenha o pet com a
 *     arte de reserva primeiro (Invariante nº 1 garante que há o que desenhar).
 *  2. **Em ocioso**: `requestIdleCallback` com `timeout: 5000`, ou
 *     `setTimeout(2000)` onde ele não existir. Nunca em efeito de montagem
 *     síncrono — "na abertura do app" é o pior orçamento de CPU e rede que este
 *     app tem.
 *  3. **Nunca durante** a virada do dia, o relatório diário, a cerimônia ou uma
 *     animação de cuidado. Enfileira.
 *  4. **Um lote por vez, serial.** Duas vésperas acumuladas viram dois lotes em
 *     sequência, nunca seis requisições simultâneas.
 *
 * A adoção automática do §2.3.1 (a oferta de sintonizar que expira numa virada
 * de dia) usa **a mesma janela** — é a exigência literal do gate.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { creatureFormId, type CreatureStage } from '../utils/oracle';
import { requestSprite } from '../utils/spriteGen';
import { runSpriteBatch } from '../utils/spriteRunner';
import {
  autoTuneDue, canManualRetry, displaySprite, recordFailure, recordSprite, tuneVisor,
  emptySpriteLibrary, type SpriteLibrary,
} from '../utils/spriteLibrary';
import { spriteBatch, birthBatch, type SpriteTriggerInput } from '../utils/spriteTrigger';

/** Espera o app ficar ocioso. Devolve o cancelador. */
export function whenIdle(fn: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(fn, { timeout: 5000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 2000);
  return () => window.clearTimeout(id);
}

export interface UseSpriteGenerationArgs {
  /** Tudo que o gatilho lê, menos o acervo (que vem de `library`). */
  trigger: Omit<SpriteTriggerInput, 'library'>;
  library: SpriteLibrary;
  /** Grava o acervo no save. Recebe o acervo anterior — nunca um snapshot velho. */
  updateLibrary: (fn: (prev: SpriteLibrary) => SpriteLibrary) => void;
  /** A árvore de 11 formas do jogador (prompts de imagem por forma). */
  stages?: CreatureStage[];
  /** Dia civil corrente (`YYYY-MM-DD`) — governa a adoção automática. */
  dayKey: string;
  /**
   * Momento ruim: virada do dia, relatório diário, cerimônia ou animação de
   * cuidado em curso. Enquanto for `true`, nada parte e nada troca de rosto.
   */
  busy: boolean;
  /**
   * O jogador tem direito a sprite próprio? Isto **não** é pré-checagem de
   * tier — quem decide é o servidor (`custo-geracao-sprite.md` §8). É só o
   * corte de quem nem árvore própria tem (demo), que não teria prompt para
   * mandar.
   */
  enabled: boolean;
  /** Ocasião A: o reveal do Oráculo acabou de fechar. */
  newborn?: boolean;
}

export interface SpriteGenerationStatus {
  /** Formas com lote vivo agora — alimenta o card `GERANDO` (§2.2). */
  generating: string[];
  /** Anúncio de `aria-live` pendente ("Visor sintonizado"), uma vez por adoção. */
  tunedAnnouncement: boolean;
  clearAnnouncement: () => void;
  /** "Sintonizar o Visor" / "Voltar ao traço antigo" — gesto do jogador. */
  tune: (formId: string) => void;
  /**
   * "Tentar de novo" do card de falha de credencial. Obedece `canManualRetry`
   * (teto manual de 3 e cooldown de 60 s) e usa a MESMA máquina do lote — não
   * existe um segundo caminho de geração neste app.
   */
  retry: (formId: string) => void;
}

export function useSpriteGeneration(args: UseSpriteGenerationArgs): SpriteGenerationStatus {
  const { trigger, library, updateLibrary, stages, dayKey, busy, enabled, newborn } = args;
  const [generating, setGenerating] = useState<string[]>([]);
  const [tunedAnnouncement, setTunedAnnouncement] = useState(false);
  /** Um lote por vez: a trava é um ref, não estado (não pode re-renderizar). */
  const running = useRef(false);
  /** Formas com uma retentativa MANUAL já pedida e ainda não despachada. */
  const manualPendente = useRef<Set<string>>(new Set());
  const argsRef = useRef(args);
  argsRef.current = args;

  const tune = useCallback((formId: string) => {
    updateLibrary(prev => tuneVisor(prev, formId));
    setTunedAnnouncement(true);
  }, [updateLibrary]);

  const clearAnnouncement = useCallback(() => setTunedAnnouncement(false), []);

  /**
   * A EXECUÇÃO de um lote — o único lugar deste app que chama a geração.
   *
   * Saiu de dentro do efeito para o botão "Tentar de novo" poder usá-la sem um
   * SEGUNDO caminho de geração. Um teto de dinheiro com duas contabilidades é
   * um teto que não existe: quem grava a falha aqui é o mesmo `recordFailure`
   * que alimenta o `canManualRetry`, e a trava `running` é a mesma, então o
   * gesto do jogador e o lote automático continuam sendo "um lote por vez".
   *
   * `manual` só muda UMA coisa: a falha passa a consumir o teto manual de
   * `SPRITE_MANUAL_RETRY_CAP` (`custo-geracao-sprite.md` §6). Se não consumisse,
   * o teto de 3 nunca chegaria e o botão viraria uma torneira aberta.
   */
  const executarLote = useCallback(
    (formIds: readonly string[], opts: { adoptCurrentNow: boolean; manual?: boolean }) => {
      const a = argsRef.current;
      const byForm = new Map<string, CreatureStage>(
        (a.stages ?? []).map(s => [creatureFormId(s), s]),
      );
      // Forma sem prompt na árvore não vira requisição: `generate` lançaria, e
      // uma falha inventada aqui gastaria o teto manual do jogador por um erro
      // que é nosso. Melhor não partir.
      const alvos = formIds.filter(id => byForm.has(id));
      if (alvos.length === 0) return;

      running.current = true;
      setGenerating([...alvos]);

      void runSpriteBatch(alvos, {
        generate: async formId => {
          const stage = byForm.get(formId);
          if (!stage) throw new Error(`forma sem prompt: ${formId}`);
          // Cadeia image2image: a forma anterior já existe quando a próxima é
          // pedida — é o que a geração incremental compra de graça (§8.6).
          const anterior = displaySprite(argsRef.current.library, argsRef.current.trigger.evolutionStage);
          const { image, provider } = await requestSprite(stage.imagePrompt, {
            promptFallback: stage.imagePromptFallback,
            formId,
            referenceImageUrls: anterior ? [anterior.url] : undefined,
          });
          return { url: image, formId, provider, at: Date.now() };
        },
        onResult: (formId, entry) => {
          // A troca do rosto da forma ATUAL é sempre do jogador (§2.3.1) —
          // exceto no nascimento, onde ainda não há história a proteger.
          const éAtual = formId === argsRef.current.trigger.evolutionStage;
          const adopt = éAtual && !opts.adoptCurrentNow ? 'ask' : 'now';
          argsRef.current.updateLibrary(prev => recordSprite(prev, entry, { adopt, dayKey: argsRef.current.dayKey }));
        },
        onFailure: (formId, kind) => {
          argsRef.current.updateLibrary(prev => recordFailure(prev, formId, kind, { manual: opts.manual }));
        },
        isCancelled: () => argsRef.current.busy,
      }).finally(() => {
        running.current = false;
        setGenerating([]);
      });
    },
    [],
  );

  /**
   * O botão "Tentar de novo" do card de falha de credencial
   * (`EvolutionPath.tsx`, commit 60b0c89b), que nasceu inerte porque
   * `onRetrySprite` é opcional e ninguém o ligava.
   *
   * Quem decide se PODE é `canManualRetry` — teto vitalício da conta, teto por
   * forma, teto manual de 3 e cooldown de 60 s. A tela já pergunta a mesma
   * coisa para decidir se DESENHA o botão; reperguntar aqui não é redundância:
   * entre o render e o toque passa tempo, e o clique é o único momento que
   * gasta dinheiro. Quem tem a última palavra continua sendo o servidor.
   */
  const retry = useCallback((formId: string) => {
    const a = argsRef.current;
    // Toque duplo no MESMO botão não pode virar dois lotes. A trava `running`
    // sozinha não pega este caso: entre o toque e o `whenIdle` o lote ainda não
    // partiu, e o acervo que o `canManualRetry` lê é o do render anterior — em
    // dinheiro, seriam duas chamadas para uma decisão só do jogador.
    if (manualPendente.current.has(formId)) return;
    if (running.current || a.busy) return;
    if (!canManualRetry(a.library, formId)) return;
    manualPendente.current.add(formId);
    // Retentativa manual é gesto: adota a arte na hora. Pedir "sintonizar?"
    // depois de o jogador ter pedido o traço de novo seria perguntar duas
    // vezes a mesma coisa.
    whenIdle(() => {
      manualPendente.current.delete(formId);
      const atual = argsRef.current;
      if (running.current || atual.busy || !canManualRetry(atual.library, formId)) return;
      executarLote([formId], { adoptCurrentNow: true, manual: true });
    });
  }, [executarLote]);

  // ── Adoção automática (§2.3.1): a oferta expira, o sprite não. Mesma janela
  //    do lote — nunca no meio da virada, do relatório ou da cerimônia.
  useEffect(() => {
    if (busy) return;
    const pendente = autoTuneDue(library, dayKey);
    if (!pendente) return;
    return whenIdle(() => {
      updateLibrary(prev => (autoTuneDue(prev, dayKey) ? tuneVisor(prev, pendente, { auto: true }) : prev));
      setTunedAnnouncement(true);
    });
  }, [busy, library, dayKey, updateLibrary]);

  // ── O lote.
  useEffect(() => {
    if (!enabled || busy || running.current) return;
    if (!stages || stages.length === 0) return;

    return whenIdle(() => {
      const a = argsRef.current;
      if (running.current || a.busy || !a.enabled) return;
      const input: SpriteTriggerInput = { ...a.trigger, library: a.library };
      const batch = a.newborn ? birthBatch(input) : spriteBatch(input);
      if (!batch) return;
      // Ocasião A é o NASCIMENTO: não há história a proteger, então a forma
      // atual adota na hora em vez de perguntar.
      executarLote(batch.formIds, { adoptCurrentNow: batch.occasion === 'A' });
    });
    // `library` entra de propósito: quando um lote grava um sprite, a
    // reconciliação roda de novo e pega o PRÓXIMO lote devendo — que é como
    // "duas vésperas acumuladas viram dois lotes em sequência".
  }, [enabled, busy, stages, library, trigger.evolutionStage, trigger.perfectDays, newborn, executarLote]);

  return { generating, tunedAnnouncement, clearAnnouncement, tune, retry };
}

/** Acervo com fallback — save antigo não tem o campo (`?? padrão` de sempre). */
export function libraryOf(state: { spriteLibrary?: SpriteLibrary }): SpriteLibrary {
  return state.spriteLibrary ?? emptySpriteLibrary();
}
