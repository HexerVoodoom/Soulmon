# Spike L1 v2: cv3-sim3 (Fase 1 AJUSTAR, contexto §2.4 / PLANO §10)

O script fica fora do repo, em `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim3.mjs`. O `cv3-sim2.mjs` ficou intacto. Para rodar: `node cv3-sim3.mjs [--k=N --spd=lin|prop] [--red]`.

## Premissa: **NÃO**
A premissa era: "com curva proporcional + régua ΔTTK, as 7 famílias fecham ±5% e nenhum build puro passa de 10% de gap".
- Gap ≤10% só fecha com k≥~100 e SPD proporcional. Com esse k a curva vira quase linear em HP e o atributo deixa de valer: +1 ATK muda 0,0% de golpes no DIST d60.
- No k que respeita 2 dos 3 exemplos do dono (k=8), o gap chega a −68,9%.
- Buff ATK, debuff DEF e buff SPD não fecham em k nenhum.

## Suposições rotuladas
- Evoluções no 4º, 9º, 14º e 59º dia que conta. Vem do código: FORM_REQUIREMENTS 4/5/5 + ULTRA_PATIENCE_DAYS 45.
- HP +1 a cada 4º dia que conta, mais ×1,5 ceil nos 4 atributos na evolução.
- Janela de 22,5 s. E = 3 golpes.
- Energia: +60 × fração de HP causada, +60 × fração recebida, +2/s; o especial dispara a 100.
- Régua: fase 0,5 nos dois lados. Quem cai continua dando golpe básico ("fantasma") até o outro cair. Δ = t(A cai)/t(B cai) − 1, e empate é válido.
- **Cura e escudo entram no TTK como TTK do adversário estendido**, ou seja, A cai mais tarde.
- Buffs têm duração fixa de 4 intervalos próprios; o parâmetro calibrado é a magnitude.

## Constantes calibradas (k escolhido = 200, SPD proporcional)
| família | parâmetro | valor | pior Δ | veredito |
|---|---|---|---|---|
| direto (ref) | × E | 1 | 0,0% | PASS |
| direto2 (controle) | 2 metades | 1 | −1,2% | PASS |
| dot (respeita DEF) | × E, 3 ticks | 1,00 | −1,7% | PASS |
| cura | × E golpes do inimigo | 0,96 | 0,0% | PASS |
| escudo | × E golpes do inimigo | 0,96 | 0,0% | PASS |
| buff ATK | dano ×(1+p), 4 int. | 1,24 | −13,3% (d0) | REPROVA |
| debuff DEF | dano recebido ×(1+p), 4 int. | 1,24 | −13,3% (d0) | REPROVA |
| buff SPD | ritmo ×(1+p), 4 int. | 1,10 | +13,4% (d7/DEF) | REPROVA |

Com k=8 e SPD linear: dot vai a p=1,11 e REPROVA (−6,8% em d7/ATK), cura e escudo a 0,98 (PASS), buff ATK e debuff DEF a 1,24 (−13,3%), buff SPD a 1,75 (−14,4%).

## Leitura
1. **Exemplos do dono.** ATK2→9 exige k≤8; DEF2→11 exige k≥9. Nenhum k dá os 3 exemplos ao mesmo tempo.
2. **A curva proporcional premia o balanceado.** Com HP×(1+D/k)/(1+A/k), concentrar pontos rende menos que distribuir: o DIST vence todo build puro por 49% a 83% com k≤20. O gap só cai abaixo de 10% quando k≥100, e aí o atributo quase não pesa.
3. **Duração das lutas.** Com o HP crescendo junto, a luta de espelho chega a 140–280 s no d60 com k=200, e o DEF puro com k=8 chega a 624 s. Isso sai da faixa PvE de 20–29 s: falta normalizar a janela por estágio.
4. **Buffs e debuffs com duração fixa não acompanham o tamanho da luta.** Na luta curta do d0 rendem pouco e na longa rendem muito. Para fechar, a duração tem de ser proporcional aos golpes da luta, ou o efeito tem de virar "E golpes equivalentes".
5. **Energia.** Disparou ≥1× nos dois lados em 100.000 de 100.000 lutas (20 células × 8 famílias × 625 fases). PASS V1.
6. **Prova de vermelho.** dot ×1,5 dá +10,2% (d21/ATK) e a saída nomeia "REPROVA: família=dot".
7. **Glitchtama.**
   - Regra ingênua (+1 por dia e por Glitchtama, nunca retirado): os totais ao evoluir variam de 2 a 9+ por estágio, então o invariante QUEBRA.
   - Regra "acompanha" (pontos do estágio = min(perfectDays, required)): totais únicos por estágio (rookie 4, champion 5, ultimate 5), INVARIANTE OK.
   - Conflito com a linha vermelha: um dia ruim isolado não tira perfectDays (dailyReset.ts), logo não tira ponto. Só a degeneração por HP zerado tira, e ela já custa perfectDays hoje (custo 5). A saída proposta é declarar "ponto = espelho de perfectDays": a degeneração já é a punição aceita, e nenhum ponto sai fora dela.
   - Ressalva: no estresse aleatório (45% de dias ruins, 5000 saves) houve 168.079 degenerações que retiraram ponto. O mega→ultra não foi exercitado (45 dias de paciência).

## SAÍDA REAL A: `node cv3-sim3.mjs` (exit 1)
```
## 1. Curva golpes = ceil(HP×(1+DEF/k)÷(1+ATK/k)) — exemplos do dono no d0 por k
k | base(10) | ATK2(9) | DEF2(11) | exemplos OK
2 | 10 | 8 | 14 | 1/3
3 | 10 | 8 | 13 | 1/3
4 | 10 | 9 | 12 | 2/3
5 | 10 | 9 | 12 | 2/3
6 | 10 | 9 | 12 | 2/3
7 | 10 | 9 | 12 | 2/3
8 | 10 | 9 | 12 | 2/3
9 | 10 | 10 | 11 | 2/3
10 | 10 | 10 | 11 | 2/3
11 | 10 | 10 | 11 | 2/3
12 | 10 | 10 | 11 | 2/3
13 | 10 | 10 | 11 | 2/3
14 | 10 | 10 | 11 | 2/3
15 | 10 | 10 | 11 | 2/3
16 | 10 | 10 | 11 | 2/3
17 | 10 | 10 | 11 | 2/3
18 | 10 | 10 | 11 | 2/3
19 | 10 | 10 | 11 | 2/3
20 | 10 | 10 | 11 | 2/3
=> ATK2→9 exige k≤8 ((k+1)/(k+2)≤0,9); DEF2→11 exige k≥9 ((k+2)/(k+1)≤1,1). Nenhum k satisfaz os 3 ao mesmo tempo.

Varredura k × modo SPD: pior gap de TTK (build puro vs DIST, dias 0/7/21/45/60; positivo = build puro vence)
k | SPD linear 8+spd | SPD proporcional 9(1+s/k)/(1+1/k)
2 | -83.2% (d60/SPD) | -82.3% (d60/DEF)
3 | -81.2% (d60/SPD) | -80.1% (d60/ATK)
4 | -78.2% (d60/SPD) | -77.7% (d60/DEF)
5 | -76.0% (d60/SPD) | -75.4% (d60/DEF)
6 | -73.8% (d60/SPD) | -73.3% (d60/DEF)
7 | -71.5% (d60/SPD) | -71.6% (d60/ATK)
8 | -68.9% (d60/DEF) | -68.9% (d60/DEF)
9 | -68.1% (d60/ATK) | -66.9% (d60/ATK)
10 | -67.4% (d60/DEF) | -64.9% (d60/DEF)
11 | -66.9% (d60/ATK) | -63.3% (d60/ATK)
12 | -66.1% (d60/DEF) | -61.2% (d60/DEF)
13 | -65.6% (d60/DEF) | -59.5% (d60/DEF)
14 | -65.1% (d60/DEF) | -57.8% (d60/DEF)
15 | -64.5% (d60/DEF) | -56.1% (d60/DEF)
16 | -64.7% (d60/ATK) | -55.4% (d60/ATK)
17 | -63.8% (d60/ATK) | -53.2% (d60/ATK)
18 | -63.2% (d60/DEF) | -51.5% (d60/DEF)
19 | -62.8% (d60/ATK) | -50.0% (d60/ATK)
20 | -62.6% (d60/DEF) | -48.8% (d60/DEF)
30 | -60.2% (d60/ATK) | -37.5% (d60/ATK)
50 | -58.1% (d60/ATK) | -23.2% (d60/ATK)
100 | +71.5% (d45/SPD) | -10.2% (d60/ATK)
200 | +93.4% (d45/SPD) | -3.3% (d60/ATK)
1000 | +125.3% (d60/SPD) | -5.1% (d7/SPD)
ESCOLHA: k=200, SPD=prop — pior gap -3.3% em d60/ATK (meta ≤10%: PASS); exemplos do dono com este k: base 10, ATK2 10, DEF2 11; valor de +1 ATK no espelho DIST d60: +0.0% golpes
dia | DIST a/d/s/hp | ATK gap (meu TTK s / dele s) | DEF gap | SPD gap | golpes espelho DIST
0 | 1/1/1/10 | +0.0% (25.0/25.0) | +0.0% (25.0/25.0) | +0.0% (25.0/25.0) | 10
7 | 4/4/4/17 | -1.0% (42.3/41.9) | -1.0% (44.8/44.3) | -3.2% (43.3/41.9) | 17
21 | 16/13/13/44 | -1.4% (100.5/99.1) | +0.4% (112.8/113.2) | +0.3% (98.8/99.1) | 44
45 | 22/19/19/50 | -0.0% (107.9/107.8) | -1.2% (132.4/130.8) | +0.2% (107.7/107.8) | 50
60 | 38/35/35/81 | -3.3% (157.0/151.8) | -2.8% (222.3/216.0) | -3.1% (156.7/151.8) | 80
Duração do espelho por build/dia (s): d0 ATK:25.0,DEF:25.0,SPD:25.0,DIST:25.0 | d7 ATK:42.3,DEF:44.8,SPD:40.9,DIST:41.9 | d21 ATK:95.6,DEF:125.0,SPD:94.5,DIST:103.8 | d45 ATK:100.5,DEF:152.0,SPD:99.7,DIST:114.7 | d60 ATK:140.1,DEF:277.8,SPD:138.0,DIST:171.1

## 3. Energia: +60×(fração de HP causada) +60×(fração recebida) +2/s; especial a 100
lutas (20 células × 8 famílias × 625 fases): 100000; especial disparou ≥1× nos DOIS lados em 100000 (100.0%) — PASS V1; luta mais curta 15.0s

## 4. Régua oficial ΔTTK no espelho (determinística, fase 0,5 nos dois; empate é válido). Δ = t(A cai)/t(B cai) − 1; PASS se |Δ| ≤ 5%
cura/escudo entram como TTK do adversário estendido (A cai mais tarde); buff/debuff/DoT encurtam t(B cai).
família | parâmetro | p | pior Δ (célula) | PASS/20 | t médio p/ A derrubar B (s) | HP de A quando B cai (média) | veredito
direto | × E | 1 | +0.0% (-) | 20/20 | 78.4 | 0.00 | PASS
direto2 | × E (2 metades) | 1 | -1.2% (d45/DIST) | 20/20 | 78.5 | 0.00 | PASS
dot | × E total, 3 ticks | 1 | -1.7% (d45/DIST) | 20/20 | 78.5 | 0.00 | PASS
cura | × E golpes do inimigo | 0.96 | +0.0% (-) | 20/20 | 93.0 | 0.00 | PASS
escudo | × E golpes do inimigo | 0.96 | +0.0% (-) | 20/20 | 93.0 | 0.00 | PASS
buffAtk | magnitude: meu dano ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 8/20 | 74.9 | 0.03 | REPROVA: família=buffAtk
debuffDef | magnitude: dano recebido pelo alvo ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 8/20 | 74.9 | 0.03 | REPROVA: família=debuffDef
buffSpd | magnitude: ritmo ×(1+p) por 4 intervalos | 1.1 | +13.4% (d7/DEF) | 2/20 | 73.6 | 0.07 | REPROVA: família=buffSpd
Detalhe por célula (Δ%): família | d0A d0D d0S d0D d7A d7D d7S d7D d21A d21D d21S d21D d45A d45D d45S d45D d60A d60D d60S d60D
direto | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
direto2 | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 -1.2 0.0 0.0 0.0 0.0
dot | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 -1.7 0.0 0.0 0.0 -0.2
cura | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
escudo | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
buffAtk | -13.3 -13.3 -13.3 -13.3 0.0 0.0 0.0 0.0 6.6 5.1 8.7 2.7 9.5 8.2 4.8 0.0 9.0 9.9 5.9 1.5
debuffDef | -13.3 -13.3 -13.3 -13.3 0.0 0.0 0.0 0.0 6.6 5.1 8.7 2.7 9.5 8.2 4.8 0.0 9.0 9.9 5.9 1.5
buffSpd | -13.4 -13.4 -13.4 -13.4 9.7 13.4 9.7 9.7 9.8 3.0 9.8 8.4 10.0 9.5 8.6 -0.2 9.1 8.5 7.8 7.9

Informativo: pior Δ médio sobre 100 pares de fase (não é a régua)
  direto: +0.2%
  direto2: -1.2%
  dot: -1.6%
  cura: +1.2%
  escudo: +1.2%
  buffAtk: -13.3%
  debuffDef: -13.3%
  buffSpd: -15.0%

## 5. Invariante "mesmo estágio = mesmo total de pontos ao evoluir" (Glitchtama dá ponto)
regra "ingênua": totais distintos ao evoluir por estágio: rookie={2,3,4,5,6,7,8,9,…} champion={3,4,5,6,7,8,9,10,…} ultimate={3,4,5,6,7,8,9,10,…} -> QUEBRA; degenerações que retiraram ponto (5000 saves): 0
regra "acompanha": totais distintos ao evoluir por estágio: rookie={4} champion={5} ultimate={5} -> INVARIANTE OK; degenerações que retiraram ponto (5000 saves): 168079
regra "ingênua" = +1 ponto por dia que conta e por Glitchtama, nunca retirado. regra "acompanha" = pontos do estágio = min(perfectDays, required): concedido ao subir pd, retirado (LIFO) só quando pd cai (degeneração), recriado do pd ao degenerar.
Dia ruim isolado NÃO muda pd (dailyReset.ts: "Dia não-perfeito NÃO tira perfectDays"), logo NÃO tira ponto; só a degeneração por HP zerado tira, e ela já tira perfectDays hoje (custo 5).

## PREMISSA ("com curva proporcional + régua ΔTTK, as 7 famílias fecham ±5% e nenhum build puro passa de 10% de gap"): NÃO
  famílias ±5%: NÃO (buffAtk, debuffDef, buffSpd) | gap ≤10%: SIM (-3.3% d60/ATK, k=200, SPD prop)
```

## SAÍDA REAL B: `node cv3-sim3.mjs --k=8 --spd=lin` (exit 1), a partir da escolha
```
[forçado por argumento] k=8 SPD=lin
ESCOLHA: k=8, SPD=lin — pior gap -68.9% em d60/DEF (meta ≤10%: FAIL); exemplos do dono com este k: base 10, ATK2 9, DEF2 12; valor de +1 ATK no espelho DIST d60: -1.3% golpes
dia | DIST a/d/s/hp | ATK gap (meu TTK s / dele s) | DEF gap | SPD gap | golpes espelho DIST
0 | 1/1/1/10 | +0.0% (25.0/25.0) | +0.0% (25.0/25.0) | +0.0% (25.0/25.0) | 10
7 | 4/4/4/17 | +4.2% (27.0/28.1) | -0.8% (47.3/46.9) | +1.2% (27.8/28.1) | 17
21 | 16/13/13/44 | -32.5% (38.1/25.7) | -33.8% (124.6/82.5) | -33.3% (38.6/25.7) | 39
45 | 22/19/19/50 | -53.9% (39.8/18.3) | -53.7% (180.0/83.3) | -53.0% (39.0/18.3) | 45
60 | 38/35/35/81 | -68.3% (47.8/15.2) | -68.9% (306.6/95.2) | -68.1% (47.6/15.2) | 76
Duração do espelho por build/dia (s): d0 ATK:25.0,DEF:25.0,SPD:25.0,DIST:25.0 | d7 ATK:22.5,DEF:65.3,SPD:22.5,DIST:31.9 | d21 ATK:24.2,DEF:247.5,SPD:23.6,DIST:41.8 | d45 ATK:19.0,DEF:399.8,SPD:18.8,DIST:37.5 | d60 ATK:18.3,DEF:734.1,SPD:17.7,DIST:39.8

## 3. Energia: +60×(fração de HP causada) +60×(fração recebida) +2/s; especial a 100
lutas (20 células × 8 famílias × 625 fases): 100000; especial disparou ≥1× nos DOIS lados em 100000 (100.0%) — PASS V1; luta mais curta 12.1s

## 4. Régua oficial ΔTTK no espelho (determinística, fase 0,5 nos dois; empate é válido). Δ = t(A cai)/t(B cai) − 1; PASS se |Δ| ≤ 5%
cura/escudo entram como TTK do adversário estendido (A cai mais tarde); buff/debuff/DoT encurtam t(B cai).
família | parâmetro | p | pior Δ (célula) | PASS/20 | t médio p/ A derrubar B (s) | HP de A quando B cai (média) | veredito
direto | × E | 1 | +0.0% (-) | 20/20 | 81.8 | 0.00 | PASS
direto2 | × E (2 metades) | 1 | -3.3% (d7/ATK) | 20/20 | 81.9 | 0.00 | PASS
dot | × E total, 3 ticks | 1.11 | -6.8% (d7/ATK) | 19/20 | 81.4 | 0.00 | REPROVA: família=dot
cura | × E golpes do inimigo | 0.98 | +0.0% (-) | 20/20 | 92.4 | 0.00 | PASS
escudo | × E golpes do inimigo | 0.98 | +0.0% (-) | 20/20 | 92.4 | 0.00 | PASS
buffAtk | magnitude: meu dano ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 10/20 | 79.5 | 0.01 | REPROVA: família=buffAtk
debuffDef | magnitude: dano recebido pelo alvo ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 10/20 | 79.5 | 0.01 | REPROVA: família=debuffDef
buffSpd | magnitude: ritmo ×(1+p) por 4 intervalos | 1.75 | -14.4% (d7/ATK) | 2/20 | 75.1 | 0.05 | REPROVA: família=buffSpd
Detalhe por célula (Δ%): família | d0A d0D d0S d0D d7A d7D d7S d7D d21A d21D d21S d21D d45A d45D d45S d45D d60A d60D d60S d60D
direto | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
direto2 | 0.0 0.0 0.0 0.0 -3.3 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
dot | 0.0 0.0 0.0 0.0 -6.8 0.0 0.0 0.0 0.0 0.8 0.0 0.0 -1.0 1.0 0.0 0.0 0.0 0.8 0.0 0.0
cura | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
escudo | 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
buffAtk | -13.3 -13.3 -13.3 -13.3 -13.3 -4.3 0.0 0.0 -8.7 7.6 0.0 2.9 -11.8 4.6 0.0 2.5 -9.5 5.0 0.0 1.4
debuffDef | -13.3 -13.3 -13.3 -13.3 -13.3 -4.3 0.0 0.0 -8.7 7.6 0.0 2.9 -11.8 4.6 0.0 2.5 -9.5 5.0 0.0 1.4
buffSpd | -7.9 -7.9 -7.9 -7.9 -14.4 7.7 6.5 12.1 1.8 12.3 11.0 12.7 -9.5 13.8 9.4 10.7 -4.6 10.4 5.4 5.8

Informativo: pior Δ médio sobre 100 pares de fase (não é a régua)
  direto: +0.2%
  direto2: -3.6%
  dot: -6.6%
  cura: +1.7%
  escudo: +1.7%
  buffAtk: -16.4%
  debuffDef: -16.4%
  buffSpd: +13.5%

## 5. Invariante "mesmo estágio = mesmo total de pontos ao evoluir" (Glitchtama dá ponto)
regra "ingênua": totais distintos ao evoluir por estágio: rookie={2,3,4,5,6,7,8,9,…} champion={3,4,5,6,7,8,9,10,…} ultimate={3,4,5,6,7,8,9,10,…} -> QUEBRA; degenerações que retiraram ponto (5000 saves): 0
regra "acompanha": totais distintos ao evoluir por estágio: rookie={4} champion={5} ultimate={5} -> INVARIANTE OK; degenerações que retiraram ponto (5000 saves): 168079
regra "ingênua" = +1 ponto por dia que conta e por Glitchtama, nunca retirado. regra "acompanha" = pontos do estágio = min(perfectDays, required): concedido ao subir pd, retirado (LIFO) só quando pd cai (degeneração), recriado do pd ao degenerar.
Dia ruim isolado NÃO muda pd (dailyReset.ts: "Dia não-perfeito NÃO tira perfectDays"), logo NÃO tira ponto; só a degeneração por HP zerado tira, e ela já tira perfectDays hoje (custo 5).

## PREMISSA ("com curva proporcional + régua ΔTTK, as 7 famílias fecham ±5% e nenhum build puro passa de 10% de gap"): NÃO
  famílias ±5%: NÃO (dot, buffAtk, debuffDef, buffSpd) | gap ≤10%: NÃO (-68.9% d60/DEF, k=8, SPD lin)
```

## SAÍDA REAL C: `node cv3-sim3.mjs --red` (exit 1), régua
```
## 4. Régua oficial ΔTTK no espelho (determinística, fase 0,5 nos dois; empate é válido). Δ = t(A cai)/t(B cai) − 1; PASS se |Δ| ≤ 5%
cura/escudo entram como TTK do adversário estendido (A cai mais tarde); buff/debuff/DoT encurtam t(B cai).
[--red] dot descalibrado ×1,5 -> p=1.5
família | parâmetro | p | pior Δ (célula) | PASS/20 | t médio p/ A derrubar B (s) | HP de A quando B cai (média) | veredito
direto | × E | 1 | +0.0% (-) | 20/20 | 78.4 | 0.00 | PASS
direto2 | × E (2 metades) | 1 | -1.2% (d45/DIST) | 20/20 | 78.5 | 0.00 | PASS
dot | × E total, 3 ticks | 1.5 | +10.2% (d21/ATK) | 5/20 | 73.6 | 0.07 | REPROVA: família=dot
cura | × E golpes do inimigo | 0.96 | +0.0% (-) | 20/20 | 93.0 | 0.00 | PASS
escudo | × E golpes do inimigo | 0.96 | +0.0% (-) | 20/20 | 93.0 | 0.00 | PASS
buffAtk | magnitude: meu dano ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 8/20 | 74.9 | 0.03 | REPROVA: família=buffAtk
debuffDef | magnitude: dano recebido pelo alvo ×(1+p) por 4 intervalos | 1.24 | -13.3% (d0/ATK) | 8/20 | 74.9 | 0.03 | REPROVA: família=debuffDef
buffSpd | magnitude: ritmo ×(1+p) por 4 intervalos | 1.1 | +13.4% (d7/DEF) | 2/20 | 73.6 | 0.07 | REPROVA: família=buffSpd
Detalhe por célula (Δ%): família | d0A d0D d0S d0D d7A d7D d7S d7D d21A d21D d21S d21D d45A d45D d45S d45D d60A d60D d60S d60D
```

---
# Passe 1 (revisão do skeptic) — `node cv3-sim3.mjs --p1` (exit 0; a premissa é impressa, não vira exit code)

Mudanças, sem tocar no design do dono:
- Arredondamento `round` disponível.
- k fixo ou k = c × nível, onde nível = média de ATK/DEF/SPD do DIST do dia.
- Critério novo: valor marginal ≥2%.
- Matriz puro×puro e puro×DIST.
- Buffs por contagem: efeito ×2 em p×E golpes.
- Janela normalizada por dia.
- Glitchtama realista, com os símbolos do código.

O `cv3-sim3.v0.mjs` guarda a versão anterior.

## Premissa Passe 1: **NÃO**
- Exemplos do dono e gap fecham: round, k = 8 × nível, SPD proporcional, com exemplos 10/9/11 e gap máx 2,4%.
- Valor marginal reprova: +1 ATK ou +1 DEF muda **0,0%** do TTK a partir do d7.
- Os 3 buffs reprovam (−13 a −15% no d0).
- Nenhuma das 216 configurações passa nos 4 critérios.
- Trade-off estrutural: tudo o que reduz o gap também achata o valor do ponto. Com golpes inteiros e k crescendo junto com o nível, +1 ponto vale menos que meio golpe.

## SAÍDA REAL P1 — `node cv3-sim3.mjs --p1`
```
## P1-a Arredondamento: faixa de k inteiro (2..40) que fecha os 3 exemplos do dono (base 10, ATK2 9, DEF2 11)
ceil: k ∈ {nenhum}
round: k ∈ {6,7,8,9,10,11,12,13,14,15,16,17}

## P1-b/c/d Varredura: k fixo 2..40 e k = c × nível (nível = média ATK/DEF/SPD do DIST do dia; no d0 nível=1, logo k=c), round/ceil, SPD lin/prop
critérios: exemplos 3/3 · gap puro×DIST ≤10% · gap puro×puro ≤10% · valor marginal mín ≥2% (+1 em ATK/SPD/DEF/HP do DIST, efeito no TTK do espelho)
config | exemplos | gap puro×DIST pior (+=DIST vence) | gap puro×puro pior | DIST domina máx | algum puro domina máx | marginal mín | veredito
round/k=8×nível/SPD prop | 10/9/11 | +1.5% (d21 DIST×ATK) | +2.4% (d7 DEF×SPD) | +1.5% | +2.4% | +0.0% (d7/atk) | FAIL
round/k=10×nível/SPD prop | 10/9/11 | -1.8% (d7 DIST×ATK) | -2.9% (d7 ATK×SPD) | +1.0% | +2.9% | +0.0% (d7/atk) | FAIL
round/k=12×nível/SPD prop | 10/9/11 | +3.8% (d7 DIST×ATK) | -2.0% (d7 DEF×SPD) | +3.8% | +2.0% | +0.0% (d7/atk) | FAIL
round/k=15×nível/SPD prop | 10/9/11 | +4.2% (d7 DIST×SPD) | +1.8% (d7 ATK×SPD) | +4.2% | +1.8% | +0.0% (d7/atk) | FAIL
round/k=7×nível/SPD prop | 10/9/11 | -4.2% (d7 DIST×DEF) | -1.5% (d7 ATK×SPD) | +2.2% | +4.2% | +0.0% (d21/def) | FAIL
round/k=6×nível/SPD prop | 10/9/11 | -6.1% (d7 DIST×ATK) | +3.0% (d7 ATK×SPD) | +3.3% | +6.1% | +0.0% (d21/def) | FAIL
round/k=17×nível/SPD prop | 10/9/11 | -6.9% (d7 DIST×SPD) | +3.0% (d7 ATK×SPD) | +1.0% | +6.9% | +0.0% (d7/atk) | FAIL
round/k=17/SPD prop | 10/9/11 | +53.2% (d60 DIST×ATK) | +3.5% (d7 ATK×SPD) | +53.2% | +3.5% | +1.3% (d60/def) | FAIL
round/k=16/SPD prop | 10/9/11 | +54.4% (d60 DIST×SPD) | +2.9% (d45 ATK×SPD) | +54.4% | +2.9% | +0.0% (d60/hp) | FAIL
round/k=15/SPD prop | 10/9/11 | +56.5% (d60 DIST×ATK) | -0.5% (d45 ATK×SPD) | +56.5% | +3.2% | +1.3% (d60/hp) | FAIL
round/k=14/SPD prop | 10/9/11 | +58.0% (d60 DIST×SPD) | +2.8% (d45 ATK×SPD) | +58.0% | +2.9% | +1.3% (d60/hp) | FAIL
round/k=13/SPD prop | 10/9/11 | +59.9% (d60 DIST×ATK) | -3.4% (d7 ATK×SPD) | +59.9% | +3.4% | +1.3% (d60/hp) | FAIL
round/k=12/SPD prop | 10/9/11 | +62.2% (d60 DIST×ATK) | +3.0% (d7 ATK×SPD) | +62.2% | +3.6% | +0.0% (d45/hp) | FAIL
round/k=11/SPD prop | 10/9/11 | +63.6% (d60 DIST×SPD) | -3.2% (d60 ATK×SPD) | +63.6% | +3.2% | +1.3% (d60/hp) | FAIL
round/k=17/SPD lin | 10/9/11 | +63.8% (d60 DIST×ATK) | -32.3% (d45 ATK×SPD) | +63.8% | +32.3% | +1.3% (d60/def) | FAIL
round/k=16/SPD lin | 10/9/11 | +63.9% (d60 DIST×DEF) | -30.1% (d60 ATK×SPD) | +63.9% | +30.1% | +0.0% (d60/hp) | FAIL
round/k=15/SPD lin | 10/9/11 | +64.8% (d60 DIST×ATK) | -27.8% (d45 ATK×SPD) | +64.8% | +27.8% | +1.3% (d60/atk) | FAIL
round/k=14/SPD lin | 10/9/11 | +64.9% (d60 DIST×ATK) | -24.6% (d45 DEF×SPD) | +64.9% | +24.6% | +1.3% (d60/atk) | FAIL
round/k=10/SPD prop | 10/9/11 | +65.7% (d60 DIST×ATK) | -2.4% (d7 ATK×SPD) | +65.7% | +2.4% | +1.3% (d60/hp) | FAIL
round/k=13/SPD lin | 10/9/11 | +65.9% (d60 DIST×ATK) | -22.6% (d45 ATK×SPD) | +65.9% | +22.6% | +1.3% (d60/atk) | FAIL
configs avaliadas: 216; PASS em todos os critérios: 0
melhor com exemplos 3/3 + marginal ≥2%: nenhuma
melhor com gap ≤10% (os dois): round/k=8×nível/SPD prop → exemplos 10/9/11, marginal mín +0.0% (d7/atk)

ESCOLHA (menor pior gap, penalizando exemplos e marginal): round/k=8×nível/SPD prop. Valor marginal por dia (DIST):
  d0: +1 ATK +10.0% · +1 SPD +10.0% · +1 DEF +10.0% · +1 HP +10.0%
  d7: +1 ATK +0.0% · +1 SPD +2.7% · +1 DEF +0.0% · +1 HP +5.9%
  d21: +1 ATK +0.0% · +1 SPD +0.8% · +1 DEF +0.0% · +1 HP +2.3%
  d45: +1 ATK +0.0% · +1 SPD +0.6% · +1 DEF +0.0% · +1 HP +2.0%
  d60: +1 ATK +0.0% · +1 SPD +0.3% · +1 DEF +1.3% · +1 HP +1.3%
Matriz da ESCOLHA (linha vence coluna por x% = TTK do adversário / meu TTK − 1; ordem ATK DEF SPD DIST):
  d0: ATK[+0.0% +0.0% +0.0% +0.0%] DEF[+0.0% +0.0% +0.0% +0.0%] SPD[+0.0% +0.0% +0.0% +0.0%] DIST[+0.0% +0.0% +0.0% +0.0%]
  d7: ATK[+0.0% +0.0% +0.7% +0.7%] DEF[+0.0% +0.0% +2.4% -0.3%] SPD[-0.7% -2.4% +0.0% +1.2%] DIST[-0.7% +0.3% -1.2% +0.0%]
  d21: ATK[+0.0% +0.0% +0.7% -1.5%] DEF[+0.0% +0.0% +0.2% -0.4%] SPD[-0.7% -0.2% +0.0% -0.6%] DIST[+1.5% +0.4% +0.6% +0.0%]
  d45: ATK[+0.0% +0.0% -0.2% -1.2%] DEF[+0.0% +0.0% -0.4% -1.0%] SPD[+0.2% +0.4% +0.0% -1.3%] DIST[+1.3% +1.0% +1.3% +0.0%]
  d60: ATK[+0.0% +0.0% -0.6% -0.3%] DEF[+0.0% +0.0% +0.2% -1.1%] SPD[+0.6% -0.2% +0.0% -0.3%] DIST[+0.3% +1.1% +0.3% +0.0%]

## P1-f Janela normalizada por dia: J tal que o espelho DIST dure 25 s (faixa PvE 20–29 s)
  d0: J=22.5s · espelhos ATK 25.0s, DEF 25.0s, SPD 25.0s, DIST 25.0s
  d7: J=14.4s · espelhos ATK 21.8s, DEF 32.7s, SPD 22.0s, DIST 25.0s
  d21: J=5.8s · espelhos ATK 21.7s, DEF 34.2s, SPD 21.9s, DIST 25.0s
  d45: J=5.1s · espelhos ATK 21.6s, DEF 35.4s, SPD 21.5s, DIST 25.0s
  d60: J=3.1s · espelhos ATK 21.5s, DEF 35.8s, SPD 21.3s, DIST 25.0s

## P1-e Buffs em "E golpes equivalentes" (contagem, não tempo): buffAtkN = meus próximos p×E golpes valem ×2; debuffDefN = próximos p×E golpes que o alvo recebe valem ×2; buffSpdN = próximos p×E golpes meus em ritmo ×2. Régua ΔTTK com a ESCOLHA + janela normalizada.
família | p | pior Δ (célula) | PASS/20 | NÃO MEDIDO | veredito
direto | 1 | +0.0% (-) | 20/20 | 0 | PASS
direto2 | 1 | +0.0% (-) | 20/20 | 0 | PASS
dot | 1.11 | +0.0% (-) | 20/20 | 0 | PASS
cura | 0.77 | +0.0% (-) | 20/20 | 0 | PASS
escudo | 0.77 | +0.0% (-) | 20/20 | 0 | PASS
buffAtkN | 0.68 | -13.3% (d0/ATK) | 12/20 | 0 | REPROVA: família=buffAtkN
debuffDefN | 0.68 | -13.3% (d0/ATK) | 12/20 | 0 | REPROVA: família=debuffDefN
buffSpdN | 1.28 | -14.5% (d0/ATK) | 15/20 | 0 | REPROVA: família=buffSpdN

## P1-g Glitchtama. Código: specialItemUse.ts › applySpecialItem → `perfectDays: prev.perfectDays + 1` (teto GLITCHTAMA_PER_DAY = 1).
Modelo realista: MAX_HP_BY_FORM 3/3/3/4/5 · −1 coração por dia não perfeito (MAX_HEARTS_LOST_PER_DAY=1) · 1 folga/semana (REST_DAYS_PER_WEEK) · +0,5 na segunda (WEEKLY_RELIEF_HEARTS) · queda = degeneratedPerfectDays (max(req/2, pd−5)) · ultra = pd ≥ 45 no mega (ULTRA_PATIENCE_DAYS) · Glitchtama em 30% dos dias · 365 dias × 3000 saves
  p(dia perfeito)=0.6 regra ingênua: rookie{2,3,4,5,6,7,8,9,10,11,…} champion{3,4,5,6,7,8,9,10,11,12,…} ultimate{3,4,5,6,7,8,9,10,11,12,…} mega→ultra{45,46} -> QUEBRA · ultra em 1313/3000 · degenerações 1.29 por 30 dias
  p(dia perfeito)=0.6 regra acompanha: rookie{4} champion{5} ultimate{5} mega→ultra{45} -> INVARIANTE OK · ultra em 1313/3000 · degenerações 1.29 por 30 dias · quedas (todas retiram os pontos do estágio perdido) 37272
  p(dia perfeito)=0.8 regra ingênua: rookie{2,3,4,5,6,7} champion{3,4,5,6,7,8} ultimate{5,6,7,8,9,10,11,12,13,14,…} mega→ultra{45,46} -> QUEBRA · ultra em 3000/3000 · degenerações 0.12 por 30 dias
  p(dia perfeito)=0.8 regra acompanha: rookie{4} champion{5} ultimate{5} mega→ultra{45} -> INVARIANTE OK · ultra em 3000/3000 · degenerações 0.12 por 30 dias · quedas (todas retiram os pontos do estágio perdido) 704
  p(dia perfeito)=0.95 regra ingênua: rookie{4,5} champion{5,6} ultimate{5,6} mega→ultra{45,46} -> QUEBRA · ultra em 3000/3000 · degenerações 0.00 por 30 dias
  p(dia perfeito)=0.95 regra acompanha: rookie{4} champion{5} ultimate{5} mega→ultra{45} -> INVARIANTE OK · ultra em 3000/3000 · degenerações 0.00 por 30 dias · quedas (todas retiram os pontos do estágio perdido) 0

## PREMISSA PASSE 1 (7 famílias ±5% na ΔTTK e nenhum build >10% de gap, com exemplos do dono 3/3 e marginal ≥2%): NÃO
  famílias: NÃO (buffAtkN, debuffDefN, buffSpdN) | gap ≤10%: SIM (+2.4%) | exemplos 3/3: SIM | marginal ≥2%: NÃO (+0.0%)
```

## SAÍDA REAL P1 vermelho — `node cv3-sim3.mjs --p1 --red` (trecho da régua)
```
## P1-e Buffs em "E golpes equivalentes" (contagem, não tempo): buffAtkN = meus próximos p×E golpes valem ×2; debuffDefN = próximos p×E golpes que o alvo recebe valem ×2; buffSpdN = próximos p×E golpes meus em ritmo ×2. Régua ΔTTK com a ESCOLHA + janela normalizada.
[--red] buffSpdN descalibrado ×1,5 -> 1.92
família | p | pior Δ (célula) | PASS/20 | NÃO MEDIDO | veredito
direto | 1 | +0.0% (-) | 20/20 | 0 | PASS
direto2 | 1 | +0.0% (-) | 20/20 | 0 | PASS
dot | 1.11 | +0.0% (-) | 20/20 | 0 | PASS
cura | 0.77 | +0.0% (-) | 20/20 | 0 | PASS
escudo | 0.77 | +0.0% (-) | 20/20 | 0 | PASS
buffAtkN | 0.68 | -13.3% (d0/ATK) | 12/20 | 0 | REPROVA: família=buffAtkN
debuffDefN | 0.68 | -13.3% (d0/ATK) | 12/20 | 0 | REPROVA: família=debuffDefN
buffSpdN | 1.92 | -14.5% (d0/ATK) | 16/20 | 0 | REPROVA: família=buffSpdN

## P1-g Glitchtama. Código: specialItemUse.ts › applySpecialItem → `perfectDays: prev.perfectDays + 1` (teto GLITCHTAMA_PER_DAY = 1).
```

---
# Confirmação final (contexto §2.5): `node cv3-sim3.mjs --final` (exit 0; o veredito sai impresso)

Configuração: dano fracionário no TTK, golpes de exibição com `round`, k = 8 × nível, SPD proporcional, janela normalizada por dia, energia 60/60/2, HP no 4º dia, evolução ×1,5 ceil, pontos = espelho de perfectDays.

**Veredito: NÃO. FATAL em 2 critérios:**
- **Marginal.** +1 ATK/DEF/SPD vale só 0,3% do TTK no d60 (abaixo de 2% do d21 em diante). É estrutural: com k proporcional ao nível, o ganho de +1 é ≈ 1/(k+ATK) = 1/(288+38).
- **Cura e escudo.** −6,9% no d7/ATK (19/20 células).

Passaram:
- exemplos 10/9/11
- gap ≤1,6%
- DEF puro ≤35,6 s
- direto2
- dot
- os 3 buffs, dentro da tolerância de −15% no d0
- energia em 64.000 de 64.000 lutas
- prova de vermelho válida: dot p=1 fica 20/20; com ×1,5 cai para 15/20 e a saída nomeia "REPROVA: família=dot"

```
## F-1 Exemplos do dono no d0 (golpes de exibição = round): 10/9/11 (alvo 10/9/11) -> PASS

## F-2 Matriz de gap (linha vence coluna; ordem ATK DEF SPD DIST), marginal (+1 no DIST, % do TTK) e duração do espelho (janela normalizada)
d0 (k=8.0, J=22.50s) ATK[+0.0% +0.0% +0.0% +0.0%] DEF[+0.0% +0.0% +0.0% +0.0%] SPD[+0.0% +0.0% +0.0% +0.0%] DIST[+0.0% +0.0% +0.0% +0.0%]
   marginal: ATK +10.0% · SPD +10.0% · DEF +11.1% · HP +10.0% | espelhos: ATK 25.0s, DEF 25.0s, SPD 25.0s, DIST 25.0s
d7 (k=32.0, J=14.44s) ATK[+0.0% +0.0% +0.0% +1.6%] DEF[+0.0% +0.0% +0.0% +1.6%] SPD[-0.0% -0.0% +0.0% +1.6%] DIST[-1.6% -1.6% -1.6% +0.0%]
   marginal: ATK +2.7% · SPD +2.7% · DEF +2.8% · HP +5.9% | espelhos: ATK 22.0s, DEF 31.9s, SPD 22.0s, DIST 25.0s
d21 (k=112.0, J=5.79s) ATK[+0.0% +0.0% +0.0% -0.1%] DEF[+0.0% +0.0% +0.0% -0.1%] SPD[+0.0% -0.0% +0.0% -0.1%] DIST[+0.1% +0.1% +0.1% +0.0%]
   marginal: ATK +0.8% · SPD +0.8% · DEF +0.8% · HP +2.3% | espelhos: ATK 21.9s, DEF 34.1s, SPD 21.9s, DIST 25.0s
d45 (k=160.0, J=5.09s) ATK[+0.0% +0.0% +0.0% -1.0%] DEF[+0.0% +0.0% +0.0% -1.0%] SPD[-0.0% -0.0% +0.0% -1.0%] DIST[+1.0% +1.0% +1.0% +0.0%]
   marginal: ATK +0.5% · SPD +0.6% · DEF +0.6% · HP +2.0% | espelhos: ATK 21.5s, DEF 35.4s, SPD 21.5s, DIST 25.0s
d60 (k=288.0, J=3.13s) ATK[+0.0% +0.0% +0.0% -1.3%] DEF[+0.0% +0.0% +0.0% -1.3%] SPD[-0.0% -0.0% +0.0% -1.3%] DIST[+1.4% +1.4% +1.4% +0.0%]
   marginal: ATK +0.3% · SPD +0.3% · DEF +0.3% · HP +1.2% | espelhos: ATK 21.3s, DEF 35.6s, SPD 21.3s, DIST 25.0s
gap máx +1.6% (d7 ATK×DIST) -> PASS · marginal mín +0.3% (d60/atk) -> FATAL · DEF puro máx 35.6s -> PASS

## F-3 Régua ΔTTK (fracionário, determinística; buffs: tolerância −15%/+5% só no d0, ±5% nos demais)
família | p | pior Δ (célula) | dentro/20 | sem disparo | veredito
direto | 1 | +0.0% (-) | 20/20 | 0 | PASS
direto2 | 1 | +0.0% (-) | 20/20 | 0 | PASS
dot | 1 | +0.0% (-) | 20/20 | 0 | PASS
cura | 0.77 | -6.9% (d7/ATK) | 19/20 | 0 | FATAL: família=cura
escudo | 0.77 | -6.9% (d7/ATK) | 19/20 | 0 | FATAL: família=escudo
buffAtkN | 1.12 | -13.3% (d0/ATK) | 20/20 | 0 | PASS
debuffDefN | 1.12 | -13.3% (d0/ATK) | 20/20 | 0 | PASS
buffSpdN | 1.58 | -14.5% (d0/ATK) | 20/20 | 0 | PASS
prova de vermelho: dot p=1 -> 20/20 PASS; p×1,5=1.5 -> 15/20, pior +21.1% (d7/ATK) -> REPROVA: família=dot

## F-4 Energia (+60×fração causada +60×fração recebida +2/s, dispara a 100): 64000/64000 lutas com especial nos dois lados -> PASS

## F-5 Constantes finais (para o núcleo TS)
constante | valor
CURVA | golpes = HP×(1+DEF/k)/(1+ATK/k), fracionário no TTK; exibição = round
K | 8 × nível, nível = média(ATK,DEF,SPD) do DIST de referência do dia (d0=1 → k=8)
RITMO | 9×(1+SPD/k)/(1+1/k) ataques por janela
JANELA por dia (s) | d0=22.50 d7=14.44 d21=5.79 d45=5.09 d60=3.13
E | 3 golpes
ENERGIA | +60×fração de HP causada, +60×fração recebida, +2/s, dispara a 100
P_direto | 1
P_direto2 | 1
P_dot | 1
P_cura | 0.77
P_escudo | 0.77
P_buffAtkN | 1.12
P_debuffDefN | 1.12
P_buffSpdN | 1.58
CRESCIMENTO | +1/dia que conta no galho; a cada 4º → HP; evo ×1,5 ceil nos 4; pontos do estágio = min(perfectDays, required)

## CONFIRMAÇÃO FINAL: NÃO — FATAL em: marginal, familias
```

---
# Re-escala por estágio (contexto §2.6) — `node cv3-sim3.mjs --stage --var=A|B` (exit 0; o veredito sai impresso)

## Fórmulas declaradas
- **Estágio** s = quantos EVO_AT [4, 9, 14, 59] o save já alcançou.
- **Pontos do estágio**: um por dia que conta dentro do estágio; o 4º, 8º, … vão para HP. Equivalem a min(perfectDays, required).
- **VAR A (mais simples)**: valor = base_s + pontos do estágio, com base_s = ceil(1,5^s) em ATK/DEF/SPD e ceil(10·1,5^s) em HP. O ×1,5 da evolução É a base do estágio seguinte. Pelo invariante, a base é igual para todos.
- **VAR B**: base_s = ceil(1,5 × valor final do estágio anterior), por atributo.
- **Curva**: k = 8 fixo, golpes fracionários no TTK; a exibição usa round. O SPD é proporcional.
- **Janela contínua**: J(d) = 25 × ritmo(SPD_ref) ÷ golpes(ref, ref), com ref = DIST do mesmo estágio e dos mesmos dias no estágio.

## Veredito: **NÃO**

**VAR A** — FATAL em:
- **Gap**: +54,3% em d45, com o DIST dominando dentro do estágio longo (mega, 45 dias).
- **Marginal**: +1 HP vale 2,0% no d60, na borda; o critério marca FATAL.
- **DEF puro**: 125 s.
- **Buffs**: −13,3% no d0 (dentro da tolerância), mas buff ATK e debuff DEF ficam em 15/20 e buff SPD em 18/20, com estouro do ±5% fora do rookie.

Passam na VAR A:
- exemplos 10/9/11
- energia em 64.000 de 64.000 lutas
- direto2
- dot
- cura e escudo com p por estágio (rookie 0,77; demais 0,96)
- prova de vermelho: dot ×1,5 nomeado

**VAR B** é pior: gap +215,7%, DEF puro 507,8 s, e direto2 também reprova (FATAL).

**Causa raiz (as duas variantes):** a curva multiplicativa premia o equilíbrio (AM-GM). Num estágio longo, o build puro acumula +23 num só atributo e perde do DIST por ~35%. Dar re-escala por estágio só ajuda nos estágios curtos.

```
## S-1 [VAR A] Exemplos do dono no d0 (golpes de exibição = round): 10/9/11 (alvo 10/9/11) -> PASS

## F-2 Matriz de gap (linha vence coluna; ordem ATK DEF SPD DIST), marginal (+1 no DIST, % do TTK) e duração do espelho (janela normalizada)
d0 (k=8.0, J=22.50s) ATK[+0.0% +0.0% +0.0% +0.0%] DEF[+0.0% +0.0% +0.0% +0.0%] SPD[+0.0% +0.0% +0.0% +0.0%] DIST[+0.0% +0.0% +0.0% +0.0%]
   marginal: ATK +10.0% · SPD +10.0% · DEF +11.1% · HP +10.0% | espelhos: ATK 25.0s, DEF 25.0s, SPD 25.0s, DIST 25.0s
d7 (k=8.0, J=18.33s) ATK[+0.0% +0.0% +0.0% -2.3%] DEF[+0.0% +0.0% -0.0% -2.3%] SPD[+0.0% +0.0% +0.0% -2.3%] DIST[+2.4% +2.4% +2.4% +0.0%]
   marginal: ATK +8.3% · SPD +8.3% · DEF +9.1% · HP +6.7% | espelhos: ATK 21.2s, DEF 35.8s, SPD 21.2s, DIST 25.0s
d21 (k=8.0, J=10.00s) ATK[+0.0% +0.0% +0.0% -5.5%] DEF[+0.0% +0.0% +0.0% -5.5%] SPD[-0.0% +0.0% +0.0% -5.5%] DIST[+5.9% +5.9% +5.9% +0.0%]
   marginal: ATK +6.7% · SPD +6.7% · DEF +7.1% · HP +2.9% | espelhos: ATK 19.4s, DEF 43.8s, SPD 19.4s, DIST 25.0s
d45 (k=8.0, J=12.20s) ATK[+0.0% +0.0% +0.0% -35.2%] DEF[+0.0% +0.0% +0.0% -35.2%] SPD[+0.0% +0.0% +0.0% -35.2%] DIST[+54.3% +54.3% +54.3% +0.0%]
   marginal: ATK +4.8% · SPD +4.8% · DEF +5.0% · HP +2.4% | espelhos: ATK 13.9s, DEF 125.0s, SPD 13.9s, DIST 25.0s
d60 (k=8.0, J=7.35s) ATK[+0.0% +0.0% +0.0% +0.0%] DEF[+0.0% +0.0% -0.0% +0.0%] SPD[+0.0% +0.0% +0.0% +0.0%] DIST[+0.0% +0.0% +0.0% +0.0%]
   marginal: ATK +6.3% · SPD +6.7% · DEF +7.1% · HP +2.0% | espelhos: ATK 25.0s, DEF 28.7s, SPD 25.0s, DIST 25.0s
gap máx +54.3% (d45 DIST×ATK) -> FATAL · marginal mín +2.0% (d60/hp) -> FATAL · DEF puro máx 125.0s -> FATAL

## F-3 Régua ΔTTK (fracionário, determinística; buffs: tolerância −15%/+5% só no d0, ±5% nos demais)
família | p | pior Δ (célula) | dentro/20 | sem disparo | veredito
direto | 1 | +0.0% (-) | 20/20 | 0 | PASS
direto2 | 1 | +0.0% (-) | 20/20 | 0 | PASS
dot | 1 | -0.5% (d21/DEF) | 20/20 | 0 | PASS
cura | {"0":0.77,"1":0.96,"3":0.96,"4":0.96} | +0.0% (-) | 20/20 | 0 | PASS
escudo | {"0":0.77,"1":0.96,"3":0.96,"4":0.96} | +0.0% (-) | 20/20 | 0 | PASS
buffAtkN | 0.68 | -13.3% (d0/ATK) | 15/20 | 0 | FATAL: família=buffAtkN
debuffDefN | 0.68 | -13.3% (d0/ATK) | 15/20 | 0 | FATAL: família=debuffDefN
buffSpdN | 1.58 | -14.5% (d0/ATK) | 18/20 | 0 | FATAL: família=buffSpdN
prova de vermelho: dot p=1 -> 20/20 PASS; p×1,5=1.5 -> 16/20, pior +13.8% (d7/DEF) -> REPROVA: família=dot

## F-4 Energia (+60×fração causada +60×fração recebida +2/s, dispara a 100): 64000/64000 lutas com especial nos dois lados -> PASS

## F-5 Constantes finais (para o núcleo TS)
constante | valor
CURVA | golpes = HP×(1+DEF/k)/(1+ATK/k), fracionário no TTK; exibição = round
K | 8 fixo; valores por estágio: VAR A (ver cabeçalho)
ESTÁGIO | s = nº de EVO_AT [4,9,14,59] alcançados; base A: ceil(1,5^s) / HP ceil(10·1,5^s)
RITMO | 9×(1+SPD/k)/(1+1/k) ataques por janela
JANELA | J(d) = 25 × ritmo(SPD_ref) ÷ golpes(ref,ref), ref = DIST do mesmo estágio/dias; contínua por dia:
  d0=22.50 d1=25.00 d2=27.78 d3=25.00 d4=16.67 d5=18.33 d6=20.17 d7=18.33 d8=17.19 d9=11.96 d10=13.04 d11=14.23 d12=13.04 d13=12.50 d14=8.82 d15=9.56 d16=10.36 d17=9.56 d18=9.29 d19=10.00 d20=10.77 d21=10.00 d22=9.72 d23=10.42 d24=11.16 d25=10.42 d26=10.14 d27=10.81 d28=11.53 d29=10.81 d30=10.53 d31=11.18 d32=11.88 d33=11.18 d34=10.90 d35=11.54 d36=12.22 d37=11.54 d38=11.25 d39=11.88 d40=12.53 d41=11.88 d42=11.59 d43=12.20 d44=12.84 d45=12.20 d46=11.90 d47=12.50 d48=13.13 d49=12.50 d50=12.21 d51=12.79 d52=13.40 d53=12.79 d54=12.50 d55=13.07 d56=13.66 d57=13.07 d58=12.78 d59=6.86 d60=7.35
E | 3 golpes
ENERGIA | +60×fração de HP causada, +60×fração recebida, +2/s, dispara a 100
P_direto | 1
P_direto2 | 1
P_dot | 1
P_cura | estágio 0=0.77, estágio 1=0.96, estágio 3=0.96, estágio 4=0.96
P_escudo | estágio 0=0.77, estágio 1=0.96, estágio 3=0.96, estágio 4=0.96
P_buffAtkN | 0.68
P_debuffDefN | 0.68
P_buffSpdN | 1.58
CRESCIMENTO | +1/dia que conta no estágio; 4º → HP; evolução: base do estágio seguinte (VAR); pontos = min(perfectDays, required)

## RE-ESCALA [VAR A]: NÃO — FATAL em: gap, marginal, defDur, familias
```

### VAR B
```
## S-1 [VAR B] Exemplos do dono no d0 (golpes de exibição = round): 10/9/11 (alvo 10/9/11) -> PASS

## F-2 Matriz de gap (linha vence coluna; ordem ATK DEF SPD DIST), marginal (+1 no DIST, % do TTK) e duração do espelho (janela normalizada)
d0 (k=8.0, J=22.50s) ATK[+0.0% +0.0% +0.0% +0.0%] DEF[+0.0% +0.0% +0.0% +0.0%] SPD[+0.0% +0.0% +0.0% +0.0%] DIST[+0.0% +0.0% +0.0% +0.0%]
   marginal: ATK +10.0% · SPD +10.0% · DEF +11.1% · HP +10.0% | espelhos: ATK 25.0s, DEF 25.0s, SPD 25.0s, DIST 25.0s
d7 (k=8.0, J=17.65s) ATK[+0.0% +0.0% +0.0% -1.6%] DEF[+0.0% +0.0% +0.0% -1.6%] SPD[+0.0% +0.0% +0.0% -1.6%] DIST[+1.6% +1.6% +1.6% +0.0%]
   marginal: ATK +7.7% · SPD +7.7% · DEF +8.3% · HP +5.9% | espelhos: ATK 17.6s, DEF 51.0s, SPD 17.6s, DIST 25.0s
d21 (k=8.0, J=14.53s) ATK[+0.0% +0.0% +0.0% -34.1%] DEF[+0.0% +0.0% +0.0% -34.1%] SPD[+0.0% +0.0% +0.0% -34.1%] DIST[+51.7% +51.7% +51.7% +0.0%]
   marginal: ATK +3.8% · SPD +4.5% · DEF +4.8% · HP +2.3% | espelhos: ATK 14.5s, DEF 159.0s, SPD 14.5s, DIST 25.0s
d45 (k=8.0, J=15.82s) ATK[+0.0% +0.0% +0.0% -54.4%] DEF[+0.0% +0.0% +0.0% -54.4%] SPD[-0.0% -0.0% +0.0% -54.4%] DIST[+119.2% +119.2% +119.2% +0.0%]
   marginal: ATK +3.1% · SPD +3.6% · DEF +3.7% · HP +2.0% | espelhos: ATK 12.7s, DEF 279.7s, SPD 12.7s, DIST 25.0s
d60 (k=8.0, J=15.63s) ATK[+0.0% +0.0% -0.0% -68.3%] DEF[+0.0% +0.0% +0.0% -68.3%] SPD[+0.0% +0.0% +0.0% -68.3%] DIST[+215.7% +215.7% +215.7% +0.0%]
   marginal: ATK +2.0% · SPD +2.4% · DEF +2.4% · HP +1.2% | espelhos: ATK 12.0s, DEF 507.8s, SPD 12.0s, DIST 25.0s
gap máx +215.7% (d60 DIST×ATK) -> FATAL · marginal mín +1.2% (d60/hp) -> FATAL · DEF puro máx 507.8s -> FATAL

## F-3 Régua ΔTTK (fracionário, determinística; buffs: tolerância −15%/+5% só no d0, ±5% nos demais)
família | p | pior Δ (célula) | dentro/20 | sem disparo | veredito
direto | 1 | +0.0% (-) | 20/20 | 0 | PASS
direto2 | 1 | -7.1% (d7/ATK) | 18/20 | 0 | FATAL: família=direto2
dot | 1.52 | +8.0% (d7/SPD) | 15/20 | 0 | FATAL: família=dot
cura | {"0":0.77,"1":0.96,"3":1,"4":0.98} | +0.0% (-) | 20/20 | 0 | PASS
escudo | {"0":0.77,"1":0.96,"3":1,"4":0.98} | +0.0% (-) | 20/20 | 0 | PASS
buffAtkN | 0.39 | -23.5% (d0/ATK) | 8/20 | 0 | FATAL: família=buffAtkN
debuffDefN | 0.39 | -23.5% (d0/ATK) | 8/20 | 0 | FATAL: família=debuffDefN
buffSpdN | 0.99 | -18.8% (d7/ATK) | 14/20 | 0 | FATAL: família=buffSpdN
prova de vermelho: cura p=[object Object] -> 20/20 PASS; p×1,5=NaN -> 8/20, pior +21.1% (d7/ATK) -> REPROVA: família=cura

## F-4 Energia (+60×fração causada +60×fração recebida +2/s, dispara a 100): 64000/64000 lutas com especial nos dois lados -> PASS

## F-5 Constantes finais (para o núcleo TS)
constante | valor
CURVA | golpes = HP×(1+DEF/k)/(1+ATK/k), fracionário no TTK; exibição = round
K | 8 fixo; valores por estágio: VAR B (ver cabeçalho)
ESTÁGIO | s = nº de EVO_AT [4,9,14,59] alcançados; base A: ceil(1,5^s) / HP ceil(10·1,5^s)
RITMO | 9×(1+SPD/k)/(1+1/k) ataques por janela
JANELA | J(d) = 25 × ritmo(SPD_ref) ÷ golpes(ref,ref), ref = DIST do mesmo estágio/dias; contínua por dia:
  d0=22.50 d1=25.00 d2=27.78 d3=25.00 d4=16.18 d5=17.65 d6=19.25 d7=17.65 d8=16.67 d9=14.81 d10=15.74 d11=16.87 d12=15.74 d13=15.18 d14=13.69 d15=14.29 d16=15.04 d17=14.29 d18=13.95 d19=14.53 d20=15.26 d21=14.53 d22=14.20 d23=14.77 d24=15.48 d25=14.77 d26=14.44 d27=15.00 d28=15.68 d29=15.00 d30=14.67 d31=15.22 d32=15.88 d33=15.22 d34=14.89 d35=15.43 d36=16.07 d37=15.43 d38=15.10 d39=15.63 d40=16.25 d41=15.63 d42=15.31 d43=15.82 d44=16.42 d45=15.82 d46=15.50 d47=16.00 d48=16.59 d49=16.00 d50=15.69 d51=16.18 d52=16.75 d53=16.18 d54=15.87 d55=16.35 d56=16.91 d57=16.35 d58=16.04 d59=15.31 d60=15.63
E | 3 golpes
ENERGIA | +60×fração de HP causada, +60×fração recebida, +2/s, dispara a 100
P_direto | 1
P_direto2 | 1
P_dot | 1.52
P_cura | estágio 0=0.77, estágio 1=0.96, estágio 3=1, estágio 4=0.98
P_escudo | estágio 0=0.77, estágio 1=0.96, estágio 3=1, estágio 4=0.98
P_buffAtkN | 0.39
P_debuffDefN | 0.39
P_buffSpdN | 0.99
CRESCIMENTO | +1/dia que conta no estágio; 4º → HP; evolução: base do estágio seguinte (VAR); pontos = min(perfectDays, required)

## RE-ESCALA [VAR B]: NÃO — FATAL em: gap, marginal, defDur, familias, direto2
```
