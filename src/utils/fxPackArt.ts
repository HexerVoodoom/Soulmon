// Artes geradas em 02/11/2026 (SQUAD-ARTE; origem E:/Soulmon-assets/geradas-2026-11-02): fundos, títulos de resultado,
// placa de prédio e folhas de FX 3×2 (6 quadros). Tudo com alfa real onde há recorte (nunca chroma).
import fusionBg from '../assets/soulmon/bg/fusion-bg.png';
import torneioLobbyBg from '../assets/soulmon/bg/torneio-lobby.png';
import dueloBg from '../assets/soulmon/bg/duelo-bg.png';
import evolucaoBg from '../assets/soulmon/bg/evolucao-bg.png';
import bannerVictory from '../assets/soulmon/banners/victory.png';
import bannerDefeat from '../assets/soulmon/banners/defeat.png';
import bannerDraw from '../assets/soulmon/banners/draw.png';
import placaPredio from '../assets/soulmon/placas/placa-predio.png';
import fusaoSheet from '../assets/soulmon/fx-pack/fusao-sheet.png';
import bauSheet from '../assets/soulmon/fx-pack/bau-sheet.png';
import recompensaSheet from '../assets/soulmon/fx-pack/recompensa-sheet.png';
import evolucaoSheet from '../assets/soulmon/fx-pack/evolucao-sheet.png';

export const SCENE_BG = { fusion: fusionBg, torneioLobby: torneioLobbyBg, duelo: dueloBg, evolucao: evolucaoBg } as const;
export const RESULT_BANNER = { victory: bannerVictory, defeat: bannerDefeat, draw: bannerDraw } as const;
export const BUILDING_PLATE = placaPredio;
export const FX_SHEET = { fusao: fusaoSheet, bau: bauSheet, recompensa: recompensaSheet, evolucao: evolucaoSheet } as const;
export type ResultBannerKind = keyof typeof RESULT_BANNER;
