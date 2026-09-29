import { CoopPanel } from '../CoopPanel';
import type { Language } from '../../utils/i18n';

/**
 * GUILDA (29/09/2026) — o grupo cooperativo leve (`CoopPanel`, Fase 4.3) como
 * lugar do mapa: a construção da Arena e o Salão do Hall abrem a MESMA folha.
 *
 * Nada de regra nova: a Guilda É o grupo de sempre — meta somada, "apareceu
 * hoje" binário, sair num toque, sem push de cobrança (`CoopPanel` explica o
 * porquê). Só o nome e o lugar mudaram; é o `CoopPanel` quem manda no servidor.
 */
export function GuildSheet({ saveId, language, metaDoDiaCumprida }: {
  saveId: string;
  language: Language;
  metaDoDiaCumprida: boolean;
}) {
  return <CoopPanel saveId={saveId} language={language} metaDoDiaCumprida={metaDoDiaCumprida} />;
}
