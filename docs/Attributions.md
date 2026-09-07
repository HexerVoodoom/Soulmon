# ⚠️ 07/09/2026 — "saiu tudo" era MEIA VERDADE

Este documento declarava que a arte e os nomes da Bandai tinham saído. Saíram
do **bundle web**. A limpeza de 07/09/2026 encontrou mais três árvores que
ninguém tinha olhado, e todas iam para produção:

| Onde | O que havia | Como estava |
|---|---|---|
| `src/types/progression.ts` | **57 ids** de espécie da Bandai (`LEGACY_FORM_TIERS`) | no bundle servido, justificados por compat de save |
| `android/res/drawable/` | **40 sprites** da Bandai + `triceramon_dot` | no APK, e `resolveSprite` caía neles **para todo usuário, sempre** — nenhum drawable casava com os estágios reais da árvore |
| `WidgetRenderer.kt` | ~30 nomes em `stageLabel` | tabela morta: todo estágio real caía no `else` |
| `soulProfile/bestiary/pool.json` | **242 criaturas** de franquia protegida com a DESCRIÇÃO OFICIAL copiada | Pokémon 50 · D&D 78 · Warcraft 26 · Digimon 22 · Ragnarok · Final Fantasy · Warhammer · Senhor dos Anéis — num JSON de 947 KB no bundle |

O caso do widget é o mais grave e o mais silencioso: o APK que iria para a Play
Store desenhava um personagem registrado como se fosse a criatura do jogador.

**A única justificativa escrita para a primeira linha era compatibilidade de
save.** O dono confirmou em 07/09/2026 que ninguém nunca usou o app em
produção — o save que aquilo protegia não existe.

Hoje há régua, e ela é executável: `src/utils/sprites.dungeonRoster.test.ts`
varre o **bundle construído** (não o fonte — comentário é apagado no build, e
os comentários-lápide CITAM os nomes de propósito) e o diretório de drawables
do Android; `pipeline.test.ts` varre o pool do bestiário. O filtro de origem
mora em `scripts/sync-oracle-data.mjs`, na FONTE, para não voltar no próximo
`npm run sync:oracle-data`.

---

# Atribuições

## Código e componentes

This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## Sprites e propriedade intelectual — RESOLVIDO (opção b)

O app **não embarca mais nenhuma arte nem nome de terceiro**. Foi a opção (b)
do plano antigo: substituir por arte e nomenclatura originais.

### O que saiu

- Os 25 sprites `src/assets/*_dmc.png`, extraídos de
  [`furudbat/wayland-vpets`](https://github.com/furudbat/wayland-vpets)
  (`assets/dmc/<Nome>.png`) — arte de **Digital Monster**, propriedade da
  **Bandai Namco**. A licença do repositório de origem cobria o código daquele
  projeto e **não transferia direitos sobre a arte**.
- Os 49 PNGs `figma:asset/*` das linhas Tapirmon / Veemon / Salamon, junto com
  `src/types/evolution-lines.ts`, `EggSelection.tsx` e `OnboardingScreen.tsx`.
- Os itens de digievolução da loja e o roster nominal da masmorra, que eram a
  única superfície onde esses nomes apareciam para o jogador.
- Os nomes de franquia que iam dentro do **prompt de geração de sprite**
  (`src/utils/oracle.ts`): pedir "inspirado em Digimon, Pokémon, Palworld…"
  convidava o gerador a devolver algo perto demais de personagem registrado —
  e o resultado ia direto pro app de um usuário real. Há teste travando isso.

### O que entrou no lugar

Arte própria, em `src/assets/soulmon/`: a árvore jogável
(`rookie` → `champion|ultimate|mega` × 3 atributos → `ultra`) e seis linhas
completas usadas como inimigos da masmorra e personagens do modo demo. A
resolução de sprite (`src/utils/getSpriteForStage`) responde **sempre** com arte
nossa; saves antigos que ainda carregam um id de espécie legada caem num
`legacySpriteForStage` determinístico — o mesmo save renderiza sempre a mesma
criatura, sem nunca tocar em arte de terceiro.

### O que ficou, de propósito

- Os nomes de estágio **rookie / champion / ultimate / mega** — vocabulário
  genérico de v-pet, usado por vários jogos do gênero, não marca registrada.
- A chave `digimonName` no bridge nativo do widget e as chaves `digiapp_*` do
  localStorage: identificadores internos que **nunca aparecem para o usuário**
  e cuja renomeação quebraria save e widget de quem já joga (mesma decisão
  documentada no `CLAUDE.md`).

*Nada aqui é aconselhamento jurídico — é o registro de um item que estava em
aberto no benchmark de agosto/2026 (`docs/PLANO-EVOLUCAO.md`) e foi fechado.*

## Tipografia

- **Silkscreen** — Jason Kottke, licença **SIL Open Font License 1.1** (livre
  para uso comercial, inclusive embarcada em app pago). Entra pelo npm
  (`@fontsource/silkscreen`, `OFL-1.1`), não por download avulso, para que a
  origem e a licença fiquem rastreadas no `package.json` e o texto da licença
  viaje junto em `node_modules/@fontsource/silkscreen/LICENSE`.
- Só os subsets `latin` 400/700 são importados (`src/main.tsx`). O subset
  `latin-ext` desta fonte tem 18 glifos e nenhum acento do PT-BR; os acentos
  (á à â ã é ê í ó ô õ ú ü ç e as maiúsculas) estão todos no `latin`,
  conferidos no `cmap` do arquivo antes de adotar.
- **Onde a fonte é usada**: títulos, rótulos, números, botões e HUD. **Nunca**
  em texto corrido (guia, glossário, relatório diário, falas do pet) — bitmap
  em caixa alta destrói legibilidade em parágrafo, e em português os acentos
  ficam colados no teto da caixa.
