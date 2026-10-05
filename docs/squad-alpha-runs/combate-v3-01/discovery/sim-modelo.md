# Discovery — simulação executável do modelo (PLANO-COMBATE-V3 §2/§3)

Script: `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim.mjs` (Node, fora do repo, determinístico por seed). Rodar com `node cv3-sim.mjs` (verde/vermelho na checagem ±5%) e `node cv3-sim.mjs --red` (prova de vermelho).

## Suposições (rotuladas)
- S1 `JANELA = 22.5 s` → SPD1 = 2,5 s/golpe; luta base espelho = 25 s (dentro de PvE 20–29 s).
- S2 piso Q3 = 1 (aberto ao dono).
- S3 evoluções no fim dos dias 7, 21, 45; ×1,5 ceil nos 4 (Q4). HP só sobe na evolução (Q1).
- S4 `E = 3` golpes. S5 energia +U[20,30] por golpe próprio, especial dispara a 100 (~4º golpe). S6 300 seeds; fase inicial U[0,intervalo) por lutador.
- S7 dano por golpe = 1/golpesParaDerrubar(atual) do HP máx; buffs de ATK/DEF recalculam o divisor no meio da luta.
- S8 calibração "como escrita": buff ATK/debuff DEF +1 por `t = E/(g/(g−1)−1)` intervalos; buff SPD +1 por `t = E·JANELA`; DoT 3 ticks em 3 intervalos; cura/escudo = E golpes do inimigo.
- S9 inimigo "mesmo total de pontos" = build DIST (rotação ATK→SPD→DEF) no mesmo dia.

## Onde a matemática do dono FECHA
- Os 4 exemplos literais: 10 / 9 / 11 / 10-em-9 — exatos.
- Valor marginal de +1 ATK, +1 DEF, +1 HP é idêntico em todo nível (±1 golpe). +1 SPD empata com ATK em nível baixo (−10% vs −10% no dia 0).
- Espelho DIST vs DIST nunca bate no piso (até dia 200); tempo de luta encolhe devagar (25 s → 16,4 s no dia 60).
- DoT com ticks curtos (`t ≤ ~0,3 intervalo`) fica a ≤1,2% do dano direto.

## Onde NÃO fecha
- **Empate determinístico**: espelho sem fase aleatória empata no mesmo tick (t=25 s). Precisa de regra de desempate.
- **SPD2 vence o espelho 300/300** (média 21,4 s; contra 25 s). +1 ponto = vitória garantida em espelho — todo ponto decide a luta.
- **Build puro quebra tudo**: ATK-only bate o piso (1 golpe) contra ROOKIE no dia 7, contra DIST no dia 17, em espelho ATK no dia 11. No dia 21, ATK-only mata DIST em 2,05 s. DEF-only e SPD-only perdem para DIST em todos os dias. ATK domina.
- **×1,5 quebra a linearidade**: ATK-only contra ROOKIE cai 1 golpe/dia (d0..d6) e −3 no dia 7 (evo). HP só cresce na evolução (10→15→23→35) e é diluído pelos pontos diários; golpes do espelho DIST = 10,14,23,35.
- **Marginal de SPD decai mais que ATK** em nível alto: dia 45 +1 ATK −2,9% vs +1 SPD −2,3%; dia 60 −2,9% vs −2,0% (SPD é 1/(8+spd), sublinear).
- **Cura e escudo não fecham em tempo-para-vencer, por definição**: TTW = sem especial (+46% a +73% vs direto). Fecham só em HP líquido (cura termina com mais HP que direto). "Mesma proporção" precisa escolher a métrica.
- **Buff ATK / debuff DEF / buff SPD calibrados por "E golpes extras" duram 48–68 s, mais que a luta inteira (~16–23 s)**: maior parte do orçamento perdido; +38% a +61% de tempo. No base, buff +1 ATK dá ZERO ganho (win 48% = moeda no espelho) por arredondamento (golpe inteiro: 0,6 HP / (1/9) = 5,4 → 6 golpes, total 10 igual).
- **DoT "k ticks em t"**: +7,4% a +7,6% de média, pior caso até +13,9% — o atraso custa, não só o dano perdido na morte (perdido médio só 0,02–0,04 golpe).
- **No piso (S-c)** o especial nunca dispara (luta acaba no 1º golpe): todas as famílias "passam" trivialmente — paridade vazia, não é prova.
- Overkill do direto é ~0 aqui porque o dano é fracionário; com HP em inteiros o overkill reaparece.

## Saída real — `node cv3-sim.mjs` (exit=1)
```
## 1. Exemplos literais do dono
golpes(1/1/1/10 vs 1/1/1/10) = 10  (esperado 10)
golpes(ATK2 vs base) = 9  (esperado 9)
golpes(base vs DEF2) = 11  (esperado 11)
ataques em 9 intervalos de SPD1 com SPD2 = 10.00  (esperado 10); intervalo spd1=2.50s spd2=2.25s
espelho 1/1/1/10 sem fase aleatória: winner=tie t=25.00s  (EMPATE: ambos a 0 no mesmo tick)
base vs SPD2 sem fase: winner=B (B=SPD2) t=22.50s; A precisaria 25.00s
base vs SPD2, 300 seeds com fase U[0,int): SPD2 vence 300, base vence 0, empates 0; t médio 21.37s, max 22.50s
espelho base, 300 seeds com fase: A 144 / B 156 / empate 0  -> vencedor = quem começou antes (fase), 50/50 puro

## 2. Crescimento 0..60 dias (evo x1.5 ceil nos dias 7,21,45)
dia | build | stats a/d/s/hp | golpes p/ derrubar DIST mesmo dia | TTW(meu) s | TTW(inimigo DIST em mim) s | vence?
 0 | ATK  | 1/1/1/10 | 10 | 25.00 | 25.00 | empate
 0 | DEF  | 1/1/1/10 | 10 | 25.00 | 25.00 | empate
 0 | SPD  | 1/1/1/10 | 10 | 25.00 | 25.00 | empate
 0 | DIST | 1/1/1/10 | 10 | 25.00 | 25.00 | empate
 7 | ATK  | 12/2/2/15 | 8 | 18.00 | 19.04 | SIM
 7 | DEF  | 2/12/2/15 | 18 | 40.50 | 36.35 | nao
 7 | SPD  | 2/2/12/15 | 18 | 20.25 | 19.04 | nao
 7 | DIST | 6/5/5/15 | 14 | 24.23 | 24.23 | empate
 8 | ATK  | 13/2/2/15 | 7 | 15.75 | 17.68 | SIM
 8 | DEF  | 2/13/2/15 | 18 | 40.50 | 35.36 | nao
 8 | SPD  | 2/2/13/15 | 18 | 19.29 | 17.68 | nao
 8 | DIST | 6/5/6/15 | 14 | 22.50 | 22.50 | empate
14 | ATK  | 19/2/2/15 | 3 | 6.75 | 12.66 | SIM
14 | DEF  | 2/19/2/15 | 20 | 45.00 | 36.56 | nao
14 | SPD  | 2/2/19/15 | 20 | 16.67 | 12.66 | nao
14 | DIST | 8/7/8/15 | 14 | 19.69 | 19.69 | empate
21 | ATK  | 39/3/3/23 | 1 | 2.05 | 10.76 | SIM
21 | DEF  | 3/39/3/23 | 35 | 71.59 | 45.98 | nao
21 | SPD  | 3/3/39/23 | 35 | 16.76 | 10.76 | nao
21 | DIST | 15/15/15/23 | 23 | 22.50 | 22.50 | empate
22 | ATK  | 40/3/3/23 | 1 | 2.05 | 9.78 | SIM
22 | DEF  | 3/40/3/23 | 35 | 71.59 | 45.98 | nao
22 | SPD  | 3/3/40/23 | 35 | 16.41 | 9.78 | nao
22 | DIST | 16/15/15/23 | 22 | 21.52 | 21.52 | empate
30 | ATK  | 48/3/3/23 | 1 | 2.05 | 6.92 | SIM
30 | DEF  | 3/48/3/23 | 38 | 77.73 | 45.87 | nao
30 | SPD  | 3/3/48/23 | 38 | 15.27 | 6.92 | nao
30 | DIST | 18/18/18/23 | 23 | 19.90 | 19.90 | empate
45 | ATK  | 95/5/5/35 | 1 | 1.73 | 2.62 | SIM
45 | DEF  | 5/95/5/35 | 65 | 112.50 | 49.71 | nao
45 | SPD  | 5/5/95/35 | 65 | 14.20 | 2.62 | nao
45 | DIST | 35/35/35/35 | 35 | 18.31 | 18.31 | empate
46 | ATK  | 96/5/5/35 | 1 | 1.73 | 2.09 | SIM
46 | DEF  | 5/96/5/35 | 65 | 112.50 | 49.71 | nao
46 | SPD  | 5/5/96/35 | 65 | 14.06 | 2.09 | nao
46 | DIST | 36/35/35/35 | 34 | 17.79 | 17.79 | empate
60 | ATK  | 110/5/5/35 | 1 | 1.73 | 0.47 | nao
60 | DEF  | 5/110/5/35 | 70 | 121.15 | 49.22 | nao
60 | SPD  | 5/5/110/35 | 70 | 13.35 | 0.47 | nao
60 | DIST | 40/40/40/35 | 35 | 16.41 | 16.41 | empate

Valor marginal de +1 ponto (build DIST, contra inimigo DIST do mesmo dia): % de mudança no TTW próprio (ATK,SPD) e no TTW do inimigo (DEF)
dia | +1 ATK (meu TTW) | +1 SPD (meu TTW) | +1 DEF (TTW inimigo) | +1 HP (TTW inimigo)
0 (1/1/1/10, golpes=10) | -10.0% | -10.0% | +10.0% | +10.0%
7 (6/5/5/15, golpes=14) | -7.1% | -7.1% | +7.1% | +7.1%
21 (15/15/15/23, golpes=23) | -4.3% | -4.2% | +4.3% | +4.3%
45 (35/35/35/35, golpes=35) | -2.9% | -2.3% | +2.9% | +2.9%
60 (40/40/40/35, golpes=35) | -2.9% | -2.0% | +2.9% | +2.9%

Piso Q3: primeiro dia em que golpesParaDerrubar == 1
ATK vs ROOKIE: dia 7
ATK vs DIST mesmo dia: dia 17
ATK vs mesmo build mesmo dia: dia 11
DIST vs ROOKIE: dia 19
DIST vs DIST mesmo dia: nao bate ate dia 200
DIST vs mesmo build mesmo dia: nao bate ate dia 200

Linearidade: golpes que build ATK precisa contra ROOKIE, e queda por dia
d0:10 d1:9(-1) d2:8(-1) d3:7(-1) d4:6(-1) d5:5(-1) d6:4(-1) d7:1(-3) d8:1(0) d9:1(0) d10:1(0) d11:1(0) d12:1(0)
DIST em torno das evos: d6:3/3/3/10 d7:6/5/5/15 d20:10/9/10/15 d21:15/15/15/23 d44:23/22/23/23 d45:35/35/35/35

## 3. Especiais, orçamento E=3 golpes; 300 seeds; jogador A (com especial) vs B (básico)

### S-a base 1/1/1/10 espelho: A=1/1/1/10 B=1/1/1/10 golpes A->B=10 B->A=10
sem especial: TTW medio 23.36s
familia | TTW medio s | pior s | vs direto (medio) | vs direto (pior) | win% A | HP A fim medio | overkill medio (golpes-frac) | DoT perdido | cura desperdicada | veredito ±5%
direto | 16.30 | 17.50 | +0.0% | +0.0% | 100% | 0.35 | 0.00 | 0.00 | 0.00 | PASS
dot | 17.51 | 19.92 | +7.4% | +13.9% | 100% | 0.30 | 0.05 | 0.04 | 0.00 | FAIL (t=7.50s)
dotCurto | 16.30 | 17.50 | +0.0% | +0.0% | 100% | 0.35 | 0.00 | 0.00 | 0.00 | PASS (t=0.75s)
cura | 23.80 | 25.00 | +46.0% | +42.9% | 100% | 0.65 | 0.00 | 0.00 | 0.00 | FAIL
escudo | 23.80 | 25.00 | +46.0% | +42.9% | 100% | 0.50 | 0.00 | 0.00 | 0.00 | FAIL
buffAtk | 23.36 | 24.78 | +43.3% | +41.6% | 48% | 0.05 | 0.04 | 0.00 | 0.00 | FAIL (t=67.50s)
buffSpd | 22.51 | 23.91 | +38.0% | +36.6% | 86% | 0.10 | 0.00 | 0.00 | 0.00 | FAIL (t=67.50s)
debuffDef | 23.36 | 24.78 | +43.3% | +41.6% | 48% | 0.05 | 0.04 | 0.00 | 0.00 | FAIL (t=67.50s)

### S-b dia30 DIST espelho: A=18/18/18/23 B=18/18/18/23 golpes A->B=23 B->A=23
sem especial: TTW medio 19.34s
familia | TTW medio s | pior s | vs direto (medio) | vs direto (pior) | win% A | HP A fim medio | overkill medio (golpes-frac) | DoT perdido | cura desperdicada | veredito ±5%
direto | 11.70 | 12.11 | +0.0% | +0.0% | 100% | 0.41 | 0.00 | 0.00 | 0.00 | PASS
dot | 12.57 | 13.75 | +7.4% | +13.5% | 100% | 0.37 | 0.02 | 0.02 | 0.00 | FAIL (t=2.60s)
dotCurto | 11.70 | 12.28 | +0.0% | +1.3% | 100% | 0.41 | 0.00 | 0.00 | 0.00 | PASS (t=0.26s)
cura | 19.49 | 19.90 | +66.6% | +64.3% | 100% | 0.68 | 0.00 | 0.00 | 0.00 | FAIL
escudo | 19.49 | 19.90 | +66.6% | +64.3% | 100% | 0.65 | 0.00 | 0.00 | 0.00 | FAIL
buffAtk | 17.78 | 18.96 | +52.0% | +56.5% | 100% | 0.11 | 0.01 | 0.00 | 0.00 | FAIL (t=57.12s)
buffSpd | 18.08 | 18.54 | +54.5% | +53.0% | 100% | 0.09 | 0.00 | 0.00 | 0.00 | FAIL (t=67.50s)
debuffDef | 17.78 | 18.96 | +52.0% | +56.5% | 100% | 0.11 | 0.01 | 0.00 | 0.00 | FAIL (t=57.12s)

### S-c ATK alto (golpes no piso): A=48/3/3/23 B=18/18/18/23 golpes A->B=1 B->A=8
sem especial: TTW medio 1.07s
familia | TTW medio s | pior s | vs direto (medio) | vs direto (pior) | win% A | HP A fim medio | overkill medio (golpes-frac) | DoT perdido | cura desperdicada | veredito ±5%
direto | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS
dot | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=6.14s)
dotCurto | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=0.61s)
cura | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS
escudo | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS
buffAtk | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=0.00s)
buffSpd | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=67.50s)
debuffDef | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=0.00s)

### S-d dia 60 DIST espelho: A=40/40/40/35 B=40/40/40/35 golpes A->B=35 B->A=35
sem especial: TTW medio 16.10s
familia | TTW medio s | pior s | vs direto (medio) | vs direto (pior) | win% A | HP A fim medio | overkill medio (golpes-frac) | DoT perdido | cura desperdicada | veredito ±5%
direto | 9.38 | 10.29 | +0.0% | +0.0% | 100% | 0.43 | 0.01 | 0.00 | 0.00 | PASS
dot | 10.09 | 10.76 | +7.6% | +4.6% | 100% | 0.38 | 0.02 | 0.04 | 0.00 | FAIL (t=1.41s)
dotCurto | 9.49 | 10.34 | +1.2% | +0.5% | 100% | 0.42 | 0.00 | 0.01 | 0.00 | PASS (t=0.14s)
cura | 16.18 | 16.41 | +72.5% | +59.4% | 100% | 0.71 | 0.00 | 0.00 | 0.00 | FAIL
escudo | 16.18 | 16.41 | +72.5% | +59.4% | 100% | 0.68 | 0.00 | 0.00 | 0.00 | FAIL
buffAtk | 14.78 | 15.00 | +57.5% | +45.8% | 100% | 0.10 | 0.02 | 0.00 | 0.00 | FAIL (t=47.81s)
buffSpd | 15.09 | 15.32 | +60.8% | +48.9% | 100% | 0.08 | 0.00 | 0.00 | 0.00 | FAIL (t=67.50s)
debuffDef | 14.78 | 15.00 | +57.5% | +45.8% | 100% | 0.10 | 0.02 | 0.00 | 0.00 | FAIL (t=47.81s)

## Checagem de paridade ±5% (tempo-para-vencer medio vs direto)
REPROVA: familia=dot cenario="S-a base 1/1/1/10 espelho" desvio=+7.4%
REPROVA: familia=cura cenario="S-a base 1/1/1/10 espelho" desvio=+46.0%
REPROVA: familia=escudo cenario="S-a base 1/1/1/10 espelho" desvio=+46.0%
REPROVA: familia=buffAtk cenario="S-a base 1/1/1/10 espelho" desvio=+43.3%
REPROVA: familia=buffSpd cenario="S-a base 1/1/1/10 espelho" desvio=+38.0%
REPROVA: familia=debuffDef cenario="S-a base 1/1/1/10 espelho" desvio=+43.3%
REPROVA: familia=dot cenario="S-b dia30 DIST espelho" desvio=+7.4%
REPROVA: familia=cura cenario="S-b dia30 DIST espelho" desvio=+66.6%
REPROVA: familia=escudo cenario="S-b dia30 DIST espelho" desvio=+66.6%
REPROVA: familia=buffAtk cenario="S-b dia30 DIST espelho" desvio=+52.0%
REPROVA: familia=buffSpd cenario="S-b dia30 DIST espelho" desvio=+54.5%
REPROVA: familia=debuffDef cenario="S-b dia30 DIST espelho" desvio=+52.0%
REPROVA: familia=dot cenario="S-d dia 60 DIST espelho" desvio=+7.6%
REPROVA: familia=cura cenario="S-d dia 60 DIST espelho" desvio=+72.5%
REPROVA: familia=escudo cenario="S-d dia 60 DIST espelho" desvio=+72.5%
REPROVA: familia=buffAtk cenario="S-d dia 60 DIST espelho" desvio=+57.5%
REPROVA: familia=buffSpd cenario="S-d dia 60 DIST espelho" desvio=+60.8%
REPROVA: familia=debuffDef cenario="S-d dia 60 DIST espelho" desvio=+57.5%
total: 14 PASS / 18 FAIL 
```

## Prova de vermelho — `node cv3-sim.mjs --red` (exit=1): `dotCurto.t` 0,3→3 intervalos; família de controle passa de PASS para REPROVA nomeada
```
### S-a base 1/1/1/10 espelho: A=1/1/1/10 B=1/1/1/10 golpes A->B=10 B->A=10
dotCurto | 17.51 | 19.92 | +7.4% | +13.9% | 100% | 0.30 | 0.05 | 0.04 | 0.00 | FAIL (t=7.50s)
### S-b dia30 DIST espelho: A=18/18/18/23 B=18/18/18/23 golpes A->B=23 B->A=23
dotCurto | 12.57 | 13.75 | +7.4% | +13.5% | 100% | 0.37 | 0.02 | 0.02 | 0.00 | FAIL (t=2.60s)
### S-c ATK alto (golpes no piso): A=48/3/3/23 B=18/18/18/23 golpes A->B=1 B->A=8
dotCurto | 1.07 | 2.04 | +0.0% | +0.0% | 100% | 0.84 | 0.00 | 0.00 | 0.00 | PASS (t=6.14s)
### S-d dia 60 DIST espelho: A=40/40/40/35 B=40/40/40/35 golpes A->B=35 B->A=35
dotCurto | 10.09 | 10.76 | +7.6% | +4.6% | 100% | 0.38 | 0.02 | 0.04 | 0.00 | FAIL (t=1.41s)
REPROVA: familia=dotCurto cenario="S-a base 1/1/1/10 espelho" desvio=+7.4%
REPROVA: familia=dotCurto cenario="S-b dia30 DIST espelho" desvio=+7.4%
REPROVA: familia=dotCurto cenario="S-d dia 60 DIST espelho" desvio=+7.6%
total: 11 PASS / 21 FAIL [MODO --red: dotCurto.t 0.3*int -> 3*int]
```
