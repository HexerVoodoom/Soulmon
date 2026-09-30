# Balanço dos minijogos — Bits por minuto e o teto diário

> **Etiqueta: vivo** (30/09/2026). Dono da régua: `src/utils/mente/balanco.test.ts`
> (roda com `BALANCO_PRINT=1 npx vitest run src/utils/mente/balanco.test.ts --disable-console-intercept`
> para imprimir a tabela). A precedência continua código > teste > `CLAUDE.md` > este doc.
> Decisões em aberto estão no §5 — quem decide é o dono, no `REGISTRO-DE-DECISOES.md`.

## 1. O princípio

**Nenhum jogo leve deve ser escolhido pelo que paga.** Se um jogo rende o dobro
dos outros por minuto, ele vira "o jogo de fazer Bits" e os outros viram
decoração — inclusive os do Ateliê da Mente, que existem por outro motivo.
Por isso a faixa de Bits/minuto é a MESMA para o Salão e o Ateliê, e o Refúgio
fica fora da economia (não paga nada, por desenho).

A régua trava três coisas:
1. o jogador **típico** ganha entre **2,5 e 9 Bits/min** em todo jogo leve;
2. o **experiente** nunca passa de **13 Bits/min**;
3. o teto que a folha anuncia ("até N Bits") é **alcançável** — anunciar um
   número que ninguém vê é promessa falsa.

Os perfis são **suposições declaradas**, não medição: ninguém usa o app em
produção ainda. Quando houver telemetria, é esta tabela que se confronta.

| Suposição | Típico | Experiente |
|---|---|---|
| Eco: maior sequência | 6 | 9 |
| Eco: tempo por toque | 650 ms | 420 ms |
| Bolhas: acerto (estourar sonho / deixar fiapo) | 85% | 97% |
| Troca: segundos por carta · acerto | 1,8 s · 85% | 1,1 s · 97% |
| Picross: segundos por casa | 2,4 s | 1,2 s |
| Dino: duração da corrida | 60 s | 180 s |
| PPT | sorte (50%), ~2,5 s por rodada | igual |

## 2. A tabela (depois do ajuste)

| Jogo | Típico: Bits · min · **Bits/min** | Experiente: Bits · min · **Bits/min** |
|---|---|---|
| Eco do Pet | 3 · 0,6 · **5,0** | 6 · 1,0 · **6,2** |
| Bolhas do Sonho | 6 · 1,0 · **6,0** | 8 · 1,0 · **8,0** |
| Troca de Regra | 5 · 0,9 · **5,6** | 5 · 0,55 · **9,1** |
| Picross 5×5 | 3 · 1,0 · **3,0** | 3 · 0,5 · **6,0** |
| Picross 7×7 | 6 · 2,0 · **3,1** | 6 · 1,0 · **6,1** |
| Picross 10×10 | 12 · 4,0 · **3,0** | 12 · 2,0 · **6,0** |
| Corrida do Dino | 6 · 1,05 · **5,7** | 18 · 3,05 · **5,9** |
| Pedra, papel e tesoura | 2,5 · 0,36 · **6,9** | igual (sorte) |
| Revisão da Malha (1×/dia) | 5 · 1,25 · **4,0** | 5 · 0,75 · **6,7** |

O Picross fica de propósito no piso da faixa: é o jogo calmo, sem relógio, e o
desenho do dia soma **+5** uma vez por dia.

## 3. O que mudou neste balanço (30/09/2026)

| Jogo | Antes | Depois | Por quê |
|---|---|---|---|
| **Bolhas do Sonho** | 1 Bit a cada 10 sonhos, teto 10 | **1 a cada 6, teto 8** | a mediana do jogador típico é ~39 sonhos em 60 s: ele ganhava **3** (metade do Dino), e o teto 10 era quase inalcançável. Agora o típico ganha ~6 e o experiente para em 8 |
| **Troca de Regra** | teto 10 | **teto 6** (derivado: 30 cartas ÷ 5) | 30 cartas nunca rendiam mais que 6; a folha anunciava "até 10" |
| **Nonograma da Malha** | 10 no do dia, 3 nos outros, qualquer tamanho | **por tamanho: 5×5 = 3, 7×7 = 6, 10×10 = 12; o do dia +5** | com valor fixo, o 10×10 (4 min) pagava o mesmo que o 5×5 (1 min): o certo era fugir da grade grande |
| **Picross — bônus do dia** | pago de novo a cada vez que se reabria o jogo | **uma vez por dia do jogador**, no aparelho (`STORAGE_KEYS.PICROSS_DAILY_PAID`) | reabrir a tela repagava o bônus |
| Eco, Revisão, Dino, PPT | — | sem mudança | já estavam na faixa |

## 4. Os jogos longos e o teto diário

O teto de minijogo é **150 Bits por dia do jogador** (`MINIGAME_BITS_PER_DAY`,
decisão #61/#63), compartilhado por TODOS os jogos que pagam (é o funil
`handleEarnGamePoints`). Medido nas funções reais:

| Jogo | Uma run completa | Em relação ao teto |
|---|---|---|
| **Masmorra**, nível 1, rookie | **327 Bits** | 2,2× o teto |
| Masmorra, nível 3, champion | 370 Bits | 2,5× |
| Masmorra, nível 5, mega | 417 Bits | 2,8× |
| Arena | 5 rodadas, 4/7/16 Bits por inimigo (+ dificuldade) | a conferir com o dono |
| Pesadelo | 4 / 7 / 11 Bits por vitória, 1 luta por noite | irrelevante para o teto |

**Consequência:** quem desce a Masmorra enche o teto no **2º ou 3º andar da
primeira run** (em ~5 minutos) — e, a partir daí, **nenhum outro jogo paga
nada naquele dia**, inclusive os do Ateliê da Mente. A folha do Ateliê anuncia
"até N Bits" sem saber que o teto já foi batido. É a pendência nº 1 do §5.

## 5. Decisões (fechadas pelo dono em 30/09/2026)

✅ 1 → **(b)**: `DUNGEON_BITS_FACTOR` = 0,4 (run completa ~130–170; bônus de andar 4/6/8/10/12; custo de começar mais fundo 16/nível). ✅ 2 → sim (`BitsHoje`). ✅ 3 → não. ✅ 4 → manter no aparelho. A Arena foi medida: 50 Bits por run completa, fica como está. O texto original das perguntas segue abaixo como registro.


1. **A Masmorra enche o teto sozinha.** Opções: (a) manter; (b) **reduzir os
   Bits da Masmorra para que uma run completa fique perto do teto** (~÷2,5 nos
   Bits por inimigo e no bônus de andar); (c) tetos separados por prédio.
   **Recomendação: (b)** — preserva um teto só (a trava continua simples) e
   devolve sentido aos outros jogos.
2. **Mostrar "Bits de hoje: X de 150" nas folhas dos prédios?** Quando o teto
   bate, o "até N Bits" vira mentira. Recomendação: sim, em texto neutro, sem
   barra nem cor de alerta.
3. **Os jogos do Ateliê alimentam o Vínculo (XP) ou as missões semanais?**
   Recomendação: não por ora — a trilha do Vínculo não pode pedir ação nova, e
   missão de "jogar X" empurra o jogo que existe para descansar a cabeça.
4. **Picross: o bônus do dia fica por APARELHO** (quem joga em dois aparelhos
   recebe o bônus duas vezes, limitado pelo teto). Recomendação: manter no
   aparelho; o teto diário (no save) já segura.
