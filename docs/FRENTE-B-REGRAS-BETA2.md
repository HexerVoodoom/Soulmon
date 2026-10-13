# Frente B (regras) — beta-2: fome, energia por tempo, check-ins, limite diário da masmorra, placa de madeira, Soulsmith e modo imersivo (13/10/2026)

> **Etiqueta:** vivo · **Dono:** `src/utils/hunger.ts` (fome/energia), `src/utils/dungeonIdle.ts` (limite diário), `src/utils/checkIns.ts` · **Régua:** `hunger.test.ts`, `hunger.balanco.test.ts`, `dungeonDaily.test.ts`, `checkIns.test.ts`, `soulsmithAcesso.test.ts`, `hooks/useDungeonReturn.test.tsx`, `functions/api/_dayCounters.test.js` · **Decisão:** `REGISTRO-DE-DECISOES.md` §40
>
> Squad `beta-play-01`, backlog beta-2 (13/10/2026), FRENTE B. Este arquivo descreve o CONTRATO com as outras frentes e o que muda no merge; o código e os testes decidem.

Este documento é o CONTRATO com as outras frentes (A: Home/atividades/cenário · C: resumos/modais/passeio/level-up · D: mercado/jogos/arena/perfil/mood)
e o lembrete do que muda no merge.

---

## 1. Os dois componentes para a faixa de status do cenário (frente A encaixa)

Ambos são PEQUENOS, DESACOPLADOS e só recebem props simples. Nenhum lê o save, nenhum tem relógio próprio, nenhum tem texto na tela além do tempo.

```tsx
import { useEnergyStatus } from '../hooks/useEnergyStatus';   // recalcula a cada 15 s; resultado memoizado (CompanionHUD é memo)
import { EnergyTimer } from './home/EnergyTimer';
import { HungerIndicator } from './home/HungerIndicator';

const status = useEnergyStatus(gameState);   // EnergyStatus = { energy, max, hunger, tier, speed, mode, msToNext }

<EnergyTimer msToNext={status.msToNext} mode={status.mode} language={language} />
<HungerIndicator tier={status.tier} value={status.hunger} language={language} />
```

| Componente | Props | Renderiza |
|---|---|---|
| `EnergyTimer` (`src/components/home/EnergyTimer.tsx`) | `msToNext: number \| null` · `mode: 'full' \| 'regen' \| 'slow' \| 'paused'` · `language` · `style?` | `full` → nada · `regen`/`slow` → `1h05` / `42 min` (tempo até a PRÓXIMA unidade) · `paused` ou sem previsão → `–`. `role="img"` com nome acessível ("Próxima energia em 1h05 (regenerando devagar)"). |
| `HungerIndicator` (`src/components/home/HungerIndicator.tsx`) | `tier: 'fed' \| 'fair' \| 'starving'` · `value?: number` · `language` · `size?` · `style?` | tigela em SVG (20 px) + 3 pontos (3 = bem alimentado, 2 = mediano, 0 = só o contorno = faminto). O estado NÃO depende de cor. `currentColor`: herda a tinta do contêiner (`sm3-stat`). |

**Hoje já estão ligados** no `CompanionHUD` com a MENOR mudança possível (a frente A pode mover/refazer o encaixe): prop nova `energyInfo?` (`Pick<EnergyStatus,'tier'|'hunger'|'mode'|'msToNext'>`);
o timer entra DENTRO do botão da energia (ao lado do número) e o indicador de fome é um irmão do botão, dentro de `.sm3-stats`. O `App.tsx` passa
`energyPoints={energiaStatus.energy}` (a energia de AGORA, não a do último tick) e `energyInfo={energiaStatus}`.

**Regras de estabilidade de layout (13.2):** o timer é `white-space: nowrap`, `tabular-nums`, 11 px, no máximo 5 caracteres; o indicador é 20 × 20 + 4 de ponto. Nenhum
muda de tamanho entre os estados (o `full` do timer some, mas o botão da energia mantém a altura do alvo de toque).

## 2. O contrato do slot da placa "In Dungeon" (6.2)

`DungeonSign` (`src/components/home/DungeonSign.tsx`) ocupa o MESMO lugar do sprite do pet no palco enquanto `soulmonNaMasmorra(save)`. A frente A é dona do layout do cenário; o que ela pode assumir:

* raiz `[data-pet-masmorra]`, **caixa fixa** `SIGN_W × SIGN_H` = **118 × 46** + haste de 12 px — trocar texto, tempo ou idioma NUNCA muda o tamanho (teste: `DungeonSign.render.test.tsx`);
* é um botão (alvo ≥ 44) que chama `onSinalMasmorra`;
* props: `language`, `onTap?`, `returnInMs?: number | null` — vem de `useDungeonReturn(gameState).msLeft` (`src/hooks/useDungeonReturn.ts`);
* texto curto: `In Dungeon` / `Na masmorra`; tempo `1h05` / `42 min`; `Voltou` / `Back` quando o instante passou (tocar recebe o Soulmon);
* visual de madeira em CSS com variáveis locais de fallback (`--sm2-wood`, `--sm2-wood-edge`, `--sm2-wood-ink`) — se a frente A tiver um token de bronze/madeira, basta defini-los.

O tempo é função do ESTADO PERSISTIDO (nada de contagem de tela): o fim da descida que a MESMA conta determinística de `applyDungeonAway` vai dar (teto de 8 h a partir de `since`,
antes disso se a energia, o HP, o limite diário ou o portão acabarem). Reabrir o app, navegar ou remontar o componente dá o mesmo instante; ele muda quando a energia/fome/camadas do dia mudam.

## 3. O que mudou no save (e o contador do fuzz2 para o merge)

Campos NOVOS, todos opcionais, com `??`/sanitize no `hydrateSave` e SEM subir `SAVE_SCHEMA_VERSION` (PLANO-SAVE-SCHEMA §2.6: campo novo com padrão não sobe a versão):

| Campo | Forma | Sanitize | Ausente significa |
|---|---|---|---|
| `hunger` | `{ v: 0..100, at: ms }` | `sanitizeHunger` (`utils/hunger.ts`) | fome cheia (sem dívida retroativa) |
| `energyClock` | `{ at: ms, carry: 0..UNIT_POINTS-1 }` | `sanitizeEnergyClock` | o relógio nasce na próxima leitura (sem regeneração retroativa) |
| `dungeonDaily` | `{ day: 'AAAA-MM-DD', layers: 0..999 }` | `sanitizeDungeonDaily` (`utils/dungeonIdle.ts`) + espelho/monotônico no servidor | nenhuma camada hoje |
| `checkIns` | `{ day: 'AAAA-MM-DD', claimed: ('morning'\|'afternoon'\|'night')[] }` | `sanitizeCheckIns` (`utils/checkIns.ts`) + servidor | nenhuma janela resgatada hoje |

**Fuzz2** (`GameStateContext.hydrate.fuzz2.qa.test.tsx`): base da `release/beta-2` = **124** campos; esta frente soma **+4** → **128**. **No merge: somar os `+N` das quatro frentes** (124 + 4 + A + C + D) e
manter a lista de `toContain`. Os quatro campos já estão listados no teste.

Servidor (`functions/api/save.js`): `_dayCounters.js` guarda `dungeonDaily` e `checkIns` MONOTÔNICOS — mesmo dia: máximo/união; dia anterior ao gravado: mantém o gravado;
dia > dia do servidor + 1: ignora; campo omitido: mantém o gravado. Testes: `_dayCounters.test.js`, `dayCounters.parity.test.js`.

## 4. Para o merge (arquivos tocados que são de outra frente)

| Arquivo | O que mudou aqui | Frente dona |
|---|---|---|
| `src/components/CompanionHUD.tsx` | props novas `energyInfo`, `masmorraRetornoMs`; `EnergyTimer`/`HungerIndicator` ao lado da energia; `DungeonSign` recebe `returnInMs` | A |
| `src/components/home/DungeonSign.tsx` | placa de madeira (caixa 118 × 46 fixa) | A (slot) |
| `src/components/MealInviteCard.tsx` | prop opcional `checkIn` e o botão de check-in | A/C (cartão de refeição) |
| `src/App.tsx` | efeito de acerto da energia (15 s), `useEnergyStatus`, `useDungeonReturn`, `resgatarCheckIn`, `applyBuildingEntry`, texto do toast de comida premium, saída do aviso "falta encher a energia" | todas |
| `src/components/DungeonGame.tsx` | `pagarCamada` pela porta única `spendLayer`; mensagens de limite diário | — |

## 5. Verificação

Cada item tem os testes citados em `product/beta-play-01/builder/b2-b/test-run.log` (saída real colada). Resumo: `tsc` ×3, suíte completa em `TZ=UTC` e `America/Sao_Paulo`, `assembleDebug` com o JBR do Android Studio.
