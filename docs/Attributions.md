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
