# Story PR1 — Núcleo puro do combate v3 (sem UI)
**Objetivo:** módulo puro `src/utils/combate/` com as regras validadas pelo spike, travadas por vitest. Nenhuma tela ou motor existente muda (Arena/Masmorra/PvP seguem nos motores atuais até os PRs seguintes).

**Constantes e regras** (fonte: `prototyper/spike-sistema.md` + `spike-variancia.md`, scripts cv3-sim5/6 no scratchpad `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\`):
- Curva: `golpes = HP·(1+DEF/8)/(1+ATK/8)`, fracionária; a exibição arredonda (`round`).
- Ritmo: `9·(1+SPD/8)/(1+1/8)` ataques por janela.
- Level:
  - teto por estágio derivado de `FORM_REQUIREMENTS.cap` (acumulado 6/13/21/30/40);
  - 1 ponto por level, só em ATK/DEF/SPD;
  - distribuição pelo galho com teto de 45% e piso de 15% por atributo;
  - base do estágio `ceil(1,5^s)`;
  - HP automático `10·1,5^s·(1+L/10)`.
- Bônus: `min(soma(talento, equipamento, comércio, renascimento), 5%)`, não empilhável.
- Energia: 60×fração de HP causada, 60×fração recebida, +2/s, dispara a 100. E = 3 golpes.
- Especiais, p por família: direto 1, dot 1 (respeita DEF; o que sobra expira), cura 1, escudo 1, buffAtk 1,01, debuffDef 1,01, buffSpd 1,82.
- Variância: AR(1) por golpe, ρ=0,9, σ=0,15. RNG mulberry32 com seed por luta e stream por lado. Conformidade: `mulberry32(42)` → 0.601104, 0.448291, 0.852466.
- Empate é resultado válido.

**Critérios de aceite (vitest):**
1. Exemplos do dono no d0: 10/9/11 golpes exibidos.
2. Gap entre builds ≤10% (TTK médio).
3. +1 level ≥2% do TTK.
4. DEF puro P95 ≤40 s.
5. Régua pareada (mesma seed, média de N seeds, HP×3): 7 famílias ±5%; buffs −15% tolerado no rookie.
6. Teto de bônus pela razão das médias ≤5%+tol.
7. Mais fraco por 5% vence entre 25–40% (IC95).
8. Determinismo: mesma seed → mesma luta.
9. **Prova de vermelho** de cada assertiva nova (comentário + teste que mostra a reprovação).
10. Amostra declarada (V1): a lista de famílias e builds vem do módulo, não de uma lista do teste.
- Tolerância e N declarados no teste. Tempo de suíte ≤ ~20 s (use N menor no CI se preciso, declarado).

**Não-objetivos:** UI, save, motores existentes, `_duel.js`, talentos, equipamento, nome do especial.
