# Spike L1 — cv3-sim2 (Fase 1 Prototyper, run combate-v3-01)

Script: `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim2.mjs` (fora do repo). `node cv3-sim2.mjs [--noise-regua] [--extra]`.

## Premissa: **NÃO**
"Todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp" — reprova nas três frentes: 6/6 famílias FAIL, 4 células NÃO MEDIDO (ATK puro d7+), dominância 50–100pp a partir do dia 7.

## Suposições rotuladas
JANELA 22,5 s (SPD1 = 2,5 s) · piso 3 · evo nos dias 7/21/45 (SUPOSIÇÃO) · HP no dia 4,8,12…, demais dias no galho (DIST roda atk→spd→def) · E = 3 golpes · energia +U[20,30]/golpe próprio, dispara a 100 · DoT 3 ticks a cada 0,25 intervalo, ignora DEF (`max(3, hp−atk)`), resto expira · buff ATK/debuff DEF X = ceil(25% de hp+def−atk), buff SPD X = 8+spd (ritmo ×2), duração = p intervalos próprios · cura/escudo = p·E golpes do inimigo, cura limitada ao HP faltante · desempate = mais % HP, depois seed · espelho: A (família X) vs B (direto), mesmo build; ambos têm especial.

## Parâmetros "calibrados" (melhor escalar único; NENHUM passa — não virar constante)
| família | parâmetro | valor (sem ruído) | valor (régua com ±25%) | pior Δpp | célula |
|---|---|---|---|---|---|
| direto (ref) | p (× E) | 1 | 1 | −1,8 (controle) | d21/DIST |
| dot | p (× E total) | 0,92 | 0,93 | +50,0 | d7/DEF |
| cura | p (× E) | 1,01 | 1,03 | +21,8 / +17,1 | d21/SPD / d60/DEF |
| escudo | p (× E) | 1,01 | 1,03 | +21,8 / +17,4 | d21/SPD / d60/DEF |
| buffAtk | duração (intervalos) | 7,3 | 7,3 | −50,0 / −44,4 | d0/ATK / d0/DIST |
| buffSpd | duração (intervalos) | 1,5 | 1,5 | −50,0 | d7/SPD / d45/DEF |
| debuffDef | duração (intervalos) | 7,3 | 7,3 | −50,0 / −44,4 | d0/ATK / d0/DIST |

## O que não fechou (causas)
1. **Win rate no espelho é função degrau.** Luta determinística + fase aleatória: qualquer vantagem de fração de golpe vira 0% ou 100% (§7: dot 0,6→0,8 leva win de 52% a 98%; buffSpd 1,5→2 leva de 0% a 92%). Janela de ±5pp ≈ ±2% no parâmetro, e o ±25% de ruído alarga pouco.
2. **Um escalar por família não serve para todos os builds.** O valor relativo depende do build: DoT ignora DEF → +50pp no DEF puro e −50pp no SPD puro com o mesmo p. Seria preciso parâmetro por contexto (por razão def/hp, spd) — vira fórmula, não constante.
3. **Paridade vazia (V1):** ATK puro d21/45/60 = 3 golpes (piso), luta de 4–6 s, especial dispara em 0% (d7: 75,9%). NÃO MEDIDO nas 6 famílias.
4. **Dominância:** espalhamento máx 100pp. ATK puro vs DIST: d0 48%, d7 0%, d21 1%, d45 100%, d60 100% (com ±25%: 3/4/96/100). DEF puro perde sempre (0%), luta de espelho DEF d60 = 142 golpes / ~246 s. Piso 3 + evo ×1,5 fazem ATK quebrar a escada a partir do dia 45.
5. **Vantagem elemental ±1 golpe** no espelho base sem especial = 100% de vitória para quem a tem (degrau de novo).
6. Ruído ±25% (camadas): inverte o sinal médio de cura e escudo (Σ +0,91 → −1,66), não das demais — a paridade dessas duas é frágil às camadas.
7. Prova de vermelho: baseline direto vs direto PASS (−1,8pp); direto p=1,3 → REPROVA nomeada (+50pp d7/SPD). Gate detecta.

## O que fecharia (para o dono / architect)
- Régua: trocar win rate do espelho (degrau) por **Δ tempo-para-vencer ±5%** ou por win rate com ruído de camadas ligado e N grande — decisão do dono (F1).
- Teto/curva para ATK (piso 3 é atingido no d21 pelo ATK puro): DR em `atk` ou piso proporcional ao HP.
- Parâmetro de especial por fórmula de contexto (fração do HP do alvo em vez de golpes; DoT respeitando DEF parcial).
- Energia também ao receber golpe, para o especial disparar em luta de 3 golpes.

---
## SAÍDA REAL 1 — `node cv3-sim2.mjs --extra` (régua sem ruído; exit 1)
```
## 0. Sanidade das regras
golpes base espelho 1/1/1/10 = 10 (10) | ATK13 vs base = 3 (piso 3) | vantagem elemental +1: 9 / -1: 11
Crescimento (dia 4,8,... -> HP; evo x1.5 ceil nos dias 7,21,45 = SUPOSIÇÃO):
  d 0 ATK  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 DEF  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 SPD  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 DIST atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 7 ATK  atk/def/spd/hp = 11/2/2/17  golpes espelho = 8  ataques/janela = 10  luta espelho ~18.0s
  d 7 DEF  atk/def/spd/hp = 2/11/2/17  golpes espelho = 26  ataques/janela = 10  luta espelho ~58.5s
  d 7 SPD  atk/def/spd/hp = 2/2/11/17  golpes espelho = 17  ataques/janela = 19  luta espelho ~20.1s
  d 7 DIST atk/def/spd/hp = 5/5/5/17  golpes espelho = 17  ataques/janela = 13  luta espelho ~29.4s
  d21 ATK  atk/def/spd/hp = 32/3/3/32  golpes espelho = 3  ataques/janela = 11  luta espelho ~6.1s
  d21 DEF  atk/def/spd/hp = 3/32/3/32  golpes espelho = 61  ataques/janela = 11  luta espelho ~124.8s
  d21 SPD  atk/def/spd/hp = 3/3/32/32  golpes espelho = 32  ataques/janela = 40  luta espelho ~18.0s
  d21 DIST atk/def/spd/hp = 14/12/12/32  golpes espelho = 30  ataques/janela = 20  luta espelho ~33.8s
  d45 ATK  atk/def/spd/hp = 75/5/5/57  golpes espelho = 3  ataques/janela = 13  luta espelho ~5.2s
  d45 DEF  atk/def/spd/hp = 5/75/5/57  golpes espelho = 127  ataques/janela = 13  luta espelho ~219.8s
  d45 SPD  atk/def/spd/hp = 5/5/75/57  golpes espelho = 57  ataques/janela = 83  luta espelho ~15.5s
  d45 DIST atk/def/spd/hp = 30/27/27/57  golpes espelho = 54  ataques/janela = 35  luta espelho ~34.7s
  d60 ATK  atk/def/spd/hp = 86/5/5/61  golpes espelho = 3  ataques/janela = 13  luta espelho ~5.2s
  d60 DEF  atk/def/spd/hp = 5/86/5/61  golpes espelho = 142  ataques/janela = 13  luta espelho ~245.8s
  d60 SPD  atk/def/spd/hp = 5/5/86/61  golpes espelho = 61  ataques/janela = 94  luta espelho ~14.6s
  d60 DIST atk/def/spd/hp = 33/31/31/61  golpes espelho = 59  ataques/janela = 39  luta espelho ~34.0s
vantagem elemental ±1 no espelho base (sem especial): A com vantagem vence 100.0%

## 1. Calibração (grade+refino, 300 seeds, objetivo = pior |wr-50%| nas células medidas)
  dot: p = 0.92
  cura: p = 1.01
  escudo: p = 1.01
  buffAtk: p = 7.3
  buffSpd: p = 1.5
  debuffDef: p = 7.3

## 2. Verificação N=1000 seeds/célula — A (família X) vs B (direto), espelho de build
família | dia | build | win% A | Δpp | disparou% | empate-tick% | t vitória A (s) | HP final vencedor A | veredito
dot | 0 | ATK | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | DEF | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | SPD | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | DIST | 49.7 | -0.3 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 7 | ATK | 26.6 | -23.4 | 75.9 | 0.0 | 9.9 | 0.30 | NÃO MEDIDO (V1)
dot | 7 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 28.8 | 0.19 | FAIL
dot | 7 | SPD | 50.1 | +0.1 | 100.0 | 0.0 | 12.3 | 0.06 | PASS
dot | 7 | DIST | 100.0 | +50.0 | 100.0 | 0.0 | 16.5 | 0.09 | FAIL
dot | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
dot | 21 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 54.2 | 0.27 | FAIL
dot | 21 | SPD | 49.0 | -1.0 | 100.0 | 0.0 | 10.9 | 0.03 | PASS
dot | 21 | DIST | 100.0 | +50.0 | 100.0 | 0.0 | 18.1 | 0.11 | FAIL
dot | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
dot | 45 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 84.2 | 0.34 | FAIL
dot | 45 | SPD | 29.6 | -20.4 | 100.0 | 0.0 | 8.8 | 0.04 | FAIL
dot | 45 | DIST | 100.0 | +50.0 | 100.0 | 0.0 | 15.7 | 0.23 | FAIL
dot | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
dot | 60 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 91.3 | 0.36 | FAIL
dot | 60 | SPD | 44.3 | -5.7 | 100.0 | 0.0 | 8.6 | 0.02 | FAIL
dot | 60 | DIST | 100.0 | +50.0 | 100.0 | 0.0 | 14.4 | 0.28 | FAIL
cura | 0 | ATK | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | DEF | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | SPD | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | DIST | 50.1 | +0.1 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 7 | ATK | 62.1 | +12.1 | 75.9 | 0.0 | 16.7 | 0.31 | NÃO MEDIDO (V1)
cura | 7 | DEF | 50.9 | +0.9 | 100.0 | 0.0 | 57.3 | 0.04 | PASS
cura | 7 | SPD | 51.0 | +1.0 | 100.0 | 0.0 | 19.5 | 0.14 | PASS
cura | 7 | DIST | 53.6 | +3.6 | 100.0 | 0.0 | 28.4 | 0.13 | PASS
cura | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
cura | 21 | DEF | 49.9 | -0.1 | 100.0 | 0.0 | 123.7 | 0.04 | PASS
cura | 21 | SPD | 71.8 | +21.8 | 100.0 | 0.0 | 17.7 | 0.07 | FAIL
cura | 21 | DIST | 51.6 | +1.6 | 100.0 | 0.0 | 33.1 | 0.04 | PASS
cura | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
cura | 45 | DEF | 62.8 | +12.8 | 100.0 | 0.0 | 218.9 | 0.02 | FAIL
cura | 45 | SPD | 50.8 | +0.8 | 100.0 | 0.0 | 15.3 | 0.04 | PASS
cura | 45 | DIST | 52.0 | +2.0 | 100.0 | 0.0 | 34.4 | 0.03 | PASS
cura | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
cura | 60 | DEF | 63.1 | +13.1 | 100.0 | 0.0 | 244.9 | 0.02 | FAIL
cura | 60 | SPD | 52.7 | +2.7 | 100.0 | 0.0 | 14.5 | 0.04 | PASS
cura | 60 | DIST | 70.6 | +20.6 | 100.0 | 0.0 | 33.7 | 0.03 | FAIL
escudo | 0 | ATK | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | DEF | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | SPD | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | DIST | 50.1 | +0.1 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 7 | ATK | 62.1 | +12.1 | 75.9 | 0.0 | 16.7 | 0.10 | NÃO MEDIDO (V1)
escudo | 7 | DEF | 50.9 | +0.9 | 100.0 | 0.0 | 57.3 | 0.04 | PASS
escudo | 7 | SPD | 51.0 | +1.0 | 100.0 | 0.0 | 19.5 | 0.06 | PASS
escudo | 7 | DIST | 53.6 | +3.6 | 100.0 | 0.0 | 28.4 | 0.06 | PASS
escudo | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
escudo | 21 | DEF | 49.9 | -0.1 | 100.0 | 0.0 | 123.7 | 0.02 | PASS
escudo | 21 | SPD | 71.8 | +21.8 | 100.0 | 0.0 | 17.7 | 0.03 | FAIL
escudo | 21 | DIST | 51.6 | +1.6 | 100.0 | 0.0 | 33.1 | 0.03 | PASS
escudo | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
escudo | 45 | DEF | 62.8 | +12.8 | 100.0 | 0.0 | 218.9 | 0.01 | FAIL
escudo | 45 | SPD | 50.8 | +0.8 | 100.0 | 0.0 | 15.3 | 0.02 | PASS
escudo | 45 | DIST | 52.0 | +2.0 | 100.0 | 0.0 | 34.4 | 0.02 | PASS
escudo | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
escudo | 60 | DEF | 66.3 | +16.3 | 100.0 | 0.0 | 244.9 | 0.01 | FAIL
escudo | 60 | SPD | 52.7 | +2.7 | 100.0 | 0.0 | 14.5 | 0.02 | PASS
escudo | 60 | DIST | 70.6 | +20.6 | 100.0 | 0.0 | 33.7 | 0.02 | FAIL
buffAtk | 0 | ATK | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
buffAtk | 7 | DEF | 23.3 | -26.7 | 100.0 | 0.0 | 36.7 | 0.04 | FAIL
buffAtk | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 7 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 21 | DEF | 83.5 | +33.5 | 100.0 | 0.0 | 71.3 | 0.04 | FAIL
buffAtk | 21 | SPD | 1.0 | -49.0 | 100.0 | 0.0 | 10.9 | 0.03 | FAIL
buffAtk | 21 | DIST | 0.7 | -49.3 | 100.0 | 0.0 | 19.5 | 0.03 | FAIL
buffAtk | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 45 | DEF | 85.4 | +35.4 | 100.0 | 0.0 | 124.0 | 0.03 | FAIL
buffAtk | 45 | SPD | 29.9 | -20.1 | 100.0 | 0.0 | 8.8 | 0.05 | FAIL
buffAtk | 45 | DIST | 70.1 | +20.1 | 100.0 | 0.0 | 20.2 | 0.03 | FAIL
buffAtk | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 60 | DEF | 99.2 | +49.2 | 100.0 | 0.0 | 137.4 | 0.03 | FAIL
buffAtk | 60 | SPD | 83.8 | +33.8 | 100.0 | 0.0 | 8.3 | 0.04 | FAIL
buffAtk | 60 | DIST | 40.4 | -9.6 | 100.0 | 0.0 | 19.7 | 0.02 | FAIL
buffSpd | 0 | ATK | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | DEF | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | SPD | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | DIST | 6.1 | -43.9 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
buffSpd | 7 | DEF | 3.9 | -46.1 | 100.0 | 0.0 | 37.2 | 0.04 | FAIL
buffSpd | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 7 | DIST | 0.4 | -49.6 | 100.0 | 0.0 | 18.3 | 0.06 | FAIL
buffSpd | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 21 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 21 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 21 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 45 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 60 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | ATK | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
debuffDef | 7 | DEF | 23.3 | -26.7 | 100.0 | 0.0 | 36.7 | 0.04 | FAIL
debuffDef | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 7 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 21 | DEF | 83.5 | +33.5 | 100.0 | 0.0 | 71.3 | 0.04 | FAIL
debuffDef | 21 | SPD | 1.0 | -49.0 | 100.0 | 0.0 | 10.9 | 0.03 | FAIL
debuffDef | 21 | DIST | 0.7 | -49.3 | 100.0 | 0.0 | 19.5 | 0.03 | FAIL
debuffDef | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 45 | DEF | 85.4 | +35.4 | 100.0 | 0.0 | 124.0 | 0.03 | FAIL
debuffDef | 45 | SPD | 29.9 | -20.1 | 100.0 | 0.0 | 8.8 | 0.05 | FAIL
debuffDef | 45 | DIST | 70.1 | +20.1 | 100.0 | 0.0 | 20.2 | 0.03 | FAIL
debuffDef | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 60 | DEF | 99.2 | +49.2 | 100.0 | 0.0 | 137.4 | 0.03 | FAIL
debuffDef | 60 | SPD | 83.8 | +33.8 | 100.0 | 0.0 | 8.3 | 0.04 | FAIL
debuffDef | 60 | DIST | 40.4 | -9.6 | 100.0 | 0.0 | 19.7 | 0.02 | FAIL
controle direto vs direto: pior |Δ| = 1.8pp (ruído do método com N=1000)

## 3. Resumo por família (pior caso entre células medidas)
família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito
REPROVA: família=dot pior Δ=50.0pp em d7/DEF
dot | 0.92 | +50.0 (d7/DEF) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 26.7 | 0.15 | FAIL
REPROVA: família=cura pior Δ=21.8pp em d21/SPD
cura | 1.01 | +21.8 (d21/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 58.5 | 0.06 | FAIL
REPROVA: família=escudo pior Δ=21.8pp em d21/SPD
escudo | 1.01 | +21.8 (d21/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 58.5 | 0.04 | FAIL
REPROVA: família=buffAtk pior Δ=-50.0pp em d0/ATK
buffAtk | 7.3 | -50.0 (d0/ATK) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL
REPROVA: família=buffSpd pior Δ=-50.0pp em d7/SPD
buffSpd | 1.5 | -50.0 (d7/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL
REPROVA: família=debuffDef pior Δ=-50.0pp em d0/ATK
debuffDef | 7.3 | -50.0 (d0/ATK) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL

## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=1000
dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor
0 | 48.4% | 48.4% | 48.4% | 1.6 | 10 | 7
7 | 0.0% | 0.0% | 42.7% | 50.0 FAIL | 11 | 8
21 | 1.1% | 0.0% | 48.9% | 50.0 FAIL | 12 | 8
45 | 100.0% | 0.0% | 80.0% | 100.0 FAIL | 9 | 6
60 | 100.0% | 0.0% | 4.4% | 100.0 FAIL | 6 | 4
ATK puro vs DIST por dia: d0:48.4% d7:0.0% d21:1.1% d45:100.0% d60:100.0%

## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)
família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?
dot | 50.0 | 50.0 | não (Σ 3.81 -> 3.94)
cura | 21.8 | -18.0 | SIM (Σ 0.91 -> -1.66)
escudo | 21.8 | -16.8 | SIM (Σ 0.95 -> -1.50)
buffAtk | -50.0 | -44.4 | não (Σ -2.78 -> -1.42)
buffSpd | -50.0 | -50.0 | não (Σ -7.68 -> -6.42)
debuffDef | -50.0 | -44.4 | não (Σ -2.78 -> -1.42)

## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): NÃO
  famílias ±5pp nas células medidas: NÃO | células NÃO MEDIDO: SIM | dominância ≤20pp: NÃO (spread máx 100.0pp)

## 6. Prova de vermelho: família "direto" vs referência direto (baseline verde), depois descalibrada p=1.3
direto(p=1): pior Δ=-1.8pp em d21/DIST -> PASS
direto(p=1.3): pior Δ=50.0pp em d7/SPD -> REPROVA: família=direto(p=1.3)

## 7. Forma da curva win%(p) numa célula (d21/DIST, sem ruído e com ±25%) — calibração por célula é possível?
dot: p0.6:51.7/49.0 p0.8:98.0/89.3 p0.9:100.0/96.3 p1:100.0/98.0 p1.1:100.0/100.0 p1.2:100.0/100.0 p1.5:100.0/100.0
cura: p0.6:0.0/0.0 p0.8:0.0/1.0 p0.9:5.3/8.3 p1:40.0/37.7 p1.1:71.7/67.7 p1.2:100.0/86.7 p1.5:100.0/99.7
buffSpd: p0.5:0.0/0.0 p1:0.0/0.0 p1.5:0.0/6.7 p2:92.0/80.3 p3:100.0/100.0 p4:100.0/100.0 p6:100.0/100.0
```

## SAÍDA REAL 2 — `node cv3-sim2.mjs --noise-regua` (régua com ±25%; exit 1), seções 1, 3–5
```
## 1. Calibração (grade+refino, 300 seeds, objetivo = pior |wr-50%| nas células medidas)
  dot: p = 0.93
  cura: p = 1.03
  escudo: p = 1.03
  buffAtk: p = 7.3
  buffSpd: p = 1.5
  debuffDef: p = 7.3

## 3. Resumo por família (pior caso entre células medidas)
família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito
REPROVA: família=dot pior Δ=50.0pp em d7/DEF
dot | 0.93 | +50.0 (d7/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 26.7 | 0.15 | FAIL
REPROVA: família=cura pior Δ=17.1pp em d60/DEF
cura | 1.03 | +17.1 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 58.9 | 0.09 | FAIL
REPROVA: família=escudo pior Δ=17.4pp em d60/DEF
escudo | 1.03 | +17.4 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 58.9 | 0.07 | FAIL
REPROVA: família=buffAtk pior Δ=-44.4pp em d0/DIST
buffAtk | 7.3 | -44.4 (d0/DIST) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 35.2 | 0.04 | FAIL
REPROVA: família=buffSpd pior Δ=-50.0pp em d45/DEF
buffSpd | 1.5 | -50.0 (d45/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | NaN | NaN | FAIL
REPROVA: família=debuffDef pior Δ=-44.4pp em d0/DIST
debuffDef | 7.3 | -44.4 (d0/DIST) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 35.2 | 0.04 | FAIL

## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=1000
dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor
0 | 47.7% | 47.7% | 47.7% | 2.3 | 10 | 6
7 | 3.1% | 7.8% | 54.2% | 51.1 FAIL | 11 | 7
21 | 3.5% | 0.0% | 66.7% | 66.7 FAIL | 12 | 8
45 | 95.5% | 0.0% | 51.8% | 95.5 FAIL | 9 | 5
60 | 100.0% | 0.0% | 9.9% | 100.0 FAIL | 6 | 4
ATK puro vs DIST por dia: d0:47.7% d7:3.1% d21:3.5% d45:95.5% d60:100.0%

## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)
família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?
dot | 50.0 | 50.0 | não (Σ 3.81 -> 4.11)
cura | 17.1 | 17.1 | SIM (Σ 1.94 -> -0.49)
escudo | 17.4 | 17.4 | SIM (Σ 1.98 -> -0.31)
buffAtk | -44.4 | -44.4 | não (Σ -2.78 -> -1.42)
buffSpd | -50.0 | -50.0 | não (Σ -7.68 -> -6.42)
debuffDef | -44.4 | -44.4 | não (Σ -2.78 -> -1.42)

## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): NÃO
  famílias ±5pp nas células medidas: NÃO | células NÃO MEDIDO: SIM | dominância ≤20pp: NÃO (spread máx 100.0pp)
```

---
# Passe 1 (revisão do skeptic, objeções FIXÁVEIS) — regras do dono inalteradas

Mudanças no `cv3-sim2.mjs` (a versão anterior ficou em `cv3-sim2.v0.mjs`):
- (a) DoT usa `golpes()` (respeita DEF); a S7 antiga era artefato.
- (b) S8': buff ATK = meus golpes básicos ×1/(1−0,25); debuff DEF = todo dano recebido pelo alvo ×1/(1−0,25). As duas são invariantes ao build. No espelho são equivalentes, por isso saem iguais.
- (c) `--energy-hit` é uma VARIANTE rotulada: +U[10,15] de energia ao receber golpe.
- (d) P1-d: ΔTTK determinístico, INFORMATIVO, usando o p calibrado pelo win rate. Quem cai continua atacando como "fantasma" até o outro cair.
- (e) P1-e: controle `direto2` (o mesmo E, dividido em 2 golpes de p/2) medido na régua win-rate oficial.
- (f) P1-f: gap de TTK de cada build puro contra o DIST, sem especial.

## Veredito do Passe 1: premissa continua **NÃO**
| família | pior Δpp (oficial, sem ruído) | idem, com energy-hit | idem, régua ±25% | ΔTTK PASS (sem ruído) |
|---|---|---|---|---|
| dot | −20,4 (d45/SPD) | −35,0 | −12,7 | 16/17 (pior −6,1%) |
| cura | +21,8 | +19,7 | +17,1 | 10/17 (+13,3%) |
| escudo | +21,8 | +11,5 | +17,4 | 10/17 |
| buffAtk / debuffDef | −50,0 | −50,0 | +49,1 | 7/17 (−30,8%) |
| buffSpd | −50,0 | −50,0 | −50,0 | 0/17 (−25%) |
| **controle direto2** | **−15,7 REPROVA** | −29,3 REPROVA | −6,6 REPROVA | 17/17 PASS |

O mesmo orçamento, só dividido em dois golpes, já reprova na régua win-rate e passa na ΔTTK. Conclusão: **a régua win-rate do espelho é degrau por construção.**

## SAÍDA REAL P1-A — `node cv3-sim2.mjs` (exit 1)
```
## 0. Sanidade das regras
golpes base espelho 1/1/1/10 = 10 (10) | ATK13 vs base = 3 (piso 3) | vantagem elemental +1: 9 / -1: 11
Crescimento (dia 4,8,... -> HP; evo x1.5 ceil nos dias 7,21,45 = SUPOSIÇÃO):
  d 0 ATK  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 DEF  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 SPD  atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 0 DIST atk/def/spd/hp = 1/1/1/10  golpes espelho = 10  ataques/janela = 9  luta espelho ~25.0s
  d 7 ATK  atk/def/spd/hp = 11/2/2/17  golpes espelho = 8  ataques/janela = 10  luta espelho ~18.0s
  d 7 DEF  atk/def/spd/hp = 2/11/2/17  golpes espelho = 26  ataques/janela = 10  luta espelho ~58.5s
  d 7 SPD  atk/def/spd/hp = 2/2/11/17  golpes espelho = 17  ataques/janela = 19  luta espelho ~20.1s
  d 7 DIST atk/def/spd/hp = 5/5/5/17  golpes espelho = 17  ataques/janela = 13  luta espelho ~29.4s
  d21 ATK  atk/def/spd/hp = 32/3/3/32  golpes espelho = 3  ataques/janela = 11  luta espelho ~6.1s
  d21 DEF  atk/def/spd/hp = 3/32/3/32  golpes espelho = 61  ataques/janela = 11  luta espelho ~124.8s
  d21 SPD  atk/def/spd/hp = 3/3/32/32  golpes espelho = 32  ataques/janela = 40  luta espelho ~18.0s
  d21 DIST atk/def/spd/hp = 14/12/12/32  golpes espelho = 30  ataques/janela = 20  luta espelho ~33.8s
  d45 ATK  atk/def/spd/hp = 75/5/5/57  golpes espelho = 3  ataques/janela = 13  luta espelho ~5.2s
  d45 DEF  atk/def/spd/hp = 5/75/5/57  golpes espelho = 127  ataques/janela = 13  luta espelho ~219.8s
  d45 SPD  atk/def/spd/hp = 5/5/75/57  golpes espelho = 57  ataques/janela = 83  luta espelho ~15.5s
  d45 DIST atk/def/spd/hp = 30/27/27/57  golpes espelho = 54  ataques/janela = 35  luta espelho ~34.7s
  d60 ATK  atk/def/spd/hp = 86/5/5/61  golpes espelho = 3  ataques/janela = 13  luta espelho ~5.2s
  d60 DEF  atk/def/spd/hp = 5/86/5/61  golpes espelho = 142  ataques/janela = 13  luta espelho ~245.8s
  d60 SPD  atk/def/spd/hp = 5/5/86/61  golpes espelho = 61  ataques/janela = 94  luta espelho ~14.6s
  d60 DIST atk/def/spd/hp = 33/31/31/61  golpes espelho = 59  ataques/janela = 39  luta espelho ~34.0s
vantagem elemental ±1 no espelho base (sem especial): A com vantagem vence 100.0%

## 1. Calibração (grade+refino, 300 seeds, objetivo = pior |wr-50%| nas células medidas)
  dot: p = 1
  cura: p = 1.01
  escudo: p = 1.01
  buffAtk: p = 9.52
  buffSpd: p = 1.5
  debuffDef: p = 9.52

## 2. Verificação N=1000 seeds/célula — A (família X) vs B (direto), espelho de build
família | dia | build | win% A | Δpp | disparou% | empate-tick% | t vitória A (s) | HP final vencedor A | veredito
dot | 0 | ATK | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | DEF | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | SPD | 51.1 | +1.1 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 0 | DIST | 49.7 | -0.3 | 100.0 | 0.0 | 15.8 | 0.10 | PASS
dot | 7 | ATK | 26.6 | -23.4 | 75.9 | 0.0 | 9.9 | 0.30 | NÃO MEDIDO (V1)
dot | 7 | DEF | 44.7 | -5.3 | 100.0 | 0.0 | 35.8 | 0.05 | FAIL
dot | 7 | SPD | 50.1 | +0.1 | 100.0 | 0.0 | 12.3 | 0.06 | PASS
dot | 7 | DIST | 50.0 | +0.0 | 100.0 | 0.0 | 17.9 | 0.06 | PASS
dot | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
dot | 21 | DEF | 44.1 | -5.9 | 100.0 | 0.0 | 73.1 | 0.02 | FAIL
dot | 21 | SPD | 49.0 | -1.0 | 100.0 | 0.0 | 10.9 | 0.03 | PASS
dot | 21 | DIST | 47.5 | -2.5 | 100.0 | 0.0 | 19.5 | 0.04 | PASS
dot | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
dot | 45 | DEF | 34.9 | -15.1 | 100.0 | 0.0 | 125.5 | 0.02 | FAIL
dot | 45 | SPD | 29.6 | -20.4 | 100.0 | 0.0 | 8.8 | 0.04 | FAIL
dot | 45 | DIST | 42.8 | -7.2 | 100.0 | 0.0 | 20.4 | 0.03 | FAIL
dot | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
dot | 60 | DEF | 42.1 | -7.9 | 100.0 | 0.0 | 140.8 | 0.01 | FAIL
dot | 60 | SPD | 44.3 | -5.7 | 100.0 | 0.0 | 8.6 | 0.02 | FAIL
dot | 60 | DIST | 49.7 | -0.3 | 100.0 | 0.0 | 19.8 | 0.02 | PASS
cura | 0 | ATK | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | DEF | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | SPD | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 0 | DIST | 50.1 | +0.1 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
cura | 7 | ATK | 62.1 | +12.1 | 75.9 | 0.0 | 16.7 | 0.31 | NÃO MEDIDO (V1)
cura | 7 | DEF | 50.9 | +0.9 | 100.0 | 0.0 | 57.3 | 0.04 | PASS
cura | 7 | SPD | 51.0 | +1.0 | 100.0 | 0.0 | 19.5 | 0.14 | PASS
cura | 7 | DIST | 53.6 | +3.6 | 100.0 | 0.0 | 28.4 | 0.13 | PASS
cura | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
cura | 21 | DEF | 49.9 | -0.1 | 100.0 | 0.0 | 123.7 | 0.04 | PASS
cura | 21 | SPD | 71.8 | +21.8 | 100.0 | 0.0 | 17.7 | 0.07 | FAIL
cura | 21 | DIST | 51.6 | +1.6 | 100.0 | 0.0 | 33.1 | 0.04 | PASS
cura | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
cura | 45 | DEF | 62.8 | +12.8 | 100.0 | 0.0 | 218.9 | 0.02 | FAIL
cura | 45 | SPD | 50.8 | +0.8 | 100.0 | 0.0 | 15.3 | 0.04 | PASS
cura | 45 | DIST | 52.0 | +2.0 | 100.0 | 0.0 | 34.4 | 0.03 | PASS
cura | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
cura | 60 | DEF | 63.1 | +13.1 | 100.0 | 0.0 | 244.9 | 0.02 | FAIL
cura | 60 | SPD | 52.7 | +2.7 | 100.0 | 0.0 | 14.5 | 0.04 | PASS
cura | 60 | DIST | 70.6 | +20.6 | 100.0 | 0.0 | 33.7 | 0.03 | FAIL
escudo | 0 | ATK | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | DEF | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | SPD | 49.3 | -0.7 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 0 | DIST | 50.1 | +0.1 | 100.0 | 0.0 | 23.5 | 0.08 | PASS
escudo | 7 | ATK | 62.1 | +12.1 | 75.9 | 0.0 | 16.7 | 0.10 | NÃO MEDIDO (V1)
escudo | 7 | DEF | 50.9 | +0.9 | 100.0 | 0.0 | 57.3 | 0.04 | PASS
escudo | 7 | SPD | 51.0 | +1.0 | 100.0 | 0.0 | 19.5 | 0.06 | PASS
escudo | 7 | DIST | 53.6 | +3.6 | 100.0 | 0.0 | 28.4 | 0.06 | PASS
escudo | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
escudo | 21 | DEF | 49.9 | -0.1 | 100.0 | 0.0 | 123.7 | 0.02 | PASS
escudo | 21 | SPD | 71.8 | +21.8 | 100.0 | 0.0 | 17.7 | 0.03 | FAIL
escudo | 21 | DIST | 51.6 | +1.6 | 100.0 | 0.0 | 33.1 | 0.03 | PASS
escudo | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
escudo | 45 | DEF | 62.8 | +12.8 | 100.0 | 0.0 | 218.9 | 0.01 | FAIL
escudo | 45 | SPD | 50.8 | +0.8 | 100.0 | 0.0 | 15.3 | 0.02 | PASS
escudo | 45 | DIST | 52.0 | +2.0 | 100.0 | 0.0 | 34.4 | 0.02 | PASS
escudo | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
escudo | 60 | DEF | 66.3 | +16.3 | 100.0 | 0.0 | 244.9 | 0.01 | FAIL
escudo | 60 | SPD | 52.7 | +2.7 | 100.0 | 0.0 | 14.5 | 0.02 | PASS
escudo | 60 | DIST | 70.6 | +20.6 | 100.0 | 0.0 | 33.7 | 0.02 | FAIL
buffAtk | 0 | ATK | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 0 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
buffAtk | 7 | DEF | 10.5 | -39.5 | 100.0 | 0.0 | 36.8 | 0.04 | FAIL
buffAtk | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 7 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 21 | DEF | 73.8 | +23.8 | 100.0 | 0.0 | 71.9 | 0.03 | FAIL
buffAtk | 21 | SPD | 8.0 | -42.0 | 100.0 | 0.0 | 10.9 | 0.03 | FAIL
buffAtk | 21 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffAtk | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 45 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 120.1 | 0.05 | FAIL
buffAtk | 45 | SPD | 24.6 | -25.4 | 100.0 | 0.0 | 8.8 | 0.04 | FAIL
buffAtk | 45 | DIST | 62.0 | +12.0 | 100.0 | 0.0 | 20.2 | 0.03 | FAIL
buffAtk | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffAtk | 60 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 133.6 | 0.06 | FAIL
buffAtk | 60 | SPD | 75.1 | +25.1 | 100.0 | 0.0 | 8.4 | 0.03 | FAIL
buffAtk | 60 | DIST | 72.0 | +22.0 | 100.0 | 0.0 | 19.5 | 0.02 | FAIL
buffSpd | 0 | ATK | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | DEF | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | SPD | 6.2 | -43.8 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 0 | DIST | 6.1 | -43.9 | 100.0 | 0.0 | 16.7 | 0.10 | FAIL
buffSpd | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
buffSpd | 7 | DEF | 3.9 | -46.1 | 100.0 | 0.0 | 37.2 | 0.04 | FAIL
buffSpd | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 7 | DIST | 0.4 | -49.6 | 100.0 | 0.0 | 18.3 | 0.06 | FAIL
buffSpd | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 21 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 21 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 21 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 45 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 45 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
buffSpd | 60 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
buffSpd | 60 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | ATK | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | DEF | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 0 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 7 | ATK | 0.0 | -50.0 | 75.9 | 0.0 | NaN | NaN | NÃO MEDIDO (V1)
debuffDef | 7 | DEF | 10.5 | -39.5 | 100.0 | 0.0 | 36.8 | 0.04 | FAIL
debuffDef | 7 | SPD | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 7 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 21 | ATK | 49.0 | -1.0 | 0.0 | 0.0 | 4.8 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 21 | DEF | 73.8 | +23.8 | 100.0 | 0.0 | 71.9 | 0.03 | FAIL
debuffDef | 21 | SPD | 8.0 | -42.0 | 100.0 | 0.0 | 10.9 | 0.03 | FAIL
debuffDef | 21 | DIST | 0.0 | -50.0 | 100.0 | 0.0 | NaN | NaN | FAIL
debuffDef | 45 | ATK | 49.4 | -0.6 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 45 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 120.1 | 0.05 | FAIL
debuffDef | 45 | SPD | 24.6 | -25.4 | 100.0 | 0.0 | 8.8 | 0.04 | FAIL
debuffDef | 45 | DIST | 62.0 | +12.0 | 100.0 | 0.0 | 20.2 | 0.03 | FAIL
debuffDef | 60 | ATK | 49.3 | -0.7 | 0.0 | 0.0 | 4.0 | 0.33 | NÃO MEDIDO (V1)
debuffDef | 60 | DEF | 100.0 | +50.0 | 100.0 | 0.0 | 133.6 | 0.06 | FAIL
debuffDef | 60 | SPD | 75.1 | +25.1 | 100.0 | 0.0 | 8.4 | 0.03 | FAIL
debuffDef | 60 | DIST | 72.0 | +22.0 | 100.0 | 0.0 | 19.5 | 0.02 | FAIL
controle direto vs direto: pior |Δ| = 1.8pp (ruído do método com N=1000)

## 3. Resumo por família (pior caso entre células medidas)
família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito
REPROVA: família=dot pior Δ=-20.4pp em d45/SPD
dot | 1 | -20.4 (d45/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 34.8 | 0.05 | FAIL
REPROVA: família=cura pior Δ=21.8pp em d21/SPD
cura | 1.01 | +21.8 (d21/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 58.5 | 0.06 | FAIL
REPROVA: família=escudo pior Δ=21.8pp em d21/SPD
escudo | 1.01 | +21.8 (d21/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | 58.5 | 0.04 | FAIL
REPROVA: família=buffAtk pior Δ=-50.0pp em d0/ATK
buffAtk | 9.52 | -50.0 (d0/ATK) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL
REPROVA: família=buffSpd pior Δ=-50.0pp em d7/SPD
buffSpd | 1.5 | -50.0 (d7/SPD) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL
REPROVA: família=debuffDef pior Δ=-50.0pp em d0/ATK
debuffDef | 9.52 | -50.0 (d0/ATK) | d7/ATK(75.9%) d21/ATK(0.0%) d45/ATK(0.0%) d60/ATK(0.0%) | NaN | NaN | FAIL

## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=1000
dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor
0 | 48.4% | 48.4% | 48.4% | 1.6 | 10 | 7
7 | 0.0% | 0.0% | 42.7% | 50.0 FAIL | 11 | 8
21 | 1.1% | 0.0% | 48.9% | 50.0 FAIL | 12 | 8
45 | 100.0% | 0.0% | 80.0% | 100.0 FAIL | 9 | 6
60 | 100.0% | 0.0% | 4.4% | 100.0 FAIL | 6 | 4
ATK puro vs DIST por dia: d0:48.4% d7:0.0% d21:1.1% d45:100.0% d60:100.0%

## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)
família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?
dot | -20.4 | -14.2 | não (Σ -0.61 -> -0.72)
cura | 21.8 | -18.0 | SIM (Σ 0.91 -> -1.66)
escudo | 21.8 | -16.8 | SIM (Σ 0.95 -> -1.50)
buffAtk | -50.0 | 49.1 | não (Σ -2.64 -> -2.22)
buffSpd | -50.0 | -50.0 | não (Σ -7.68 -> -6.42)
debuffDef | -50.0 | 49.1 | não (Σ -2.64 -> -2.22)

## P1-d Régua alternativa INFORMATIVA: ΔTTK determinístico no espelho (fase=0.5, energia=25/golpe; quem cai continua atacando como fantasma até o outro cair = TTK de cada lado contra o kit inteiro do outro)
Δ = t(A cai)/t(B cai) − 1 (positivo = família X sobrevive mais que o direto); PASS se |Δ| ≤ 5%
família | p | pior Δ (célula) | células PASS/medidas
direto | 1 | 0.0% () | 17/17
direto2 | 1 | 0.0% () | 17/17
dot | 1 | -6.1% (d7/DEF) | 16/17
cura | 1.01 | 13.3% (d7/ATK) | 10/17
escudo | 1.01 | 13.3% (d7/ATK) | 10/17
buffAtk | 9.52 | -30.8% (d7/ATK) | 7/17
buffSpd | 1.5 | -25.0% (d7/ATK) | 0/17
debuffDef | 9.52 | -30.8% (d7/ATK) | 7/17

## P1-e Controle: "direto2" (2 golpes de p/2, 0.5 intervalo de distância) vs direto na régua win-rate oficial, N=1000
  d0/ATK: 51.1%
  d0/DEF: 51.1%
  d0/SPD: 51.1%
  d0/DIST: 49.7%
  d7/DEF: 50.6%
  d7/SPD: 50.1%
  d7/DIST: 50.0%
  d21/DEF: 48.2%
  d21/SPD: 49.0%
  d21/DIST: 47.5%
  d45/DEF: 37.3%
  d45/SPD: 34.3%
  d45/DIST: 48.4%
  d60/DEF: 43.4%
  d60/SPD: 48.8%
  d60/DIST: 49.7%
direto2: pior Δ=-15.7pp em d45/SPD; NÃO MEDIDO=4 -> REPROVA: família=direto2 (mesmo orçamento E) => régua é degrau por construção

## P1-f Gap de TTK (regras do dono, sem especial): TTK(eu derrubo DIST)=golpes×intervalo; gap = TTK(DIST me derruba)/TTK(eu derrubo DIST) − 1 (positivo = build puro vence)
dia | ATK | DEF | SPD
0 | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s)
7 | -2.1% (24.8s vs 24.2s) | -11.5% (45.0s vs 39.8s) | 2.3% (23.7s vs 24.2s)
21 | -3.8% (24.5s vs 23.6s) | -32.9% (83.9s vs 56.3s) | 2.4% (23.1s vs 23.6s)
45 | 32.1% (15.6s vs 20.6s) | -52.0% (136.7s vs 65.6s) | -3.9% (21.4s vs 20.6s)
60 | 83.3% (10.4s vs 19.0s) | -56.3% (150.6s vs 65.8s) | -8.6% (20.8s vs 19.0s)

## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): NÃO
  famílias ±5pp nas células medidas: NÃO | células NÃO MEDIDO: SIM | dominância ≤20pp: NÃO (spread máx 100.0pp)
```

## SAÍDA REAL P1-B — `node cv3-sim2.mjs --energy-hit` (exit 1)
```
## 1. Calibração (grade+refino, 300 seeds, objetivo = pior |wr-50%| nas células medidas)
  dot: p = 1
  cura: p = 1.01
  escudo: p = 1.01
  buffAtk: p = 11.92
  buffSpd: p = 2.51
  debuffDef: p = 11.92

## 2. Verificação N=1000 seeds/célula — A (família X) vs B (direto), espelho de build
família | dia | build | win% A | Δpp | disparou% | empate-tick% | t vitória A (s) | HP final vencedor A | veredito
controle direto vs direto: pior |Δ| = 2.7pp (ruído do método com N=1000)

## 3. Resumo por família (pior caso entre células medidas)
família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito
REPROVA: família=dot pior Δ=-35.0pp em d7/DIST
dot | 1 | -35.0 (d7/DIST) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | 27.7 | 0.09 | FAIL
REPROVA: família=cura pior Δ=19.7pp em d0/DIST
cura | 1.01 | +19.7 (d0/DIST) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | 56.1 | 0.04 | FAIL
REPROVA: família=escudo pior Δ=11.5pp em d7/ATK
escudo | 1.01 | +11.5 (d7/ATK) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | 56.1 | 0.04 | FAIL
REPROVA: família=buffAtk pior Δ=-50.0pp em d0/ATK
buffAtk | 11.92 | -50.0 (d0/ATK) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | NaN | NaN | FAIL
REPROVA: família=buffSpd pior Δ=-50.0pp em d0/ATK
buffSpd | 2.51 | -50.0 (d0/ATK) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | NaN | NaN | FAIL
REPROVA: família=debuffDef pior Δ=-50.0pp em d0/ATK
debuffDef | 11.92 | -50.0 (d0/ATK) | d21/ATK(25.2%) d45/ATK(24.1%) d60/ATK(24.4%) | NaN | NaN | FAIL

## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=1000
dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor
0 | 49.3% | 49.3% | 49.3% | 0.7 | 10 | 5
7 | 99.2% | 4.6% | 9.5% | 94.6 FAIL | 11 | 5
21 | 100.0% | 0.0% | 0.0% | 100.0 FAIL | 12 | 6
45 | 100.0% | 0.0% | 0.0% | 100.0 FAIL | 9 | 3
60 | 100.0% | 0.0% | 0.0% | 100.0 FAIL | 6 | 3
ATK puro vs DIST por dia: d0:49.3% d7:99.2% d21:100.0% d45:100.0% d60:100.0%

## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)
família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?
dot | -35.0 | -37.3 | não (Σ -3.53 -> -3.22)
cura | 19.7 | -19.4 | SIM (Σ 2.41 -> -1.87)
escudo | 11.5 | -21.2 | SIM (Σ 0.24 -> -1.92)
buffAtk | -50.0 | -50.0 | não (Σ 0.01 -> 0.12)
buffSpd | -50.0 | 50.0 | não (Σ 0.55 -> 0.08)
debuffDef | -50.0 | -50.0 | não (Σ 0.01 -> 0.12)

## P1-d Régua alternativa INFORMATIVA: ΔTTK determinístico no espelho (fase=0.5, energia=25/golpe; quem cai continua atacando como fantasma até o outro cair = TTK de cada lado contra o kit inteiro do outro)
Δ = t(A cai)/t(B cai) − 1 (positivo = família X sobrevive mais que o direto); PASS se |Δ| ≤ 5%
família | p | pior Δ (célula) | células PASS/medidas
direto | 1 | 0.0% () | 20/20
direto2 | 1 | -6.3% (d7/DIST) | 18/20
dot | 1 | -28.6% (d7/SPD) | 12/20
cura | 1.01 | 0.8% (d45/DEF) | 20/20
escudo | 1.01 | 40.0% (d45/ATK) | 10/20
buffAtk | 11.92 | 37.1% (d60/DEF) | 6/20
buffSpd | 2.51 | -15.6% (d0/ATK) | 10/20
debuffDef | 11.92 | 37.1% (d60/DEF) | 6/20

## P1-e Controle: "direto2" (2 golpes de p/2, 0.5 intervalo de distância) vs direto na régua win-rate oficial, N=1000
  d0/ATK: 27.1%
  d0/DEF: 27.1%
  d0/SPD: 27.1%
  d0/DIST: 26.1%
  d7/ATK: 50.1%
  d7/DEF: 38.8%
  d7/SPD: 20.7%
  d7/DIST: 20.9%
  d21/DEF: 33.0%
  d21/SPD: 32.0%
  d21/DIST: 46.9%
  d45/DEF: 46.3%
  d45/SPD: 23.5%
  d45/DIST: 45.6%
  d60/DEF: 33.4%
  d60/SPD: 34.1%
  d60/DIST: 49.6%
direto2: pior Δ=-29.3pp em d7/SPD; NÃO MEDIDO=3 -> REPROVA: família=direto2 (mesmo orçamento E) => régua é degrau por construção

## P1-f Gap de TTK (regras do dono, sem especial): TTK(eu derrubo DIST)=golpes×intervalo; gap = TTK(DIST me derruba)/TTK(eu derrubo DIST) − 1 (positivo = build puro vence)
dia | ATK | DEF | SPD
0 | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s)
7 | -2.1% (24.8s vs 24.2s) | -11.5% (45.0s vs 39.8s) | 2.3% (23.7s vs 24.2s)
21 | -3.8% (24.5s vs 23.6s) | -32.9% (83.9s vs 56.3s) | 2.4% (23.1s vs 23.6s)
45 | 32.1% (15.6s vs 20.6s) | -52.0% (136.7s vs 65.6s) | -3.9% (21.4s vs 20.6s)
60 | 83.3% (10.4s vs 19.0s) | -56.3% (150.6s vs 65.8s) | -8.6% (20.8s vs 19.0s)

## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): NÃO
  famílias ±5pp nas células medidas: NÃO | células NÃO MEDIDO: SIM | dominância ≤20pp: NÃO (spread máx 100.0pp)
```

## SAÍDA REAL P1-C — `node cv3-sim2.mjs --noise-regua` (exit 1)
```
## 1. Calibração (grade+refino, 300 seeds, objetivo = pior |wr-50%| nas células medidas)
  dot: p = 1.01
  cura: p = 1.03
  escudo: p = 1.03
  buffAtk: p = 9.52
  buffSpd: p = 1.5
  debuffDef: p = 9.52

## 2. Verificação N=1000 seeds/célula — A (família X) vs B (direto), espelho de build
família | dia | build | win% A | Δpp | disparou% | empate-tick% | t vitória A (s) | HP final vencedor A | veredito
controle direto vs direto: pior |Δ| = 2.4pp (ruído do método com N=1000)

## 3. Resumo por família (pior caso entre células medidas)
família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito
REPROVA: família=dot pior Δ=-12.7pp em d7/DEF
dot | 1.01 | -12.7 (d7/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 35.0 | 0.05 | FAIL
REPROVA: família=cura pior Δ=17.1pp em d60/DEF
cura | 1.03 | +17.1 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 58.9 | 0.09 | FAIL
REPROVA: família=escudo pior Δ=17.4pp em d60/DEF
escudo | 1.03 | +17.4 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 58.9 | 0.07 | FAIL
REPROVA: família=buffAtk pior Δ=49.1pp em d60/DEF
buffAtk | 9.52 | +49.1 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 35.2 | 0.04 | FAIL
REPROVA: família=buffSpd pior Δ=-50.0pp em d45/DEF
buffSpd | 1.5 | -50.0 (d45/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | NaN | NaN | FAIL
REPROVA: família=debuffDef pior Δ=49.1pp em d60/DEF
debuffDef | 9.52 | +49.1 (d60/DEF) | d7/ATK(85.6%) d21/ATK(6.9%) d45/ATK(5.1%) d60/ATK(6.1%) | 35.2 | 0.04 | FAIL

## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=1000
dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor
0 | 47.7% | 47.7% | 47.7% | 2.3 | 10 | 6
7 | 3.1% | 7.8% | 54.2% | 51.1 FAIL | 11 | 7
21 | 3.5% | 0.0% | 66.7% | 66.7 FAIL | 12 | 8
45 | 95.5% | 0.0% | 51.8% | 95.5 FAIL | 9 | 5
60 | 100.0% | 0.0% | 9.9% | 100.0 FAIL | 6 | 4
ATK puro vs DIST por dia: d0:47.7% d7:3.1% d21:3.5% d45:95.5% d60:100.0%

## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)
família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?
dot | -12.7 | -12.7 | não (Σ -0.61 -> -0.23)
cura | 17.1 | 17.1 | SIM (Σ 1.94 -> -0.49)
escudo | 17.4 | 17.4 | SIM (Σ 1.98 -> -0.31)
buffAtk | 49.1 | 49.1 | não (Σ -2.64 -> -2.22)
buffSpd | -50.0 | -50.0 | não (Σ -7.68 -> -6.42)
debuffDef | 49.1 | 49.1 | não (Σ -2.64 -> -2.22)

## P1-d Régua alternativa INFORMATIVA: ΔTTK determinístico no espelho (fase=0.5, energia=25/golpe; quem cai continua atacando como fantasma até o outro cair = TTK de cada lado contra o kit inteiro do outro)
Δ = t(A cai)/t(B cai) − 1 (positivo = família X sobrevive mais que o direto); PASS se |Δ| ≤ 5%
família | p | pior Δ (célula) | células PASS/medidas
direto | 1 | 0.0% () | 17/17
direto2 | 1 | 0.0% () | 17/17
dot | 1.01 | -6.1% (d7/DEF) | 16/17
cura | 1.03 | 13.3% (d7/ATK) | 10/17
escudo | 1.03 | 13.3% (d7/ATK) | 10/17
buffAtk | 9.52 | -30.8% (d7/ATK) | 7/17
buffSpd | 1.5 | -25.0% (d7/ATK) | 0/17
debuffDef | 9.52 | -30.8% (d7/ATK) | 7/17

## P1-e Controle: "direto2" (2 golpes de p/2, 0.5 intervalo de distância) vs direto na régua win-rate oficial, N=1000
  d0/ATK: 49.6%
  d0/DEF: 49.6%
  d0/SPD: 49.6%
  d0/DIST: 49.7%
  d7/DEF: 43.4%
  d7/SPD: 49.3%
  d7/DIST: 50.6%
  d21/DEF: 47.5%
  d21/SPD: 46.1%
  d21/DIST: 49.1%
  d45/DEF: 48.2%
  d45/SPD: 46.4%
  d45/DIST: 45.1%
  d60/DEF: 46.9%
  d60/SPD: 46.3%
  d60/DIST: 49.3%
direto2: pior Δ=-6.6pp em d7/DEF; NÃO MEDIDO=4 -> REPROVA: família=direto2 (mesmo orçamento E) => régua é degrau por construção

## P1-f Gap de TTK (regras do dono, sem especial): TTK(eu derrubo DIST)=golpes×intervalo; gap = TTK(DIST me derruba)/TTK(eu derrubo DIST) − 1 (positivo = build puro vence)
dia | ATK | DEF | SPD
0 | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s) | 0.0% (25.0s vs 25.0s)
7 | -2.1% (24.8s vs 24.2s) | -11.5% (45.0s vs 39.8s) | 2.3% (23.7s vs 24.2s)
21 | -3.8% (24.5s vs 23.6s) | -32.9% (83.9s vs 56.3s) | 2.4% (23.1s vs 23.6s)
45 | 32.1% (15.6s vs 20.6s) | -52.0% (136.7s vs 65.6s) | -3.9% (21.4s vs 20.6s)
60 | 83.3% (10.4s vs 19.0s) | -56.3% (150.6s vs 65.8s) | -8.6% (20.8s vs 19.0s)

## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): NÃO
  famílias ±5pp nas células medidas: NÃO | células NÃO MEDIDO: SIM | dominância ≤20pp: NÃO (spread máx 100.0pp)
```
