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
import { ArenaGame } from './ArenaGame';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { bitsStyle } from '../utils/currencies';
import { Icon } from './ui/Icon';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { sm2Tag } from './TaskMeta';
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

export function ActivitiesPage({ evolutionStage, demoCharacterId, language, totalPoints, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onGlitchtama, onDungeonEnemyDefeated, onDinoScore, onEarnPoints, onSpendBits, onOpenTournament, soulmonSkills }: {
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
  /** Skills da ficha por estagio (`gameState.soulmonSkills`). A Arena luta com
   *  as habilidades do bicho quando elas existem, e com um par generico quando
   *  nao — o perfil do oraculo vive so no localStorage e nao sobe para a nuvem. */
  soulmonSkills?: Partial<Record<FichaStage, StageSkills>>;
}) {
  const isPt = language === 'pt-BR';
  const [openGame, setOpenGame] = useState<'dungeon' | 'arena' | 'dino' | 'rps' | null>(null);

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
      // A ARENA fica logo depois da Masmorra porque e a irma dela: mesma barra
      // de tempo, mesma promessa de "perder nao custa coracao". O que muda e a
      // FICHA entrar na conta — o elemento e a habilidade especial do bicho —,
      // e e isso que o texto do cartao precisa dizer, senao ela le como uma
      // segunda masmorra com outro nome.
      key: 'arena',
      // `bolt` (canvas Jogos D-J1): `swords` ja e a Masmorra, `emoji_events`
      // ja e o Torneio e `military_tech` e a MOEDA do Torneio (Emblemas) —
      // o icone de um jogo nao pode ser o glifo de uma moeda.
      icon: 'bolt',
      title: isPt ? 'Arena' : 'Arena',
      desc: isPt
        ? 'Cinco rodadas com o elemento e a habilidade especial do seu Soulmon.'
        : "Five rounds using your Soulmon's element and special skill.",
      tag: isPt ? 'Sua ficha' : 'Your sheet',
      onClick: () => setOpenGame('arena'),
    },
    {
      key: 'dino',
      // `play_arrow` (D-J1): `directions_run` seria mais literal mas nao esta
      // no subset de 102; `pets` era o glifo do PET, nao do jogo.
      icon: 'play_arrow',
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
        backgroundColor: 'var(--sm2-surface)',
        border: '1px solid var(--sm2-line)',
        /* O card em destaque leva anel 1px `primary-ink` (D-J1) — não fundo
           `primary-soft`: o soft é o idioma de SELEÇÃO (linha "you" do
           ranking, chip marcado), e o Torneio não está selecionado. */
        boxShadow: c.featured ? `inset 0 0 0 1px var(--sm2-primary-ink), ${SM2_SHADOW_CARD}` : SM2_SHADOW_CARD,
        transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
      }}
    >
      {/* Ícone PELADO — sem moldura, sem fundo, sem chanfro (regra do dono).
          24 (D-J1: Material 24 pelado; era 32). O destaque do Torneio é o
          ícone em ciano + anel 1px `primary-ink`, a única luz forte da tela. */}
      <Icon name={c.icon} size={24} fill={c.featured ? 1 : 0} tone={c.featured ? 'primary' : 'ink'} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{ ...sm2Text, display: 'block', fontWeight: 500 }}
        >
          {c.title}
        </span>
        <span style={{ ...sm2Hint, display: 'block', marginTop: 2 }}>{c.desc}</span>
      </span>
      {/* O rótulo nomeado como `.chip.tag` 24 (SIS-03, canvas Jogos): pílula
          `surface-2` sem borda, Rubik 12/500 `muted` — a mesma peça das
          etiquetas da Ficha. Não é alvo (CRITICA R7, registro). */}
      <span style={{ ...sm2Tag, flexShrink: 0, color: c.featured ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>
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
            {isPt ? 'Jogos' : 'Games'}
          </h1>
          <p style={{ ...sm2Hint, marginTop: 4 }}>
            {isPt ? 'Jogue com seu Soulmon e ganhe Bits.' : 'Play with your Soulmon and earn Bits.'}
          </p>
        </div>
        {/* Saldo: "N Bits" numa peça só, em `--sm2-font-mono` (calculadora),
            sem cápsula e sem ícone (D-J2, 💠). A cor é a do `bitsStyle`
            (`primary-ink`, DECISÕES §26 — o §25 dizia `ink`, o §26 do mesmo
            dia fecha em `primary-ink` e o código vence). */}
        <span
          className="sm2-num"
          title={isPt ? 'Bits — moeda dos minijogos, gaste na Loja' : 'Bits — minigame currency, spend it in the Shop'}
          aria-label={`Bits: ${totalPoints}`}
          style={{ ...bitsNum, display: 'inline-flex', alignItems: 'center', minHeight: 28, flexShrink: 0, fontSize: 'var(--sm2-text-sm)', whiteSpace: 'nowrap' }}
        >
          {totalPoints} Bits
        </span>
      </div>

      {renderCard(tournament)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2
          className="sm2-title"
          style={{ fontSize: 'var(--sm2-text-md)', fontWeight: 500, margin: 0 }}
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
      {openGame === 'arena' && (
        <ArenaGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
          language={language}
          skills={soulmonSkills}
          onEarnPoints={onEarnPoints}
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
