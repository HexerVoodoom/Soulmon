/**
 * ATIVIDADES — o hub de MINIJOGOS (não a lista de hábitos, apesar do nome).
 *
 * REVAMP: saiu do fliperama (`sm-px-*`), saíram os 9 PNGs de ícone e saiu o
 * `PixelChip`/`PixelTag`. Superfície limpa sobre `--sm2-*`, glifos pela
 * `<Icon>` (Material Symbols Rounded), tipografia Fredoka/Rubik.
 *
 * ─── A RÉGUA APLICADA ──────────────────────────────────────────────────────
 *
 * 1. **Uma ação dominante: ENTRAR num jogo.** O card inteiro é o alvo (≥44px,
 *    é um `<button>` de verdade, alcançável pelo teclado). Nada mais nesta
 *    tela compete com esse gesto.
 *
 * 2. **Rótulo nomeado no lugar do número.** As etiquetas eram "1 Bit a cada
 *    100 de score", "5 partidas/dia", "Bits por inimigo + ranking" — números
 *    de BALANCEAMENTO, que ninguém usa para escolher entre pular obstáculo e
 *    explorar masmorra. Viraram o que a pessoa realmente decide: "Ranking",
 *    "Recorde", "Rápido", "Toda semana". Os números continuam existindo
 *    dentro de cada jogo, onde são a consequência da jogada.
 *
 * 3. **Corte impiedoso.** Saíram: a setinha por card (o card já é o botão), o
 *    ícone ao lado do título da página, a cápsula com moldura em volta dos
 *    Bits e a segunda linha de metadado que dividia espaço com a descrição.
 *    Sobrou uma linha de descrição por jogo — essa ajuda a escolher, então
 *    fica.
 *
 * 4. **Sem PNG e sem Silkscreen.** O único selo de arcade autorizado aqui era
 *    o título da página em bitmap; ele volta a ser Fredoka, porque "Atividades"
 *    é a voz do PRODUTO, não a do aparelho.
 *
 * A Loja **não** é card daqui: ela é destino da `BottomNav` (ver
 * `BottomNav.tsx`), e duplicar a entrada seria dois caminhos para a mesma
 * tela no mesmo polegar.
 *
 * Nomes de ícone conferidos UM A UM contra o inventário de `tokens.md` — nome
 * fora dele renderiza VAZIO, sem erro nenhum.
 */
import { useState } from 'react';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { bitsStyle } from '../utils/currencies';
import { Icon } from './ui/Icon';
import { sm2Hint, SM2_SHADOW_CARD } from './form/FormKit';
import type { Language } from '../utils/i18n';

/** Bits: o estilo da moeda, inteiro, SEM override de cor.
 *
 *  Havia aqui `color: var(--sm2-ink)` por cima — o número saía na mesma tinta
 *  do texto corrido e a moeda perdia metade da sua identidade (a outra metade,
 *  a família de calculadora, é sutil a 12px). É o padrão "inline vence o
 *  token" que `utils/currencies.ts` declara ter eliminado.
 *
 *  Não havia motivo de contraste: `--sm2-primary-ink` medido sobre as
 *  superfícies desta tela passa AA nos dois temas (bg 5,55 / 13,21 · surface
 *  6,02 / 11,12 · surface-2 5,28 / 9,43). Sem ícone, sempre: a AUSÊNCIA de
 *  ícone é o que distingue Bits de Emblemas e Créditos. */
const bitsNum: React.CSSProperties = bitsStyle;

interface GameCard {
  key: string;
  /** Ligature da Material Symbols. Tem que estar no inventário de 102 nomes. */
  icon: string;
  title: string;
  desc: string;
  /** Rótulo NOMEADO (nunca número de balanceamento). */
  tag: string;
  featured?: boolean;
  onClick: () => void;
}

export function ActivitiesPage({ evolutionStage, demoCharacterId, language, totalPoints, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onGlitchtama, onDungeonEnemyDefeated, onDinoScore, onEarnPoints, onSpendBits, onOpenTournament }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet nos minijogos. */
  demoCharacterId?: string;
  language: Language;
  totalPoints: number;
  onDungeonEnter: () => { ok: true; level: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onDungeonEnemyDefeated: () => void;
  onDinoScore: (score: number) => void;
  onEarnPoints: (pts: number) => void;
  /** WP4.5 — cobra Bits (sumidouro da masmorra). Devolve `false` se não deu. */
  onSpendBits?: (pts: number) => boolean;
  onOpenTournament: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [openGame, setOpenGame] = useState<'dungeon' | 'dino' | 'rps' | null>(null);

  // O Torneio vem primeiro e destacado: é o único que acontece CONTRA outras
  // pessoas e o único com rodada semanal — a coisa que muda de estado sozinha
  // é a que merece o topo.
  const tournament: GameCard = {
    key: 'tournament',
    icon: 'emoji_events',
    title: isPt ? 'Torneio' : 'Tournament',
    desc: isPt ? 'Desafie os pets de outros jogadores.' : "Challenge other players' pets.",
    tag: isPt ? 'Toda semana' : 'Every week',
    featured: true,
    onClick: onOpenTournament,
  };

  const games: GameCard[] = [
    {
      key: 'dungeon',
      icon: 'swords',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? 'Cinco andares, cada um mais forte. Perder custa a run, nunca seus corações.'
        : 'Five floors, each one tougher. Losing costs you the run, never your hearts.',
      tag: isPt ? 'Ranking' : 'Ranking',
      onClick: () => setOpenGame('dungeon'),
    },
    {
      key: 'dino',
      icon: 'pets',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      tag: isPt ? 'Recorde' : 'High score',
      onClick: () => setOpenGame('dino'),
    },
    {
      key: 'rps',
      icon: 'pan_tool',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Duelo rápido contra o seu Soulmon.' : 'A quick duel against your Soulmon.',
      tag: isPt ? 'Rápido' : 'Quick',
      onClick: () => setOpenGame('rps'),
    },
  ];

  const renderCard = (c: GameCard) => (
    <button
      key={c.key}
      type="button"
      onClick={c.onClick}
      /* O CARD INTEIRO é o alvo. `minHeight` 44 é o piso do sistema; na
         prática a linha dupla passa de 72px. */
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 'var(--sm2-radius-md)',
        backgroundColor: c.featured ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface)',
        border: c.featured ? '1px solid var(--sm2-primary-fill)' : '1px solid var(--sm2-line)',
        boxShadow: SM2_SHADOW_CARD,
        transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
      }}
    >
      {/* Ícone PELADO — sem moldura, sem fundo, sem chanfro (regra do dono). */}
      <Icon name={c.icon} size={32} fill={c.featured ? 1 : 0} tone={c.featured ? 'primary' : 'ink'} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="sm2-title"
          style={{ display: 'block', fontSize: 'var(--sm2-text-md)', fontWeight: 600 }}
        >
          {c.title}
        </span>
        <span style={{ ...sm2Hint, display: 'block', marginTop: 2 }}>{c.desc}</span>
      </span>
      {/* O rótulo nomeado. Tinta sobre superfície, nunca `*-fill` como cor de
          texto — e por isso ele não precisa de pílula preenchida atrás. */}
      <span
        style={{
          ...sm2Hint,
          flexShrink: 0,
          fontWeight: 500,
          color: c.featured ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)',
        }}
      >
        {c.tag}
      </span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-xl)',
              fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)',
              color: 'var(--sm2-ink)',
              margin: 0,
            }}
          >
            {isPt ? 'Atividades' : 'Activities'}
          </h1>
          <p style={{ ...sm2Hint, marginTop: 4 }}>
            {isPt ? 'Jogue com seu Soulmon e ganhe Bits.' : 'Play with your Soulmon and earn Bits.'}
          </p>
        </div>
        {/* Saldo: número + a palavra, sem cápsula e sem ícone. */}
        <span
          title={isPt ? 'Bits — moeda dos minijogos, gaste na Loja' : 'Bits — minigame currency, spend it in the Shop'}
          style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0, paddingTop: 2 }}
        >
          <span className="sm2-num" style={{ ...bitsNum, fontSize: 'var(--sm2-text-lg)' }}>{totalPoints}</span>
          <span style={sm2Hint}>Bits</span>
        </span>
      </div>

      {renderCard(tournament)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2
          className="sm2-title"
          style={{ fontSize: 'var(--sm2-text-md)', fontWeight: 600, margin: 0 }}
        >
          {isPt ? 'Minijogos' : 'Minigames'}
        </h2>
        {games.map(renderCard)}
      </div>

      {openGame === 'dungeon' && (
        <DungeonGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
          language={language}
          onEnter={onDungeonEnter}
          onLose={onDungeonLose}
          onHeartDrop={onDungeonHeartDrop}
          onGlitchtama={onGlitchtama}
          onEnemyDefeated={onDungeonEnemyDefeated}
          onEarnPoints={onEarnPoints}
          /* WP4.5 — o sumidouro recorrente: comprar profundidade com Bits. */
          bits={totalPoints}
          onSpendBits={onSpendBits}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'dino' && (
        <DinoGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
          language={language}
          onEarnPoints={onEarnPoints}
          onScore={onDinoScore}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'rps' && (
        <RPSGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
