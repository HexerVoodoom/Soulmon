// Arte pixel do cabeçalho do relatório diário (item A16 do
// `docs/BACKLOG-ARTE-GERAR.md`), no estilo arcano-tech —
// `docs/PROMPT-ARTE-ARCANO-TECH.md`.
//
// Fronteira de troca no molde de `utils/dreamArt.ts`, `decorArt.ts`,
// `adventureArt.ts` e `traitArt.ts`: o modal importa daqui e não conhece PNG
// nenhum.
//
// As quatro chaves são os quatro TIPOS DE DIA que o `DailyReportModal` já
// distinguia com nome de ícone line-art — a decisão de tom de cada um está
// escrita lá e não muda aqui:
//
//  · `return`  — quem voltou depois de sumir. Deliberadamente NÃO é luto:
//                coração partido para um evento que já exige dias ruins
//                seguidos dizia que a pessoa falhou. Porta aberta com luz.
//  · `perfect` — dia completo.
//  · `slow`    — dia em que houve perda de coração. Ampulheta, não punição.
//  · `good`    — o dia comum.
import reportReturn from '../assets/soulmon/icons/report/report-return.png';
import reportPerfect from '../assets/soulmon/icons/report/report-perfect.png';
import reportSlow from '../assets/soulmon/icons/report/report-slow.png';
import reportGood from '../assets/soulmon/icons/report/report-good.png';

export type ReportDayKind = 'return' | 'perfect' | 'slow' | 'good';

/** Tipo de dia → URL do PNG (128×128, desenhado em 48 px no cabeçalho). */
export const REPORT_ART: Record<ReportDayKind, string> = {
  return: reportReturn,
  perfect: reportPerfect,
  slow: reportSlow,
  good: reportGood,
};
