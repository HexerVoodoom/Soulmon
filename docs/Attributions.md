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

## Áudio

**Desde 21/09/2026: cinco arquivos de áudio gerados por IA em `public/sounds/`** (S16, decisão
do dono em `REGISTRO-DE-DECISOES.md` §6.1 — instalados **sem** o A/B cego ter rodado, "só pra ter
pronto"). Os outros cinco sons continuam **sintetizados em runtime** (`src/utils/sounds.ts`), e os
três eventos com arquivo mantêm o procedural como fallback. Régua executável, nas duas direções
(manifesto ↔ arquivo ↔ esta tabela): `src/utils/sonsAssets.contract.test.ts`.

### Os arquivos (21/09/2026)

| Arquivo · SHA-256 | Evento | Origem · modelo | Provedor do modelo | Prompt | Gerado em | Versão dos termos | Termos |
|---|---|---|---|---|---|---|---|
| `public/sounds/evolve.webm` · `cc8e814b51c7eb5df5a3827cde0674492e869db35f30a4fef778094dc1fc1dfe` | `playEvolve` (Marco) | Higgsfield CLI · `seed_audio` (Seed Audio 1.0), job `298a77b3` | **não nomeado pela plataforma** (§8 — pendência) | `squad-alpha-runs/som-01/prototyper/pacote-prompts.md` §2.1, literal | 21/09/2026 | Terms of Use *Last Updated* 26/07/2026 | §4.4 uso comercial, sem exclusividade · §13.2 sem garantia de originalidade |
| `public/sounds/degenerate.webm` · `1508cfaff0c4889152a94bf7b2735b1e03762dd3b228f7186397b89fb79d904b` | `playDegenerate` (Degeneração) | idem, job `af9b0064` | idem | `pacote-prompts.md` §2.12 | 21/09/2026 | idem | idem |
| `public/sounds/task-complete.webm` · `798225a0dd836866b886506fa8d697fcda87e7eaafd30a783724211bff2d9520` | `playTaskComplete` (Conclusão) | idem, job `852e6808` | idem | `pacote-prompts.md` §2.7 | 21/09/2026 | idem | idem |
| `public/sounds/trilha-base.webm` · `2122e7ed4d330a117eb27b067781a2fcbd90ce1113d800d2839a3702acd10688` | trilha, camada `base` (E1) | Higgsfield CLI · `sonilo_music`, job `49823588` | idem | `pacote-prompts.md` §2.14 | 21/09/2026 | idem | idem |
| `public/sounds/trilha-ritmo.webm` · `6182a9f6ed468a77cfb3c65a6224907b8f7abdce3ce1c7d84df0745a16e175f8` | trilha, camada `ritmo` | Higgsfield CLI · `sonilo_music`, job `6072e49c` | idem | `pacote-prompts.md` §2.15 | 21/09/2026 | idem | idem |

Pós-processamento (corte, 48 kHz, crista, normalização ao alvo da categoria) por
`squad-alpha-runs/som-01/prototyper/pos-processar.mjs` (SFX) e `E:/Soulmon-assets/som-01/mestre-trilha.mjs`
(trilha: mono, 12 compassos a 100 BPM, crossfade de loop, −28 LUFS-S); codificação **WebM/Opus 48 kbps
mono pelo MediaRecorder do Chrome** (não há codec nesta máquina) e decodificação conferida no mesmo
motor. Total **258 248 bytes**, nenhum em `PRECACHE_URLS` (S6). Nenhum prompt contém texto do usuário
(D8/#18); todos carregam a cláusula anti-franquia.

Esta seção existe **antes** de existir asset, de propósito: quando o primeiro arquivo entrar, ele
entra com a linha pronta, e não depois. `dist/` é commitado, então **todo byte de áudio é
permanente no histórico do git** — a diferença entre apagar um arquivo e reescrever histórico.

### A linha obrigatória, por asset

| Campo | O que vai |
|---|---|
| Arquivo | caminho e hash SHA-256 |
| Origem | plataforma e **modelo** (ex.: `seed_audio`) |
| **Provedor do modelo** | quem realmente treinou e opera o modelo — **não** a plataforma que o revende |
| Prompt | o texto exato usado |
| Data | quando foi gerado |
| **Versão dos termos** | a data de "Last Updated" dos termos vigentes **na geração** |
| Termos | uso comercial concedido · sem exclusividade · **sem garantia de originalidade** |

As duas colunas em negrito **não são burocracia** — cada uma existe por um achado do levantamento
de 09/09/2026 (`squad-alpha-runs/som-01/termos-gerador.md`):

- **Provedor do modelo** — a §8 dos termos da plataforma obriga a cumprir **também** a política de
  uso aceitável do provedor terceiro, e diz que **a mais restritiva prevalece**. Só que a
  plataforma **não nomeia** o provedor do modelo de áudio em nenhuma fonte pública que se consiga
  ler. Enquanto a coluna estiver vazia, estamos vinculados a uma política que **não conseguimos
  identificar nem ler** — e isso precisa ficar visível, não implícito.
- **Versão dos termos** — os termos mudam. O direito sobre um asset gerado hoje é o dos termos de
  hoje, e um arquivo permanente no histórico sobrevive a várias revisões deles.

### O que os termos dizem, lido na fonte (09/09/2026)

`higgsfield.ai/terms-of-use-agreement`, *Last Updated* 26/07/2026:

- **§4.4** — uso comercial concedido, **sem trava de plano**, sem cessão de propriedade, com
  direito de transferir e sublicenciar. E a parte que sustenta o `dist/` commitado, literal:
  *"Your rights in Outputs you have generated **and exported** survive cancellation of your
  subscription or deletion or termination of your Account."* O **"and exported"** é condição, não
  enfeite — asset não exportado não carrega o direito.
- **§4.4** — **sem exclusividade**: outro usuário pode receber saída idêntica ou similar.
- **§13.2** — **nega garantia de originalidade ou legalidade**, e põe o *rights clearance* como
  responsabilidade exclusiva do usuário. Ou seja: **o fornecedor declara por escrito que também
  não prova originalidade.**
- **§12** — o usuário indeniza a plataforma. **Não há indemnity a nosso favor.**
- **Atribuição não é exigida** pelos termos. A que fazemos aqui é **regra interna** (S9), porque
  procedência é auditável e originalidade não.
- **Proibido** usar output para treinar, ajustar ou destilar modelo.
- Procedência dos dados de treino do modelo de áudio: **não encontrado**.

### As condições para embarcar áudio gerado num app de loja

Veredito do levantamento: **sim, com condições** — e elas estão listadas em
`squad-alpha-runs/som-01/termos-gerador.md` §2. Em resumo: exportar o asset (não só gerar), não
treinar nada com o output, assumir que clearance e risco financeiro são **nossos**, nenhum prompt
citando franquia, registrar a versão dos termos junto do asset, e tratar a **§8 como pendência
aberta** — não como cumprida por presunção.

> ⚠️ **O que exige advogado, e este projeto não tem um:** protegibilidade da saída, alcance da
> cláusula de indenização sob lei brasileira, as regras de divulgação de conteúdo de IA das lojas,
> e direito adquirido diante de mudança de termos. Isso está **nomeado, não resolvido** — e o
> primeiro passo em aberto é administrativo, não jurídico: **perguntar à plataforma, por escrito,
> qual é o provedor do modelo de áudio e onde fica a política dele.**

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
