# Som do Soulmon — o mínimo para não errar

> **O que é:** o mínimo que um agente precisa saber para não quebrar o som do Soulmon.
> O runbook completo vive em `squad-alpha-runs/som-01/maintainer/runbook-som.md` — e essa
> pasta está no **`.gitignore`**, ou seja, **não vai para o git**. Por isso este arquivo
> existe: é a parte que precisa sobreviver. Se você precisar de detalhe que não está aqui,
> ele está lá, na máquina de quem rodou o run.
> **Origem:** run `som-01` (Fases 0 a 3, 08–09/09/2026). As decisões canônicas são **S1..S17** ⚠️ (dizia S1..S13 até 21/09/2026, e ficou para trás quando o S16 entrou; não existe S14)
> em `docs/REGISTRO-DE-DECISOES.md` §6.1 — este documento não decide nada, só orienta.
> ⚠️ Este arquivo foi escrito na Fase 5, **antes** da Fase 3 e das decisões S11–S13: as
> seções 2, 2.1 e 5 foram **corrigidas em 09/09/2026** contra o código e contra os
> artefatos do run, e o que estava obsoleto está marcado onde estava.
> Em 07/09/2026 nenhum usuário tinha usado o app (`docs/STATUS.md`): tudo sobre "o usuário" foi escrito como `[hipótese]`.
> ⚰️ Premissa vencida em 20/10/2026: o app está em teste fechado na Google Play com usuários reais; a telemetria passa a ter dado real, e as hipóteses `[hipótese]` deste doc podem ser confrontadas com ele. Ver CLAUDE.md › Compatibilidade.

## 1. Onde o som mora

| O quê | Arquivo |
|---|---|
| Os sons — **16 símbolos** (+ `playLevelUp` e, desde 19/10/2026, `playDefend`/`playCharge`/`playDefeat` — §10.5) (`playPresence`, `playTaskComplete`, `playFeed`, `playShower`, `playEvolve`, `playDegenerate`, `playSleep`, `playVisorTune` + os 4 do combate, abaixo: `playAttack`, `playAttackRanged`, `playSpecial`, `playVictory`), síntese procedural; desde 21/09/2026 (S16; o dono escolheu "o gerado nos 3") `playEvolve`/`playDegenerate`/`playTaskComplete` preferem o asset de IA e caem no procedural | `src/utils/sounds.ts` |
| Os sons — **12 símbolos** (`playLevelUp` desde 11/10/2026, §3.2; `playPresence`, `playTaskComplete`, `playFeed`, `playShower`, `playEvolve`, `playDegenerate`, `playSleep`, `playVisorTune` + os 3 do combate, abaixo), síntese procedural; desde 21/09/2026 (S16; o dono escolheu "o gerado nos 3") `playEvolve`/`playDegenerate`/`playTaskComplete` preferem o asset de IA e caem no procedural | `src/utils/sounds.ts` |
| Manifesto e carga dos **5 assets** (3 SFX + 2 camadas de trilha; ⚰️ 20/10/2026 (§136): as 2 camadas foram removidas), hash S9, zero no bundle inicial | `src/utils/sonsAssets.ts` + `public/sounds/` |
| A **música-TEMA** "Stone Hall Decay" (S17, 07/10/2026): `<audio>` em streaming → `busTema`, nasce LIGADA mas só começa no 1º gesto da sessão, 2 formatos por `canPlayType`, 30 s de silêncio entre voltas | `src/utils/tema.ts` + `TEMA_DO_JOGO` em `sonsAssets.ts` |
| A **trilha** (⚰️ 20/10/2026 (§136): o loop de 2 camadas foi removido; o módulo fica para consentimento e pausas) (duas camadas em fase, loop de 12 compassos, gesto liga, E0 para; trim por nº de camadas em `loudness.ts`) + a **faixa da Arena** (derivada, §10) | `src/utils/trilha.ts` + `src/utils/trilhaArena.ts` |
| ⚠️ 19/10 O **diretor de música** (§10, §11): casa = tema, masmorra = "dungeon theme", torneio (lobby) e duelo = "pvp theme", arena = faixa derivada, pesadelo = terror; crossfade | `src/utils/musica.ts` |
| ⚠️ 19/10 O **player de `<audio>` em streaming** (extraído do `tema.ts`: formato por `canPlayType`, troca no erro, refaz no bfcache, pausa entre voltas, fade-in) — dono único | `src/utils/streamMusica.ts` |
| ⚠️ 19/10 O estado das **faixas de combate** (pedida, consentimento, pausas sono/descanso/mudo) no `busTrilha`, crossfade de `CROSSFADE_MUSICA_S`; manifesto `MUSICAS_DE_COMBATE` | `src/utils/musicaDeCombate.ts` + `src/utils/sonsAssets.ts` |
| **A política de loudness** (categorias, alvos, teto, degrau, offsets) — **dono único** | `src/utils/loudness.ts` |
| Barramento único (sub-mix por categoria, limitador, ducking) e **despacho com a R-EX** | `src/utils/audioBus.ts` |
| Trava da **R-NOVA** — os sons cortados não podem voltar por superfície nova | `src/utils/cortes.contract.test.ts` |
| Trava da **R-EX** — janela de coincidência e critério de desempate | `src/utils/audioBus.rex.test.ts` |
| Guards que leem o fonte (AC-4 cobertura, AC-5 plausibilidade, escada) | `src/utils/loudness.contract.test.ts` |
| Guards de call-site (quem chama `play*`, quando, sob `prefers-reduced-motion`) | `src/utils/sounds.contract.test.ts`, `src/components/sintonia-chiado.render.test.tsx` |

**Nunca copie um alvo, um teto ou um degrau para outro arquivo.** A política tem dono único, e
há um teste (`footgun 9`) que reprova a cópia.

## 2. As sete regras que não se negociam

1. **D11 — som só por gesto do usuário.** Nunca agendado pelo app, nunca com `document.hidden`.
   *Porque* "som que sai sozinho não é presença, é alarme": o perfil `[hipótese]` "usuário em
   público" é punido por qualquer som não solicitado, e o app tem de funcionar **100% mudo** —
   som nunca é o único canal de nada. A fronteira da D11 é o **pacote inteiro**: ela mora no
   chamador tanto quanto em `sounds.ts`.
2. **S2 — a trilha nasce desligada** e só começa por gesto. (⚠️ **S17, 07/10/2026, decisão do dono:** a música-TEMA é a ÚNICA exceção — a preferência nasce LIGADA; o autoplay continua proibido: ela só começa no primeiro gesto da sessão. Música é uma por vez — ⚠️ **emendado em 11/10/2026 (§10):** as duas preferências agora CONVIVEM, o diretor alterna por superfície com crossfade e nunca soam juntas.) *Porque* autoplay viola a D11 por
   extensão: música contínua não é presença nem confirmação de ação.
3. **S3 — ≤ −16 LUFS integrado e true peak ≤ −1 dBTP** (ITU-R BS.1770 / EBU R 128). *Porque* é o
   único alvo com norma citada; a alternativa em dBFS mistura régua de pico com régua de
   loudness (as duas estão a **3,017 dB medidos** uma da outra).
4. **S9 — atribuição obrigatória**, escrita no **mesmo passo** em que o arquivo nasce (origem,
   modelo, prompt, data, termos em `docs/Attributions.md` + hash casado com o manifesto nas duas
   direções). *Porque* o guard prova **procedência, nunca originalidade** — não existe `grep` por
   melodia; o único controle de originalidade é a escuta humana do dono (S8).
5. **R-EX — um gesto, uma fonte.** Dois `play*` a ≤ 120 ms são o mesmo gesto: toca a de classe
   mais alta; empate → a menos repetida; empate → a do gesto (não a da consequência); empate → a
   primeira despachada. A perdedora é **descartada, nunca enfileirada**. *Porque* o limitador
   **não** resolve colisão — medido, ele fez **0,00 dB** sobre uma soma de **+4,58 dB**; e
   enfileirar transformaria um gesto em dois sons.
6. **R-CAT — categoria vem do EVENTO, nunca do nível medido do arquivo.** Uma categoria pode ter
   um único membro se, e só se, o perfil de repetição do membro não coincidir com o de nenhuma
   outra. *Porque* categoria criada para caber na medição de um arquivo é decoração: foi assim
   que `playVisorTune` ficou **dois degraus errado** sem nada ficar vermelho.
7. **R-NOVA — toda superfície nova nasce MUDA.** Tela, modo ou fluxo novo entra sem chamar
   nenhum `play*`; o som só é acrescentado depois, pelo caminho do §4 (evento → categoria →
   alvo → calibração → gate). *Porque* a régua faltou uma vez e o preço está medido:
   `ArenaGame.tsx` nasceu **21 minutos antes** do commit dos cortes, reintroduziu dois sons já
   cortados (`playTaskComplete` e `playFeed`) e **3.974 testes passaram verdes**. O defeito não
   foi a tela — foi a **ausência de régua para superfície nova**. Hoje existe a régua:
   `src/utils/cortes.contract.test.ts`.

## 2.1 O que já está decidido, e não se reabre por conta própria

- **S11 — o carinho não ganha som próprio.** O motivo é contraintuitivo e por isso está escrito:
  o gesto **já tem som**. Tocar e esfregar são o mesmo dedo, então o carinho é coberto pela
  **Presença**, que toca **1×/sessão** pela **D11**. Dar som ao carinho seria dar som ao evento
  mais repetido do app — e um motivo que se repete está proibido. **Custo zero**: nenhuma
  amostra, nenhum byte, nenhuma categoria.
- **S12 — a Arena é muda.** Se um dia tiver som, será a classe **Arcade** genérica, **sem uma
  única amostra própria**: pela R-CAT, rodada de combate é impacto e rodada limpa é fim de
  partida, e as duas já estão na Arcade. A **R-NOVA** (regra 7) saiu daqui.
- **S13 — o contrato adaptativo E0–E6 está CONGELADO** como proposta não verificada: validar
  camadas sem nenhuma camada mede só que o barramento sobe e desce um ganho. **Duas peças foram
  extraídas e valem sozinhas**, porque não são regra de trilha: **E0** (`document.hidden` · app
  sem foco · `isSleeping` · janela de descanso) é **D11 + S2 sobre o pacote inteiro** e vale para
  os SFX que existem hoje; e a **chave da trilha separada do `SOUND_MUTED`** é proibição, que não
  precisa de asset para valer.
  **O que o descongela — as duas condições juntas:** (1) existirem no repositório **≥2 camadas
  reais** (`base` + `ritmo`) no mesmo BPM fixo declarado no manifesto, com hash e procedência; **e**
  (2) o dono ter ligado a trilha por gesto **ao menos uma vez** numa sessão real.
  ⚠️ **Recarregar crédito no gerador NÃO descongela sozinho.**

## 3. A escada de loudness (o critério é REPETIÇÃO, não importância)

| Categoria | Alvo (LUFS-M em P-B) |
|---|---|
| Marco · Presença · Degeneração (voluntária) | **−16,0** |
| Sintonia · Cuidado | **−19,0** |
| Conclusão · Transação | **−22,0** |
| Arcade | **−25,0** |
| Música (trilha, tema, faixa da Arena e ⚠️ 19/10 as faixas de combate "dungeon theme" e "pvp theme", §11) | **−22,0 LUFS-S** (era −28,0 até 11/10/2026, §10), **−25,0 em combate**, e ≤ −16 LUFS integrado |

Tolerância **±1,0 LU**; degrau **3,0 dB**, sem meio-degrau; teto **≤ −1 dBTP** em tudo.
**Quem repete mais entra mais baixo.** Nível ≠ importância: se algo "deve soar como perda ou como
conquista", isso é timbre/envelope/duração, não nível.

### 3.1 O som do combate (PR18, pedido do dono, 06/10/2026)

Três eventos novos (e, desde 11/10/2026, um quarto: `playAttackRanged`, o golpe À DISTÂNCIA — §10), **todos `arcade`** (R-CAT: combate é minijogo e o golpe é o que mais repete; vitória de
minijogo não é "concluir tarefa" nem "marco", como no C-11): `playAttack` (golpe básico, soa no IMPACTO),
`playSpecial` (sobe e estoura; a subida cai no fim da cena do especial e o estouro quando o golpe sai) e
`playVictory` (arpejo que segura a última nota). Chamadores: o golpe e o especial só em
`components/games/BattleStage.tsx`; a vitória na Arena (a cada rodada limpa), no Duelo (só se a luta terminou a
favor do pet — o resultado oficial é do servidor), na Masmorra (andar limpo) e no Pesadelo. `playFeed` (som de
COMER) deixou de ser o "som de vitória" da Masmorra e do Pesadelo. Offsets **medidos** em Chromium
(`OfflineAudioContext` + K-weighting BS.1770; o mesmo arnês reproduz `playFeed` −19,00 e `playTaskComplete` −22,00):
**falta o gate humano de escuta** (S8). Continua valendo: som só em luta que o jogador abriu (D11), o gate de
mudo e a R-EX moram em `sounds.ts`/`audioBus.ts`, e a torcida (`TorcidaKit`) segue muda.

### 3.2 O som do level up (pedido do dono, 11/10/2026)

`playLevelUp` — stinger de 3 notas ascendentes (C5–G5–C6 em `square`, oitava em seno por baixo, a última segura),
**categoria `marco`** (R-CAT: subir de Vínculo é raro e voluntário, mesmo perfil de repetição de `playEvolve`; a
categoria vem do EVENTO, não do arquivo). Offset **+1,893 dB**, medido em Chromium (`OfflineAudioContext` +
K-weighting BS.1770; o mesmo arnês reproduz `playTaskComplete` −22,00): −17,893 LUFS-M a ganho 0,12 → alvo −16,0;
pico ≈ −11,5 dBFS. **Único chamador: `components/LevelUpOverlay.tsx`**, e a **D11 mora lá**: só toca com a aba visível
e com o áudio JÁ liberado por um gesto da sessão (`barramentoAtual()?.ctx.state === 'running'`) — o level up que
aparece na abertura do app (evento pendente de uma sessão anterior) nasce mudo. Falta o gate humano de escuta (S8).

## 4. Mudar ou acrescentar um som

- **Mudar o ganho:** provavelmente errado. O nível é derivado da categoria. Se o som está longe
  do alvo, mude a **forma** (envelope, duração, filtro) e **regere a calibração por medição**
  (`gate-loudness.mjs --calibrar`, que grava e sai, depois o gate de verdade); transcreva os
  offsets para `OFFSET_POR_SOM_DB`.
- **Som novo:** evento → categoria (por repetição) → alvo (cai da categoria) → calibração → gate.
  Pular passo faz o **AC-4 reprovar nomeando o som**, porque ele lê o fonte de `sounds.ts`.
- **Aprovação auditiva não é do gate.** "Soa bem" é do dono (S8): fone **e** alto-falante de
  celular, três perguntas fechadas por asset, lote de no máximo 8.

## 5. Áudio gerado por IA — INSTALADO em 21/09/2026 (S16), A/B ainda NÃO OUVIDO

> **21/09/2026:** o bloqueio caiu (480 cr; termos, loja e S11/S12 respondidos pelo dono — registro
> §6.1, nota de 21/09 sob a emenda da S10). Os 12 prompts foram gerados e pós-processados em
> `E:/Soulmon-assets/som-01/` (**fora do repo**: nenhum byte de áudio entrou, `Attributions.md`
> segue sem linha de áudio). Custo medido: **2,5 cr/geração**, plano pro = **3 jobs concorrentes**.
> O A/B cego dos 3 pares está montado (`E:/Soulmon-assets/som-01/ab/escuta.html`, protocolo
> `ab-piloto.md` §8) e **espera o dono ouvir**.
>
> **S16 (mesmo dia, decisão do dono: "só pra ter pronto"):** os assets dos três eventos LONGOS e a
> trilha (duas camadas) **estão no app** — `public/sounds/*.webm` (5 arquivos, 258 248 bytes, Opus pelo MediaRecorder
> do Chrome), manifesto e carga preguiçosa em `src/utils/sonsAssets.ts`, trilha em
> `src/utils/trilha.ts` (switches "Sons" e "Trilha/Music" nas **Configurações** — `SettingsPage`, grupo Som; liga por gesto, para em
> `hidden`/sono/mudo). Os cinco sons curtos seguem procedurais; os três com asset mantêm o
> procedural como fallback. Régua: `src/utils/sonsAssets.contract.test.ts`. O A/B continua sendo
> o gatilho: se o procedural vencer, os assets saem. "O procedural venceu" e "a IA venceu" seguem
> as duas proibidas — ninguém mediu.

Prompts (12) e a sequência de 6 passos estão em
`squad-alpha-runs/som-01/prototyper/pacote-prompts.md`. O que era pré-condição, e como ficou:
crédito no gerador (a conta estava em **0,45**), **termos comerciais confirmados** (§13.2 nega
garantia de originalidade e põe o *rights clearance* no usuário) e política de loja sobre IA.
⚠️ **`dist/` é commitado: todo byte é permanente no histórico do git.** Orçamento: **S6 — 300 KB
no total, zero no bundle inicial**. Enquanto isso vale o **S10**, com a
emenda de 09/09/2026 embutida abaixo.

**Correção por medição, 09/09/2026 — o S10 mudou de significado.** Este arquivo dizia que o
procedural era a solução **provisória**; ficou obsoleto no mesmo dia. O dono decidiu **não
recarregar o gerador por ora**, o prazo virou indeterminado, e a emenda à S10 (§6.1 do registro)
diz o que passou a valer: **o som procedural é a solução VIGENTE do Soulmon**, não um rascunho
esperando substituição. Ele foi calibrado contra a escada (dispersão de **41,63 dB → 8,02 dB**),
passa nos três critérios do gate, e o subsistema inteiro ocupa **1,9% do orçamento S6 com zero
byte de asset**.

⚠️ **A frase que precisa sobreviver:** a premissa do run segue **não medida, não refutada** —
ninguém comparou som de IA com o procedural em teste cego. **Ele não venceu, ele ficou** — o
outro lado nunca entrou em campo. Dizer "o procedural venceu" é inventar um resultado que não
existe. **Gatilho para reabrir, e ele não expira:** haver crédito no gerador, e o A/B rodar.

## 6. O gate — e a regra de ouro

`node squad-alpha-runs/som-01/prototyper/gate-loudness.mjs` (exige Chromium). Assertivas:
**AC-0** amostra existe · **AC-1** teto −1 dBTP · **AC-2** catraca −3,29 dBTP (pior caso medido
+ 1 dB de folga; **não é o teto**) · **AC-3** o medidor não pode ser cego (autovalida com
senoide em fs/4 a 45° e **aborta**) · **AC-4** cobertura · **AC-5** `|offset| ≤ 20 dB` ·
**A-3** desvio por asset · **A-5** alvo único da trilha.

> ### ***"Conserte a ESCADA, não a catraca."*** — está escrito na saída do próprio gate.

**Por que confiar nele:** ele já foi visto vermelho, com as saídas gravadas em disco
(`prototyper/saida-gate-vermelho.txt`, `prova-vermelho-C-amostra-vazia.txt`,
`provas-vermelho-pos-ataque.txt`). Isso importa porque o run achou **dois verdes vazios** — um
deles dentro do próprio gate (`classe0` **removia** o som da medição em vez de reprová-lo), o
outro na calibração (desvio 0,00 era **identidade algébrica**, não medição).
**Regra geral que sai daí: alguma assertiva tem de olhar para quem define a amostra.**

## 7. Aberto, com dono

Do **dono**: crédito no gerador · termos comerciais · política de loja sobre IA · o 🔴 do
microfone (`ChatBox.tsx` grava e envia áudio ao Supabase contra a Data Safety declarada — fora do
escopo do som, **bloqueia publicação**).
Do **engenheiro de áudio** — **as três fechadas em 21/09/2026**, no arnês local
(`prototyper/gate-loudness.mjs`, `driver-chrome.mjs`, `cenarios.ts`; não versionado):
- **Flake do gate**: o diagnóstico agora **persiste** em `prototyper/diagnosticos/*.json` a cada
  saída anormal (exceção, rejeição, vermelho), com produto do Chrome, retries, avisos da página e
  renders recebidos. A **primeira execução instrumentada reproduziu o flake**: *"Chrome nao expos
  aba pelo CDP"* em 20 s — a porta era `9500 + pid % 400`, escolhida **antes** de o Chrome subir,
  e colidia. Hoje o Chrome recebe `--remote-debugging-port=0` e o driver **lê a porta real** de
  `DevToolsActivePort`. Depois do conserto: **11 execuções, 11 verdes, 0 retries**.
- **O-5**: `SONS` é a amostra medida (os **8** do fonte); `playPoopClean`/`playMenuOpen` só entram
  como `MATERIAL_DE_TESTE` dos contraexemplos (0 dB, sem assertiva), e o gate reprova se um deles
  voltar ao fonte ou se a calibração carregar offset de som fora da amostra. `RENDERS_ESPERADOS`
  48 → 46 (os dois G-1 dos cortados deixaram de existir — não é ajuste ao observado).
- **O-7**: o AC-1 varre **todos** os renders; `FORA_DO_AC1` virou mapa nome → motivo (13 cenários),
  reprova se citar cenário inexistente, e cenário novo sem veredito de inclusão reprova.
  ⚠️ **Limite que fica**: o baseline de `discovery/baseline-wav/` é captura da **Fase 0**; o
  `playVisorTune` de produção (400 ms) só entra pela variável `SOM01_CANDIDATO_VISOR`
  (`procedural/wav-sintonia-gate`, captura do motor real da forma decidida). Recapturar os 8 sons ⚠️ (a CONTAGEM segue 8, mas desde `ee79fd44` três deles preferem asset `.webm` — `playEvolve`/`playDegenerate`/`playTaskComplete`, via `playComAsset`; há **cinco** arquivos em `public/sounds/`)
  do `src/` vigente pelo `audioBus` continua **pendente** — o arnês é ferramenta de calibração,
  não portão de commit (`loudness.contract.test.ts` explica por quê).

## 8. Quatro armadilhas que este run pagou para aprender

1. **Só afirme sobre o código o que você acabou de executar contra o código.** 7 erros de fato
   caíram assim; nenhum caiu por leitura de documento.
2. **Nunca ancore medição em renderização própria sem validar contra o motor real** — o baseline
   em Node divergiu do Chromium em **7 de 10 sons, 1,44–1,76 dB**.
3. **Desconfie de resultado perfeito.** Pergunte que entrada faria a assertiva falhar; se a
   resposta for "nenhuma", ela não mede nada.
4. **Fonte estocástica só se afere sobre a distribuição (N ≥ 12)**, nunca sobre uma realização —
   uma folga anunciada de 3,24 dB era, na distribuição, de **0,08 dB**.

Detalhe completo, com saídas coladas e proveniência de cada número:
`squad-alpha-runs/som-01/maintainer/runbook-som.md` (não versionado).

## 9. A música-tema (S17, 07/10/2026)

- **Onde:** `src/utils/tema.ts` (comportamento), `TEMA_DO_JOGO` em `src/utils/sonsAssets.ts` (manifesto: hash, bytes,
  formatos, pausa e fade), `busTema` em `audioBus.ts`, switch "Música-tema/Theme music" em `SettingsPage`.
- **Gesto:** `armarTemaNoPrimeiroGesto()` (no `main.tsx`) só instala ouvintes (`pointerup`/`touchend`/`keydown`/`click`).
  Se o motor recusar o `play()`, rearma e o próximo gesto tenta — **nunca** autoplay cego. A intro é `muted` (guard em
  `IntroScreen.render.test.tsx`), então não há briga de áudio com o vídeo.
- **Na intro (07/10/2026, decisão do dono):** o tema toca DURANTE a intro. Antes do vídeo, o `IntroScreen` mostra a tela de
  abertura (pôster da marca + "Tap to start"/"Toque para começar"); o toque chama `iniciarTemaNoGesto()` no handler (D11 no
  chamador, guard em `tema.test.ts`) e monta o vídeo `muted`. A tela é pulada se o jogador já interagiu
  (`navigator.userActivation.hasBeenActive`), se o tema está desligado ou se o app está mudo. Sem ducking novo.
- **Pausas:** `pausarTrilha`/`retomarTrilha` repassam os motivos (`sono`/`descanso`/`mudo`) ao tema; `document.hidden` pausa o
  elemento. O mudo global (`isMuted`) impede o início.
- **Loudness:** o arquivo foi mestrado no ALVO DA TRILHA de `loudness.ts` (LUFS-S mediano medido com o filtro `ebur128` do
  ffmpeg, BS.1770, nos dois formatos: −28,0 / −28,1; integrado −28,2; true peak −15 dBFS). Nenhum número
  de alvo foi copiado para `tema.ts`/`sonsAssets.ts` (há guard). ⚠️ Desde 11/10/2026 ele NÃO toca mais a ganho 1: o ganho de
  reprodução é a diferença entre o alvo vigente e o de masterização (`GANHO_MUSICA_DB`, §10) — um número da POLÍTICA, aplicado
  no nó de fade; remasterizar o arquivo continua sendo o jeito de mudar o que ele É.
- **Bytes:** ≤ 2,5 MB por formato, fora do S6 de 300 KB (que vale para SFX e camadas), fora do `PRECACHE_URLS`; o `sw.js` não
  intercepta `Range` nem `/sounds/tema-`.
- **Pendências do dono:** termos comerciais do plano Suno (`docs/Attributions.md`) e a escuta (S8).
- ⚠️ 19/10/2026: o arquivo do tema foi trocado por versão nova (§12). Os números de loudness e bytes acima são do arquivo antigo.

## 10. Auditoria da música, volume, rotas por superfície e golpe físico × à distância (11/10/2026, ditado do dono)

Seis pedidos num ditado só. O que cada um virou, onde mora e o que o trava:

**10.1 "Música às vezes parece que não toca."** Auditoria de `trilha.ts`/`tema.ts`/`audioBus.ts`. Quatro defeitos reais (cada um com
teste em `trilha.retomada.test.ts`, `tema.cena.test.ts`, `audioBus.retomada.test.ts`):
1. **Contexto preso em `suspended`.** O `audioBus` suspende o contexto com a aba oculta e o navegador também o suspende (iOS
   `interrupted`, foco de áudio, APK voltando do segundo plano), mas NINGUÉM mandava `resume()` ao voltar: a trilha só o chamava ao
   COMEÇAR, e voltar para a aba não começa nada (`comecar()` devolvia `true` antes do `resume`). Hoje `retomarContexto()` (dono único,
   `audioBus.ts`) roda em `visibilitychange` (visível), `pageshow`, `focus`, no evento `resume` do Capacitor e em `statechange`; aba
   oculta NUNCA retoma (D11).
2. **`resume()` fora da pilha do gesto.** A trilha só o chamava DEPOIS do `await` da carga dos arquivos; o Safari/iOS o recusa. Agora
   sai síncrono, antes de qualquer `await`.
3. **Contexto fechado (`pagehide` → bfcache).** A voz/o `<audio>` ficavam presos a um grafo morto, "tocando" em silêncio para sempre.
   A voz da trilha guarda o contexto em que nasceu e é refeita; o tema refaz o `<audio>` (um `MediaElementSource` só vale uma vez).
4. **`busTrilha` em 0 com storage falhando** (janela privada): a flag não persistia e a trilha tocava mudo. Quem toca com consentimento
   abre o bus.
Não achado (conferido): o ducking D-1/D-2 volta (a liberação é agendada na mesma chamada que o abaixa e o contexto suspenso só congela
a linha do tempo); o interruptor e o `AudioContext` não brigam (o toggle persiste a preferência, o consentimento é por sessão).

**10.2 "A música está muito baixa."** Dois fatores, os dois da POLÍTICA (`loudness.ts`, nenhum número em outro arquivo — há guard):
- **O alvo subiu de −28 para −22 LUFS-S** (`ALVO_TRILHA_LUFS_S`) e o ganho de reprodução é DERIVADO: `GANHO_MUSICA_DB` = alvo − nível
  de masterização dos arquivos (`ALVO_MASTERIZACAO_MUSICA_LUFS_S`, −28) = **+6 dB**, aplicado no nó de fade/trim de cada música. A regra
  antiga ("a trilha fica abaixo do último degrau de SFX") foi relaxada para "no máximo no degrau de Conclusão (−22)"; **em combate**
  (masmorra, arena) a música desce `OFFSET_MUSICA_EM_COMBATE_DB` (−3) para o degrau do Arcade (−25), o golpe que mais repete não é coberto.
- **Achado de medição: a trilha tocava 4,6 dB MAIS BAIXA que o tema.** O `TRIM_TRILHA_POR_CAMADAS_DB` antigo (`{1: 0, 2: −2,024}`) vinha de
  um arnês que anunciava a soma em "−28 LUFS-S"; medida sobre o `.webm` servido, com a MESMA estatística do tema (LUFS-S mediano,
  `ebur128` do ffmpeg), a soma dava **−32,6** (integrado −31,5, que bate com o "−31,46" do registro antigo). Remedido (base sozinha
  −32,1; ritmo −33,5; soma sem trim −30,6; picos −19,2/−16,6/−14,1 dBFS): trim novo **{1: +4,8, 2: +2,6}**. Picos finais ≤ teto S3.
- Resultado: tema e loop no mesmo nível (−22 em casa, −25 em combate); a trilha ficou ≈ +10,6 dB mais alta que antes, o tema +6 dB.
  **Falta a escuta do dono (S8)** — o número é de medição, não de ouvido.

**10.3 Rotas por superfície** (`musica.ts`): casa = **tema**; masmorra = **loop** (as duas camadas, em combate); arena = **faixa própria**.
⚠️ 19/10/2026: substituído pela §12 (masmorra, arena, duelo e torneio tocam "Stone Hall Combat"; pesadelo toca "Stone Hall Nightmare"). Abaixo, histórico.
- ⚠️ 19/10/2026: substituído pela §12 (a faixa derivada e a percussão `trilhaArena.ts` foram apagadas). **Faixa da Arena = DERIVADA, zero asset novo.** As duas camadas a `RAZAO_DA_ARENA` (1,2× → 100→120 BPM; o loop cai de 28,8 para 24 s,
  12 compassos de 2 s) + uma PERCUSSÃO procedural (`trilhaArena.ts`: bumbo nos tempos 1/3 + contratempo, caixa nos 2/4, chimbal em
  colcheias, virada no 4º compasso de cada 4) sintetizada num buffer de um loop inteiro, que começa no mesmo instante e fecha no mesmo
  ponto (em fase, sem relógio). Sem melodia de propósito: um `AudioBufferSourceNode` não faz time-stretch, então as camadas mudam de
  tom ao acelerar, e uma linha melódica nova poderia brigar com a tonalidade delas. Trim medido `TRIM_FAIXA_ARENA_DB` (−5,8 sobre o das
  camadas: a percussão deixa a mistura 5,8 dB mais alta). **Rascunho de ouvido: precisa da escuta do dono.**
- **Crossfade** de `CROSSFADE_MUSICA_S` (1,2 s) entre as músicas: o tema ganha o motivo de pausa `cena` (desce e pára, volta de onde
  parou) enquanto a de combate sobe; entre `loop` e `masmorra` (mesmo material) só o ganho desliza.
- ⚠️ 19/10/2026: **o "nasce DESLIGADO" abaixo foi revogado para as faixas de combate** — o interruptor nasce LIGADO e tem outro rótulo
  (§11). O texto fica como histórico.
- **Nasce desligada, só por gesto.** O tema segue nascendo ligado (S17); as faixas de combate são o interruptor **"Música de masmorra e
  arena" / "Dungeon & arena music"** (Configurações › Som, `SOUND_TRACK_ENABLED`, NASCE DESLIGADO). Abrir a masmorra/arena é um gesto do
  jogador (`consentirNestaSessao`), mas só vale com o interruptor ligado. Sem ele, o tema segue tocando em combate (mais baixo).
- **S17 emendada:** "música é uma por vez: ligar uma desliga a outra" virou "as duas preferências convivem; o diretor nunca as deixa
  soar juntas". Quem ligou só o loop (tema desligado) o mantém na Home (legado). ⚠️ 19/10/2026: esse legado SAIU (§11.6).
  (Duas preferências substituídas por um interruptor só pela §13, 19/10/2026.)

**10.4 Golpe físico × à distância.** `playAttackRanged` (disparo: triangle agudo que cai de tom + parcial uma oitava acima; o físico
`playAttack` segue o soco grave). **Mesma categoria `arcade`** (R-CAT: o EVENTO é golpe de combate nos dois), offset próprio **1,651 dB**
medido no arnês que reproduz `playAttack` em 1,971 (Chromium + K-weighting, LUFS-M). Quem escolhe é o TIPO do ataque do combatente
(`strikeFormOf` no `BattleStage`, único ponto que dispara o som do golpe — Masmorra, Arena, Duelo, Torneio, Pesadelo herdam). O especial
segue com `playSpecial`. Falta o gate humano de escuta (S8), como no resto do combate.

**10.5 FX maior no especial** (`BattleStage` + `index.css`): a esfera da skill à distância sai a `ORB_PX_SPECIAL` (150, era 88; o básico 60) e
o corte da física a `SLASH_SCALE_SPECIAL` (1,75, era 1,2; o básico 0,95), mesma arte, e as animações `.sm-bs-big` ainda crescem no trajeto/na
batida. Movimento reduzido no bloco canônico (esfera some como a comum; corte vira o flash único).

**10.6 Especiais em série** (`specialGate.ts`, `DuelScreen`, `useGroupBattle`): encenação pura, nada do núcleo/servidor muda. No Duelo
(relógio de parede), ao chegar ao `cast` o relógio PARA — nenhum golpe de nenhum lado começa nem chega — pela cena + trajeto (`specialLeadMs`),
o golpe do especial é aplicado, o relógio segue parado pela cauda do efeito (`specialTailMs`) e RETOMA recuado (`impactMs('ranged')`) para o
próximo golpe ter a animação inteira. Dois especiais no MESMO instante (espelho) saem como `cast A, golpe A, cast B, golpe B`
(`serializarEspeciais`, retratos refeitos por deltas: a vida não regride). Na Arena/Masmorra/Pesadelo o `cast` já pausava o relógio; o que
faltava era esperar a cauda antes do golpe seguinte (antes ele CORTAVA o efeito). Efeito colateral declarado: cada especial alonga a luta
EXIBIDA em ≈ lead + cauda + respiro (≈ 3,3 s); a simulação e o resultado são os mesmos.

## 11. As músicas de combate: dungeon theme e pvp theme (19/10/2026, pedido do dono)

⚠️ 19/10/2026: substituído pela §12. As faixas "dungeon theme" e "pvp theme" e seus arquivos saíram do app; o histórico abaixo fica como registro. O que segue valendo da §11: o interruptor nasce ligado (11.2), o player único (11.3) e o `sw.js` (11.5).

Pedido: dono entregou duas faixas do Suno (plano Free) para a Masmorra e o PvP.

**11.1 O que toca onde** (`musica.ts`, tabela casa = tema):
| Superfície | Faixa | É combate? (−3 dB) |
|---|---|---|
| casa | tema "Stone Hall Decay" | não |
| masmorra (`DungeonGame`) | "dungeon theme" | sim |
| torneio (`TournamentPage`, lobby) | "pvp theme" | **não** |
| duelo (`DuelScreen`: luta ranqueada e treino) | "pvp theme" | sim |
| arena (`ArenaGame`, inclusive a folha "Arena livre" do `DueloSheet`, que é PvE) | faixa derivada (§10.3, inalterada) | sim |
| pesadelo | terror (inalterado) | sim |

`SUPERFICIE_EM_COMBATE` decide o −3 dB. Chamadas: `TournamentPage` → `entrarNaSuperficie('torneio')`, `DuelScreen` → `'duelo'`.

**11.2 O interruptor.** Rótulo **"Música de combate" / "Combat music"** (era "Música de masmorra e arena"), mesma chave
`SOUND_TRACK_ENABLED`. ⚠️ **Agora NASCE LIGADO** (`readFlagOr(..., true)`); quem gravou `'false'` continua desligado. Isto revoga o "nasce
desligada" da S2 para as faixas de combate (`REGISTRO-DE-DECISOES.md` §102). **D11 intacta:** só toca depois de gesto; o primeiro gesto sonoro
dá o consentimento da sessão SEM gravar a preferência.
(Rótulo "Música de combate" e chave `SOUND_TRACK_ENABLED` substituídos pela §13, 19/10/2026.)

**11.3 O player único.** `utils/streamMusica.ts` é o `<audio>` em streaming extraído do `tema.ts` (que passa a usá-lo): formato por
`canPlayType` (WebM/Opus, depois M4A), troca de formato no erro, refaz o `<audio>` no bfcache, pausa entre voltas, fade-in. O estado das
faixas de combate (pedida, consentimento, pausas por motivo sono/descanso/mudo) mora em `utils/musicaDeCombate.ts`, no `busTrilha`, com
crossfade de `CROSSFADE_MUSICA_S`; pausa entre voltas de 4 s, fade-in de 2 s. Manifesto: `MUSICAS_DE_COMBATE` em `sonsAssets.ts`.

**11.4 Medidas** (ffmpeg 6.1.1, filtro `ebur128`, BS.1770; LUFS-S mediano; a mesma régua reproduz o tema já instalado: −28,0 / integrado −28,2 / TP −15,1):
| Faixa | Original (LUFS-S / integrado / TP) | Ganho aplicado | Arquivo final (LUFS-S / integrado / TP) |
|---|---|---|---|
| dungeon theme (199,44 s) | −14,2 / −14,5 / −0,4 dBTP | −13,8 dB | webm −28,0 / −28,3 / −13,6; m4a −28,0 / −28,3 / −12,6 |
| pvp theme (212,04 s) | −13,9 / −14,1 / −2,7 dBTP | −14,1 dB + fade-out de 3 s | webm −28,0 / −28,2 / −15,7; m4a −27,9 / −28,2 / −15,8 |

Com o ganho de reprodução `GANHO_MUSICA_DB` (+6 dB): integrado −22,3 / −22,2 e pior true peak −6,6 dBTP (≤ −1 dBTP e ≤ −16 LUFS: **S3
cumprida**); em combate (−3 dB) −25,3. Trim residual 0 (`TRIM_MUSICAS_DE_COMBATE_DB` em `loudness.ts`). O pvp ganhou fade-out porque
terminava seco (os últimos 0,3 s tinham pico −31 dBFS); o dungeon já acaba em decrescendo natural (≈185–199 s); nenhuma intro cortada (o
pvp tem 0,42 s de silêncio na cabeça, mantido).

**11.5 Bytes, orçamento e service worker.** `public/sounds/`: `musica-masmorra.webm` 2 134 684 B, `musica-masmorra.m4a` 2 267 713 B,
`musica-pvp.webm` 1 954 061 B, `musica-pvp.m4a` 2 398 063 B (Opus 72 kbps / AAC-LC 88 kbps, 48 kHz, sem metadados nem capa). Orçamento ≤ 2,5 MB
por formato (o mesmo do tema), **fora** do S6 de 300 KB, **fora** do `PRECACHE`, streaming só depois de gesto. ⚠️ O `sw.js` agora também ignora
`/sounds/musica-` (requisições `Range`). ~8,8 MB novos no repo (`public/` + `dist/`).

**11.6 O que saiu.** ⚠️ O legado "tema desligado + só o loop ligado → loop na Home" (§10.3, última linha) **SAIU**: com o interruptor
nascendo ligado, quem desligou o tema passaria a ouvir o loop na Home sem pedir. Home = tema ou silêncio. Decidido pelo orquestrador;
**pendente de confirmação do dono**. A faixa `masmorra` do loop em `trilha.ts` ficou **sem chamador no diretor** (o tipo fica; os testes de
retomada a usam).

**11.7 Pendências, sem suavizar.**
- ⚠️ **Licença:** as duas faixas são do Suno plano Free, **sem direito comercial**. Bloqueia publicar na loja com elas dentro (mesma situação do
  tema). `Attributions.md` registra procedência, nunca licença.
- ⚠️ **Falta o gate humano de escuta (S8)** das duas faixas: nível relativo, transição entre faixas, o fade de 3 s do pvp. Os números são de medição.

**10.5 Os 7 efeitos de combate (19/10/2026, D-86..D-92).** `playAttack` (corte), `playDefend` (defesa/bloqueio), `playAttackRanged` (ataque mágico),
`playCharge` (carregando o especial), `playSpecial` (soltando), `playVictory` e `playDefeat` (derrota neutra) são buffers procedurais de
`src/utils/sfxCombate.ts` (origem `procedural próprio`, `SFX_DE_COMBATE`), todos `arcade`, com o offset medido de `loudness.ts` embutido (ganho 1 no grafo).
Registro §120. Para OUVIR (gate S8): `node scripts/render-sfx-combate.mjs` grava os 7 WAV; `--medir` só imprime LUFS-M, pico e offset.

**10.6 ⚠️ Os 7 efeitos de combate viraram samples de banco gratuito CC0 (20/10/2026, §130).** O dono não gostou do timbre procedural e pediu
um banco gratuito. O PADRÃO agora são 7 arquivos `public/sounds/sfx-combate-*.webm` (Opus mono, 3–12 KB cada) de Kenney (CC0; o D-88 veio de JaggedStone até 20/10/2026, §152),
manifesto `SFX_DE_COMBATE_LIVRES` em `sonsAssets.ts` (arquivo original, pacote, URL, autor, licença, data, hash), já mestrados no alvo `arcade` e
tocados a ganho 1. A síntese de `sfxCombate.ts` ficou como FALLBACK (arquivo que não chegou/decodificou). A cena de luta baixa/decodifica ao
montar (`sfxCombateCarga.ts`); mudo não baixa nada. Procedência: `Attributions.md` ("Os 7 efeitos de combate — banco GRATUITO livre"). Régua:
`sfxCombateLivres.contract.test.ts`. Escolhas do dono (20/10): vitória = `jingles_HIT15`, derrota = `jingles_STEEL07`, carga = "ki" derivado de `spaceEngine_001` (CC0). Alternativas de cada efeito para trocar na escuta: `D:/Soulmon/_gemini_out/w10-sfx/para-ouvir/` (`D-86-a.wav` é a instalada).

## 12. Trilhas licenciadas: tema novo, Stone Hall Combat e Stone Hall Nightmare (19/10/2026, pedido do dono)

Decisão do dono: "Todos os combates" tocam uma faixa só, e o Pesadelo tem a sua. Registro: `REGISTRO-DE-DECISOES.md` §126.
Procedência e hashes: `Attributions.md`. Um dono só para música em streaming: `streamMusica.ts` + `musicaDeCombate.ts`.

**12.1 O que toca onde** (`musica.ts`):
| Superfície | Faixa | −3 dB (combate)? |
|---|---|---|
| casa | tema "Stone Hall Decay" (arquivo novo) | não |
| torneio (`TournamentPage`, lobby) | "Stone Hall Combat" | **não** |
| masmorra (`DungeonGame`) | "Stone Hall Combat" | sim |
| arena (`ArenaGame`, inclusive a folha "Arena livre") | "Stone Hall Combat" | sim |
| duelo (`DuelScreen`) | "Stone Hall Combat" | sim |
| torneio (as lutas, depois do lobby) | "Stone Hall Combat" | sim |
| pesadelo (`NightmareBattle`) | "Stone Hall Nightmare" | sim |

O interruptor "Música de combate" (`SOUND_TRACK_ENABLED`, nasce ligado, só toca depois de gesto, D11) cobre combate **e** Pesadelo.
(Substituído pela §13, 19/10/2026: agora é o interruptor único "Música".)
Com o interruptor desligado, o Pesadelo segue a regra das outras superfícies de combate: o tema toca mais baixo, se estiver ligado.
(Também substituído pela §13: desligada = silêncio em todas as superfícies.)
Antes, o terror tocava se o tema OU a trilha estivesse ligado. Nunca duas músicas juntas.

**12.2 Medidas** (ffmpeg 6.1.1, filtro `ebur128`, LUFS-S mediano; régua calibrada no tema antigo instalado: −28,0 / integrado −28,2 / TP −15,1):
| Faixa | Original (LUFS-S / integrado / TP) | Ganho | WebM final (LUFS-S / integrado / TP) | M4A final (LUFS-S / integrado / TP) |
|---|---|---|---|---|
| Stone Hall Decay (227,48 s) | −15,7 / −15,9 / −3,8 | −12,3 dB | −28,0 / −28,2 / −15,8 | −28,0 / −28,3 / −15,8 |
| Stone Hall Combat | −15,2 / −15,3 / −5,1 | −12,9 dB + fade-out 3 s | −28,0 / −28,2 / −17,5 | −28,0 / −28,2 / −16,3 |
| Stone Hall Nightmare | −16,0 / −16,2 / −5,6 | −12,2 dB + fade-out 3 s | −28,1 / −28,4 / −17,4 | −28,0 / −28,3 / −17,2 |

Com o ganho de reprodução `GANHO_MUSICA_DB` (+6 dB): integrado pior −22,2 LUFS e true peak pior −9,8 dBTP (S3 cumprida: ≤ −16 LUFS e ≤ −1 dBTP).
Trim residual 0 (`TRIM_MUSICAS_DE_COMBATE_DB = { combate: 0, pesadelo: 0 }` em `loudness.ts`). Nenhuma intro cortada.
O combate terminava seco (último 0,3 s com pico −20,6 dBFS) e o Pesadelo sustentava −24 dBFS no último segundo e cortava: por isso o fade-out de 3 s.

**12.3 Bytes, orçamento e service worker.** `public/sounds/`: tema webm 2 296 694 B / m4a 2 555 598 B; combate webm 1 849 637 B / m4a 2 241 408 B;
pesadelo webm 2 055 285 B / m4a 2 454 316 B. Todo formato ≤ 2,5 MiB (maior: tema m4a). Fora do S6 de 300 KB, fora do pré-cache,
streaming só depois de gesto. O `sw.js` já ignora `Range` em `/sounds/tema-` e `/sounds/musica-`. Total em `public/sounds/` das músicas:
antes (tema velho + dungeon + pvp) 13 589 741 B; depois 13 452 938 B (−136 803 B).

**12.4 O que saiu.** Sem fallback, por decisão do orquestrador (um dono só para música em streaming):
- "dungeon theme" e "pvp theme" (os arquivos `.webm`/`.m4a` das duas, em `public/sounds/`).
- A faixa derivada da Arena: `src/utils/trilhaArena.ts`, `TRIM_FAIXA_ARENA_DB` e `RAZAO_DA_ARENA`.
- A trilha de terror procedural do Pesadelo: `trilhaPesadelo.ts`, `trilhaPesadeloSintese.ts` e `scripts/render-trilha-pesadelo.mjs`.
  O encaixe "solte `pesadelo-trilha.mp3` em `src/assets/audio`" também saiu.
- No manifesto, `MUSICAS_DE_COMBATE` agora é `{ combate, pesadelo }`. Em `trilha.ts`, `FaixaDaTrilha` é só `'loop'`.

**12.5 Pendências, sem suavizar.**
- ⚠️ **Licença: declarada, não provada.** O dono declarou em 19/10/2026 que as três faixas foram geradas no plano pago do Suno.
  O repo não prova o plano; o dono enviou o print de `suno.com/account` em 20/10/2026 (Pro Plan, ciclo mensal desde 19/10, "Commercial use rights" na lista do plano; o print fica fora do git). Falta só conferir o texto do termo do download comercial.
  A pendência anterior (plano Free) está SUPERADA pela troca.
- ⚠️ **Nome de terceiro no título.** No Suno, as faixas de combate e Pesadelo tinham no título o nome de uma trilha de terceiro, por erro de digitação (declaração do dono).
  O repo não consegue provar por escuta a ausência de material de terceiro.
- ⚠️ **Falta o gate humano de escuta (S8)** das três faixas e do nível relativo entre elas. Os números são de medição.
- ✅ Resolvido em 20/10/2026 (REGISTRO §136): os dois arquivos saíram, com `CAMADAS_DA_TRILHA` e o motor do loop em `trilha.ts`. ~~**Loop de 2 camadas sem uso.** `trilha-base` e `trilha-ritmo` (~244 KB) seguem no repo, mas nenhuma superfície as pede mais. Decidir se saem.~~
- **Decisões do orquestrador, a confirmar com o dono:** o procedural foi apagado sem fallback; com o interruptor desligado, o Pesadelo cai no tema. (O segundo ponto foi superado pela §13: desligada = silêncio.)

## 13. Um interruptor só de música (19/10/2026, pedido do dono)

**Pedido.** "Quando entro em combate não toca a música tema de batalha" (testado no PWA instalado, com "Música de combate" desligado por um
`'false'` da era antiga) e "É só um interruptor de música, que vale pra todas." Registro: `REGISTRO-DE-DECISOES.md` §129 (emenda S17, §102 e §127).

**Regra nova.** Um interruptor **"Música" / "Music"** em Configurações › Som liga e desliga, juntos, o tema da Home, a música de combate
(Masmorra, Arena, Duelo, Torneio) e o Pesadelo. "Sons" (mudo/SFX) é outro interruptor e não mudou. A música nasce ligada, só toca depois de
gesto (D11/S2), uma por vez com crossfade; as pausas de sono, descanso e mudo seguem iguais. Dono da preferência: `musicaLigada()` /
`definirMusicaLigada(on)` em `audioBus.ts`, chave `SOUND_MUSIC_OFF` (`soulmon-sound-music-off`, polaridade "off": ausente = ligada) e marca
`SOUND_MUSIC_VERSION`. `trilhaLigada`, `definirTrilhaLigada` e `temaPreferido` ficaram como aliases que leem dela.

**13.1 O que toca onde** (`escolherFaixa(s, musicaOn)` em `musica.ts`):
| Superfície | Música ligada | Música desligada |
|---|---|---|
| casa (Home) | tema "Stone Hall Decay" | silêncio |
| masmorra, arena, duelo, torneio (lobby e lutas) | "Stone Hall Combat" | silêncio |
| pesadelo | "Stone Hall Nightmare" | silêncio |

Acabou o "tema em combate, mais baixo" com o interruptor desligado (§12.1 e §11).

**13.2 Migração** (`migrarPreferenciaDeMusica()`, substitui `migrarPreferenciasDeSom` da §127; roda em `iniciarMusica()`, idempotente).
Se a marca `SOUND_MUSIC_VERSION` já existe, não faz nada. Senão, a música fica DESLIGADA só se o jogador desligou AS DUAS depois da marca da
§127 (`SOUND_PREFS_VERSION='1'`, `SOUND_TRACK_ENABLED='false'` e `SOUND_THEME_OFF='true'`). Qualquer outro caso fica ligada, inclusive o
`'false'` herdado antes da marca e o "só tema desligado". Remove as 3 chaves legadas e grava a marca. Régua:
`musicaPreferencia.migracao.test.ts` (casos a até i), `musica.test.ts`, `settingsSom.render.test.tsx`, `musicaCombate.integracao.test.ts`.

**13.3 O que segue igual.** "Sons" separado; nasce ligada e só toca depois de gesto; uma música por vez com crossfade; pausas de
sono, descanso e mudo; guards de loudness e de manifesto; R-NOVA e D11.

**13.4 O que só o aparelho do dono confirma.** No PWA instalado, depois de atualizar: entrar na Masmorra toca "Stone Hall Combat"; desligar
"Música" silencia Home, combate e Pesadelo; "Sons" continua independente. Os testes cobrem o código, não o aparelho.

