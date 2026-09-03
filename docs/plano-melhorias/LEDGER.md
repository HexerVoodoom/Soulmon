# Livro-razão do plano — quem guarda o quê, e o que já foi verificado

Este arquivo é o **estado durável** do `docs/PLANO-MELHORIAS.md`. Ele existe
porque um agente não tem memória entre sessões: sem registro em disco,
"o guarda garante que foi implementado" é uma frase, não um mecanismo.

**São 86 pacotes (WP)** — 36 na criação, +14 na rodada 3, **+36 na rodada 4** (estudo pré-Mobbin, 03/09/2026 — tabela da seção 14.3 do plano, mesma forma de linhas da seção 13) (dossiê Mobbin, 02/09/2026); antes disso, não 30 — o número "30" apareceu no primeiro commit do
plano e estava errado; conferido com
`grep -oE '^### WP[0-9]+\.[0-9]+' docs/PLANO-MELHORIAS.md | wc -l` → **36** (as seções da criação) **mais** os 14 pacotes da rodada 3, que vivem como LINHAS da tabela da seção 13 e não como seções: `grep -oE '^\| WP[0-9]+\.[0-9]+ ' docs/PLANO-MELHORIAS.md | sort -u | wc -l` → 16 na seção 13.5 (dos quais 2, WP3.1 e WP3.3, são revisões) e 36 na seção 14.3 (rodada 4). ⚠️ A tabela 14.1 também começa linhas com `| WPx.y |` para pacotes EXISTENTES — quem contar só pelo prefixo pega 60 e erra; conte por seção. Conferência hoje: 36 + 14 + 36 = **86**. ⚠️ Até 03/09/2026 este parágrafo citava só o primeiro comando e afirmava 50 — o guarda da medição rodou o comando, obteve 36 e apontou a contradição (`estudo/medicao.md`). O número estava certo; o comando, não.

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
| medição (13) | 8 | 2 (D1, D2) | — | — | **3** (0.3, 0.5, 0.7) | — |
| nascimento (17) | 16 | — | — | — | **1** (1.7) | — |
| constância (15) | 12 | 1 (D3) | — | — | **2** (2.3, 2.9) | — |
| vínculo (11) | 8 | 2 (D11, D16) | — | — | **1** (3.7) | — |
| permanência (21) | 16 | 3 (D5, D6 ×2) | — | — | **1** (4.9) | **1** (4.4) |
| sustento (9) | 5 | 3 (D7, D10, H.4) | — | — | **1** (5.5) | — |
| **Total (86)** | **65** | **11** | — | — | **9** | **1** |

**Oito pacotes esperam decisão do dono** (seção 10 do plano). D1
(`METRICS_ADMIN_KEY`) é o que destrava mais coisa: sem ele ninguém lê nenhum
número, e as metas de todas as ondas ficam sem régua.

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

_Última consolidação: 03/09/2026 (rodada 4)._
