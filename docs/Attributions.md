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
save.** O dono confirmou em 07/09/2026 que ninguém tinha usado o app em
produção — o save que aquilo protegia não existia naquela data.

> ⚰️ Premissa vencida em 20/10/2026: o app está em teste fechado na Google Play com usuários reais; renomear ou remover ids de save agora exige migração (e backup), não só a justificativa de 07/09. Ver CLAUDE.md › Compatibilidade.

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
| 🗑️ Removida em 20/10/2026 (§136) · `public/sounds/trilha-base.webm` · `2122e7ed4d330a117eb27b067781a2fcbd90ce1113d800d2839a3702acd10688` | trilha, camada `base` (E1) | Higgsfield CLI · `sonilo_music`, job `49823588` | idem | `pacote-prompts.md` §2.14 | 21/09/2026 | idem | idem |
| 🗑️ Removida em 20/10/2026 (§136) · `public/sounds/trilha-ritmo.webm` · `6182a9f6ed468a77cfb3c65a6224907b8f7abdce3ce1c7d84df0745a16e175f8` | trilha, camada `ritmo` | Higgsfield CLI · `sonilo_music`, job `6072e49c` | idem | `pacote-prompts.md` §2.15 | 21/09/2026 | idem | idem |

### As três músicas em streaming (19/10/2026) — plano Pro comprovado por print do dono (20/10/2026)

Tema, combate e Pesadelo. Cada faixa tem dois arquivos (WebM/Opus 72 kbps e M4A/AAC-LC 88 kbps, 48 kHz,
estéreo, sem metadados nem capa). Ganho único de masterização para o alvo de `utils/loudness.ts`
(LUFS-S mediano −28,0); nenhuma intro cortada. Medidas: `SOM.md` §12.

#### "Stone Hall Decay" — tema da casa (`utils/tema.ts`)

| Arquivo · SHA-256 · bytes | Formato |
|---|---|
| `public/sounds/tema-stone-hall-decay.webm` · `65944d0daf3ed90f979f3471686f80d7b3d1dc71ca0fd6f36ec8fb6c54eed31e` · 2 296 694 B | Opus 72 kbps |
| `public/sounds/tema-stone-hall-decay.m4a` · `01edff65c7f84dc2c96caf96d29b8e697a541927f217da79e4ae934e5837c371` · 2 555 598 B | AAC-LC 88 kbps, faststart (reserva p/ Safari/iOS) |

Origem: **Fornecida pelo dono, gerada no Suno**. Suno id `5c0871e5-e086-4625-96d4-5b5a5e0d2027`, criada em
2026-10-19T22:03:18Z, original de 3:47,5 (5 288 519 B). Duração final 227,48 s. Ganho −12,3 dB. Substitui o tema
anterior (outro id Suno, plano Free), que saiu do bundle.

#### "Stone Hall Combat" — todos os combates (`utils/musicaDeCombate.ts`)

| Arquivo · SHA-256 · bytes | Formato |
|---|---|
| `public/sounds/musica-combate.webm` · `f94ea91cf3d8a32059889c87c678c37a19270ad3b95a6b49f7707fe05ca954f5` · 1 849 637 B | Opus 72 kbps |
| `public/sounds/musica-combate.m4a` · `c2dfe0323d17ecd73551489eada3ead9e7eae5d81cec1f4c6676255250a9c16e` · 2 241 408 B | AAC-LC 88 kbps, faststart |

Origem: **Fornecida pelo dono, gerada no Suno**. Suno id `59855db6-6336-4400-86e9-c3b93aec7678`, criada em
2026-10-19T22:28:41Z, original de 3:17,9 (4 611 456 B). Ganho −12,9 dB + fade-out de 3 s (terminava seco).
Toca na Masmorra, na Arena, no Duelo e no Torneio. O título original no Suno continha o nome de uma trilha de terceiro por erro de digitação, segundo declaração do dono em 19/10/2026; o repo não consegue provar por escuta a ausência de material de terceiro.

#### "Stone Hall Nightmare" — Pesadelo (`utils/musicaDeCombate.ts`)

| Arquivo · SHA-256 · bytes | Formato |
|---|---|
| `public/sounds/musica-pesadelo.webm` · `bb897ebe3e968a7e2e328404c5bb77ea2ef4504c840489487475f641b09275b2` · 2 055 285 B | Opus 72 kbps |
| `public/sounds/musica-pesadelo.m4a` · `5d0e1d504fc65db592551f2f85735facf2579a041d3d450e2d0b5829e7d7986d` · 2 454 316 B | AAC-LC 88 kbps, faststart |

Origem: **Fornecida pelo dono, gerada no Suno**. Suno id `e12b0ec8-0451-424a-ae56-f21fd4b952b4`, criada em
2026-10-19T22:29:09Z, original de 3:37,2 (4 976 023 B). Ganho −12,2 dB + fade-out de 3 s (o último segundo ficava
sustentado e cortava seco). O título original no Suno continha o nome de uma trilha de terceiro por erro de digitação, segundo declaração do dono em 19/10/2026; o repo não consegue provar por escuta a ausência de material de terceiro.

#### Licença — o que está declarado e o que falta

⚠️ **Pendência do dono — nada aqui afirma licença.** O Soulmon NÃO registra termo algum do Suno. Estado em
20/10/2026: o dono enviou o print da página do plano (`suno.com/account`): **Pro Plan**, período mensal, próxima cobrança
19/11/2026 (o ciclo começou em 19/10/2026, o dia da geração das três faixas), 2 360 créditos e 20 downloads restantes; a
lista de benefícios do próprio plano traz *"Commercial use rights"* (2 500 créditos e 20 downloads por mês). O print
não prova em qual instante cada faixa foi gerada em relação à assinatura: a data de cobrança é coerente com a declaração
do dono, nada mais. Falta só conferir o texto do termo (versão) antes de citar numa ficha de loja.

O que o repo sabe e o que não sabe:

- **Declaração mais print, não prova pública.** O print do plano Pro (20/10/2026) fica com o dono, fora do git. O guard (`sonsAssets.contract.test.ts`) prova
  procedência (hash ↔ arquivo ↔ esta linha), nunca originalidade nem licença.
- **Termos lidos em 18/10/2026, por resumo da página** (`suno.com/terms`, *Date of Last Revision*
  10/08/2026): conta Free/Basic só usa o Output para fins *"lawful, personal and non-commercial"*; o uso
  comercial exige plano pago **e** um Download permitido dentro da cota do plano. **Conferir o texto antes
  de citar numa ficha de loja** e anotar aqui a versão dos termos e o plano.
- **Verificar os termos comerciais do plano Suno antes de publicar o app na loja.** Se o print mostrar plano
  sem direito comercial, a pendência volta a bloquear a loja.
- A escuta do dono (S8) das três faixas continua pendente.
- Não afeta os assets da Higgsfield (termos próprios, S15).

✅ **SUPERADA em 19/10/2026 pela troca:** a pendência anterior do plano **Free** (tema antigo, "dungeon theme" e
"pvp theme", todos sem direito comercial) deixou de valer porque esses arquivos **saíram do bundle** e não há
fallback. As dúvidas que ela carregava (como o arquivo saiu da conta, a fonte do cover) ficam sem objeto. A
nova pendência é só a deste bloco.

🗑️ **Removida em 19/10/2026:** a trilha de terror procedural do Pesadelo (síntese em código, sem arquivo) e a
faixa da Arena derivada do loop de 2 camadas. O Pesadelo e a Arena tocam as faixas acima.

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

### Os 7 efeitos de combate — banco GRATUITO livre, CC0 (20/10/2026, §130)

Pedido do dono: "o som eu não gostei muito, vê se acha algum banco de dados GRATUITO que dá pra usar". Os 7 efeitos de combate
(D-86..D-92) deixaram de ser síntese procedural (§120, hoje só FALLBACK em `src/utils/sfxCombate.ts`) e passaram a ser **samples de
domínio público (CC0 1.0)**, todos lidos nas páginas de origem em **20/10/2026**. Manifesto: `SFX_DE_COMBATE_LIVRES` em
`src/utils/sonsAssets.ts`; régua: `src/utils/sfxCombateLivres.contract.test.ts` (reprova sample sem fonte/licença/hash nesta tabela).

**Licença — o que foi lido, não resumido de memória.** Kenney: a página de cada pacote traz "Creative Commons CC0" e o `License.txt`
dentro do zip diz "You may use these assets in personal and commercial projects. Credit (Kenney or www.kenney.nl) would be nice but
is not mandatory"; o FAQ (https://kenney.nl/support) diz que os assets são CC0, "free to use ... even in commercial projects" e
"Attribution is not required". JaggedStone (OpenGameArt, "magic spell sfx", 17/10/2014; CC0, "Attribution Notice: None needed") foi a fonte do D-88 até 20/10/2026, quando o "plim" foi trocado por um "push" da Kenney; as alternativas dele seguem só na pasta de pré-escuta. Texto da licença: https://creativecommons.org/publicdomain/zero/1.0/. **Atribuição não é obrigatória para nenhum;
está aqui por boa prática** (e porque o teste de contrato exige a linha). Sem API paga, sem conta, sem cadastro.

| Arquivo instalado (`public/sounds/…`) · SHA-256 · bytes | Evento | Arquivo ORIGINAL · pacote · autor · URL de origem | SHA-256 do original | Licença · atribuição |
|---|---|---|---|---|
| `public/sounds/sfx-combate-attack.webm` · `75c2ed92348f009ec55ba247b33d931a68a2c3f795d2c67945f85fcd60b4eab8` · 3 212 B | D-86 ataque físico (`playAttack`) | `knifeSlice.ogg` · RPG Audio · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/rpg-audio | `4cd96dc630bed9840c15f1dd2306da2cc56a4da26a5d3f1a03c5a7265ac5e54f` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-defend.webm` · `618c762eea231ec47cee8cfb6d18608424589a4d1d8a8cf86203dc77dd4538c1` · 3 698 B | D-87 defesa (`playDefend`) | `impactPlate_medium_000.ogg` · Impact Sounds · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/impact-sounds | `b670d30452983369771081319c268475edaaafe782bf4e8d70bd7eef09d8823c` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-attack-ranged.webm` · `48825c636a07c7be3202d27d60125bb83ffc6bb52edc0ea4c3c2faf8168e8f59` · 3 698 B | D-88 ataque mágico (`playAttackRanged`) — "push" | `thrusterFire_001.ogg` · Sci-Fi Sounds · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/sci-fi-sounds · **derivado**: recorte de 0,5 s do jato de propulsor, passa-baixa 3 kHz, passa-altas 90 Hz, ataque de 6 ms e queda exponencial de 0,42 s (só material CC0) | `924636edc923fe4aab5829b69dc5dc1c5d659dec5739865434dabee752a3bb79` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-charge.webm` · `c82e917f312b19f34b01b7eabca2b330fae5fc38accf0f62642229ef870ad576` · 10 016 B | D-89 carregando o especial (`playCharge`) — "ki" | `spaceEngine_001.ogg` · Sci-Fi Sounds · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/sci-fi-sounds · **derivado**: zumbido de motor lido com velocidade 0,7x→1,7x, passa-baixa que abre e crescendo de 1,2 s (só material CC0) | `ee53af299758b664c086d9ca99efecb41168596ea9fb1c5c24ac4389f94aea6b` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-special.webm` · `e3ec62f3c969c43958ca0475d36f9c7c4d4a844f6e6825005dcfe183c2a1ecc3` · 6 128 B | D-90 soltando o especial (`playSpecial`) | `explosionCrunch_000.ogg` · Sci-Fi Sounds · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/sci-fi-sounds | `4b597d658d0ae101f0a030fbeea5fc3a4292ab85f017470a8254a8e7959cbd69` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-victory.webm` · `3bad651252787f25852c21c9e3a57223fbd91bd86af090e2fa0d53282526093f` · 9 530 B | D-91 vitória (`playVictory`) | `jingles_HIT15.ogg` · Music Jingles · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/music-jingles | `e2929ad1acb0ff929f2367eb06d4a57d3c543be9f5a8b6a7fad7e44e440474e1` | CC0 1.0 · não exigida |
| `public/sounds/sfx-combate-defeat.webm` · `4c39dd150f05105fdb1bdc4a506078d5e2f277c47cbe8c7688b059015985087f` · 12 446 B | D-92 derrota (`playDefeat`) — escolha do dono: o mesmo jingle que era a vitória | `jingles_STEEL07.ogg` · Music Jingles · Kenney Vleugels (Kenney.nl) · https://kenney.nl/assets/music-jingles | `206b5cb18870c1faa393047cb857eda28441b9682380c9eb5910119ea04c2ece` | CC0 1.0 · não exigida |

**Escolhas do dono na pré-escuta (20/10/2026):** D-86, D-87, D-88 e D-90 ficaram como instalados; D-91 passou para a opção C (`jingles_HIT15`); D-92 passou a usar o jingle `jingles_STEEL07` (o antigo D-91-a); D-89 foi trocado por um "ki" derivado de `spaceEngine_001` (alternativas `D-89-ki-b/c` na pré-escuta: `b` deriva de `charge.wav` de faxcorp, CC0, https://opengameart.org/content/electricity-game-sound-pack; `c` de `spaceEngineSmall_000`, Kenney).

**Processamento (fato, não licença):** originais Ogg Vorbis → decodificados pelo Chrome a 48 kHz mono → recorte do silêncio inicial e
da cauda (teto 1,15 s os efeitos / 1,9 s vitória e derrota; fade de saída de 30 ms, 140 ms quando o teto cortou a cauda) → ganho único
até o alvo `arcade` de `src/utils/loudness.ts` (LUFS-M máx. 400 ms, K-weighting) com true peak ≤ −1,6 dBTP → WebM/Opus 64 kbps mono
(MediaRecorder do Chrome) → medido de novo no arquivo decodificado: todos entre −25,03 e −24,97 LUFS-M, true peak entre −16,4 e −3,3 dBTP.
CC0 permite a modificação. Os originais e as 2–3 alternativas de cada efeito (para o dono trocar na escuta) ficam FORA do repositório
(`D:/Soulmon/_gemini_out/w10-sfx/`, pré-escuta em `para-ouvir/`).

**Bancos avaliados e o que ficou de fora, de propósito.** Usados: Kenney (CC0) e OpenGameArt filtrado a CC0 (JaggedStone). Não usados nesta rodada:
"Spell Sounds Starter Pack" (p0ss, OpenGameArt) — CC-BY-SA 3.0/GPL, share-alike que o app não quer carregar; Pixabay Sound Effects — o
resumo da licença (pixabay.com/service/license-summary, lido em 20/10/2026) diz uso grátis, sem atribuição, e proíbe só distribuir o
conteúdo isolado, marca registrada e uso ilícito/enganoso, mas ele não cita áudio e avisa que só a licença completa vale (plano B
razoável, relendo os termos na data do download); Mixkit — a página da licença remete a uma "Sound Effects Free License" própria cujo
texto NÃO consegui ler, então não usei; Freesound (só itens CC0 serviriam; CC-BY-NC e Sampling+ fora) e Sonniss GDC bundles (licença
royalty-free própria, pacotes de GB) não foram avaliados a fundo porque Kenney + OpenGameArt CC0 já cobriram os 7. **Nada de jogo comercial foi usado.** Risco residual: CC0 vale pela
declaração do autor; não existe `grep` por originalidade (mesma ressalva de S9/S15). Se o dono não gostar, a troca é arquivo + hash
+ medidas + esta linha.

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
