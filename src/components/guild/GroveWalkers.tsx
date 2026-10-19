/**
 * OS MEMBROS ANDANDO NO BOSQUE (D-51..D-53, 19/10/2026) — a camada de criaturas do cenário ÚNICO do Bosque: serve ao
 * panorama (`GroveVisor`) e à cena do Clã (`GroveCena`). Quem anda e por onde vem de `utils/groveWalkers.ts` (puro).
 *
 *  · até 12 sprites (o máximo do clã), animação CSS barata: UMA travessia por sprite (`sm2-grove-walk`, `transform`)
 *    e UM virar de lado (`sm2-grove-flip`), sem JS por frame. Todos andam sempre — nada indica quem abriu o app hoje (K-13);
 *  · CONTORNO em cada sprite (`sm2-grove-walker-img`): a própria criatura ganha o contorno da cor primária;
 *  · bounce/squash do `sm2-grove-bob` (o de sempre). Movimento reduzido: ninguém anda, ninguém bate, e a reação do
 *    toque vira só um brilho;
 *  · de vez em quando (20..45 s, sorteio) UMA criatura solta um balão com uma frase FIXA (EN+PT, sem IA, sem cobrança);
 *  · TOCAR numa criatura: reação VISUAL (pulo + brilho) e o nome dela embaixo — sem número, sem contribuição. Sem som:
 *    superfície nova nasce muda (K-12).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { groveWalkers, nextBubbleDelay, pickBubble } from '../../utils/groveWalkers';
import { guildText, type GuildKey } from '../../utils/guildCopy';
import type { GuildView } from '../../utils/community';
import type { Language } from '../../utils/i18n';

/** Tempo que o balão e o nome ficam à vista. */
const BUBBLE_MS = 4_200;
const NAME_MS = 2_600;

export interface GroveWalkersProps {
  language: Language;
  guild: Pick<GuildView, 'members'>;
  /** A criatura de quem olha (o App sabe o estágio dela). */
  mySprite: string;
  reducedMotion: boolean;
  /** Lado do sprite, em px: o seu e o dos outros (escala inteira de 256²: 64/96 no panorama). */
  sizes: { own: number; other: number };
  /** Onde os pés pisam (% da altura da cena) na faixa mais ao fundo; as outras faixas descem `faixa` pontos. */
  baseY: number;
  faixa?: number;
}

export function GroveWalkers({ language, guild, mySprite, reducedMotion, sizes, baseY, faixa = 3 }: GroveWalkersProps) {
  const walkers = useMemo(() => groveWalkers(guild), [guild]);
  const [fala, setFala] = useState<{ key: string; phrase: number } | null>(null);
  const [toque, setToque] = useState<{ key: string; n: number } | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const nomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = (k: GuildKey) => guildText(language, k);

  // D-52: um balão de vez em quando. Um timer por vez (sem laço de quadro); desmontar limpa tudo.
  useEffect(() => {
    if (walkers.length === 0) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let some: ReturnType<typeof setTimeout> | undefined;
    const agendar = () => {
      espera = setTimeout(() => {
        if (!vivo) return;
        const p = pickBubble(walkers.length, Math.random(), Math.random());
        if (p) {
          setFala({ key: walkers[p.who].key, phrase: p.phrase });
          some = setTimeout(() => { if (vivo) setFala(null); }, BUBBLE_MS);
        }
        agendar();
      }, nextBubbleDelay(Math.random()));
    };
    agendar();
    return () => { vivo = false; if (espera) clearTimeout(espera); if (some) clearTimeout(some); };
  }, [walkers]);

  useEffect(() => () => { if (nomeTimer.current) clearTimeout(nomeTimer.current); }, []);

  const tocar = (key: string) => {
    setToque(prev => ({ key, n: (prev?.key === key ? prev.n : 0) + 1 }));
    setNome(key);
    setFala(null);
    if (nomeTimer.current) clearTimeout(nomeTimer.current);
    nomeTimer.current = setTimeout(() => setNome(null), NAME_MS);
  };

  return (
    <div className="sm2-grove-walkers" data-grove-walkers data-count={walkers.length} data-reduced-motion={reducedMotion ? 'true' : undefined}>
      {walkers.map(w => {
        const size = w.own ? sizes.own : sizes.other;
        const titulo = w.own ? t('guild.bosque.eu') : (w.nome ?? t('guild.roda.alguem'));
        const reage = toque?.key === w.key;
        return (
          <div
            key={w.key}
            className="sm2-grove-walker"
            data-grove-walker={w.own ? 'own' : 'other'}
            data-lane={w.lane}
            style={{
              left: `${w.home}%`,
              top: `${baseY + w.lane * faixa}%`,
              ...(reducedMotion ? { animation: 'none' } : {
                ['--gw-amp' as string]: String(w.amp),
                ['--gw-dur' as string]: `${w.dur}s`,
                ['--gw-delay' as string]: `${w.delay}s`,
              }),
              zIndex: w.lane + 1,
            }}
          >
            <button
              type="button"
              className="sm2-grove-walker-btn"
              aria-label={titulo}
              onClick={() => tocar(w.key)}
              style={{ width: size, height: size, left: -Math.round(size / 2), top: -Math.round(size * 0.94) }}
            >
              <span className="sm2-grove-walker-flip" style={reducedMotion ? { animation: 'none' } : undefined}>
                <span key={reage ? toque!.n : 0} className={reage ? 'sm2-grove-walker-pulse sm2-grove-walker-pulse-on' : 'sm2-grove-walker-pulse'} data-grove-reacao={reage ? 'true' : undefined}>
                  <img
                    src={w.own ? mySprite : (w.sprite ?? undefined)}
                    alt=""
                    width={size}
                    height={size}
                    draggable={false}
                    data-grove-creature={w.own ? 'own' : 'other'}
                    data-grove-outline=""
                    className={reducedMotion ? 'sm2-grove-walker-img' : 'sm2-grove-walker-img sm2-grove-bob'}
                    style={{ width: size, height: size }}
                  />
                </span>
              </span>
            </button>
            {fala?.key === w.key && (
              <span className="sm2-grove-walker-fala" role="status" data-grove-fala style={{ bottom: Math.round(size * 0.94) + 4 }}>
                {t(`guild.bosque.fala.${fala.phrase}` as GuildKey)}
              </span>
            )}
            {nome === w.key && (
              <span className="sm2-grove-walker-nome" role="status" data-grove-nome>{titulo}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
