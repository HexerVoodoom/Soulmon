// Arte dos MATERIAIS de aprimoramento (aba "Materiais" da Mochila). Fronteira de
// troca no molde de `itemArt.ts`: quem desenha importa daqui e não conhece PNG.
// Chave = `MaterialId` (buildingQuestsCopy). Sem entrada, cai no emoji do próprio
// material (placeholder) — é o estado de hoje; a faixa D (D1) preenche este mapa
// com os PNGs gerados e nada mais precisa mudar.
export const MATERIAL_ART: Partial<Record<string, string>> = {};
