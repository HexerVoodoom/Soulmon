// ---------------------------------------------------------------------------
// Cascata geracional — a RÉPLICA MÍNIMA da regra do class-system que a ficha
// do Soulmon precisa para distribuir pontos como um jogador distribuiria.
//
// Regra (fonte da verdade: `vendor/class-system/index.js`, `calcularCascata`):
//
//   alimento(base) = pontos diretos + TRANSBORDO de sinergia de alvo único
//   passivos(par)  = min(floor(alimento(a)/5), floor(alimento(b)/5))
//   destravado(par) = passivos >= 10              — aceita ponto direto
//   custo do ponto direto num par = 2 de orçamento (base = 1)
//
// O **transbordo de sinergia de alvo único** (`SINERGIAS` com `para.length===1`)
// entrou no class-system em `fb866455` (PR #8, "sinergia de alvo único
// alimenta o destrave"): cada elemento com pontos diretos empurra
// `floor(pontos * razao)` para o seu único alvo ANTES da divisão, e esse bônus
// conta na cascata como se fosse ponto. Ex.: 40 em `luz` dá +4 em `vida`
// (razão 0.1) — 14 diretos em `vida` viram 18 de alimento, e o par
// `luz+vida` sai com 3 passivos em vez de 2. Sinergia de LEQUE (`vida` para
// os primais, `arcano` para os sete) fica de fora: o motor filtra por
// `para.length === 1`, e replicar isso errado inflaria a ficha inteira.
//
// A tabela de sinergias NÃO é copiada à mão: vem de `cascata.fixtures.json`,
// gerado do PRÓPRIO vendor por `npm run gen:cascata-fixtures`. Regra copiada é
// regra que diverge em silêncio (footgun 9) — e foi assim que esta réplica
// ficou 8 dias divergindo do motor sem nenhum teste vermelho.
//
// O Soulmon modela DE PROPÓSITO só as gerações 1 e 2: a linguagem de essência
// do pet são os 17 base + 136 pares (essenceLabels PT+EN); triplas/quádruplas
// são capacidade do class-system e continuam alcançáveis por quem levar a
// ficha exportada para lá. `cascata.parity.test.ts` compara esta réplica com o
// MOTOR VIVO vendorizado, par a par, sobre os casos do fixture — e os quatro
// diais abaixo são afirmados um a um, porque fixture de comportamento não pega
// PREÇO: `CUSTO_PONTO_PAR` sobrevivia a qualquer mutação sem derrubar teste.
// ---------------------------------------------------------------------------

import type { ClassElementId } from '../types';
import { DERIVED_ELEMENT_PAIRS, type DerivedElementDef } from '../derivedElements';
import fixturesJson from './cascata.fixtures.json';

/** Espelhos dos diais de `Class-System/src/registry/geracoes.ts` (gen 1–2). */
export const DIVISOR_CASCATA_PAR = 5;
export const LIMIAR_DESTRAVAMENTO_PAR = 10;
export const CUSTO_PONTO_BASE = 1;
/** Paridade com os pais ({1,2,3,4} no class-system pós-auditoria): +1 nível
 *  no par via direto custa o mesmo que +1 em cada componente. */
export const CUSTO_PONTO_PAR = 2;

/** Uma sinergia de ALVO ÚNICO: `de` empurra `floor(pontos * razao)` para
 *  `para`. Dado do class-system, não regra escrita aqui. */
export interface SinergiaAlvoUnico {
  de: ClassElementId;
  para: ClassElementId;
  razao: number;
}

export const SINERGIAS_ALVO_UNICO: readonly SinergiaAlvoUnico[] =
  (fixturesJson as { sinergiasAlvoUnico: SinergiaAlvoUnico[] }).sinergiasAlvoUnico;

export interface CascataPar {
  def: DerivedElementDef;
  passivos: number;
  destravado: boolean;
}

/**
 * O que cada base efetivamente ALIMENTA na cascata: pontos diretos mais o
 * transbordo das sinergias de alvo único que apontam para ela.
 *
 * Espelha o bloco `transbordoSimples` de `calcularCascata`: o bônus é
 * calculado sobre os pontos DIRETOS da origem (nunca sobre um alimento já
 * transbordado — não há segunda passada, senão duas sinergias em cadeia se
 * amplificariam), truncado para baixo, e somado quando dois emissores
 * diferentes apontam para o mesmo alvo.
 */
export function alimentoDasBases(
  bases: Partial<Record<ClassElementId, number>>,
): Partial<Record<ClassElementId, number>> {
  const saida: Partial<Record<ClassElementId, number>> = { ...bases };
  for (const s of SINERGIAS_ALVO_UNICO) {
    const origem = bases[s.de] ?? 0;
    if (origem <= 0) continue;
    const bonus = Math.floor(origem * s.razao);
    if (bonus <= 0) continue;
    saida[s.para] = (saida[s.para] ?? 0) + bonus;
  }
  return saida;
}

/** A cascata de todos os pares tocados pela ficha (passivos > 0). */
export function cascataDosPares(
  bases: Partial<Record<ClassElementId, number>>,
): CascataPar[] {
  const alimento = alimentoDasBases(bases);
  const saida: CascataPar[] = [];
  for (const def of DERIVED_ELEMENT_PAIRS) {
    const [a, b] = def.componentes;
    const passivos = Math.min(
      Math.floor((alimento[a] ?? 0) / DIVISOR_CASCATA_PAR),
      Math.floor((alimento[b] ?? 0) / DIVISOR_CASCATA_PAR),
    );
    if (passivos <= 0) continue;
    saida.push({ def, passivos, destravado: passivos >= LIMIAR_DESTRAVAMENTO_PAR });
  }
  return saida;
}
