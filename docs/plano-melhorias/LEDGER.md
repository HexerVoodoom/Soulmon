# Livro-razão do plano — quem guarda o quê, e o que já foi verificado

Este arquivo é o **estado durável** do `docs/PLANO-MELHORIAS.md`. Ele existe
porque um agente não tem memória entre sessões: sem registro em disco,
"o guarda garante que foi implementado" é uma frase, não um mecanismo.

**São 36 pacotes (WP)**, não 30 — o número "30" apareceu no primeiro commit do
plano e estava errado; conferido com
`grep -oE '^### WP[0-9]+\.[0-9]+' docs/PLANO-MELHORIAS.md | wc -l`.

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
| `soulmon-guarda-nascimento` | Onboarding, Oráculo, reveal, D0 | WP1.1–1.5 | `ledger/nascimento.md` |
| `soulmon-guarda-constancia` | Hábitos, escudos, rituais, marcos, widget | WP2.1–2.7 | `ledger/constancia.md` |
| `soulmon-guarda-vinculo` | Chat, voz, presença, push, som | WP3.1–3.5 | `ledger/vinculo.md` |
| `soulmon-guarda-permanencia` | Evolução, conteúdo D30–D90, coleção | WP4.1–4.8 | `ledger/permanencia.md` |
| `soulmon-guarda-sustento` | Monetização, billing, créditos | WP0.6, WP5.1–5.4 | `ledger/sustento.md` |
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
| medição (6) | 4 | 2 (D1, D2) | — | — | — | — |
| nascimento (5) | 5 | — | — | — | — | — |
| constância (7) | 6 | 1 (D3) | — | — | — | — |
| vínculo (5) | 4 | 1 (D11) | — | — | — | — |
| permanência (8) | 6 | 2 (D5, D6) | — | — | — | — |
| sustento (5) | 3 | 2 (D7, D10) | — | — | — | — |
| **Total (36)** | **28** | **8** | — | — | — | — |

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

_Última consolidação: 02/09/2026 (nascimento do sistema de guarda)._
