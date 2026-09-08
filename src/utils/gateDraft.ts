/**
 * RASCUNHO DO PORTÃO DE IDENTIDADE
 * ================================
 *
 * O portão de e-mail (`IDENTITY_STEP` do `SoulmonOnboarding`) manda um link e
 * a pessoa SAI do app para abri-lo. Quando ela volta, `App.tsx` conclui o
 * login e chama `window.location.reload()` — o onboarding remonta do zero e o
 * estado do componente morre junto.
 *
 * Sem persistência, a viagem até o e-mail cobraria de volta o objetivo, a
 * dificuldade e o aceite dos Termos. Um portão que pune quem passa por ele é
 * um portão que ninguém atravessa.
 *
 * **Por que não reusar `oracleDraft.ts`:** ele é o rascunho do RITUAL PAGO e
 * recusa por contrato qualquer passo `< 1` (`readOracleDraft`), justamente
 * para nunca retomar na geração ou depois. O trecho antes da escolha vive em
 * ids negativos. Esticar aquele contrato para caber aqui misturaria duas
 * coisas que têm regras de descarte diferentes — este morre ao terminar o
 * onboarding, aquele morre ao gerar a criatura.
 *
 * **O que NUNCA entra**, pelos mesmos motivos do outro rascunho:
 *
 *  · **o e-mail** — quem prova posse dele é o Firebase, não o `localStorage`;
 *  · **o mês/ano de nascimento do demo** — não é persistido de propósito (ver
 *    `demoAgeMonth` no onboarding): ele serve só para conferir 18+ naquele
 *    instante e não alimenta mapa astral nenhum. A prova de que a checagem
 *    passou é o próprio `consent` guardado aqui;
 *  · qualquer dado de cadastro (apelido, nome do pet, criatura escolhida) —
 *    tudo isso acontece DEPOIS do portão e não é atravessado pela viagem.
 *
 * Funções puras sobre o storage, como as do `oracleDraft`.
 */
import { readJson, writeJson, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { ConsentRecord } from './consent';

export const GATE_DRAFT_VERSION = 1;

export interface GateDraft {
  v: typeof GATE_DRAFT_VERSION;
  soulGoal: string;
  soulStruggle: string;
  /** Prova do aceite dos Termos, tirada nas caixas do portão
   *  (`IDENTITY_STEP`/`GOOGLE_STEP`/`EMAIL_STEP`). O `CONSENT_STEP` que este
   *  comentário citava foi APAGADO em 07/09/2026, quando o aceite desceu para
   *  a própria tela de conta — a referência sobreviveu ao passo. */
  consent: ConsentRecord | null;
  /** ISO de quando foi gravado — só para o leitor humano do storage. */
  savedAt: string;
}

/**
 * Lê o rascunho do portão. Devolve `null` se não houver, se a versão não bater
 * ou se o formato estiver corrompido — o storage é dado NÃO confiável, e um
 * rascunho ilegível nunca pode derrubar o onboarding.
 */
export function readGateDraft(): GateDraft | null {
  const d = readJson<Partial<GateDraft> | null>(STORAGE_KEYS.GATE_DRAFT, null);
  if (!d || typeof d !== 'object') return null;
  if (d.v !== GATE_DRAFT_VERSION) return null;
  return {
    v: GATE_DRAFT_VERSION,
    soulGoal: typeof d.soulGoal === 'string' ? d.soulGoal : '',
    soulStruggle: typeof d.soulStruggle === 'string' ? d.soulStruggle : '',
    // O consent é a peça que as caixas do portão produzem. Se vier
    // quebrado, vale `null`: o onboarding pede o aceite de novo, que é o
    // comportamento seguro. Consentimento presumido não é consentimento.
    consent: d.consent && typeof d.consent === 'object' ? (d.consent as ConsentRecord) : null,
    savedAt: typeof d.savedAt === 'string' ? d.savedAt : '',
  };
}

export function writeGateDraft(
  dados: Pick<GateDraft, 'soulGoal' | 'soulStruggle' | 'consent'>,
  now: Date = new Date(),
): boolean {
  return writeJson(
    STORAGE_KEYS.GATE_DRAFT,
    {
      v: GATE_DRAFT_VERSION,
      soulGoal: dados.soulGoal,
      soulStruggle: dados.soulStruggle,
      consent: dados.consent,
      savedAt: now.toISOString(),
    } satisfies GateDraft,
    { silent: true },
  );
}

export function clearGateDraft(): void {
  removeLocal(STORAGE_KEYS.GATE_DRAFT, { silent: true });
}
