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
- ⚠️ **Os nomes de franquia NÃO saíram do prompt de geração de sprite — esta
  linha dizia que sim, e era falso** (corrigido em 22/09/2026, compliance #9 da
  QA rodada 1). O que existe em `src/utils/oracle.ts` › `composeSpritePrompts`
  são **duas variantes**: `imagePrompt`, a **principal**, cita as referências de
  gênero (`GENRE_REFERENCES`: Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh,
  Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi,
  Ragnarok Online, World of Warcraft) porque o resultado sai visivelmente melhor
  — decisão do dono; e `imagePromptFallback`, sem citar ninguém, usada quando o
  provedor recusa por política de conteúdo (`generate-sprite.js` › `isRefusal`).
  **As duas** carregam "Generate an original creature … Do not copy any existing
  franchise character". O que saiu de verdade foi o nome de **personagem**
  (Agumon, Greymon…) de qualquer prompt — o teste varre isso
  (`sprites.dungeonRoster.test.ts` no bundle; `pipeline.test.ts` no pool). O risco
  residual — citar a franquia puxar um design perto demais de personagem
  registrado — fica contido pela cláusula anti-cópia e pelo fallback, não por
  ausência das referências. Ver `CLAUDE.md` › "Prompt do gerador tem DUAS
  variantes".

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

**Desde 21/09/2026: seis arquivos de áudio em `public/sounds/`** (S16, decisão
do dono em `REGISTRO-DE-DECISOES.md` §6.1): cinco gerados por IA instalados **sem** o A/B cego ter rodado ("só pra ter
pronto"), mais um de síntese procedural em Python (07/10/2026). Os outros cinco sons continuam **sintetizados em runtime** (`src/utils/sounds.ts`), e os
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
| `public/sounds/trilha-soulmon-procedural.webm` · `8f2bc5b3e8fd412d33d95074c96dfced6455c1fedefd1b385b4d73cf43fed242` | trilha, camada `procedural` (síntese alternativa) | síntese procedural (Python 3 + NumPy/SciPy) · osciladores + ADSR + vibrato | N/A (síntese matemática, sem IA) | `scripts/gerar-trilha.py` — progressão harmônica (Cm-Gm-Bb-F), melody contraponto com inspiração Pokémon/Digimon/Chrono Cross/FFIX, loop 12 compassos a 100 BPM | 07/10/2026 | N/A | N/A (obra derivada do Soulmon) |

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

### As fontes em `public/fonts/` (self-host — ver `src/index.css`, bloco "FONTES — SELF-HOST")

Conferido em 21/09/2026 (decisão do dono #26, QA geral). Os cinco arquivos são
subsets `woff2` das famílias abaixo, servidos da própria origem porque o service
worker ignora requisição cross-origin (fonte do `fonts.gstatic.com` sumia
offline). Nenhuma das três licenças exige atribuição na interface; a tabela é
regra interna de procedência, como no áudio.

| Arquivo | Família · autor | Licença | Fonte / texto da licença | Uso no app |
|---|---|---|---|---|
| `material-symbols-rounded.woff2` (155 440 B) | **Material Symbols Rounded** — Google | **Apache License 2.0** | <https://github.com/google/material-design-icons> (`LICENSE`); especimen <https://fonts.google.com/icons> | Ícones de sistema FORA do visor (`Icon.tsx`), `font-display: block` |
| `cinzel-latin.woff2` (25 904 B) · `cinzel-latin-ext.woff2` (14 540 B) | **Cinzel** — Natanael Gama, The Cinzel Project Authors (variável 400–900) | **SIL Open Font License 1.1** | <https://fonts.google.com/specimen/Cinzel> · <https://github.com/google/fonts/tree/main/ofl/cinzel> (`OFL.txt`) · <https://github.com/NDISCOVER/Cinzel> | Títulos, display e wordmark de texto (desde 01/10/2026; substituiu a Fredoka, que saiu do bundle) |
| `rubik-latin.woff2` (35 348 B) · `rubik-latin-ext.woff2` (19 400 B) | **Rubik** — Hubert & Fischer, Meir Sadan, Cyreal (variável) | **SIL Open Font License 1.1** | <https://fonts.google.com/specimen/Rubik> · <https://github.com/googlefonts/rubik> (`OFL.txt`) | Texto corrido e interface |

O que cada licença exige, no que toca a nós: as duas permitem embarcar num app
pago; a OFL proíbe **vender a fonte sozinha** e pede que uma versão
**modificada** troque o nome reservado — subset por unicode-range não é
modificação de desenho, e o nome de família é mantido; a Apache pede que o
texto da licença acompanhe a redistribuição do código (o repositório é público
e este arquivo aponta para ele). Os arquivos não têm hash registrado aqui:
**sem hash registrado** — a régua de integridade deles é o próprio git.

### Silkscreen (via npm)

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

## Arte gerada por IA — procedência por lote

Registro pedido pelo dono em 21/09/2026 (pergunta #26 do QA geral), no mesmo
espírito da tabela de áudio: **procedência é auditável, originalidade não.** As
regras que valem para toda linha: nenhum prompt cita nome de **personagem**
registrado (`src/utils/sprites.dungeonRoster.test.ts` varre o bundle) — a
**franquia** como referência de gênero aparece só na variante principal do
sprite pago (`composeSpritePrompts`, ver "O que saiu" acima), nunca na arte
curada desta tabela; nenhum prompt contém texto do usuário exceto o do sprite pago, que é
higienizado e delimitado (`src/utils/oracle.ts`); a arte curada foi vista por
gente antes de entrar — o único caminho **sem** revisão humana é o sprite gerado
sob demanda para a conta paga.

Onde não há hash por arquivo, a coluna diz **sem hash registrado** — os lotes
têm dezenas a centenas de arquivos e a integridade deles é o git; registrar
hash um a um aqui seria uma tabela que ninguém mantém.

| Família (pasta) | Qtd | Modelo · provedor | Data aproximada | Onde o prompt vive | Hash |
|---|---|---|---|---|---|
| Sprite da criatura PAGA (11 formas, gerado por conta) | sob demanda | Higgsfield **Soul** (`platform.higgsfield.ai`), fallback Gemini `gemini-2.5-flash-image` | contínuo, desde ago/2026 | `src/utils/oracle.ts` (`composeSpritePrompts`, duas variantes) → `functions/api/generate-sprite.js` | não se aplica (por conta, no nosso armazenamento) |
| Árvore genérica do jogador (`soulmon/rookie.png` … `ultra.png`, 11 · 384²) + `android/res/drawable/sprite_*` | 11 + 11 | Higgsfield (mesmo pipeline do oráculo, seed fixo) | ago/2026 | `src/utils/oracle.ts` | sem hash registrado |
| Linhas prontas (`soulmon/lines/`, 9 linhas × 4 estágios · 256²; `lines/full/` kaelen/orrin/thalindra nas 11 formas) | 36 + 29 | Higgsfield (Soul) para kaelen/orrin/thalindra e ignar/lumel/serah; Igni/Nautilu/Astrase gerados em `_gemini_out/branches/` e recortados com `image_background_remover` (Higgsfield, 15/09) | ago/2026; +3 linhas em 15/09/2026 | `src/utils/oracle.ts`; rodada de 15/09 em `docs/ASSETS-A-GERAR.md` | sem hash registrado |
| Ícones-ficha das linhas (`lines/icons/`, 72) | 72 | **derivados** dos 256² por script (não é geração) | 21/09/2026 | `scripts-arte/derivar-rodada2.mjs` | sem hash registrado |
| Cenários (`soulmon/bg/` 15; `src/assets/backgrounds/` 11 + 28 thumbs derivadas) | 26 (+28) | `nano_banana_pro` via Higgsfield CLI (rodada 15/09); os mais antigos (`bg/dungeon-1..5`, `tournament`, `bg-gameboy/matrix/ocean`) no Gemini (navegador) | ago/2026 e 15/09/2026 | `docs/ASSETS-A-GERAR.md`, `scripts-arte/hf-gen.mjs`; antigos em `docs/BACKLOG-ARTE-GERAR.md` | sem hash registrado |
| Decoração (`src/assets/decor/`, 33) | 33 | 1ª leva: Higgsfield (`docs/BRIEF-ARTE-DECORACAO.md`); 14 refeitas no Gemini (navegador) em estilo arcano-tech | 12/08/2026 → refeitas 08/09/2026 | `docs/BRIEF-ARTE-DECORACAO.md`, `docs/PROMPT-ARTE-ARCANO-TECH.md`, `_gemini_out/arcano/` | sem hash registrado |
| Sonhos (`soulmon/dreams/`, 30 · 96²) | 30 | Gemini (navegador), folha única fatiada | ago/2026 | `docs/BACKLOG-ARTE-GERAR.md`, `docs/HANDOFF-ARTE-GEMINI.md` | sem hash registrado |
| Aventuras da noite (`soulmon/adventures/`, 24 · 96²) | 12 + 12 | 12 comuns no Gemini (navegador); **12 raras/lendárias desenhadas por script, sem IA** (`scripts/aventura-desenhar.mjs`) | 08/09/2026 | `docs/HANDOFF-ARTE-GEMINI.md` (A20) | sem hash registrado |
| Itens (`soulmon/items/`, 13), berço (`nest-*`, 3), mãos do PPT, cocô | ~20 | Gemini (navegador) | ago/2026 | `docs/BACKLOG-ARTE-GERAR.md` (A1, A8, A11) | sem hash registrado |
| FX de cuidado/batalha (`soulmon/fx/`, 12) e spritesheets (`anim-*`, 9) | 21 | Gemini (navegador) — `_gemini_out/entrega2`, `entrega4` | ago–set/2026, instalados 15/09/2026 | `docs/BACKLOG-ARTE-GERAR.md`; `_gemini_out/entrega*/INSTALAR.md` | sem hash registrado |
| Dino Runner (`soulmon/dino/`, 6) | 6 | Gemini (navegador) — `_gemini_out/entrega4` | set/2026, instalado 15/09/2026 | idem | sem hash registrado |
| FX de ataque por elemento (`soulmon/fx-ataque/`: 17 base × 6 = 102; 136 derivados × 6 = 816; auras 96² derivadas) | 918 (+154) | Gemini (navegador) — `_gemini_out/entrega6`; derivados por recolorização de script | set/2026, instalados 15/09/2026 | `src/assets/soulmon/fx-ataque/INSTALAR.md` | sem hash registrado |
| Ícones de elemento (`soulmon/elementos/`, 137) e sigilos (`soulmon/sigilos/`, 45) | 182 | vindos do repo irmão `D:\Soulmon\Class-System\assets` (procedência registrada lá; gerados por IA na mesma conta) | elementos ago/2026; sigilos 15/09/2026 | `Class-System/assets` | sem hash registrado |
| HUD e emblemas (`soulmon/hud/`, `soulmon/emblems/` 8, ícones de categoria 8, glifos do overlay) | ~25 | `gpt_image_2` via Higgsfield CLI (alfa real, `--background transparent`) | 15/09/2026 | `docs/BACKLOG-ARTE-GERAR.md` (A5, A6, A21), `docs/ASSETS-A-GERAR.md` | sem hash registrado |
| Marca (`src/assets/brand/final/`, favicons, launcher, splash, `mascot-raven`, `intro.mp4`) | ~10 | exploração Higgsfield/Gemini (jul/2026); marca final vetorizada por script | jul–set/2026 | `scripts-arte/vetorizar-pixel.mjs`, `marca-derivados.mjs`; candidatos em `brand/mascot-candidates/` | sem hash registrado |
| Vídeo da cerimônia (`src/assets/video/evolution-bg.mp4`) | 1 | Higgsfield (vídeo) | ago/2026 | sem prompt registrado no repo | sem hash registrado |

**Termos que valem para cada linha:**

- **Higgsfield** — os mesmos de `## Áudio` acima: §4.4 uso comercial, sem
  exclusividade, direito sobrevive ao cancelamento **se exportado** (todo asset
  aqui foi exportado e está no git); §13.2 sem garantia de originalidade; o
  **provedor do modelo de imagem** (`Soul`, `gpt_image_2`, `nano_banana_pro`)
  é nomeado pela plataforma só pelo apelido do modelo — o mesmo buraco da §8
  que o áudio já registra.
- **Gemini (navegador, `gemini.google.com`)** — Termos de Serviço do Google +
  Termos Adicionais de IA Generativa: o usuário é responsável pelo conteúdo
  gerado, uso comercial não é vedado, sem garantia de originalidade, e o Google
  não reivindica propriedade sobre a saída. **Versão dos termos na geração:
  não registrada** — lacuna igual à coluna do áudio, a fechar quando o próximo
  lote sair.
- **Derivados por script** (ícones das linhas, thumbs, auras 96², recolorizações,
  12 aventuras desenhadas, vetorização da marca) **não são geração**: herdam a
  procedência da fonte.

O que continua **sem linha**, de propósito: dependências npm
(`astronomy-engine`, `@capgo/capacitor-pedometer` etc.) — o dono decidiu em
21/09/2026 que o escopo deste arquivo é arte, som e fontes; a licença das deps
vive no `package.json` de cada uma.


## Corvinho - 11 formas (adicionado 29/09/2026)

`src/assets/soulmon/corvo/*`: derivadas do mascote proprio `mascot-raven.png` por recolor programatico (`scripts/gen-corvo-forms.py`, parametros fixos no script). Nenhuma IA de terceiros, nenhuma arte de terceiros.
