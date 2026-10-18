/**
 * O MISTÉRIO DO CLÃ (D-18): cada pessoa pode MANDAR o Soulmon investigar; a barra é COLETIVA e cada tarefa do
 * dia a dia concluída por qualquer pessoa do clã a enche. Barra cheia: quem mandou resgata uma recompensa que
 * o servidor sorteia, e a barra recomeça.
 *
 * O Visor: a boca de uma gruta no vidro, com um cristal que acende conforme a barra (0..99) — luz, não número.
 * Se o seu Soulmon ainda está em casa, ele espera diante da gruta; depois de mandado, a gruta fica sozinha.
 * A vista só traz a barra coletiva: nada por pessoa existe aqui, e o painel nunca diz quem ajudou nem quanto.
 */
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { sceneCss } from '../../utils/backgroundPortrait';
import { GROUND_Y } from '../../utils/petStage';
import { getMisterio, sendMisterio, claimMisterio } from '../../utils/claApi';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { rewardText, useClaBuilding, type ClaSalaProps } from './claUi';

export const MISTERIO_VISOR_HEIGHT = 150;
const W = 320;
const H = MISTERIO_VISOR_HEIGHT;
const PETROL = '#123232';
const SLAB = '#2A5C5A';
const OUTLINE = '#050E0E';
const TURQ = '#6EFFFB';
const COPPER = '#B87333';

interface MisterioVisorProps {
  stage: string | null;
  /** 0..99. */
  bar: number;
  /** O Soulmon desta pessoa ainda em casa, diante da gruta. */
  home: boolean;
  mySprite: string;
  reducedMotion: boolean;
  label?: string;
}

export function MisterioVisor({ stage, bar, home, mySprite, reducedMotion, label }: MisterioVisorProps) {
  const bgId = `bg-guild-${stage ?? 'clareira'}`;
  const bg = PET_BACKGROUNDS[bgId];
  const cx = W / 2;
  const ground = Math.round((H * GROUND_Y) / 100);
  const luz = 0.25 + (Math.min(99, Math.max(0, bar)) / 99) * 0.75;
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-misterio-screen"
      data-misterio-visor
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: H, background: bg && `${sceneCss(bgId)} center bottom / auto 100% no-repeat`, backgroundColor: bg?.baseColor }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMax meet" shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        {/* a boca da gruta */}
        <rect x={cx - 46} y={ground - 70} width={92} height={72} fill={SLAB} stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={cx - 32} y={ground - 54} width={64} height={56} fill={PETROL} stroke={OUTLINE} strokeWidth={1.5} />
        {/* o cristal: a luz acompanha a barra coletiva */}
        <g className={reducedMotion ? undefined : 'sm2-casa-glow'} data-misterio-cristal style={{ opacity: luz }}>
          <polygon points={`${cx},${ground - 44} ${cx + 9},${ground - 26} ${cx},${ground - 8} ${cx - 9},${ground - 26}`} fill={TURQ} stroke={OUTLINE} strokeWidth={1.5} />
        </g>
        <rect x={cx - 52} y={ground + 2} width={104} height={6} fill={COPPER} stroke={OUTLINE} strokeWidth={1.2} />
      </svg>
      {home && (
        <img
          src={mySprite}
          alt=""
          width={56}
          height={56}
          draggable={false}
          data-misterio-criatura
          className={reducedMotion ? 'sm2-grove-creature' : 'sm2-grove-creature sm2-grove-bob'}
          style={{ left: '22%', top: `${GROUND_Y}%`, width: 56, height: 56, marginTop: -Math.round(56 * 0.94), marginLeft: -28 }}
        />
      )}
      <span className="sm2-viewport-glass" />
    </span>
  );
}

/** O painel do Mistério: mandar o Soulmon, a barra coletiva e o resgate. */
export function SalaMisterio({ saveId, language, t, guild, tz, reducedMotion, mySprite, onReward, onAnnounce }: ClaSalaProps) {
  const { view, setView, status, ocupado, erro, agir, recarregar } = useClaBuilding(() => getMisterio(saveId, tz));
  const btn = 'sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline sm2-guild-btn';

  const mandar = async () => {
    const m = await agir(() => sendMisterio(saveId, tz));
    if (m) { setView(m); onAnnounce(t('guild.misterio.ok.enviar')); }
  };
  const resgatar = async () => {
    const c = await agir(() => claimMisterio(saveId, tz));
    if (c) {
      onReward(c.receipt, [c.reward]);
      if (c.misterio) setView(c.misterio);
      onAnnounce(rewardText(t, language, c.reward));
    }
  };

  return (
    <section className="sm2-guild-sec" aria-label={t('guild.misterio.titulo')} data-guild-room="misterio" aria-busy={status === 'loading' ? true : undefined}>
      {status === 'loading' && <p className="sm2-lib-busy" aria-busy="true"><Icon name="sync" size={24} tone="muted" className="animate-spin" />{t('guild.cla.carregando')}</p>}
      {(status === 'error' || (status === 'ready' && !view)) && (
        <>
          <p role="alert" className="sm2-lib-alert" data-misterio-erro>{t('guild.cla.erro')}</p>
          <button type="button" onClick={() => void recarregar(false)} className={btn}><Icon name="refresh" size={20} />{t('guild.erro.tentar')}</button>
        </>
      )}
      {view && (
        <>
          <MisterioVisor stage={guild.bosque.stage} bar={view.bar} home={!view.sent && !view.rewardPending} mySprite={mySprite} reducedMotion={reducedMotion} label={t('guild.misterio.aria')} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <h3 className="sm2-grove-stage" style={{ margin: 0 }}>{t('guild.misterio.titulo')}</h3>
            <InfoTip language={language} label={language === 'pt-BR' ? 'Como funciona o mistério' : 'How the mystery works'} align="right" style={{ marginRight: -8 }}>{t('guild.misterio.regra')}</InfoTip>
          </div>
          {erro && <p role="alert" className="sm2-lib-alert" data-misterio-erro>{t('guild.cla.erro')}</p>}

          {/* a barra COLETIVA: luz sem número, com nome para o leitor de tela */}
          <div role="img" aria-label={t('guild.misterio.investigacao')} data-misterio-barra style={{ height: 8, borderRadius: 4, background: 'var(--sm2-line, rgba(255,255,255,0.15))', overflow: 'hidden' }}>
            <div style={{ width: `${view.bar}%`, height: '100%', background: 'var(--sm2-primary, #6EFFFB)' }} />
          </div>
          {view.investigating > 0 && <p className="sm2-lib-s" style={{ margin: 0 }} data-misterio-juntos>{t('guild.misterio.juntos')}</p>}

          {view.rewardPending ? (
            <>
              <p className="sm2-stats-t" style={{ margin: 0 }} data-misterio-pronta>{t('guild.misterio.pronta')}</p>
              <button type="button" data-misterio-resgatar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void resgatar()} className={`${btn} sm2-kit-btn-primary`}>
                <Icon name="volunteer_activism" size={20} />{t('guild.misterio.resgatar')}
              </button>
            </>
          ) : view.sent ? (
            <p className="sm2-stats-t" style={{ margin: 0 }} data-misterio-enviado>{t('guild.misterio.enviado')}</p>
          ) : (
            <button type="button" data-misterio-mandar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={() => void mandar()} className={`${btn} sm2-kit-btn-primary`}>
              <Icon name={ocupado ? 'sync' : 'search'} size={20} className={ocupado ? 'animate-spin' : undefined} />{t('guild.misterio.mandar')}
            </button>
          )}
          {view.capReached && <p className="sm2-lib-s" style={{ margin: 0 }} data-misterio-teto>{t('guild.misterio.teto')}</p>}
        </>
      )}
    </section>
  );
}
