# Gate — fase `prototyper` (run `combate-v3-01`)

## Veredito
**CONCERNS. A premissa foi respondida: NÃO.** O spike (L1) foi executado e passou por 1 passe de revisão. A régua escolhida pelo dono (win rate no espelho ±5pp) é **degrau por construção**: o controle "mesmo especial dividido em 2 golpes" reprova nela (−15,7pp) e passa na ΔTTK (17/17). A dominância é **real** e vem das regras base, não dos especiais nem da régua.

## Agentes usados (2 + revisão): backend (spike), skeptic (ataque). Arquitetura e design ficaram de fora: o spike é a pergunta inteira desta fase.

## Self-grade
| Dimensão | Nota | Evidência |
|---|---|---|
| Evidência | 🟢 | spike-sim.md, saída real, N=1000, controle e prova de vermelho |
| Risco | 🟢 | premissa respondida SIM/NÃO |
| Decisão | 🟡 | exige nova decisão do dono (régua + curva de stats) |
| Executabilidade | 🟢 | sim reproduzível: `node cv3-sim2.mjs [--energy-hit] [--noise-regua]` |

## Objeções (skeptic + passe 1)
| # | Objeção | Sev. | Estado |
|---|---|---|---|
| 1 | Win rate no espelho é degrau num modelo determinístico (1 golpe de vantagem = 100%; ±5pp ≈ ±2% no parâmetro) | FIXÁVEL só pelo dono (trocar régua) | provada pelo controle direto2 → dono |
| 2 | DoT ignorava DEF (S7) | FIXÁVEL | resolvida no passe 1 (DoT ΔTTK 16/17) |
| 3 | X de buff dependia do build (S8) | FIXÁVEL | trocado por X multiplicativo; buff/debuff seguem fora (ΔTTK −31%), buffSpd 0/17 |
| 4 | Energia por golpe dado não dispara em luta de 3 golpes (0% de disparo) | FIXÁVEL | variante energy-hit não basta; regra de energia × piso 3 → dono |
| 5 | **Dominância: ATK puro no piso a partir do d21 (luta de 6 s); espelho DEF puro d60 = 142 golpes ≈ 246 s; SPD é sublinear** | **FATAL** para o §2.3 como está | aberta → dono |
| 6 | "Variância pequena resolve" | RUÍDO | o ruído ±25% não amacia o degrau |

## Verificação executável
Ver `prototyper/spike-sim.md` (P0 e Passe 1, exit 1). Controle direto2: win rate REPROVA −15,7pp e ΔTTK PASS 17/17.

## Maior risco sobrevivente
Com as regras atuais, o build decide a luta (ATK mata em 6 s, DEF luta 4 min), contra a premissa "estratégia só muda o playstyle". Nenhuma régua conserta isso: é a curva de atributos.

## Pendências → dono
Régua ΔTTK · curva de stats (ex.: golpes = ceil(hp·def/atk)-like proporcional, ou orçamento por ponto igual) · energia ao receber golpe · buff SPD sem fórmula que feche.

---
# Re-gate (AJUSTAR, 04/10/2026): curva proporcional + régua ΔTTK
## Veredito: **CONCERNS. A premissa continua NÃO, mas por pouco.** 2 passes no limite (spike-sim2.md + "Passe 1"); nada FATAL de pé.
O que fecha:
- k = 8 × nível, com `round` e SPD proporcional: os 3 exemplos do dono valem (10/9/11).
- Gap entre builds ≤2,4% (puro×puro e puro×DIST).
- Energia: 100% das lutas têm especial, nos dois lados.
- Direto, direto2, DoT, cura e escudo fecham ±5% (20/20).
- Glitchtama: "pontos = min(perfectDays, required)" mantém o invariante (4/5/5/45) em 3000 saves × 365 dias, com mega→ultra exercitado.

O que não fecha:
- (1) Com golpes inteiros, +1 ATK/DEF vale 0,0% do TTK do d7 ao d45. O piso de 2% reprova: equilíbrio comprado com irrelevância.
- (2) Buffs por carga dão −13% a −15% no d0: as cargas que sobram expiram com a luta.
- (3) A janela normalizada deixa o DEF puro em 33–36 s (faixa 20–29 s).
- (4) A regra Glitchtama retira ponto na degeneração: 1,29 queda por 30 dias no perfil de 60% de dias perfeitos, ~0 no de 80%.

| Objeção | Sev. | Estado |
|---|---|---|
| `ceil` × exemplos (incompatível) | FIXÁVEL | resolvida: `round` |
| k fixo | FIXÁVEL | resolvida: k ∝ nível |
| ponto marginal ≈0 | FIXÁVEL só pelo dono | aberta: dano fracionário |
| buffs por carga | FIXÁVEL | aberta: carga garantida ou equivalente direto |
| DEF puro 36 s | FIXÁVEL | aberta |
| degeneração retira ponto | decisão do dono | aberta |

Prova de vermelho válida: DoT ×1,5 → "REPROVA: família=dot", +10,2% (sim3 v0).
**Maior risco:** a única configuração equilibrada torna o ponto diário quase invisível no meio do jogo. O jogador "ganha +1 ATK" e nada muda na luta.

---
# Confirmação final (04/10/2026): **NÃO FECHA — parado antes do Builder** (regra do dono: FATAL → parar)
- **FATAL 1, valor do ponto.** +1 ATK/DEF/SPD vale 10% do TTK no d0, 2,7% no d7, 0,8% no d21 e 0,3% no d60. Mesmo com dano fracionário, k = 8×nível dilui o ponto (≈1/(k+ATK)). Gap ≤10% e ponto ≥2% são incompatíveis nesta curva.
- **FATAL 2 (de 1 célula só), cura e escudo.** p=0,77 dá −6,9% em d7/ATK (19/20). Saída candidata, não testada: p por estágio ou cura limitada ao HP do estágio.
- PASS: exemplos 10/9/11 · gap entre builds ≤1,6% · DEF ≤35,6 s · energia 64.000/64.000 · DoT e direto 20/20 · buffs dentro da tolerância de −15% · prova de vermelho válida (dot ×1,5 → REPROVA nomeada).
- Constantes candidatas em spike-sim2.md, seção "Confirmação final". Ressalva: a janela só foi medida em 5 dias, falta a fórmula contínua.

---
# Re-escala por estágio (04/10/2026): **NÃO FECHA — parado antes do Builder**
Critério fixo do valor do ponto: **+1 ponto ≥2% do TTK em todo dia medido**.
- VAR A (base_s = ceil(1,5^s) + pontos do estágio, k=8):
  - FATAL gap: +54,3% no d45 (DIST vence os puros; o estágio mega dura 45 dias).
  - FATAL DEF puro: 125 s.
  - +1 HP vale 2,0% no d60, exatamente no limite.
  - Buffs estouram ±5% fora do d0.
  - PASS: exemplos, energia, DoT, direto2, prova de vermelho.
- VAR B: pior em tudo.
- **Causa raiz, comum aos 4 spikes:** a curva multiplicativa premia o build distribuído, a aditiva premia o puro. Com estágios longos (45 dias), nenhuma curva testada atende ao mesmo tempo "gap ≤10%", "ponto ≥2%" e "DEF ≤40 s".
- Alerta de método: 4 re-spikes sem convergir. O problema é de critério, não de calibração.
