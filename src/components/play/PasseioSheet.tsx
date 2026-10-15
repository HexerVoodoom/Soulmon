import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import type { Language } from '../../utils/i18n';
import { MISSION_WINDOW_MS, type CrossingChallenge, type CrossingsState, type Region, type RegionId } from '../../types/travessias';
import {
  activeChallenge, dailyOffer, doneToday, markDone,
  pickMission, regionById, strollWaitMs,
  type DailyMission,
} from '../../utils/travessias';
import { travessiaTitle } from '../../utils/travessiaTitles';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import { Celebration } from '../ui/Celebration';
import { Icon } from '../ui/Icon';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { MissionMark } from './MissionMark';
import { AreaGlyph, RegionPostal } from './TravessiaIcon';
import { StrollFind, type StrollFindProps } from './StrollFind';

/**
 * 🧭 A FOLHA DO PASSEIO (30/09/2026, decisão do dono — `REGISTRO-DE-DECISOES.md`
 * §5.6; condições em `docs/reviews/2026-09-30-missoes/` e
 * `docs/reviews/2026-09-30-exploracao/`). Redesenhada em 02/10/2026 (F1–F5 de
 * `docs/AJUSTES-NAVEGACAO-2026-10-02.md`).
 *
 * BETA-2 (13/10/2026, 5.1): Free Stroll e Mission of the Day viraram UMA escolha — a missão é a informação
 * principal e o destino (a região dela) vem em destaque discreto, justificado por ela; o bloco "Passeio livre ·
 * escolha o destino" saiu (o `setDestination` segue na lógica, só não tem mais botão aqui).
 *
 * Duas camadas, e só a primeira é o Passeio:
 *  1. **Para onde ele vai hoje** — escolha livre entre as regiões abertas (casa
 *     inclusa). O Soulmon sai todo dia, com ou sem Travessia.
 *  2. **Travessias** (opcional, escondível — MIS-11): a tela mostra SÓ a que
 *     está em uso (card próprio: sinal visual, título, ato, versão pequena, o
 *     que muda no mapa, o estado de hoje) com "Fiz", "Trocar" (abre o modal
 *     com TODAS) e "Recuar". Sem ativa, um botão abre o mesmo modal.
 *
 * RODADA 7 (04/10/2026, M1–M7): escolhida a missão, a folha mostra SÓ ela (some
 * o "para onde ele vai hoje"); a escolha vale 24 h e não se troca — passado o
 * tempo ela se solta sozinha, sem custo, e saem outras (sem "Recuar", sem
 * "Esconder Travessias"); o card não explica o mapa; há um REGISTRO das
 * missões feitas e uma celebração curta no "Fiz".
 *
 * O "Fiz" vale UMA VEZ POR DIA (F5) e a Travessia continua ativa para o dia
 * seguinte: é o ato que se repete, não um troféu. A região da Travessia abre
 * uma única vez (1/noite, `settleNight`); repetir não rende mais nada no mapa,
 * e o card diz isso com todas as letras.
 *
 * O que esta folha NUNCA mostra, e há teste: número de regiões, total, "faltam
 * N", percentual, prazo, sequência de dias, e a palavra Bits/XP/Emblema. A
 * palavra da camada é Travessia/Crossing, nunca "desafio"/"challenge" (parecer
 * de menores e marca, 04 R-5). Sem som (R-NOVA), sem push, sem badge, sem
 * contador, sem culpa por não ter feito.
 *
 * Nenhuma regra nasce aqui: toda mudança é uma função pura de
 * `utils/travessias` entregue ao `App`, que a aplica sobre `prev`.
 */

const sectionHead: CSSProperties = {
  ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)',
};
const note: CSSProperties = { ...sm2Hint, margin: 0 };
const divider: CSSProperties = { border: 0, borderTop: '1px solid var(--sm2-line)', margin: '4px 0', width: '100%' };
const list: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 };

type Update = (f: (c: CrossingsState) => CrossingsState) => void;

/** O dia do jogador de reserva (só quando o `App` não entrega o `todayKey`). */
const fallbackDayKey = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * O DESTINO, em destaque discreto (beta-2, 5.1): a missão é a informação principal e o destino é o que ela
 * justifica — por isso vem como UMA linha curta (rótulo `muted` + nome em `gold-ink`), nunca como uma etapa à
 * parte. Mesmo componente na proposta e no card da escolhida.
 */
function Destino({ nome, isPt }: { nome: string; isPt: boolean }) {
  return (
    <span data-passeio-destino-nome style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
      <span style={note}>{isPt ? 'Destino' : 'Destination'}</span>
      <span style={{ ...sm2Text, fontWeight: 600, color: 'var(--sm2-gold-ink)', minWidth: 0 }}>{nome}</span>
    </span>
  );
}

/** Uma proposta de Travessia: a versão plena e a pequena, que vale igual. */
function Proposta({ c, isPt }: { c: CrossingChallenge; isPt: boolean }) {
  return (
    <>
      <p style={{ ...sm2Text, margin: 0 }}>{isPt ? c.textPt : c.textEn}</p>
      <p style={{ ...note }}>
        {isPt ? 'Ou, pequena: ' : 'Or, small: '}{isPt ? c.smallPt : c.smallEn}
      </p>
    </>
  );
}

/**
 * AS MISSÕES DO DIA (04/10/2026): três propostas sorteadas (`dailyOffer`, as
 * mesmas o dia inteiro), cada uma um CARD FECHADO, separado do vizinho, com o
 * postal do cenário dela, o sinal da área e o título próprio
 * (`utils/travessiaTitles.ts`). Tocar abre o card — o ato, a versão pequena e o
 * "Escolher esta" (primário, H14). Um aberto por vez. Escolhe-se UMA; nada obriga.
 */
function MissoesDoDia({ ofertas, isPt, language, aberto, setAberto, onPick }: {
  ofertas: DailyMission[]; isPt: boolean; language: Language;
  aberto: string | null; setAberto: (id: string | null) => void;
  onPick: (regionId: RegionId, challengeId: string) => void;
}) {
  return (
    <div data-travessias-missoes style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MissionMark kind="available" isPt={isPt} />
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Missões de hoje' : 'Missions of the day'}</p>
      </div>
      <ul style={sheetCardList} data-travessia-oferta>
        {ofertas.map(({ region, challenge: c }) => {
          const open = aberto === c.id;
          const title = travessiaTitle(c.id, isPt) ?? (isPt ? c.textPt : c.textEn);
          const bodyId = `sm2-travessia-${c.id}`;
          return (
            <li key={c.id} data-travessia-card={c.id} style={{ ...sheetCard, padding: 0, gap: 0 }}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={bodyId}
                data-travessia-abrir={c.id}
                onClick={() => setAberto(open ? null : c.id)}
                style={{
                  width: '100%', minHeight: 56, display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', boxSizing: 'border-box', textAlign: 'left',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                }}
              >
                <RegionPostal region={region} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={sheetCardTitle}>{title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AreaGlyph area={c.area} challengeId={c.id} size={24} />
                    <Destino nome={isPt ? region.namePt : region.nameEn} isPt={isPt} />
                  </span>
                </span>
                <Icon name={open ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
              </button>
              {open && (
                <div id={bodyId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px 12px' }}>
                  <Proposta c={c} isPt={isPt} />
                  <button
                    type="button"
                    data-travessia-escolher={c.id}
                    onClick={() => onPick(region.id, c.id)}
                    style={{ ...sm2Button('primary'), width: '100%' }}
                  >
                    {isPt ? 'Escolher esta' : 'Choose this one'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** O card da Travessia em uso: a única coisa de Travessia que a tela principal mostra. */
function CardAtivo({ crossings, isPt, language, todayKey, now, justDone, onFiz }: {
  crossings: CrossingsState; isPt: boolean; language: Language; todayKey: string; now: number; justDone: boolean;
  onFiz: () => void;
}) {
  const ativa = activeChallenge(crossings, todayKey, now);
  if (!ativa) return null;
  const { region, challenge } = ativa;
  const nome = isPt ? region.namePt : region.nameEn;
  const feito = doneToday(crossings, todayKey);
  /* O passeio leva um tempo: o "Concluir" só abre depois de `STROLL_MIN_MINUTES`. */
  const espera = feito ? 0 : strollWaitMs(crossings, now);
  /* O relógio de 24 h (M4): horas que restam, sem contagem regressiva ao vivo. */
  const horas = !feito && crossings.pickAt !== null
    ? Math.max(1, Math.ceil((crossings.pickAt + MISSION_WINDOW_MS - now) / 3_600_000))
    : null;
  const titulo = travessiaTitle(challenge.id, isPt);
  return (
    <div
      data-travessia-ativa={challenge.id}
      data-travessia-feito={feito ? 'sim' : 'nao'}
      className={justDone ? 'sm2-travessia-assenta' : undefined}
      style={{
        ...sheetCard, gap: 12, position: 'relative',
        borderColor: feito ? 'var(--sm2-primary-ink)' : 'var(--sm2-line)',
        backgroundColor: feito ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
      }}
    >
      {justDone && <Celebration />}
      {/* UMA coisa só (beta-2, 5.1): a MISSÃO é a informação principal e o DESTINO é o que ela justifica — não
          há mais duas etapas (antes: "destino" e "faça isto" em blocos separados). */}
      <div data-passeio-faca style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-travessia-titulo style={sheetCardTitle}>
          {titulo ?? (isPt ? challenge.textPt : challenge.textEn)}
        </p>
        <Proposta c={challenge} isPt={isPt} />
      </div>
      <div data-passeio-destino-card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RegionPostal region={region} width={64} height={52} />
        <Destino nome={nome} isPt={isPt} />
      </div>

      {/* O estado de HOJE. Sem sequência, sem "ontem", sem cobrança: ou está
          feito, ou está de pé — e deixá-la ir embora não custa nada (M4). */}
      <p role="status" aria-live="polite" data-travessia-hoje style={{ ...sm2Text, margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
        {feito ? (
          <>
            <Icon name="check_circle" size={20} fill={1} tone="primary" />
            <span>
              {isPt
                ? `Feita. Esta noite o Soulmon viaja para ${nome}.`
                : `Done. Tonight the Soulmon travels to ${nome}.`}
            </span>
          </>
        ) : (
          <span data-travessia-tempo style={{ color: 'var(--sm2-muted)' }}>
            {espera > 0
              ? (isPt ? 'Um passeio leva um tempo. Vá com calma; o botão abre quando der.' : 'A stroll takes a little while. Take it easy; the button opens when it is time.')
              : horas === null
                ? (isPt ? 'Ainda não marcada.' : 'Not marked yet.')
                : (isPt ? `Vale por mais ${horas} h.` : `${horas} h to go.`)}
          </span>
        )}
      </p>

      {/* O "Concluir" é feito AQUI, no NPC (a Home só lista a linha "Take a stroll"); abre depois dos 30 min, com a contagem no botão. */}
      <button
        type="button"
        data-travessia-fiz
        disabled={feito || espera > 0}
        onClick={onFiz}
        style={{ ...sm2Button('primary', feito || espera > 0), width: '100%' }}
      >
        {feito
          ? (isPt ? 'Feito hoje' : 'Done today')
          : `${isPt ? 'Concluir' : 'Done'}${espera > 0 ? ` · ${formatEspera(espera)}` : ''}`}
      </button>
    </div>
  );
}

/** Contagem do botão: `MM:SS` (arredonda para cima, nunca mostra 00:00 enquanto falta). */
export function formatEspera(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(total / 60))}:${p(total % 60)}`;
}

/** `AAAA-MM-DD` → "3 out" / "Oct 3" (o dia do jogador, sem fuso). */
function diaCurto(day: string, isPt: boolean): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * O REGISTRO das missões feitas (rodada 7, M6): um diário, não um placar — dia,
 * título e cenário, as mais recentes primeiro. Sem total, sem sequência.
 */
function Registro({ log, isPt }: { log: CrossingsState['log']; isPt: boolean }) {
  const [aberto, setAberto] = useState(false);
  if (log.length === 0) return null;
  const itens = [...log].reverse();
  return (
    <div data-travessias-registro style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <hr style={divider} />
      <button
        type="button"
        data-registro-abrir
        aria-expanded={aberto}
        aria-controls="sm2-registro-lista"
        onClick={() => setAberto(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 44, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Registro' : 'Logbook'}</p>
        <Icon name={aberto ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
      </button>
      {aberto && (
        <ul id="sm2-registro-lista" style={{ ...list, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itens.map((e, i) => {
            const titulo = travessiaTitle(e.challenge, isPt) ?? e.challenge;
            return (
              <li key={`${e.day}-${e.challenge}-${i}`} data-registro-item={e.challenge} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{titulo}</span>
                <span style={{ ...note, flexShrink: 0 }}>{diaCurto(e.day, isPt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** O achado de ontem dentro da folha do Passeio (REGISTRO §64): o mesmo `StrollFind` do resumo do dia. */
export type PasseioAchado = Pick<StrollFindProps, 'adventure' | 'isNew' | 'stroll'>;

export function PasseioSheet({ language, crossings, onChange, todayKey, seed = '', now: nowProp, achado }: {
  language: Language;
  crossings: CrossingsState;
  onChange: Update;
  /** O dia do jogador (o mesmo relógio do resto do app). Sem ele, o dia local. */
  todayKey?: string;
  /** A semente do sorteio das missões do dia (o id do save). */
  seed?: string;
  /** O relógio (epoch ms) da janela de 24 h. Sem ele, `Date.now()` (renova a cada minuto). */
  now?: number;
  /** O que o Soulmon encontrou no passeio de ontem (ligado à missão que a pessoa escolheu): um fluxo só com o resumo do dia. */
  achado?: PasseioAchado | null;
}) {
  const isPt = language === 'pt-BR';
  const [aberto, setAberto] = useState<string | null>(null);
  const [justDone, setJustDone] = useState(false);
  const [relogio, setRelogio] = useState(() => Date.now());
  const now = nowProp ?? relogio;
  // 1 s só enquanto o "Concluir" espera os 30 min; fora disso, 1 min (nada de ticker à toa).
  const esperando = !doneToday(crossings, todayKey ?? fallbackDayKey()) && crossings.active !== null && strollWaitMs(crossings, now) > 0;
  useEffect(() => {
    if (nowProp !== undefined) return;
    setRelogio(Date.now());
    const t = window.setInterval(() => setRelogio(Date.now()), esperando ? 1000 : 60_000);
    return () => window.clearInterval(t);
  }, [nowProp, esperando]);

  const dia = todayKey ?? fallbackDayKey();
  const ativa = activeChallenge(crossings, dia, now);
  const feitoHoje = doneToday(crossings, dia);
  const pendentes = crossings.pending.map(regionById).filter((r): r is Region => !!r);
  const nomeDe = (r: Region) => (isPt ? r.namePt : r.nameEn);
  const ofertas = useMemo(() => dailyOffer(dia, seed), [dia, seed]);

  const escolher = (region: RegionId, challengeId: string) => {
    const t = Date.now(); // fora do updater: ele pode rodar duas vezes (footgun 6)
    onChange(c => pickMission(c, dia, seed, region, challengeId, t));
    setAberto(null);
    setJustDone(false);
  };

  return (
    <div data-passeio style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* UM só "i" por folha (I2): `ModalInfo` o leva à linha do título da moldura. */}
      <ModalInfo language={language} align="right" label={isPt ? 'Sobre o Passeio' : 'About the Stroll'}>
          <InfoTipSection title={isPt ? 'O passeio' : 'The stroll'}>
            {isPt
              ? 'Ele sai para passear todo dia e volta com o que viu no relatório do fim do dia. Uma missão escolhida decide o destino da noite.'
              : 'It heads out every day and tells you what it saw in the end-of-day report. A chosen mission sets the night’s destination.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Missões do dia' : 'Daily missions'}>
            {isPt
              ? 'Todo dia saem três missões, de lugares diferentes. Escolha uma, ou nenhuma. Cada missão é um cenário: à noite o Soulmon viaja para lá e volta com uma historinha. Uma Travessia é algo que você faz na sua vida, fora do app; vale a versão plena ou a pequena. Escolhida, a missão fica com você por 24 horas; se não der, ela se vai sem custo e saem outras.'
              : 'Every day three missions come up, from different places. Pick one, or none. Each mission is a scene: at night the Soulmon travels there and comes back with a little story. A Crossing is something you do in your own life, outside the app; the full or the small version counts. Once picked, the mission stays with you for 24 hours; if it does not work out, it goes away at no cost and new ones come up.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Marcos de Aventura' : 'Adventure Milestones'} last>
            {isPt
              ? 'Cada missão feita soma um Marco, no máximo um por dia. Em 5, 10 e 20 Marcos o Soulmon volta com um postal especial. Não muda nada no jogo, nunca diminui e não tem prazo.'
              : 'Each mission done adds one Milestone, at most one a day. At 5, 10 and 20 Milestones the Soulmon comes back with a special postcard. It changes nothing in the game, never goes down and has no deadline.'}
          </InfoTipSection>
      </ModalInfo>
      {achado && (
        <section data-passeio-achado aria-label={isPt ? 'Da aventura de ontem' : "From Yesterday's Adventure"} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={sectionHead}>{isPt ? 'Da aventura de ontem' : "From Yesterday's Adventure"}</p>
          <StrollFind adventure={achado.adventure} isNew={achado.isNew} stroll={achado.stroll} language={language} />
          <hr style={divider} />
        </section>
      )}
      <section data-travessias aria-label={isPt ? 'Missões' : 'Missions'} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ativa ? (
          <CardAtivo
            crossings={crossings}
            isPt={isPt}
            language={language}
            todayKey={dia}
            now={now}
            justDone={justDone}
            onFiz={() => {
              const t = Date.now();
              if (strollWaitMs(crossings, t) > 0) return;
              onChange(c => markDone(c, dia, t));
              setJustDone(true);
            }}
          />
        ) : feitoHoje ? (
          <div data-travessia-vazia style={{ ...sheetCard, alignItems: 'stretch' }}>
            <p style={{ ...sm2Text, margin: 0 }}>
              {isPt ? 'A missão de hoje já foi registrada. Amanhã saem três novas.' : 'Today’s mission is already noted. Three new ones come up tomorrow.'}
            </p>
          </div>
        ) : (
          <MissoesDoDia
            ofertas={ofertas}
            isPt={isPt}
            language={language}
            aberto={aberto}
            setAberto={setAberto}
            onPick={escolher}
          />
        )}

        {crossings.score > 0 && (
          <p data-marcos style={{ ...note, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{isPt ? `Marcos de Aventura · ${crossings.score}` : `Adventure Milestones · ${crossings.score}`}</span>
          </p>
        )}

        {pendentes.length > 0 && (
          <ul style={list}>
            {pendentes.map((r, i) => (
              <li key={r.id} data-travessia-pendente={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0' }}>
                <Icon name="flag" size={24} tone="muted" />
                <p style={{ ...sm2Text, margin: 0 }}>
                  <b style={{ fontWeight: 600 }}>{nomeDe(r)}</b>
                  {i === 0
                    ? (isPt ? ' — abre na próxima noite.' : ' — opens tomorrow night.')
                    : (isPt ? ' — abre num passeio seguinte.' : ' — opens on a later stroll.')}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Registro log={crossings.log} isPt={isPt} />

        <p data-travessias-seguranca style={{ ...note, fontSize: 'var(--sm2-text-xs)' }}>
          {isPt
            ? 'Escolha só o que for seguro e confortável para você hoje. Toda missão tem uma versão para fazer em casa.'
            : 'Pick only what feels safe and comfortable for you today. Every mission has a version you can do at home.'}
        </p>
      </section>
    </div>
  );
}
