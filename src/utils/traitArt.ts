// Arte pixel dos 5 traços de nascimento (item A15 do
// `docs/BACKLOG-ARTE-GERAR.md`), no estilo arcano-tech —
// `docs/PROMPT-ARTE-ARCANO-TECH.md`.
//
// Fronteira de troca no molde de `utils/dreamArt.ts`, `decorArt.ts` e
// `adventureArt.ts`: quem desenha o cartão importa daqui e não conhece PNG
// nenhum. `utils/passives.ts` continua sem saber que arte existe — é módulo de
// regra, e um `import ... from '*.png'` ali amarraria o traço ao pipeline do
// Vite.
//
// ⚠️ O backlog descrevia o A15 como "hoje emoji do sistema", e isso estava
// impreciso: `StatsPage` renderizava `PASSIVE_ICON[id]`, que é NOME de ícone
// line-art do componente `Icon`, não emoji. O `emoji` de `passives.ts` existe e
// FICA — é o glifo que cabe onde não existe `<img>` —, mas não era o que a tela
// mostrava. O ganho real deste item é trocar line-art por pixel art na mesma
// fileira em que o resto já é pixel.
import traitGuloso from '../assets/soulmon/icons/traits/trait-guloso.png';
import traitCarinhoso from '../assets/soulmon/icons/traits/trait-carinhoso.png';
import traitTeimoso from '../assets/soulmon/icons/traits/trait-teimoso.png';
import traitSortudo from '../assets/soulmon/icons/traits/trait-sortudo.png';
import traitMadrugador from '../assets/soulmon/icons/traits/trait-madrugador.png';

/** Id do traço em `utils/passives.ts` → URL do PNG (64×64). */
export const TRAIT_ART: Record<string, string> = {
  guloso: traitGuloso,
  carinhoso: traitCarinhoso,
  teimoso: traitTeimoso,
  sortudo: traitSortudo,
  madrugador: traitMadrugador,
};
