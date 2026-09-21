# Som do Soulmon — o mínimo para não errar

> **O que é:** o mínimo que um agente precisa saber para não quebrar o som do Soulmon.
> O runbook completo vive em `squad-alpha-runs/som-01/maintainer/runbook-som.md` — e essa
> pasta está no **`.gitignore`**, ou seja, **não vai para o git**. Por isso este arquivo
> existe: é a parte que precisa sobreviver. Se você precisar de detalhe que não está aqui,
> ele está lá, na máquina de quem rodou o run.
> **Origem:** run `som-01` (Fases 0 a 3, 08–09/09/2026). As decisões canônicas são **S1..S16** ⚠️ (dizia S1..S13 até 21/09/2026, e ficou para trás quando o S16 entrou; não existe S14)
> em `docs/REGISTRO-DE-DECISOES.md` §6.1 — este documento não decide nada, só orienta.
> ⚠️ Este arquivo foi escrito na Fase 5, **antes** da Fase 3 e das decisões S11–S13: as
> seções 2, 2.1 e 5 foram **corrigidas em 09/09/2026** contra o código e contra os
> artefatos do run, e o que estava obsoleto está marcado onde estava.
> Nenhum usuário jamais usou o app (`docs/STATUS.md`): tudo sobre "o usuário" é `[hipótese]`.

## 1. Onde o som mora

| O quê | Arquivo |
|---|---|
| Os sons — **8 símbolos** (`playPresence`, `playTaskComplete`, `playFeed`, `playShower`, `playEvolve`, `playDegenerate`, `playSleep`, `playVisorTune`), síntese procedural; desde 21/09/2026 (S16; o dono escolheu "o gerado nos 3") `playEvolve`/`playDegenerate`/`playTaskComplete` preferem o asset de IA e caem no procedural | `src/utils/sounds.ts` |
| Manifesto e carga dos **5 assets** (3 SFX + 2 camadas de trilha), hash S9, zero no bundle inicial | `src/utils/sonsAssets.ts` + `public/sounds/` |
| A **trilha** (duas camadas em fase, loop de 12 compassos, gesto liga, E0 para; trim por nº de camadas em `loudness.ts`) | `src/utils/trilha.ts` |
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
2. **S2 — a trilha nasce desligada** e só começa por gesto. *Porque* autoplay viola a D11 por
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
| Trilha (E1–E5) | **−28,0 LUFS-S**, e ≤ −16 LUFS integrado |

Tolerância **±1,0 LU**; degrau **3,0 dB**, sem meio-degrau; teto **≤ −1 dBTP** em tudo.
**Quem repete mais entra mais baixo.** Nível ≠ importância: se algo "deve soar como perda ou como
conquista", isso é timbre/envelope/duração, não nível.

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
