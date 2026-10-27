/**
 * O PLANTIO DO CLÃ (D-14..D-17, D-38): UMA planta por estação, cuidada por todos — as MESMAS 4 árvores do Bosque:
 * abóbora no outono, pinheiro no inverno, cerejeira e acácia na primavera, cacto e coqueiro no verão (calendário do
 * hemisfério sul — o servidor decide). Girassol e melancia saíram em 18/10/2026 e migram para a espécie da mesma
 * estação (`claApi.ESPECIE_LEGADO`).
 *
 * O Visor: a árvore pintada (os sprites do Bosque, `assets/bosque`) sobre o chão do panorama do Bosque. O estágio do servidor
 * (0 semente .. 3 quase no ponto, 4 madura) escolhe o nível do sprite (`nivelDoPlantio`: broto, pequena, média,
 * completa). A árvore do clã (nível/tier, D-17) aparece como UMA linha de texto — nunca como ranking.
 *
 * Regras de tom: planta "atrasada" é um FATO calmo (`guild.plantio.atrasada`); nada morre, nada é cobrado, e
 * nenhum número por pessoa existe na vista. A barra é o crescimento COLETIVO da planta, sem texto de razão.
 * Os botões mostram só o que a pessoa pode fazer agora: o que já foi feito hoje vira o fato, sem botão.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import type { SoulXPState } from '../../utils/soulXP';
import { DEFESA_INIMIGOS, inimigosDaDefesa, lutarDefesa } from '../../utils/plantioDefesa';
import { getPlantio, actPlantio, type PlantioAction, type PlantioView, type PlantSpecies } from '../../utils/claApi';
import { fruitRewards } from '../../utils/claCredit';
import { ARVORE_SRC, PANORAMA_SRC } from '../../assets/bosque';
import { LOT_NPC_ART } from '../../assets/soulmon/npcs';
import { NpcSpeech } from '../nav/NpcSpeech';
import { tendGate, tendLinhaAntes, tendFalaLilia } from '../../utils/groveTend';
import { ESTACAO_DA_ESPECIE, nivelDoPlantio, type EstacaoBosque } from '../../utils/bosqueArvores';
import { SPRITES } from './GroveVisor';
import type { GuildKey } from '../../utils/guildCopy';
import { Icon } from '../ui/Icon';
import { InfoTip, ModalInfo } from '../ui/InfoTip';
import { useClaBuilding, type ClaSalaProps, type ClaT } from './claUi';

export const PLANTIO_VISOR_HEIGHT = 220;
const H = PLANTIO_VISOR_HEIGHT;
/** Altura da CAIXA do sprite, em px do vidro. Os 5 níveis de uma árvore dividem a mesma caixa (base alinhada, escala relativa
 *  preservada): o broto é pequeno e a completa enche a caixa, sem tabela de alturas por nível. */
/** A completa (nível 4) mede esta altura no vidro; a caixa de cada árvore se ajusta por `SPRITES` (cada folha tem a sua escala). */
const COMPLETA_PX = 180;
const caixaPx = (e: EstacaoBosque): number => Math.round((COMPLETA_PX * SPRITES[e].H) / SPRITES[e].h4);

interface PlantioVisorProps {
  stage: number;
  species: PlantSpecies;
  planted: boolean;
  mature: boolean;
  reducedMotion: boolean;
  label?: string;
}

export function PlantioVisor({ stage, species, planted, mature, reducedMotion, label }: PlantioVisorProps) {
  const nivel = nivelDoPlantio({ planted, mature, stage });
  const src = nivel > 0 ? ARVORE_SRC[ESTACAO_DA_ESPECIE[species]][nivel] : null;
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-plantio-screen"
      data-plantio-visor
      data-species={species}
      data-stage={planted ? stage : undefined}
      data-nivel={nivel}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: H, background: `url(${PANORAMA_SRC}) 40% 88% / auto 230% no-repeat`, backgroundColor: '#1d3a2a', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          data-plantio-planta
          data-plantio-fruto={mature ? '' : undefined}
          className={mature && !reducedMotion ? 'sm2-casa-glow' : undefined}
          style={{ height: caixaPx(ESTACAO_DA_ESPECIE[species]), width: 'auto', display: 'block', imageRendering: 'pixelated', marginBottom: 6, position: 'relative' }}
        />
      ) : (
        <span aria-hidden="true" style={{ width: 96, height: 14, marginBottom: 18, borderRadius: '50%', border: '2px dashed var(--sm2-primary, #6EFFFB)', opacity: 0.7 }} />
      )}
      <span className="sm2-viewport-glass" />
    </span>
  );
}

const ACOES_OK: Record<PlantioAction, GuildKey> = {
  claPlantar: 'guild.plantio.ok.plantar', claRegar: 'guild.plantio.ok.regar',
  claProteger: 'guild.plantio.ok.proteger', claColher: 'guild.plantio.ok.colher', claSortear: 'guild.plantio.cuidar',
};

/** O painel do Plantio: espécie da estação, estágio, "atrasada", Plantar/Regar/Proteger/Colher e a árvore do clã. */
/** Card UNICO do Bosque: a cena (membros do cla + arvorezinha da estacao) no lugar do visor, o icone de entrar e so o CTA do dia. */
export interface PlantioUnico {
  /** Recebe a arvore da estacao (ou null) para desenhar sobre o panorama. */
  cena: (arvore: ReactNode) => ReactNode;
  onEntrar: () => void;
  /** A regra do dia (meta cumprida) e as tarefas que ainda restam: bloqueia o CTA e Lilia explica. */
  metaCumprida: boolean;
  goal?: { done: number; heart: number };
  pendentes?: string[];
}

/** A arvorezinha plantada da estacao, sobre o panorama da cena (nivel 0 = nada). */
function ArvoreNaCena({ stage, species, planted, mature }: { stage: number; species: PlantSpecies; planted: boolean; mature: boolean }) {
  const nivel = nivelDoPlantio({ planted, mature, stage });
  if (nivel <= 0) return null;
  const e = ESTACAO_DA_ESPECIE[species];
  return <img src={ARVORE_SRC[e][nivel]} alt="" draggable={false} data-plantio-planta data-nivel={nivel} className="sm2-grove-cena-arvore" />;
}

export function SalaPlantio({ saveId, language, t, tz, reducedMotion, onReward, onAnnounce, unico }: Omit<ClaSalaProps, 'guild' | 'mySprite'> & { unico?: PlantioUnico }) {
  const { view, setView, status, ocupado, erro, agir, recarregar } = useClaBuilding(() => getPlantio(saveId, tz));

  const fazer = async (acao: PlantioAction) => {
    const r = await agir(() => actPlantio(acao, saveId, tz));
    if (!r) return;
    if (r.plantio) setView(r.plantio);
    if (r.fruit) onReward(r.fruit.receipt, fruitRewards(r.fruit.id, r.fruit.bits));
    onAnnounce(t(ACOES_OK[acao]));
  };

  const gs = useGameStateOptional()?.gameState;
  const estado = useMemo<SoulXPState>(() => (gs ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP } : { evolutionStage: 'rookie' }), [gs]);
  const linha = gs?.demoCharacterId;
  const [defendendo, setDefendendo] = useState(false);
  // L5-D2: sem botao 'Plantar' — a terra da estacao e plantada sozinha (idempotente; 409 = outro membro ja plantou).
  const plantando = useRef(false);
  useEffect(() => {
    if (view && !view.planted && view.canPlant && !plantando.current) { plantando.current = true; void fazer('claPlantar').finally(() => { plantando.current = false; }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.planted, view?.canPlant]);

  /** O servidor sorteia a acao (aguar ou defender); aguar acontece na hora, defender abre o combate. */
  const [lilia, setLilia] = useState(false);
  const gate = unico ? tendGate({ metaCumprida: unico.metaCumprida, goal: unico.goal, pendentes: unico.pendentes }) : null;
  const cuidar = async () => {
    if (gate && !gate.liberado) { setLilia(true); return; }
    let tarefa = view?.task ?? null;
    if (!tarefa) {
      const r = await agir(() => actPlantio('claSortear', saveId, tz));
      if (!r) return;
      if (r.plantio) setView(r.plantio);
      tarefa = r.plantio?.task ?? null;
    }
    if (tarefa === 'water') await fazer('claRegar');
    else if (tarefa === 'protect') setDefendendo(true);
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
          {unico ? (
            <div style={{ position: 'relative' }}>
              {unico.cena(<ArvoreNaCena stage={v.stage} species={v.species} planted={v.planted} mature={v.mature} />)}
              {/* Entrar: so o icone, sem caixa em volta (regra do app). */}
              <button type="button" data-guild-bosque-entrar onClick={unico.onEntrar} aria-label={t('guild.bosque.entrar')} className="sm2-grove-cena-entrar">
                <Icon name="arrow_forward" size={32} />
              </button>
            </div>
          ) : (
            <PlantioVisor stage={v.stage} species={v.species} planted={v.planted} mature={v.mature} reducedMotion={reducedMotion} label={t('guild.plantio.aria', { nome: especie })} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <h3 className="sm2-grove-stage" style={{ margin: 0 }} data-plantio-especie>{especie}</h3>
            {unico ? (
              // D-106: o "i" mora na linha do título do modal (canto direito), não no corpo.
              <ModalInfo language={language} label={language === 'pt-BR' ? 'Como o bosque cresce' : 'How the grove grows'}>{t('guild.plantio.regra')}</ModalInfo>
            ) : (
              <InfoTip language={language} label={language === 'pt-BR' ? 'Como funciona o plantio' : 'How the garden works'} align="right" style={{ marginRight: -8 }}>{t('guild.plantio.regra')}</InfoTip>
            )}
          </div>
          {!unico && <p className="sm2-grove-line" style={{ margin: 0 }} data-plantio-estacao>{t(`guild.plantio.estacao.${v.season}` as GuildKey)}</p>}
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
              {!unico && <>
              <p className="sm2-stats-t" style={{ margin: 0 }} data-plantio-estagio>{t(`guild.plantio.estagio.${Math.min(4, v.stage)}` as GuildKey)}</p>
              {/* o crescimento COLETIVO da planta: uma barra, sem razão nem texto de progresso */}
              <div aria-hidden="true" data-plantio-barra style={{ height: 6, borderRadius: 3, background: 'var(--sm2-line, rgba(255,255,255,0.15))', overflow: 'hidden' }}>
                <div style={{ width: `${v.progress}%`, height: '100%', background: 'var(--sm2-primary, #6EFFFB)' }} />
              </div>
              {!v.mature && <p className="sm2-lib-s sm2-num" style={{ margin: 0 }} data-plantio-dias>{v.progressDays} / {v.totalDays}</p>}
              {v.delayed && !v.mature && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-atrasada>{t('guild.plantio.atrasada')}</p>}
              </>}

              {!v.mature && (
                <>
                  {v.underAttack && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-atacada>{t('guild.plantio.atacada')}</p>}
                  {v.wateredToday && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-regado>{t('guild.plantio.regado')}</p>}
                  {v.protectedToday && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-protegido>{t('guild.plantio.protegido')}</p>}
                  {defendendo && v.task === 'protect' ? (
                    <Defesa t={t} estado={estado} linha={linha} ocupado={ocupado} onVenceu={() => { setDefendendo(false); void fazer('claProteger'); }} />
                  ) : (v.canDraw || v.task) && (
                    <>
                    {gate && !gate.liberado && <p className="sm2-lib-s" style={{ margin: 0 }} data-plantio-tend-antes>{tendLinhaAntes(language, gate.restam)}</p>}
                    {lilia && gate && !gate.liberado && (
                      <div data-plantio-lilia style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <img src={LOT_NPC_ART['hall:grove']} alt="" width={64} height={64} draggable={false} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                        <NpcSpeech name={language === 'pt-BR' ? 'Lilia' : 'Lilia'} line={tendFalaLilia(language, gate)} speakerKey="hall:grove:tend" />
                      </div>
                    )}
                    <button type="button" data-plantio-cuidar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void cuidar()} className={btn}>
                      <Icon name="eco" size={20} />{t(v.task === 'water' ? 'guild.plantio.regar' : v.task === 'protect' ? 'guild.plantio.proteger' : 'guild.plantio.cuidar')}
                    </button>
                    </>
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

              {!unico && v.level !== null && v.tier !== null && (
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

/** L5-D2: o combate fácil de proteger o jardim (3 inimigos sorteados, só o sprite). Perder não custa nada. */
function Defesa({ t, estado, linha, ocupado, onVenceu }: { t: ClaT; estado: SoulXPState; linha?: string; ocupado: boolean; onVenceu: () => void }) {
  const [seed, setSeed] = useState(() => (Math.random() * 2 ** 31) | 0);
  const [perdeu, setPerdeu] = useState(false);
  const inimigos = useMemo(() => inimigosDaDefesa(seed, linha), [seed, linha]);
  const lutar = () => {
    if (lutarDefesa(estado, seed).won) { onVenceu(); return; }
    setPerdeu(true);
    setSeed((Math.random() * 2 ** 31) | 0);
  };
  return (
    <div data-plantio-defesa style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <ul aria-label={t('guild.plantio.defesa.aria')} style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {inimigos.slice(0, DEFESA_INIMIGOS).map((src, i) => (
          <li key={i}><img src={src} alt="" width={64} height={64} draggable={false} style={{ width: 64, height: 64, imageRendering: 'pixelated' }} /></li>
        ))}
      </ul>
      {perdeu && <p role="status" className="sm2-lib-s" style={{ margin: 0 }} data-plantio-defesa-perdeu>{t('guild.plantio.defesa.perdeu')}</p>}
      <button type="button" data-plantio-lutar disabled={ocupado} aria-disabled={ocupado ? true : undefined} onClick={lutar} className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn">
        <Icon name="swords" size={20} />{t('guild.plantio.defesa.lutar')}
      </button>
    </div>
  );
}