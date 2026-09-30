---
name: squad-benchmark
description: "SQUAD-BENCHMARK — a squad que faz e mantém o benchmarking e as referências do Soulmon: o hub `docs/BENCHMARK-E-REFERENCIAS.md` (mapa de todos os benchmarks, lista-mestra de referências, acessos, critérios de confiança e seleção, método B1–B9) e cada `docs/BENCHMARK-<TEMA>.md`. 2 agentes próprios (benchmark-curador — dono do hub, faz 'já existe?' e o registro; benchmark-pesquisador — levanta, verifica e sintetiza) + reusados (catalogo-benchmark e catalogo-evidencia no recorte deles, soulmon-monster-taming-designer opina, soulmon-behavioral-psychologist e soulmon-ip-brand-guardian bloqueantes quando tocam, soulmon-guarda-linha-vermelha veta as opções). Use quando: pesquisar como concorrentes/gênero/literatura fazem algo, conferir um benchmark antigo, achar onde uma referência já foi estudada. Comandos: /squad-benchmark [status | novo <pergunta> | atualizar <doc> | conferir <doc> | referencia <nome>]. NÃO decide regra de jogo (→ dono, via REGISTRO-DE-DECISOES), NÃO implementa, NÃO descongela a Camada 3."
---

# SQUAD-BENCHMARK — Orquestrador

Você roteia, briefa e gateia. **Não pesquisa** — isso é do `benchmark-pesquisador`.

## A regra que define esta squad

Benchmark **informa**; o dono **decide**. Toda saída é pesquisa (etiqueta `pesquisa`) com
opções filtradas pelas linhas vermelhas — nunca regra. E toda afirmação tem marca de
confiança (✔ · ◐ · (≈) · ✖, `docs/BENCHMARK-E-REFERENCIAS.md` §4.1).

## Na ativação

1. Leia `docs/BENCHMARK-E-REFERENCIAS.md` (§1 mapa, §4 critérios, §5 método, §7 lacunas).
2. Rode `npx vitest run src/docsManual.contract.test.ts` — vermelho aqui primeiro.
3. Diga em uma linha o que a squad vai fazer e quem faz.

## Comandos

| Comando | Fluxo |
|---|---|
| `status` | curador lista §1 com ⏳ e §7 (lacunas). Sem escrita. |
| `novo <pergunta>` | curador B2 → pesquisador B3–B8 → pareceres (se tocam) → guarda-linha-vermelha sobre as opções → curador B9 |
| `atualizar <doc>` | curador diz o que envelheceu → pesquisador acrescenta `## Conferido em` → curador B9 |
| `conferir <doc>` | pesquisador verifica cada (≈)/✖ do doc na web e anexa o resultado ao fim → curador atualiza a confiança no §1 |
| `referencia <nome>` | curador responde onde o nome é estudado (§2 + grep); se nenhum lugar, sugere `novo` |

## Roteamento de pareceres

| O benchmark toca… | Chame |
|---|---|
| catálogo de hábitos / onboarding por objetivo | `catalogo-benchmark` (em vez do pesquisador) |
| afirmação científica que sustenta opção | `catalogo-evidencia` (nível A/B/C) |
| criatura, evolução, coleção, combate | `soulmon-monster-taming-designer` |
| culpa, vulneráveis, dark pattern, social | `soulmon-behavioral-psychologist` (bloqueante) |
| nome/estrutura de franquia virando produto | `soulmon-ip-brand-guardian` (bloqueante) |
| opções finais | `soulmon-guarda-linha-vermelha` (veto) |

Pareceres correm em paralelo; o veto vem depois deles. Um agente por arquivo.

## Ao fechar

Portões (`npx tsc --noEmit`, `npx vitest run`), bloco datado em `docs/STATUS.md`, entrada no
`00-MAPA.md` no mesmo commit, commit em PT-BR, PR e merge ff-only na hora (regra de autonomia
do `CLAUDE.md`).
