import { useState, type CSSProperties } from 'react';
import { choiceStyle, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import type { Language } from '../../utils/i18n';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { HOME_REGION, type CrossingChallenge, type CrossingsState, type Region, type RegionId } from '../../types/travessias';
import {
  activeChallenge, dropCrossing, markDone, mistRegions, offerFor, openRegions, pickCrossing,
  regionById, setDestination, setHidden,
} from '../../utils/travessias';

/**
 * 🧭 A FOLHA DO PASSEIO (30/09/2026, decisão do dono — `REGISTRO-DE-DECISOES.md`
 * §5.6; condições em `docs/reviews/2026-09-30-missoes/` e
 * `docs/reviews/2026-09-30-exploracao/`).
 *
 * Duas camadas, e só a primeira é o Passeio:
 *  1. **Para onde ele vai hoje** — escolha livre entre as regiões abertas (casa
 *     inclusa). O Soulmon sai todo dia, com ou sem Travessia.
 *  2. **Travessias** (opcional, escondível — MIS-11): a ativa, com a versão
 *     pequena ao lado e as saídas "Fiz" / "Trocar" / "Deixar pra lá"; sem ativa,
 *     as regiões em névoa, e tocar numa mostra as três propostas dela.
 *
 * O que esta folha NUNCA mostra, e há teste: número de regiões, total, "faltam
 * N", percentual, prazo, e qualquer anúncio do que uma Travessia "rende" — a
 * oferta fala do ATO (R-31). A palavra da camada é Travessia/Crossing, nunca
 * "desafio"/"challenge" (parecer de menores e marca, 04 R-5). Sem som (R-NOVA),
 * sem push, sem badge, sem contador.
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

function Postal({ region, selected, isPt, onPick }: {
  region: Region; selected: boolean; isPt: boolean; onPick: () => void;
}) {
  const bg = region.bgId ? PET_BACKGROUNDS[region.bgId] : undefined;
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
        <span
          aria-hidden="true"
          style={{
            width: 56, height: 44, flexShrink: 0, borderRadius: 'var(--sm2-radius-sm)',
            background: bg?.css ?? 'radial-gradient(circle at 50% 30%, var(--sm2-surface-2), var(--sm2-bg) 80%)',
            backgroundColor: bg?.baseColor,
            backgroundSize: 'cover', backgroundPosition: 'center bottom',
            imageRendering: 'pixelated',
          }}
        />
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

function Oferta({ region, isPt, currentId, onPick }: {
  region: Region; isPt: boolean; currentId?: string; onPick: (challengeId: string) => void;
}) {
  return (
    <ul style={list} data-travessia-oferta={region.id}>
      {offerFor(region).map(c => (
        <li key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0', borderBottom: '1px solid var(--sm2-line)' }}>
          <Proposta c={c} isPt={isPt} />
          <button
            type="button"
            data-travessia-escolher={c.id}
            disabled={c.id === currentId}
            onClick={() => onPick(c.id)}
            style={{ ...sm2Button('outline', c.id === currentId), width: '100%' }}
          >
            {c.id === currentId ? (isPt ? 'É a sua agora' : 'Your current one') : (isPt ? 'Escolher esta' : 'Choose this one')}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PasseioSheet({ language, crossings, onChange }: {
  language: Language;
  crossings: CrossingsState;
  onChange: Update;
}) {
  const isPt = language === 'pt-BR';
  const [aberta, setAberta] = useState<RegionId | null>(null);
  const [trocando, setTrocando] = useState(false);

  const destino = crossings.destination ?? HOME_REGION;
  const abertas = openRegions(crossings);
  const ativa = activeChallenge(crossings);
  const nevoa = mistRegions(crossings);
  const pendentes = crossings.pending.map(regionById).filter((r): r is Region => !!r);
  const nomeDe = (r: Region) => (isPt ? r.namePt : r.nameEn);

  const escolher = (region: RegionId, challengeId: string) => {
    onChange(c => pickCrossing(c, region, challengeId));
    setAberta(null);
    setTrocando(false);
  };

  return (
    <div data-passeio style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── 1. O Passeio: para onde ele vai hoje ─────────────────────────── */}
      <p style={sectionHead}>{isPt ? 'Para onde ele vai hoje' : 'Where it goes today'}</p>
      <p style={note}>
        {isPt
          ? 'Ele sai para passear todo dia e volta com o que viu no relatório do fim do dia.'
          : 'It heads out every day and tells you what it saw in the end-of-day report.'}
      </p>
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
          <p id="sm2-travessias-title" style={sectionHead}>{isPt ? 'Travessias' : 'Crossings'}</p>
          <p style={note}>
            {isPt
              ? 'Uma Travessia é algo que você faz na sua vida, fora do app. É opcional, e fica esperando o tempo que for.'
              : 'A Crossing is something you do in your own life, outside the app. It is optional, and it waits for as long as you like.'}
          </p>

          {ativa && !trocando && (
            <div data-travessia-ativa={ativa.challenge.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...sm2Hint, margin: 0 }}>
                {isPt ? `Sua Travessia · ${nomeDe(ativa.region)}` : `Your Crossing · ${nomeDe(ativa.region)}`}
              </p>
              <Proposta c={ativa.challenge} isPt={isPt} />
              <p style={note}>{isPt ? 'Qualquer uma das duas vale.' : 'Either one is enough.'}</p>
              <button
                type="button"
                data-travessia-fiz
                onClick={() => onChange(markDone)}
                style={{ ...sm2Button('primary'), width: '100%' }}
              >
                {isPt ? 'Fiz' : 'I did it'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  data-travessia-trocar
                  onClick={() => setTrocando(true)}
                  style={{ ...sm2Button('outline'), flex: 1 }}
                >
                  {isPt ? 'Trocar' : 'Swap'}
                </button>
                <button
                  type="button"
                  data-travessia-deixar
                  onClick={() => onChange(dropCrossing)}
                  style={{ ...sm2Button('ghost'), flex: 1 }}
                >
                  {isPt ? 'Deixar pra lá' : 'Let it go'}
                </button>
              </div>
            </div>
          )}

          {ativa && trocando && (
            <div data-travessia-troca style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...sm2Hint, margin: 0 }}>{nomeDe(ativa.region)}</p>
              <Oferta
                region={ativa.region}
                isPt={isPt}
                currentId={ativa.challenge.id}
                onPick={id => escolher(ativa.region.id, id)}
              />
              <button type="button" onClick={() => setTrocando(false)} style={{ ...sm2Button('ghost'), width: '100%' }}>
                {isPt ? 'Manter a de agora' : 'Keep the current one'}
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

          {!ativa && nevoa.length > 0 && (
            <ul style={list} aria-label={isPt ? 'Regiões na névoa' : 'Regions in the mist'}>
              {nevoa.map(r => {
                const expandida = aberta === r.id;
                return (
                  <li key={r.id} data-nevoa={r.id} style={{ borderBottom: '1px solid var(--sm2-line)' }}>
                    <button
                      type="button"
                      aria-expanded={expandida}
                      onClick={() => setAberta(expandida ? null : r.id)}
                      style={{
                        width: '100%', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left',
                        minHeight: 44, padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                        ...sm2Text,
                      }}
                    >
                      <span aria-hidden="true" style={{ ...icon, opacity: 0.7 }}>🌫️</span>
                      <span style={{ flex: 1, minWidth: 0, color: 'var(--sm2-muted)' }}>{nomeDe(r)}</span>
                    </button>
                    {expandida && (
                      <div style={{ paddingBottom: 8 }}>
                        <Oferta region={r} isPt={isPt} onPick={id => escolher(r.id, id)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p data-travessias-seguranca style={{ ...note, fontSize: 'var(--sm2-text-xs)' }}>
            {isPt
              ? 'Escolha só o que for seguro e confortável para você hoje. Toda Travessia tem uma versão para fazer em casa, e dá sempre para deixar pra lá.'
              : 'Pick only what feels safe and comfortable for you today. Every Crossing has a version you can do at home, and you can always let it go.'}
          </p>
          <button
            type="button"
            data-travessias-esconder
            onClick={() => onChange(c => setHidden(c, true))}
            style={{ ...sm2Button('quiet', false, 'sm'), alignSelf: 'center' }}
          >
            {isPt ? 'Esconder Travessias' : 'Hide Crossings'}
          </button>
        </section>
      )}
    </div>
  );
}
