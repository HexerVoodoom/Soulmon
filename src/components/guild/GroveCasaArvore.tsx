/**
 * A ÁRVORE DO CLÃ NO BOSQUE (dono, 23/11/2026): o estágio da seiva (Fagulha .. Aurora) mora também no Bosque. É a MESMA vista de
 * dados da Casa (`guild.casa`, nada novo no servidor ou no save) e as MESMAS chaves de copy (`guild.casa.nivel/linha/perto/regra`);
 * aqui só se desenha. Não há arte da árvore da casa (o antigo `CasaVisor` saiu, D-55): é a linha de texto, sem número por pessoa.
 */
import type { GuildView } from '../../utils/community';
import { CASA_STAGES } from '../../utils/guildRules';
import { guildText, type GuildKey } from '../../utils/guildCopy';
import type { Language } from '../../utils/i18n';
import { InfoTip } from '../ui/InfoTip';

export function GroveCasaArvore({ language, casa }: { language: Language; casa: NonNullable<GuildView['casa']> }) {
  const t = (k: GuildKey, v?: Record<string, string | number>) => guildText(language, k, v);
  const isPt = language === 'pt-BR';
  const proximo = casa.perto && casa.nivelIndex < CASA_STAGES.length - 1 ? t(`guild.casa.nivel.${CASA_STAGES[casa.nivelIndex + 1]}` as GuildKey) : null;
  return (
    <section className="sm2-grove-casa-arvore" aria-label={t('guild.casa.arvore.aria')} data-grove-casa-arvore>
      <h3 className="sm2-grove-stage" style={{ margin: 0 }} data-grove-casa-nivel>{t(`guild.casa.nivel.${casa.nivel}` as GuildKey)}</h3>
      <p className="sm2-grove-line" style={{ margin: 0 }}>{t(`guild.casa.linha.${casa.nivel}` as GuildKey)}</p>
      {proximo && <p className="sm2-grove-line" style={{ margin: 0 }} data-grove-casa-perto>{t('guild.casa.perto', { estagio: proximo })}</p>}
      <InfoTip language={language} label={isPt ? 'Como a árvore cresce' : 'How the tree grows'} style={{ minHeight: 28 }}>{t('guild.casa.regra')}</InfoTip>
    </section>
  );
}
