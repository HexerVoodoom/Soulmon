import { useState, type CSSProperties } from 'react';
import { ModalSheet, choiceStyle, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import type { Language } from '../../utils/i18n';
import { HOME_REGION, type CrossingChallenge, type CrossingsState, type Region, type RegionId } from '../../types/travessias';
import {
  activeChallenge, crossingRegions, crossingYield, doneToday, dropCrossing, isRegionOpen, markDone,
  offerFor, openRegions, pickCrossing, regionById, setDestination, setHidden,
} from '../../utils/travessias';
import { travessiaTitle } from '../../utils/travessiaTitles';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { AREA_LABEL, AreaGlyph, RegionPostal } from './TravessiaIcon';

/**
 * 🧭 A FOLHA DO PASSEIO (30/09/2026, decisão do dono — `REGISTRO-DE-DECISOES.md`
 * §5.6; condições em `docs/reviews/2026-09-30-missoes/` e
 * `docs/reviews/2026-09-30-exploracao/`). Redesenhada em 02/10/2026 (F1–F5 de
 * `docs/AJUSTES-NAVEGACAO-2026-10-02.md`).
 *
 * Duas camadas, e só a primeira é o Passeio:
 *  1. **Para onde ele vai hoje** — escolha livre entre as regiões abertas (casa
 *     inclusa). O Soulmon sai todo dia, com ou sem Travessia.
 *  2. **Travessias** (opcional, escondível — MIS-11): a tela mostra SÓ a que
 *     está em uso (card próprio: sinal visual, título, ato, versão pequena, o
 *     que muda no mapa, o estado de hoje) com "Fiz", "Trocar" (abre o modal
 *     com TODAS) e "Recuar". Sem ativa, um botão abre o mesmo modal.
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
const icon: CSSProperties = { fontSize: 24, lineHeight: 1, flexShrink: 0 };

type Update = (f: (c: CrossingsState) => CrossingsState) => void;

/** O dia do jogador de reserva (só quando o `App` não entrega o `todayKey`). */
const fallbackDayKey = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function Postal({ region, selected, isPt, onPick }: {
  region: Region; selected: boolean; isPt: boolean; onPick: () => void;
}) {
  const nome = isPt ? region.namePt : region.nameEn;
  const casa = region.id === HOME_REGION;
  return (
    <li>
      <button
        type="button"
        data-passeio-destino={region.id}
        aria-pressed={selected}
        onClick={onPick}
        style={{ ...choiceStyle(selected), display: 'flex', gap: 12, alignItems: 'center' }}
      >
        <RegionPostal region={region} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>
            {nome}{casa ? (isPt ? ' · casa' : ' · home') : ''}
          </span>
          <span style={{ fontSize: 'var(--sm2-text-xs)', opacity: 0.85 }}>
            {isPt ? region.glimpsePt : region.glimpseEn}
          </span>
        </span>
      </button>
    </li>
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
 * O que a Travessia muda NO MAPA, escrito a partir da regra real
 * (`crossingYield`) — nunca um número, nunca uma promessa maior que a regra.
 */
function mapaLinha(
  y: ReturnType<typeof crossingYield>, nome: string, primeira: boolean, isPt: boolean,
): string {
  if (y === 'abre') {
    return isPt
      ? `No mapa: ao marcar “Fiz”, ${nome} abre no passeio da próxima noite.`
      : `On the map: once you mark “I did it”, ${nome} opens on the next night’s stroll.`;
  }
  if (y === 'guardada') {
    return primeira
      ? (isPt ? `No mapa: ${nome} abre no passeio da próxima noite.` : `On the map: ${nome} opens on the next night’s stroll.`)
      : (isPt ? `No mapa: ${nome} abre num passeio seguinte.` : `On the map: ${nome} opens on a later stroll.`);
  }
  return isPt
    ? `${nome} já está no seu mapa. Repetir é só pelo ato — o mapa não muda.`
    : `${nome} is already on your map. Repeating is just for the act — the map stays the same.`;
}

/**
 * As propostas de uma região: cada uma é um CARD FECHADO, separado do vizinho,
 * com o sinal visual (glifo da área) e o título próprio
 * (`utils/travessiaTitles.ts`). Tocar abre o card — o ato, a versão pequena e o
 * "Escolher esta" (primário, H14). Um aberto por vez, em todo o modal.
 */
function Oferta({ region, isPt, currentId, aberto, setAberto, onPick }: {
  region: Region; isPt: boolean; currentId?: string;
  aberto: string | null; setAberto: (id: string | null) => void;
  onPick: (challengeId: string) => void;
}) {
  return (
    <ul style={sheetCardList} data-travessia-oferta={region.id}>
      {offerFor(region).map(c => {
        const open = aberto === c.id;
        const title = travessiaTitle(c.id, isPt) ?? (isPt ? c.textPt : c.textEn);
        const bodyId = `sm2-travessia-${c.id}`;
        const area = AREA_LABEL[c.area];
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
              <AreaGlyph area={c.area} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span style={sheetCardTitle}>{title}</span>
                <span style={note}>{isPt ? area.pt : area.en}</span>
              </span>
              <Icon name={open ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
            </button>
            {open && (
              <div id={bodyId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px 12px' }}>
                <Proposta c={c} isPt={isPt} />
                <button
                  type="button"
                  data-travessia-escolher={c.id}
                  disabled={c.id === currentId}
                  onClick={() => onPick(c.id)}
                  style={{ ...sm2Button('primary', c.id === currentId), width: '100%' }}
                >
                  {c.id === currentId ? (isPt ? 'É a sua agora' : 'Your current one') : (isPt ? 'Escolher esta' : 'Choose this one')}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** O modal com TODAS as Travessias, por região. Ver e trocar; nada obriga. */
function TodasModal({ open, onClose, language, crossings, currentId, onPick }: {
  open: boolean; onClose: () => void; language: Language; crossings: CrossingsState;
  currentId?: string; onPick: (regionId: RegionId, challengeId: string) => void;
}) {
  const isPt = language === 'pt-BR';
  const [aberto, setAberto] = useState<string | null>(null);
  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      language={language}
      title={isPt ? 'Todas as Travessias' : 'All Crossings'}
    >
      <div data-travessias-todas style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <InfoTip language={language} label={isPt ? 'Sobre trocar de Travessia' : 'About switching Crossings'} align="right">
            {isPt
              ? 'Veja à vontade. Trocar não custa nada, e dá para voltar a qualquer uma depois.'
              : 'Look around. Switching costs nothing, and you can come back to any of them later.'}
          </InfoTip>
        </div>
        {crossingRegions().map(r => (
          <section key={r.id} data-travessias-regiao={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RegionPostal region={r} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={sectionHead}>{isPt ? r.namePt : r.nameEn}</span>
                {isRegionOpen(crossings, r.id) && (
                  <span style={note}>{isPt ? 'Já está no seu mapa' : 'Already on your map'}</span>
                )}
              </span>
            </header>
            <Oferta
              region={r}
              isPt={isPt}
              currentId={currentId}
              aberto={aberto}
              setAberto={setAberto}
              onPick={id => onPick(r.id, id)}
            />
          </section>
        ))}
      </div>
    </ModalSheet>
  );
}

/** O card da Travessia em uso: a única coisa de Travessia que a tela principal mostra. */
function CardAtivo({ crossings, isPt, todayKey, justDone, onFiz, onTrocar, onRecuar }: {
  crossings: CrossingsState; isPt: boolean; todayKey: string; justDone: boolean;
  onFiz: () => void; onTrocar: () => void; onRecuar: () => void;
}) {
  const ativa = activeChallenge(crossings);
  if (!ativa) return null;
  const { region, challenge } = ativa;
  const nome = isPt ? region.namePt : region.nameEn;
  const area = AREA_LABEL[challenge.area];
  const feito = doneToday(crossings, todayKey);
  const y = crossingYield(crossings, region.id);
  const primeira = crossings.pending[0] === region.id;
  const titulo = travessiaTitle(challenge.id, isPt);
  return (
    <div
      data-travessia-ativa={challenge.id}
      data-travessia-feito={feito ? 'sim' : 'nao'}
      className={justDone ? 'sm2-travessia-assenta' : undefined}
      style={{
        ...sheetCard, gap: 12,
        borderColor: feito ? 'var(--sm2-primary-ink)' : 'var(--sm2-line)',
        backgroundColor: feito ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RegionPostal region={region} width={64} height={52} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <p style={{ ...sm2Hint, margin: 0 }}>
            {isPt ? `Sua Travessia · ${nome}` : `Your Crossing · ${nome}`}
          </p>
          <p data-travessia-titulo style={{ ...sheetCardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AreaGlyph area={challenge.area} />
            <span>{titulo ?? (isPt ? challenge.textPt : challenge.textEn)}</span>
          </p>
          <p style={note}>{isPt ? area.pt : area.en}</p>
        </div>
        <InfoTip language={isPt ? 'pt-BR' : 'en-US'} label={isPt ? 'Sobre as duas versões' : 'About the two versions'} align="right">
          {isPt ? 'Qualquer uma das duas vale.' : 'Either one is enough.'}
        </InfoTip>
      </div>

      <Proposta c={challenge} isPt={isPt} />

      <p data-travessia-mapa style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>
        {mapaLinha(y, nome, primeira, isPt)}
      </p>

      {/* O estado de HOJE. Sem sequência, sem "ontem", sem cobrança: ou está
          feito, ou está esperando — e esperar não custa nada. */}
      <p role="status" aria-live="polite" data-travessia-hoje style={{ ...sm2Text, margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
        {feito ? (
          <>
            <Icon name="check_circle" size={20} fill={1} tone="primary" />
            <span>
              {isPt
                ? 'Registrado por hoje. Amanhã dá para fazer de novo, se quiser.'
                : 'Noted for today. Tomorrow you can do it again, if you like.'}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--sm2-muted)' }}>
            {isPt ? 'Hoje: ainda não marcada. Sem pressa.' : 'Today: not marked yet. No rush.'}
          </span>
        )}
      </p>

      <button
        type="button"
        data-travessia-fiz
        disabled={feito}
        onClick={onFiz}
        style={{ ...sm2Button('primary', feito), width: '100%' }}
      >
        {feito ? (isPt ? 'Feito hoje' : 'Done today') : (isPt ? 'Fiz' : 'I did it')}
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" data-travessia-trocar onClick={onTrocar} style={{ ...sm2Button('outline'), flex: 1 }}>
          {isPt ? 'Ver todas e trocar' : 'See all and swap'}
        </button>
        <button type="button" data-travessia-recuar onClick={onRecuar} style={{ ...sm2Button('ghost'), flex: 1 }}>
          {isPt ? 'Recuar' : 'Step back'}
        </button>
      </div>
    </div>
  );
}

export function PasseioSheet({ language, crossings, onChange, todayKey }: {
  language: Language;
  crossings: CrossingsState;
  onChange: Update;
  /** O dia do jogador (o mesmo relógio do resto do app). Sem ele, o dia local. */
  todayKey?: string;
}) {
  const isPt = language === 'pt-BR';
  const [todas, setTodas] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const dia = todayKey ?? fallbackDayKey();
  const destino = crossings.destination ?? HOME_REGION;
  const abertas = openRegions(crossings);
  const ativa = activeChallenge(crossings);
  const pendentes = crossings.pending.map(regionById).filter((r): r is Region => !!r);
  const nomeDe = (r: Region) => (isPt ? r.namePt : r.nameEn);

  const escolher = (region: RegionId, challengeId: string) => {
    onChange(c => pickCrossing(c, region, challengeId));
    setTodas(false);
    setJustDone(false);
  };

  return (
    <div data-passeio style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── 1. O Passeio: para onde ele vai hoje ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={sectionHead}>{isPt ? 'Para onde ele vai hoje' : 'Where it goes today'}</p>
        <InfoTip language={language} label={isPt ? 'Como funciona o passeio' : 'How the stroll works'} align="right">
          {isPt
            ? 'Ele sai para passear todo dia e volta com o que viu no relatório do fim do dia.'
            : 'It heads out every day and tells you what it saw in the end-of-day report.'}
        </InfoTip>
      </div>
      <ul style={list} role="group" aria-label={isPt ? 'Destino do passeio' : 'Stroll destination'}>
        {abertas.map(r => (
          <Postal
            key={r.id}
            region={r}
            isPt={isPt}
            selected={r.id === destino}
            onPick={() => onChange(c => setDestination(c, r.id))}
          />
        ))}
      </ul>

      {crossings.hidden ? (
        <button
          type="button"
          data-travessias-mostrar
          onClick={() => onChange(c => setHidden(c, false))}
          style={{ ...sm2Button('quiet', false, 'sm'), alignSelf: 'center' }}
        >
          {isPt ? 'Mostrar Travessias' : 'Show Crossings'}
        </button>
      ) : (
        <section data-travessias aria-labelledby="sm2-travessias-title" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <hr style={divider} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p id="sm2-travessias-title" style={sectionHead}>{isPt ? 'Travessias' : 'Crossings'}</p>
            <InfoTip language={language} label={isPt ? 'O que é uma Travessia' : 'What a Crossing is'} align="right">
              {isPt
                ? 'Uma Travessia é algo que você faz na sua vida, fora do app. É opcional, e fica esperando o tempo que for.'
                : 'A Crossing is something you do in your own life, outside the app. It is optional, and it waits for as long as you like.'}
            </InfoTip>
          </div>

          {ativa ? (
            <CardAtivo
              crossings={crossings}
              isPt={isPt}
              todayKey={dia}
              justDone={justDone}
              onFiz={() => { onChange(c => markDone(c, dia)); setJustDone(true); }}
              onTrocar={() => setTodas(true)}
              onRecuar={() => { onChange(dropCrossing); setJustDone(false); }}
            />
          ) : (
            <div data-travessia-vazia style={{ ...sheetCard, alignItems: 'stretch' }}>
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt ? 'Nenhuma Travessia em uso agora. Tudo bem assim.' : 'No Crossing in use right now. That is fine.'}
              </p>
              <button
                type="button"
                data-travessia-trocar
                onClick={() => setTodas(true)}
                style={{ ...sm2Button('primary'), width: '100%' }}
              >
                {isPt ? 'Ver as Travessias' : 'See the Crossings'}
              </button>
            </div>
          )}

          {pendentes.length > 0 && (
            <ul style={list}>
              {pendentes.map((r, i) => (
                <li key={r.id} data-travessia-pendente={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0' }}>
                  <span aria-hidden="true" style={icon}>🌄</span>
                  <p style={{ ...sm2Text, margin: 0 }}>
                    <b style={{ fontWeight: 600 }}>{nomeDe(r)}</b>
                    {i === 0
                      ? (isPt ? ' — abre no passeio da próxima noite.' : " — it will open on the next night's stroll.")
                      : (isPt ? ' — abre num passeio seguinte.' : ' — it will open on a later stroll.')}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p data-travessias-seguranca style={{ ...note, fontSize: 'var(--sm2-text-xs)' }}>
            {isPt
              ? 'Escolha só o que for seguro e confortável para você hoje. Toda Travessia tem uma versão para fazer em casa, e dá sempre para recuar.'
              : 'Pick only what feels safe and comfortable for you today. Every Crossing has a version you can do at home, and you can always step back.'}
          </p>
          <button
            type="button"
            data-travessias-esconder
            onClick={() => onChange(c => setHidden(c, true))}
            style={{ ...sm2Button('quiet', false, 'sm'), alignSelf: 'center' }}
          >
            {isPt ? 'Esconder Travessias' : 'Hide Crossings'}
          </button>

          <TodasModal
            open={todas}
            onClose={() => setTodas(false)}
            language={language}
            crossings={crossings}
            currentId={ativa?.challenge.id}
            onPick={escolher}
          />
        </section>
      )}
    </div>
  );
}
