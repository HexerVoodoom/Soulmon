# Livro-razão do plano — quem guarda o quê, e o que já foi verificado

Este arquivo é o **estado durável** do `docs/PLANO-MELHORIAS.md`. Ele existe
porque um agente não tem memória entre sessões: sem registro em disco,
"o guarda garante que foi implementado" é uma frase, não um mecanismo.

**São 87 pacotes (WP)** (`grep -o 'WP[0-9]\+\.[0-9]\+' docs/PLANO-MELHORIAS.md | sort -u | wc -l` → 87, em 21/09/2026; ⚰️ este parágrafo disse "86" de 03/09 a 21/09/2026, contando sem o WP5.9 que nasceu de D12) — 36 na criação, +14 na rodada 3, **+36 na rodada 4** (estudo pré-Mobbin, 03/09/2026 — tabela da seção 14.3 do plano, mesma forma de linhas da seção 13) (dossiê Mobbin, 02/09/2026); antes disso, não 30 — o número "30" apareceu no primeiro commit do
plano e estava errado; conferido com
`grep -oE '^### WP[0-9]+\.[0-9]+' docs/PLANO-MELHORIAS.md | wc -l` → **36** (as seções da criação) **mais** os 14 pacotes da rodada 3, que vivem como LINHAS da tabela da seção 13 e não como seções: `grep -oE '^\| WP[0-9]+\.[0-9]+ ' docs/PLANO-MELHORIAS.md | sort -u | wc -l` → 16 na seção 13.5 (dos quais 2, WP3.1 e WP3.3, são revisões) e 36 na seção 14.3 (rodada 4). ⚠️ A tabela 14.1 também começa linhas com `| WPx.y |` para pacotes EXISTENTES — quem contar só pelo prefixo pega 60 e erra; conte por seção. Conferência de 03/09/2026: 36 + 14 + 36 = 86; +1 (WP5.9, D12, 06/09/2026) = **87**. ⚠️ Até 03/09/2026 este parágrafo citava só o primeiro comando e afirmava 50 — o guarda da medição rodou o comando, obteve 36 e apontou a contradição (`estudo/medicao.md`). O número estava certo; o comando, não.

## Como funciona a guarda

Cada área tem **um agente dono** (`.claude/agents/soulmon-guarda-*.md`) e **um
arquivo de ledger próprio** em `ledger/`. Um guarda só escreve no próprio
arquivo — é o que impede dois agentes gravando no mesmo lugar.

### Vocabulário de estado (não invente outro)

| Estado | Significa |
|---|---|
| `PROPOSTO` | Está no plano. Ninguém mexeu. |
| `BLOQUEADO:<D#>` | Espera uma decisão do dono (seção 10 do plano). |
| `EM CURSO` | Alguém está implementando agora. |
| `IMPLEMENTADO` | O código existe, mas o aceite **não** foi conferido. |
| `VERIFICADO` | O aceite foi conferido **rodando o comando** e o resultado está colado no ledger. |
| `RECUSADO` | Analisado e descartado. Exige motivo escrito. |

### A regra que impede teatro

**Só o guarda dono move um WP para `VERIFICADO`, e só colando a saída real do
comando de verificação.** Marcar `VERIFICADO` sem a saída é a única falha grave
deste sistema — vale mais deixar em `IMPLEMENTADO` e dizer "não consegui
conferir" do que carimbar sem evidência.

`IMPLEMENTADO` → `VERIFICADO` nunca acontece por leitura de diff. Acontece por
execução: um `grep` que acha o símbolo, um `vitest` que passa, um screenshot.

## Mapa de custódia

| Guarda | Domínio | WPs | Ledger |
|---|---|---|---|
| `soulmon-guarda-medicao` | Telemetria, privacidade, verdade dos números | WP0.1–0.5, WP0.7 | `ledger/medicao.md` |
| `soulmon-guarda-nascimento` | Onboarding, Oráculo, reveal, D0 | WP1.1–1.8 | `ledger/nascimento.md` |
| `soulmon-guarda-constancia` | Hábitos, escudos, rituais, marcos, widget | WP2.1–2.9 | `ledger/constancia.md` |
| `soulmon-guarda-vinculo` | Chat, voz, presença, push, som | WP3.1–3.7 | `ledger/vinculo.md` |
| `soulmon-guarda-permanencia` | Evolução, conteúdo D30–D90, coleção | WP4.1–4.14 | `ledger/permanencia.md` |
| `soulmon-guarda-sustento` | Monetização, billing, créditos | WP0.6, WP5.1–5.5 | `ledger/sustento.md` |
| `soulmon-guarda-linha-vermelha` | Seção 9 (guardrails) — **poder de veto** | nenhum | `ledger/vetos.md` |

O guarda da linha vermelha não possui WP nenhum de propósito: se ele tivesse
entrega própria, teria incentivo para relativizar a própria proibição.

## Como usar

- `/guarda-soulmon <área|WP|completa>` — auditoria: cada guarda confere seus WPs
  contra o código e atualiza o ledger.
- `/implementar-wp <WP>` — implementa um pacote; o guarda dono confere o aceite
  **antes** do commit e assina no ledger.
- `/destrinchar-estudo <tema|arquivo>` — pega uma parte do corpus estudado
  (relatórios 01–07, transcrições 08, os 84 vídeos) e a confronta com o código
  atual: vira WP novo, "já coberto" ou "recusado".

## Estado consolidado

Atualizado por `/guarda-soulmon completa`. **Nunca edite à mão** — ele mente
rápido; a fonte são os arquivos de `ledger/`.

| Área | PROPOSTO | BLOQUEADO | EM CURSO | IMPLEMENTADO | VERIFICADO | RECUSADO |
|---|---|---|---|---|---|---|
| medição (13) | — | — | — | **1** (0.1, falta a chave) | **12** | — |
| nascimento (17) | — | — | — | **1** (1.2, falta a régua da bio) | **15** | **1** (1.14 — premissa apagada em `ff3e48e1`/`2f264307`) |
| constância (15) | — | — | — | **1** (2.6, requer APK) | **13** | **1** (2.1, por D3) |
| vínculo (11) | — | — | — | **2** (3.1, falta a memória de sessão; 3.4, falta o win-back) | **9** | — |
| permanência (21) | — | — | — | **2** (4.6 abismo, 4.7 fiação) | **18** | **1** (4.4) |
| sustento (10) | — | — | — | **2** (0.6 e 5.8, requerem APK) | **8** | — |
| **Total (87)** | **ZERO** | **ZERO** | — | **9** | **75** | **3** |

> ### ⚠️ 21/09/2026 — QA GERAL: dois carimbos falsos e oito comandos de aceite mortos
>
> Fonte: `docs/reviews/2026-09-21-qa-geral/09-guardas.md` §1, cada item RODADO de novo
> em 21/09/2026 antes de escrever aqui. Editado à mão nesta rodada (QA GERAL, tarefa 7)
> porque o `/guarda-soulmon completa` não roda desde 07/09/2026; a tabela acima foi
> refeita somando as linhas (antes dizia 5/79/3 e as linhas somavam 8/77/2).
>
> **Carimbos falsos (estado real):**
> - **WP1.14** `VERIFICADO` → **`RECUSADO`**: o bloco `{linkSent ? (` com o `<img>` saiu em
>   `ff3e48e1` (portão de identidade) e o estado `linkSent` inteiro em `2f264307` (login
>   Google/e-mail+senha). `grep -c linkSent src/components/SoulmonOnboarding.tsx` → 0; sobra
>   o comentário órfão "Link de acesso enviado". A premissa (link mágico) não existe mais.
> - **WP3.4** `VERIFICADO` → **`IMPLEMENTADO`** (fatia 3 aberta): (1) fonte única OK
>   (`grep -c 'passou pra dizer oi' src/components/NotificationManager.tsx` → 0); (2) dedup
>   PWA×APK OK (`41bdefda`); (3) **win-back**: `grep -rn -iE 'win-?back' src functions workers`
>   (sem testes) → 0; `grep -c refreshedAt workers/push-scheduler.js` → 0. Mesmo padrão do WP3.1.
>
> **Comandos de aceite que apontavam para símbolo/arquivo inexistente** (o pacote está
> feito; o comando é que mentia). Forma nova: `caminho` + SÍMBOLO, conferida por grep:
>
> | WP | Comando morto | Comando vivo (rodado em 21/09/2026) |
> |---|---|---|
> | WP1.17 | `node --test functions/api/_pushCopy.test.js` (arquivo não existe) | `npx vitest run workers/pushCopy.parity.test.js`; `grep -c ageDays functions/api/_pushCopy.js` → 3 |
> | WP2.6 | `plugins/DigiWidgetPlugin.kt` + `grep -c constancy_pct → 0` | arquivo é `android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonWidgetPlugin.kt`; as chaves aparecem só em `editor.remove(...)` (exceção da #20 em `vetos.md`, 21/09/2026); régua: `npx vitest run src/plugins/widgetSemCobranca.contract.test.ts` |
> | WP2.14 | `RARE_CHEER_RATE` em `src/types/taskModel.ts` (→ 0) | `grep -n 'RARE_CHEER_RATE =' src/utils/petVoice.ts` → `0.05` |
> | WP3.5 | `playChirp` em `src/utils/sounds.ts` (→ 0) | `grep -n 'export function playPresence' src/utils/sounds.ts` → 1 (bloco "WP3.5 — O SOM DE PRESENÇA") |
> | WP4.8 | `src/utils/shareCard.ts` (não existe) | `ls src/components/MemoriesCard.tsx`; `grep -c MemoriesCard src/components/DailyReportModal.tsx` → 2 |
> | WP4.21 | `grep -n blur src/components/EvolutionPath.tsx` (→ 0) | `grep -n 'silhouette=' src/components/EvolutionPath.tsx` → 1 (`silhouette={hidden && …}`; a silhueta é por `mask-image`, não `blur`) |
> | WP5.6 | `! grep -q 'Reroll liberado'` (a frase sobrevive como comentário C-S1) | `grep -c 'cresce porque você cresce' src/components/UnlockAccountModal.tsx` → 1; `grep -n 'Reroll liberado' src/components/UnlockAccountModal.tsx` só dentro de `{/* C-S1 … */}` |
> | WP5.9 | `grep -c 'mesmo lugar' → 0` (→ 1 hoje, em comentário) | `grep -n 'mesmo lugar' src/components/UnlockAccountModal.tsx` → 1, e é a lápide `// mesmo lugar", como se fosse equivalência`; a string do jogador não contém a frase |
>
> **WP4.14** continua `VERIFICADO` mas o comando `grep -q visit LibraryPage.tsx community.js`
> passa por OR (`grep -c visit functions/api/community.js` → 0): a régua real é o bloco
> "WP4.14 — A CRIATURA É VISITÁVEL" em `src/components/PlayerDetailModal.tsx`.
>
> Os arquivos-fonte em `ledger/<guarda>.md` **não** foram tocados nesta rodada (são de
> outros donos); a linha de cada WP lá continua com o comando velho até o guarda dono
> rodar `/guarda-soulmon completa` e colar a saída.

> ### ⚠️ 07/09/2026 — a auditoria de alinhamento, e o que ela achou no PRÓPRIO ledger
>
> Sete agentes releram o corpus de pesquisa e o dossiê Mobbin contra o código
> de hoje (não contra este arquivo). O achado central é sobre este arquivo:
> **seis pacotes estavam carimbados com comandos de aceite que falhavam.**
>
> Não é desleixo, e a causa é identificável: são exatamente os pacotes cuja
> spec a rodada Mobbin **revisou**. O código foi escrito contra a spec antiga e
> o carimbo foi lido contra a nova. Eram WP5.1, WP2.2, WP2.4, WP2.6, WP4.5 e
> WP4.6 — todos corrigidos em 07/09, com o comando rodado e a saída colada na
> linha de cada um.
>
> **A lição de método, que vale mais que os seis:** `grep -q A B` é **OR**, não
> AND — sai 0 se qualquer um dos arquivos casar. Foi assim que o WP5.1 passou
> verde com metade do pacote faltando. **Um comando de aceite tem de FALHAR
> quando o pacote está pela metade**; se não falha, é pior que aceite nenhum,
> porque ninguém volta a olhar.
>
> O relatório completo (17 achados em três prioridades) está em
> `docs/AUDITORIA-ALINHAMENTO.md`.
>
> **06/09/2026 — a coluna PROPOSTO zerou.** Os 87 pacotes do plano foram
> percorridos. Os **8 IMPLEMENTADOS** não são pendências esquecidas: são
> pacotes cujo código está no repo, testado e mergeado, e cujo aceite depende
> de algo que não é código — a chave `METRICS_ADMIN_KEY` (0.1), um APK novo
> (0.6, 2.6, 5.8) — ou de uma fatia declarada como aberta no próprio ledger
> (o Abismo do 4.6, a fiação dos contadores do 4.7, a memória de sessão do
> 3.1). Cada um diz no seu ledger o que falta e por quê.

> ⚠️ **O total dizia 88 e o plano tem 87** (`grep -o 'WP[0-9]\+\.[0-9]\+' docs/PLANO-MELHORIAS.md | sort -u | wc -l`). O 88 veio de somar o WP5.9 sem descontar nada; contado em 06/09/2026.

> **06/09/2026 — a coluna BLOQUEADO zerou.** As dezesseis decisões do dono foram
> respondidas de uma vez (§15 do plano). Onze pacotes saíram do bloqueio; um
> virou RECUSADO com motivo (WP2.1, por D3); um pacote novo nasceu das respostas
> (WP5.9, por D12), o que leva o total a 87. **Nada mais no plano espera por
> uma decisão** — o que sobra é trabalho.

~~**Oito pacotes esperam decisão do dono**~~ — **respondidas em 06/09/2026**
(§15). D1 foi resolvida pelo caminho que não dependia de ninguém: o leitor
(`tools/metrics-read.mjs`) é escrito e testado ANTES da chave, e passa a
esperar por ela em vez de o plano inteiro esperar pelo dono.

## Linha de base medida em 02/09/2026

Os comandos de verificação foram **executados** na criação do sistema, e todos
devolveram o estado "antes" que o plano previa — o que prova que os comandos
funcionam e que o diagnóstico está certo:

| WP | Comando | Saída |
|---|---|---|
| WP1.1 | `<img>` no bloco do REVEAL | **0** |
| WP2.1 | `REST_SHIELD_MAX` | **3** |
| WP2.3 | "Assumir minha meta" no check-in | **0** |
| WP3.2 | `haunted` no `CompanionHUD.tsx` | **0** |
| WP3.3 | `bondTitle` no `CompanionHUD.tsx` | **0** |
| WP0.6 | `setObfuscatedAccountId` no `BillingPlugin.kt` | **0** |
| WP0.3 | "sete eventos" em `privacidade.html` | **1** (o bug) |
| WP5.1 | `UnlockNudge` na Loja e no relatório | **0 e 0** |

**Rodada 3 (dossiê Mobbin, 02/09/2026):** 6 guardas destrincharam 13 dossiês em
`mobbin/`; a linha vermelha inventariou 73 anti-padrões (36 já evitados, **5
exposições no código** E1–E5), inscreveu a **proibição #21** e deu parecer às 8
decisões do §16. Duas premissas do plano caíram por `grep` ("roster de 60";
"título sob o nome" num HUD que não tem nome). O guarda da linha vermelha caiu
por limite de API antes de gravar os pareceres — foram transcritos do seu
arquivo de análise para `vetos.md` pelo consolidador, e estão marcados como tal.

**Sprint 1 começou (02/09/2026):** os 5 primeiros pacotes sem dependência do dono
foram implementados e **verificados com a saída colada** — WP0.3, WP0.5, WP0.7
(medição), WP2.9 (constância), WP4.9 (permanência). O primeiro aceite escrito
(WP4.9) era autodestrutivo — a agulha do `grep` estava no texto do próprio
comando — e foi corrigido; é o tipo de coisa que só aparece quando alguém
**roda** o comando em vez de lê-lo.

**Sprint 1, lote 2 (03/09/2026):** WP2.3 (botão de compromisso + `checkin_commit`)
e WP5.5 ("Agora não" + `unlock_dismiss`) verificados. **WP4.4 foi RECUSADO por
premissa falsa**: o anexo F leu a tabela ISO de `SEASONS` e concluiu que as
estações expiravam em 2027; a função que a consome compara mês/dia e já tinha
teste em 2031. O aceite escrito ("nunca null 2026–2036") também estava errado —
28/29 de fevereiro é folga deliberada. É a terceira premissa do plano derrubada
por leitura do código, e o padrão é o mesmo das duas anteriores: a evidência
citava um DADO (tabela, tipo, nome) sem olhar a FUNÇÃO que o lê. Efeito
colateral achado no caminho: `REASON_LABEL` do agregador tinha 2 rótulos para
um schema de 4 valores — `report` e `shop` viravam `unknown` em silêncio.
**Sprint 1, lote 3 (03/09/2026):** WP3.7 e WP1.7 verificados. A auditoria de
pronome achou **36** trechos, não ~15 — e dois "he" no inglês que ninguém tinha
listado. O rascunho do ritual virou módulo puro (`utils/oracleDraft.ts`) com um
detalhe que a spec não previa: o `ConsentRecord` precisa ir no rascunho, senão
o ritual retomado termina num save sem prova de aceite. **Sprint 1 fechou: 9
VERIFICADOS + 1 RECUSADO em 3 lotes.** Tudo que sobra em PROPOSTO ou é onda 2+
(WP2.4 celebração, WP2.7 reencontro, WP3.2 pet olha, WP1.1 reveal…) ou depende
de decisão do dono (D1–D14).

**Rodada 4 (03/09/2026) — o corpus pré-Mobbin destrinchado.** Os relatórios 01–07,
as transcrições 08 e o guia nunca tinham passado pelo crivo de três colunas; só
o Mobbin tinha. Seis guardas, ~300 linhas de tabela (`estudo/*.md`), 41
candidatas, parecer da linha vermelha em `vetos.md` (17 aprovadas, 23 com
ressalva, 1 vetada — C-S3, que vira **D15**). Duplicidades fundidas (`bornAt`
proposto por dois guardas; `welcome_back` por dois; frases do widget já eram o
conserto de E1). **Premissas do plano que caíram: sete** — a intervenção do
never-miss-twice não existe na UI (WP2.5 dependia de uma tela não pintada), a
escada do Vínculo L2–L13 nunca é entregue, as estações existem e estão desligadas,
`daysToEvolve` é dado morto EXIBIDO no guia, a faixa do Torneio desce por três
caminhos e não um, a métrica-farol é média onde a fonte proíbe média, e a "única
peça que vende HP" são duas. O padrão das sete é o mesmo das três anteriores: a
evidência citou um DADO (constante, tipo, tabela, comentário) sem olhar a FUNÇÃO
que o consome ou o componente que o exibe. **Código sem consumidor foi o achado
transversal**: `needsIntervention`, `focusComplete`, `BOND_REWARDS`,
`SEASON_PATHS`, `sleepReminderAt`, `triggerMessage` e 7 eventos de telemetria
estão escritos, testados e mudos.

**Sprint 2, lote 1 (06/09/2026):** seis pacotes verificados — WP4.17, WP4.20
(permanência), WP1.9, WP1.10 (nascimento), WP0.13, WP0.14 (medição). Três deles
renderam achado maior que o próprio pacote:

- **WP4.17** ia ser uma troca de constante no guia. O `CompanionHUD` recebia
  **três props do mesmo número e não desenhava nenhuma** — a quarta ocorrência
  do "código sem consumidor" da rodada 4, agora dentro do componente que o
  jogador tem na frente o tempo todo. As três saíram.
- **WP0.14** ia ser um evento novo. Achou que `ONCE_PER_DAY` **valia pela
  metade**: o dedupe de fila era um `if` literal para `day_active`, então todo
  membro novo herdava o nome da regra sem herdar a regra — e o membro novo é
  justamente um denominador, onde repetir mente para baixo.
- **WP4.20 e WP1.10** tinham **aceite escrito errado**. O do WP4.20 é
  autodestrutivo pela segunda vez no plano: a nota histórica que explica a
  correção reproduz as frases que o `grep` procura. O do WP1.10 tinha um `awk`
  cujo intervalo começava ~700 linhas antes do bloco certo e contava o título
  do GOAL_STEP como se fosse promessa de criatura melhor. **Aceite que ninguém
  rodou é hipótese** — é a terceira vez que essa frase se paga.

**Sprint 2 completo (06/09/2026) — 7 lotes, 26 pacotes VERIFICADOS.** Depois
das 16 decisões, o sprint implementou o que elas destravaram e o que a rodada 4
tinha achado. O fio condutor de quase tudo foi o mesmo: **código escrito,
testado e mudo.**

| Lote | Entregou |
|---|---|
| 1 | WP4.17, WP4.20, WP1.9, WP1.10, WP0.13, WP0.14 |
| 2 | WP5.2 (D7+D15), WP5.6, WP5.9 (D12) |
| 3 | WP4.1 (D5) |
| 4 | WP3.8, WP2.15, WP4.15 |
| 5 | WP4.11 (E3) |
| 6 | WP0.1 (D1), WP4.16 |
| 7 | WP2.10, WP2.12 |

**Sete peças estavam escritas, testadas e sem consumidor**, e cada uma custava
alguma coisa: as 12 recompensas do Vínculo que ninguém recebia; as estações,
cuja medalha **não podia ser ganha por ninguém desde que o arquivo existe**; o
canal de fala do pet, com treze pontos do app mandando sinal para o vazio; a
oferta dos "5 minutos" e o selo de foco, os dois prometidos por escrito no guia;
`daysToEvolve` e `EVOLVE_SEGMENTS`, dois números mortos ao lado do vivo. O
padrão vale registrar: **quanto mais completo o módulo, menos óbvio que ele está
mudo** — um arquivo com testes verdes parece um arquivo que funciona.

Três achados foram maiores que o pacote que os encontrou: o `CompanionHUD`
recebia três props do mesmo número e não desenhava nenhuma; `ONCE_PER_DAY`
valia pela metade (o dedupe era um `if` literal para um evento só); e o
diretório de amigos era **ordenado por rank**, o que faz dele um placar mesmo
sem o número na tela.

_Última consolidação: 06/09/2026 (sprint 2 completo)._
