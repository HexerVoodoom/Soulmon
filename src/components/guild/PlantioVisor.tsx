/**
 * O PLANTIO DO CLÃ (D-14..D-17): UMA planta por estação, cuidada por todos. Girassol na primavera, melancia
 * no verão, abóbora no outono, pinheiro no inverno (calendário do hemisfério sul — o servidor decide).
 *
 * O Visor: SVG de arestas retas no vidro, na paleta do aparelho, sobre o cenário do Bosque. O estágio
 * (0 semente .. 3 quase no ponto, 4 madura) decide a altura da haste e das folhas; a madura mostra o fruto da
 * espécie. A árvore do clã (nível/tier, D-17) aparece como UMA linha de texto — nunca como ranking.
 *
 * Regras de tom: planta "atrasada" é um FATO calmo (`guild.plantio.atrasada`); nada morre, nada é cobrado, e
 * nenhum número por pessoa existe na vista. A barra é o crescimento COLETIVO da planta, sem texto de razão.
 * Os botões mostram só o que a pessoa pode fazer agora: o que já foi feito hoje vira o fato, sem botão.
 */
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { sceneCss } from '../../utils/backgroundPortrait';
import { getPlantio, actPlantio, type PlantioAction, type PlantioView, type PlantSpecies } from '../../utils/claApi';
import { fruitRewards } from '../../utils/claCredit';
import type { GuildKey } from '../../utils/guildCopy';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { useClaBuilding, type ClaSalaProps } from './claUi';

export const PLANTIO_VISOR_HEIGHT = 150;
const W = 320;
const H = PLANTIO_VISOR_HEIGHT;
const GROUND = H - 22;
const SLAB = '#2A5C5A';
const OUTLINE = '#050E0E';
const TURQ = '#6EFFFB';
const COPPER = '#B87333';
const BONE = '#EFE3C2';
const BRASS = '#C9A34A';
const LEAF = '#3E8E6B';

/** A cor do fruto por espécie (paleta do aparelho + verde de folha; nada de magenta, roxo ou rosa). */
const FRUIT_COLOR: Record<PlantSpecies, string> = { girassol: BRASS, melancia: LEAF, abobora: COPPER, pinheiro: BONE };
const STEM_H = [4, 18, 34, 50, 56];

interface PlantioVisorProps {
  stage: number;
  species: PlantSpecies;
  planted: boolean;
  mature: boolean;
  reducedMotion: boolean;
  stageBg: string | null;
  label?: string;
}

export function PlantioVisor({ stage, species, planted, mature, reducedMotion, stageBg, label }: PlantioVisorProps) {
  const bgId = `bg-guild-${stageBg ?? 'clareira'}`;
  const bg = PET_BACKGROUNDS[bgId];
  const cx = W / 2;
  const h = planted ? STEM_H[Math.min(4, Math.max(0, stage))] : 0;
  const leaves = planted ? Math.min(4, stage + 1) : 0;
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-plantio-screen"
      data-plantio-visor
      data-species={species}
      data-stage={planted ? stage : undefined}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: H, background: bg && `${sceneCss(bgId)} center bottom / cover no-repeat`, backgroundColor: bg?.baseColor }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMax meet" shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        {/* o canteiro: um monte de terra sobre o disco de latão */}
        <rect x={cx - 50} y={GROUND} width={100} height={8} fill={COPPER} stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={cx - 34} y={GROUND - 8} width={68} height={8} fill={SLAB} stroke={OUTLINE} strokeWidth={1.5} />
        {planted && (
          <g data-plantio-planta>
            <rect x={cx - 3} y={GROUND - 8 - h} width={6} height={h || 3} fill={LEAF} stroke={OUTLINE} strokeWidth={1.2} />
            {Array.from({ length: leaves }, (_, i) => {
              const dir = i % 2 === 0 ? -1 : 1;
              return <rect key={i} x={dir < 0 ? cx - 3 - 16 : cx + 3} y={GROUND - 8 - 8 - i * 11} width={16} height={6} fill={LEAF} stroke={OUTLINE} strokeWidth={1} />;
            })}
            {mature && (
              <g className={reducedMotion ? undefined : 'sm2-casa-glow'} data-plantio-fruto>
                <rect x={cx - 11} y={GROUND - 8 - h - 18} width={22} height={18} fill={FRUIT_COLOR[species]} stroke={OUTLINE} strokeWidth={1.5} />
                <rect x={cx - 3} y={GROUND - 8 - h - 22} width={6} height={4} fill={SLAB} stroke={OUTLINE} strokeWidth={1} />
              </g>
            )}
          </g>
        )}
        {!planted && <rect x={cx - 8} y={GROUND - 12} width={16} height={2} fill={TURQ} fillOpacity={0.6} />}
      </svg>
      <span className="sm2-viewport-glass" />
    </span>
  );
}

const ACOES_OK: Record<PlantioAction, GuildKey> = {
  claPlantar: 'guild.plantio.ok.plantar', claRegar: 'guild.plantio.ok.regar',
  claProteger: 'guild.plantio.ok.proteger', claColher: 'guild.plantio.ok.colher',
};

/** O painel do Plantio: espécie da estação, estágio, "atrasada", Plantar/Regar/Proteger/Colher e a árvore do clã. */
export function SalaPlantio({ saveId, language, t, guild, tz, reducedMotion, onReward, onAnnounce }: ClaSalaProps) {
  const { view, setView, status, ocupado, erro, agir, recarregar } = useClaBuilding(() => getPlantio(saveId, tz));

  const fazer = async (acao: PlantioAction) => {
    const r = await agir(() => actPlantio(acao, saveId, tz));
    if (!r) return;
    if (r.plantio) setView(r.plantio);
    if (r.fruit) onReward(r.fruit.receipt, fruitRewards(r.fruit.id, r.fruit.bits));
    onAnnounce(t(ACOES_OK[acao]));
  };

  const v: PlantioView | null = view;
  const especie = v ? t(`guild.plantio.especie.${v.species}` as GuildKey) : '';
  const btn = 'sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline sm2-guild-btn';
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.plantio.titulo')} data-guild-room="plantio" aria-busy={status === 'loading' ? true : undefined}>
      {status === 'loading' && <p className="sm2-lib-busy" aria-busy="true"><Icon name="sync" size={24} tone="muted" className="animate-spin" />{t('guild.cla.carregando')}</p>}
      {(status === 'error' || (status === 'ready' && !view)) && (
        <>
          <p role="alert" className="sm2-lib-alert" data-plantio-erro>{t('guild.cla.erro')}</p>
          <button type="button" onClick={() => void recarregar(false)} className={btn}><Icon name="refresh" size={20} />{t('guild.erro.tentar')}</button>
        </>
      )}
      {v && (
        <>
          <PlantioVisor stage={v.stage} species={v.species} planted={v.planted} mature={v.mature} reducedMotion={reducedMotion} stageBg={guild.bosque.stage} label={t('guild.plantio.aria', { nome: especie })} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <h3 className="sm2-grove-stage" style={{ margin: 0 }} data-plantio-especie>{especie}</h3>
            <InfoTip language={language} label={language === 'pt-BR' ? 'Como funciona o plantio' : 'How the garden works'} align="right" style={{ marginRight: -8 }}>{t('guild.plantio.regra')}</InfoTip>
          </div>
          <p className="sm2-grove-line" style={{ margin: 0 }} data-plantio-estacao>{t(`guild.plantio.estacao.${v.season}` as GuildKey)}</p>
          {erro && <p role="alert" className="sm2-lib-alert" data-plantio-erro>{t('guild.cla.erro')}</p>}

          {!v.planted ? (
            <>
              <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-vazio>{t('guild.plantio.vazio')}</p>
              {v.canPlant && (
                <button type="button" data-plantio-plantar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void fazer('claPlantar')} className={`${btn} sm2-kit-btn-primary`}>
                  <Icon name="add" size={20} />{t('guild.plantio.plantar')}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="sm2-stats-t" style={{ margin: 0 }} data-plantio-estagio>{t(`guild.plantio.estagio.${Math.min(4, v.stage)}` as GuildKey)}</p>
              {/* o crescimento COLETIVO da planta: uma barra, sem razão nem texto de progresso */}
              <div aria-hidden="true" data-plantio-barra style={{ height: 6, borderRadius: 3, background: 'var(--sm2-line, rgba(255,255,255,0.15))', overflow: 'hidden' }}>
                <div style={{ width: `${v.progress}%`, height: '100%', background: 'var(--sm2-primary, #6EFFFB)' }} />
              </div>
              {v.delayed && !v.mature && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-atrasada>{t('guild.plantio.atrasada')}</p>}

              {!v.mature && (
                <>
                  {v.wateredToday ? (
                    <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-regado>{t('guild.plantio.regado')}</p>
                  ) : (
                    <button type="button" data-plantio-regar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void fazer('claRegar')} className={btn}>
                      <Icon name="water_drop" size={20} />{t('guild.plantio.regar')}
                    </button>
                  )}
                  {v.protectedToday ? (
                    <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-protegido>{t('guild.plantio.protegido')}</p>
                  ) : (
                    <button type="button" data-plantio-proteger disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void fazer('claProteger')} className={btn}>
                      <Icon name="visibility" size={20} />{t('guild.plantio.proteger')}
                    </button>
                  )}
                </>
              )}
              {v.mature && (v.canHarvest ? (
                <button type="button" data-plantio-colher disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void fazer('claColher')} className={`${btn} sm2-kit-btn-primary`}>
                  <Icon name="task_alt" size={20} />{t('guild.plantio.colher')}
                </button>
              ) : (
                <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-colhido>{t('guild.plantio.colhido')}</p>
              ))}

              {v.level !== null && v.tier !== null && (
                <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-arvore>
                  {t('guild.plantio.arvore')}{' · '}{t('guild.plantio.nivel')} <span className="sm2-num">{v.level}</span>{' · '}{t('guild.plantio.fruto')} <span className="sm2-num">{v.tier}</span>
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
