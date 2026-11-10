/**
 * O que o App faz quando o jogador toca EQUIPAR / TROCAR FORMA no modal de formas (dono único; `App.tsx` só delega).
 * Puro: estado entra, estado sai — assim o teste de tela exercita os mesmos redutores que o app usa.
 */
import { elementoEquipavelComArte, equiparFormaAlt, type FormaAltEquipada, type FormasAlt } from './formasAlternativas';
import { trocarFormaCompleta, type FormaState } from './formaSnapshot';
import { applyLateralSwitch } from './trocaLateral';
import type { SpriteLibrary } from './spriteLibrary';

export type EstadoDeForma = FormaState & {
  formasAlt?: FormasAlt; formaAltEquipada?: FormaAltEquipada; spriteLibrary?: SpriteLibrary; unlockedEvolutions?: string[];
};

/** Equipar uma forma já desbloqueada do estágio. */
export function equiparFormaAltEstado<T extends EstadoDeForma>(prev: T, formId: string, elemento: string): T {
  // A escolha EXPLÍCITA do jogador vale sempre (a 1ª da lista é a original; antes um "guarda de arte" trocava a escolha pela 2ª quando a
  // arte da 1ª morava em `forma@elemento` — o bug do dono). O visor já resolve a arte da forma (`spriteVisorOf`).
  const formaAltEquipada = equiparFormaAlt(prev.formasAlt, prev.formaAltEquipada, formId, elemento);
  if (formaAltEquipada === prev.formaAltEquipada) return prev;
  return formId === prev.evolutionStage ? trocarFormaCompleta(prev, s => ({ ...s, formaAltEquipada })) : { ...prev, formaAltEquipada };
}

/** Troca lateral + elemento equipado da forma de destino, numa transição só. */
export function trocarFormaEstado<T extends EstadoDeForma & { unlockedEvolutions?: string[] }>(prev: T, targetStage: string, elemento?: string): T {
  return trocarFormaCompleta(prev, s => {
    const sw = applyLateralSwitch(s as T & { unlockedEvolutions: string[] }, targetStage);
    if (sw === s) return s;
    const pedido = elemento && elemento !== '__atual' ? elemento : undefined;
    // Escolha explícita vale; sem escolha (troca sem modal), usa o equipado se ele tem arte, senão um que tenha.
    const el = pedido ?? elementoEquipavelComArte(targetStage, sw.formasAlt, sw.formaAltEquipada, sw.spriteLibrary);
    const eq = el ? equiparFormaAlt(sw.formasAlt, sw.formaAltEquipada, targetStage, el) : sw.formaAltEquipada;
    return eq === sw.formaAltEquipada ? sw : { ...sw, formaAltEquipada: eq };
  });
}
