/**
 * A PRAÇA DO CLÃ (D-10 presente diário, D-11 quatro lugares de decoração coletivos).
 *
 * O Visor: o desenho vive DENTRO do vidro (`.sm2-viewport-screen`), em SVG de arestas retas na paleta do
 * aparelho (petróleo, turquesa, cobre, osso) sobre o cenário do Bosque (`bg-guild-<estágio>`). Quatro
 * pedestais em posições fixas; o item de cada lugar é a arte da decoração (`DECOR_ART`) ou, sem arte, um
 * bloco de osso (PLACEHOLDER declarado). Um embrulho aparece no canto quando há presente à espera — sem número.
 *
 * Nada aqui tem número por pessoa: a praça mostra o que está nos lugares e os presentes que CHEGARAM para
 * quem olha; quem pôs cada item é um id opaco que o painel só usa para dizer "você" (nunca ranking).
 */
import { useState } from 'react';
import giftArt from '../../assets/soulmon/items/item-gift.png';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { sceneCss } from '../../utils/backgroundPortrait';
import { DECOR_ART } from '../../utils/decorArt';
import { donatableItems } from '../../utils/guildHouse';
import { getPraca, setPracaSlot, sendPresente, claimPresente, PRACA_SLOTS, type PracaView } from '../../utils/claApi';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { decorName, rewardText, useClaBuilding, type ClaSalaProps } from './claUi';

export const PRACA_VISOR_HEIGHT = 150;
const W = 320;
const H = PRACA_VISOR_HEIGHT;
const PETROL = '#123232';
const SLAB = '#2A5C5A';
const OUTLINE = '#050E0E';
const COPPER = '#B87333';
const BONE = '#EFE3C2';
const BRASS = '#C9A34A';
const TURQ = '#6EFFFB';

/** Posições fixas dos quatro pedestais (x do centro). */
const SLOT_X = [48, 118, 202, 272];

interface PracaVisorProps {
  stage: string | null;
  slots: PracaView['slots'];
  hasGift: boolean;
  reducedMotion: boolean;
  label?: string;
}

export function PracaVisor({ stage, slots, hasGift, reducedMotion, label }: PracaVisorProps) {
  const bgId = `bg-guild-${stage ?? 'clareira'}`;
  const bg = PET_BACKGROUNDS[bgId];
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-praca-screen"
      data-praca-visor
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: H, background: bg && `${sceneCss(bgId)} center bottom / cover no-repeat`, backgroundColor: bg?.baseColor }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMax meet" shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        {/* o chão da praça: uma laje larga de latão */}
        <rect x={12} y={H - 28} width={W - 24} height={8} fill={COPPER} stroke={OUTLINE} strokeWidth={1.5} />
        {slots.map((s, i) => {
          const x = SLOT_X[i];
          const art = s.item ? DECOR_ART[s.item] : undefined;
          return (
            <g key={s.slot} data-praca-lugar={s.slot} data-ocupado={s.item ? 'true' : 'false'}>
              <rect x={x - 22} y={H - 44} width={44} height={16} fill={SLAB} stroke={OUTLINE} strokeWidth={1.5} />
              <rect x={x - 16} y={H - 48} width={32} height={4} fill={PETROL} stroke={OUTLINE} strokeWidth={1} />
              {s.item && (art
                ? <image href={art} x={x - 20} y={H - 92} width={40} height={40} preserveAspectRatio="xMidYMax meet" style={{ imageRendering: 'pixelated' }} />
                : <rect x={x - 9} y={H - 68} width={18} height={18} fill={BONE} stroke={OUTLINE} strokeWidth={1.2} />)}
              {!s.item && <rect x={x - 6} y={H - 62} width={12} height={2} fill={TURQ} fillOpacity={0.55} />}
            </g>
          );
        })}
        {hasGift && (
          <g data-praca-embrulho className={reducedMotion ? undefined : 'sm2-casa-glow'}>
            <image href={giftArt} x={W - 40} y={8} width={30} height={30} preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'pixelated' }} />
          </g>
        )}
      </svg>
      <span className="sm2-viewport-glass" />
    </span>
  );
}

/** O painel da Praça: o visor, os quatro lugares, o presente de hoje e os recebidos. */
export function SalaPraca({ saveId, language, t, guild, tz, reducedMotion, onReward, onAnnounce, itens }: ClaSalaProps & {
  /** O que a pessoa tem e pode poeItem (a mesma ponte da Casa). Sem ela, nenhum item livre. */
  itens?: { ownedFurniture: string[]; equippedDecor: Record<string, string | undefined> };
}) {
  const { view, setView, status, ocupado, erro, agir, recarregar } = useClaBuilding(() => getPraca(saveId, tz));
  const [escolhendo, setEscolhendo] = useState<number | null>(null);
  const outros = guild.members.filter(m => !m.euMesmo && m.id);
  const nomeDe = (id: string) => guild.members.find(m => m.id === id)?.name ?? t('guild.roda.alguem');
  const livres = itens ? donatableItems({ ownedFurniture: itens.ownedFurniture, equippedDecor: itens.equippedDecor as never }) : [];

  const poeItem = async (slot: number, item: string | null) => {
    setEscolhendo(null);
    const v = await agir(() => setPracaSlot(saveId, slot, item, tz));
    if (v) { setView(v); onAnnounce(t('guild.praca.lugar.ok')); }
  };
  const enviar = async (to: string) => {
    const v = await agir(() => sendPresente(saveId, to, tz));
    if (v) { setView(v); onAnnounce(t('guild.praca.presente.ok')); }
  };
  const abrir = async (giftId: string) => {
    const c = await agir(() => claimPresente(saveId, giftId, tz));
    if (c) {
      onReward(c.receipt, [c.reward]);
      setView(c.praca);
      onAnnounce(rewardText(t, language, c.reward));
    }
  };

  return (
    <section className="sm2-guild-sec" aria-label={t('guild.praca.titulo')} data-guild-room="praca" aria-busy={status === 'loading' ? true : undefined}>
      {status === 'loading' && <p className="sm2-lib-busy" aria-busy="true"><Icon name="sync" size={24} tone="muted" className="animate-spin" />{t('guild.cla.carregando')}</p>}
      {status === 'error' && (
        <>
          <p role="alert" className="sm2-lib-alert" data-praca-erro>{t('guild.cla.erro')}</p>
          <button type="button" onClick={() => void recarregar(false)} className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline sm2-guild-btn"><Icon name="refresh" size={20} />{t('guild.erro.tentar')}</button>
        </>
      )}
      {view && (
        <>
          <PracaVisor stage={guild.bosque.stage} slots={view.slots} hasGift={view.gifts.length > 0} reducedMotion={reducedMotion} label={t('guild.praca.aria')} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <h3 className="sm2-grove-stage" style={{ margin: 0 }}>{t('guild.praca.titulo')}</h3>
            <InfoTip language={language} label={language === 'pt-BR' ? 'Como funciona a praça' : 'How the square works'} align="right" style={{ marginRight: -8 }}>{t('guild.praca.regra')}</InfoTip>
          </div>
          {erro && <p role="alert" className="sm2-lib-alert" data-praca-erro>{t('guild.cla.erro')}</p>}

          <ul className="sm2-grove-list" data-praca-lugares>
            {view.slots.slice(0, PRACA_SLOTS).map(s => (
              <li key={s.slot} data-praca-lugar-item={s.slot} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0, margin: 0 }}>
                  {t('guild.praca.lugar', { nome: s.slot + 1 })}{' · '}{s.item ? decorName(language, s.item) : t('guild.praca.lugar.vazio')}
                </span>
                {s.item && (
                  <button type="button" data-praca-tirar={s.slot} disabled={ocupado} aria-disabled={ocupado ? true : undefined} onClick={() => void poeItem(s.slot, null)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline">
                    <Icon name="undo" size={20} />{t('guild.praca.lugar.tirar')}
                  </button>
                )}
                <button type="button" data-praca-escolher={s.slot} disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-expanded={escolhendo === s.slot} onClick={() => setEscolhendo(escolhendo === s.slot ? null : s.slot)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline">
                  <Icon name="inventory_2" size={20} />{s.item ? t('guild.praca.lugar.trocar') : t('guild.praca.lugar.pos')}
                </button>
              </li>
            ))}
          </ul>
          {escolhendo !== null && (livres.length === 0 ? (
            <p className="sm2-lib-s" style={{ margin: 0 }} data-praca-sem-itens>{t('guild.praca.lugar.nenhum')}</p>
          ) : (
            <ul className="sm2-grove-list" data-praca-itens>
              {livres.map(id => (
                <li key={id}>
                  <button type="button" data-praca-item={id} disabled={ocupado} onClick={() => void poeItem(escolhendo, id)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                    {DECOR_ART[id] && <img src={DECOR_ART[id]} alt="" width={24} height={24} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
                    {decorName(language, id)}
                  </button>
                </li>
              ))}
            </ul>
          ))}

          <p className="sm2-stats-t" style={{ margin: 0 }}>{t('guild.praca.presente.titulo')}</p>
          {outros.length === 0 ? (
            <p className="sm2-lib-s" style={{ margin: 0 }} data-praca-sozinho>{t('guild.praca.presente.sozinho')}</p>
          ) : (
            <ul className="sm2-grove-list" data-praca-membros>
              {outros.map(m => {
                const ja = view.sentToday.includes(m.id!);
                const nome = m.name ?? t('guild.roda.alguem');
                return (
                  <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0, margin: 0 }}>{nome}</span>
                    <button
                      type="button"
                      data-praca-presentear={m.id}
                      disabled={ocupado || ja}
                      aria-disabled={ocupado || ja ? true : undefined}
                      aria-label={ja ? `${t('guild.praca.presente.enviado')}: ${nome}` : t('guild.praca.presente.aria', { nome })}
                      onClick={() => void enviar(m.id!)}
                      className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline"
                    >
                      <Icon name={ja ? 'check_circle' : 'volunteer_activism'} size={20} fill={ja ? 1 : 0} />
                      {ja ? t('guild.praca.presente.enviado') : t('guild.praca.presente.enviar')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {view.gifts.length > 0 && (
            <>
              <p className="sm2-stats-t" style={{ margin: 0 }}>{t('guild.praca.recebidos.titulo')}</p>
              <ul className="sm2-grove-list" data-praca-recebidos>
                {view.gifts.map(g => {
                  const nome = nomeDe(g.from);
                  return (
                    <li key={g.id} data-praca-presente style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="volunteer_activism" size={24} tone="primary" />
                      <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0, margin: 0 }}>{t('guild.praca.recebidos.de', { nome })}</span>
                      <button type="button" data-praca-abrir={g.id} disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-label={t('guild.praca.abrir.aria', { nome })} onClick={() => void abrir(g.id)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary">
                        {t('guild.praca.abrir')}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
