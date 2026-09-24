import type { Language } from '../../utils/i18n';
import { AREAS, areaLabel, type AreaId } from '../../navigation';
import { bitsStyle, emblemStyle, CREDIT_COLOR } from '../../utils/currencies';

import bgMapa from '../../assets/soulmon/mapa/bg-mapa.png';
import zonaMercado from '../../assets/soulmon/mapa/zona-mercado.png';
import zonaJogos from '../../assets/soulmon/mapa/zona-jogos.png';
import zonaArena from '../../assets/soulmon/mapa/zona-arena.png';
import zonaExploracao from '../../assets/soulmon/mapa/zona-exploracao.png';
import zonaLaboratorio from '../../assets/soulmon/mapa/zona-laboratorio.png';
import zonaHall from '../../assets/soulmon/mapa/zona-hall.png';

/**
 * O MAPA — arte real (minimal-ui F3).
 *
 * Fundo 9:16 isométrico (`bg-mapa`, D2: pixel art liberada fora do visor)
 * cobrindo a tela inteira (`object-fit: cover`, centrado); as 6 construções
 * são posicionadas em PORCENTAGEM sobre esse fundo — a mesma técnica do mock
 * aprovado (`product/squad-minimal-ui/propostas/mapa/mock.html`), para a
 * posição não depender do tamanho físico da imagem. Cada construção é um
 * `<button>` (não link) que chama `onOpenArea`; o roteamento em si é de
 * `navigation.ts`, um dono só.
 *
 * O canto inferior esquerdo é vinhetado (mesmo truque do mock: um gradiente
 * radial escurecendo, para o link da Home — `CornerLink glow` — se destacar
 * sem caixa em volta).
 *
 * O saldo das 3 moedas é um menu discreto no canto inferior direito, dentro da própria cena —
 * não uma lista separada. Formatação e cor vêm de `utils/currencies.ts`
 * (dono único: nenhuma moeda pode ser confundida com outra).
 */
const AREA_ART: Record<AreaId, string> = {
  mercado: zonaMercado,
  jogos: zonaJogos,
  arena: zonaArena,
  exploracao: zonaExploracao,
  laboratorio: zonaLaboratorio,
  hall: zonaHall,
};

/** Posição do CENTRO da base de cada construção, em % do fundo (do mock aprovado). */
const AREA_POS: Record<AreaId, { left: string; top: string }> = {
  mercado: { left: '30%', top: '17%' },
  jogos: { left: '74%', top: '16.8%' },
  exploracao: { left: '23%', top: '44%' },
  arena: { left: '79%', top: '41.5%' },
  laboratorio: { left: '49%', top: '74.9%' },
  hall: { left: '81.5%', top: '66%' },
};

export function MapPage({ language, onOpenArea, bits, emblems, credits }: {
  language: Language;
  onOpenArea: (id: AreaId) => void;
  bits: number;
  emblems: number;
  credits: number;
}) {
  const isPt = language === 'pt-BR';
  return (
    <section
      aria-labelledby="sm-map-title"
      data-map-page
      style={{
        position: 'relative',
        margin: 'calc(var(--sm2-space-4) * -1)',
        width: 'calc(100% + var(--sm2-space-4) * 2)',
        minHeight: 'calc(100dvh - 2px)',
        overflow: 'hidden',
        borderRadius: 0,
      }}
    >
      <h1 id="sm-map-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {isPt ? 'Mapa' : 'Map'}
      </h1>

      {/* Fundo 9:16, cobrindo — object-fit: cover centrado. */}
      <img
        src={bgMapa}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
        }}
      />

      {/* Vinheta leve no canto inferior esquerdo — onde mora o link da Home. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, bottom: 0, width: '48%', height: '28%',
          background: 'radial-gradient(circle at 0% 100%, rgba(4,10,10,.55), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Saldo das 3 moedas — menu discreto dentro da cena, canto INFERIOR
          direito (espelho do link da Home, no esquerdo). ⚠️ Morava no canto
          superior direito e a arte do "Jogos" (74%/16.8%, renderizada depois
          no DOM) pintava POR CIMA dele — o saldo sumia atrás do cogumelo e o
          contraste ia a quase zero. O canto inferior direito não tem área
          nenhuma; o fundo usa o MESMO escuro dos rótulos das áreas (.82), que
          segura o texto sobre qualquer trecho da arte. É painel de TEXTO, não
          ícone — a regra "ícone nunca dentro de box" não se aplica. */}
      <div
        data-map-currencies
        style={{
          position: 'absolute',
          right: 'var(--sm2-space-3)',
          bottom: 'calc(var(--sm2-space-3) + env(safe-area-inset-bottom, 0px))',
          zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: 2,
          padding: '6px 10px',
          background: 'rgba(8,25,26,.82)',
          border: '1px solid rgba(95,243,224,.35)',
          borderRadius: 'var(--sm2-radius-md)',
          boxShadow: '0 4px 10px rgba(0,0,0,.45)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <span aria-label={isPt ? `${bits} Bits` : `${bits} Bits`} style={{ ...bitsStyle, fontSize: 'var(--sm2-text-sm)' }}>
          {bits} Bits
        </span>
        <span aria-label={isPt ? `${emblems} Emblemas` : `${emblems} Emblems`} style={{ ...emblemStyle, fontSize: 'var(--sm2-text-sm)' }}>
          {emblems} {isPt ? 'Emblemas' : 'Emblems'}
        </span>
        <span
          aria-label={isPt ? `${credits} Créditos` : `${credits} Credits`}
          style={{ color: CREDIT_COLOR, fontFamily: 'var(--sm2-font-text)', fontWeight: 700, fontSize: 'var(--sm2-text-sm)', fontVariantNumeric: 'tabular-nums' }}
        >
          {credits} {isPt ? 'Créditos' : 'Credits'}
        </span>
      </div>

      {/* As 6 construções, posicionadas em % sobre o fundo. */}
      {AREAS.map(id => {
        const pos = AREA_POS[id];
        return (
          <button
            key={id}
            type="button"
            data-map-area={id}
            onClick={() => onOpenArea(id)}
            aria-label={areaLabel(id, isPt)}
            style={{
              position: 'absolute',
              left: pos.left, top: pos.top,
              transform: 'translate(-50%, -78%)',
              width: '34%',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <img
              src={AREA_ART[id]}
              alt=""
              aria-hidden="true"
              style={{ width: '100%', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.55))' }}
            />
            <span
              data-map-label
              style={{
                marginTop: -4,
                padding: '2px 9px',
                borderRadius: 999,
                background: 'rgba(8,25,26,.82)',
                border: '1px solid rgba(95,243,224,.35)',
                fontFamily: 'var(--sm2-font-display)',
                fontSize: 'var(--sm2-text-xs)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                // Fixo, não o token de tema: o fundo do rótulo é sempre
                // escuro translúcido (sobre a arte da cena), nos dois temas —
                // usar `--sm2-ink` faria o texto ficar escuro-sobre-escuro
                // no tema claro (achado nos screenshots do F3).
                color: '#E9F5F2',
                textAlign: 'center',
              }}
            >
              {areaLabel(id, isPt)}
            </span>
          </button>
        );
      })}
    </section>
  );
}
