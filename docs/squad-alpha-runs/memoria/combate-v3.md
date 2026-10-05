# Memória — Combate v3

## 04/10/2026 · run combate-v3-01 · discovery
### Decisões que valem
- Gatilho do ponto diário: `dayWasPerfect` na virada (`completeDayReached`), nunca o delta de `perfectDays` (sobe com Glitchtama, cai com degeneração). Ver gate.
- O combate hoje são 3 motores (Masmorra/Pesadelo, Arena, PvP `_duel.js`), não um só. Fase 4 = um motor por vez, PvP por último.
### O que o gate matou
- "Paridade de TEMPO" como régua única para cura/escudo/buff (18/32 casos reprovam; ver sim-modelo.md).
- `max(1, hp+def−atk)` sem amortecimento + ×1,5: ATK puro chega ao piso de 1 golpe entre os dias 7 e 17.
### Benchmarks (consultados em 04/10/2026, revalidar em 04/2027)
- DoT ignora DEF (Darkest Dungeon, Slay the Spire). Nome procedural por gramática (Caves of Qud, Borderlands).
- 04/10 checkpoint F0: paridade = win rate no espelho ±5pp; piso 3 golpes; HP por rodízio no 4º dia; camadas fora da régua ±25%; nome sem IA; retroativo por totalPerfectDays.
- 04/10 F1 spike: win-rate no espelho é degrau (controle direto2 reprova −15,7pp, ΔTTK passa 17/17); dominância vem da curva de stats (ATK 6 s, DEF 246 s no d60).
- 04/10 checkpoint F1 (AJUSTAR): régua ΔTTK ±5%; golpes=ceil(HP(1+DEF/k)/(1+ATK/k)); energia por tempo/dano recebido; buff SPD mantido; Q6 especial NOVO por estágio; Glitchtama dá ponto (invariante: mesmo total de pontos por estágio); empate válido. Os defaults anteriores da squad foram rejeitados.
- 04/10 re-spike F1: k=8×nível+round+SPD proporcional equilibra (gap ≤2,4%) e fecha 5 famílias, mas com golpes inteiros +1 ATK/DEF vale ~0% no meio do jogo; Glitchtama: pontos=min(perfectDays,required) mantém o invariante.
- 04/10 F1 final: dano fracionário; buffs −15% no rookie aceitos; DEF tanque teto 40 s; pontos espelham perfectDays.
- 04/10 confirmação F1: NÃO FECHA. Com k∝nível, +1 ponto vale 0,3% no d60 mesmo com dano fracionário; equilíbrio entre builds e valor do ponto são incompatíveis nessa curva.
- 04/10: curva re-escala por estágio; critério do ponto ≥2% do TTK.
- 04/10 re-escala por estágio: NÃO fecha (gap +54% no d45). A causa raiz é o critério de gap com estágio mega longo. Não reabrir curva sem mudar o critério.
- 05/10 VOLTAR à F0, escopo ampliado: level+XP (Soulmon), level do usuário + talentos + gates, equipamento + moeda.
## 05/10/2026 · discovery reaberta (progressão)
- O Vínculo já é o level de usuário (derivado, nunca desce); os invariantes dele proíbem talento numérico e gates: reescrever exige o dono.
- Furo existente: Créditos→Bits→chips de atributo (dinheiro→combate) fora do v3.
- Spike: mult k=8 + X≤0,45 + teto FORM_REQUIREMENTS (6/13/21/30/40): gap e DEF ok, +1 level de HP 1,7% no estágio 4. direto2 −8,3% é artefato da régua em luta curta.
- Equipamento plano estoura (+11% com +1); talento +5% = +5% de gap: os dois só no PvE.
- 05/10 checkpoint D-reaberta: escopo total; X 45%; HP automático por level; level desce exibido neutro; chips só distribuição; Vínculo=level usuário (revoga 2 invariantes); 5% também no PvP (decisão explícita); XP 66/34 sem contagem.
- 05/10 F1 sistema: FECHA com piso 15% + régua pareada + teto global 5% não empilhável. A régua bruta em luta curta mede quem bate primeiro. 5% no PvP = 90% de vitória (IC 89–91) mesmo com ruído ±25%.
- 05/10: 5% PvP mantido (90% na mesa); monetização = acelerar comedido, nunca P2W; range de dano novo.
- 05/10 variância: uniforme por golpe se cancela; AR(1) ρ0,9 σ15 visível dá 31,5% (5%) e ~19% (1 level), DEF P95 39 s. Monetização: dinheiro compra tempo de recurso com teto, nunca stat.
- 05/10: sorte AR(1) aprovada; Créditos→Bits +25% de teto; lootbox em avaliação; Renascimento pago+Vínculo; Comércio dentro do teto. REGISTRO §24 tem adendo pendente (E: cheio).
- 05/10 lootbox: ECA Digital (L15.211/2025, art.20, secundário) proíbe caixa paga com acesso de menores; recomendação (C) loja direta com moeda ganha; (B) reprovada.
- 05/10 dono: equip loja direta sem RNG, só moeda ganha; Créditos só não-combate; ECA aplicável; jurídico = análise interna IA; chips só evolução, legado fica; respec pago; ROLE_SHAPE fica ±25%.
- 05/10 PR1 #221 merged (3f73ef78). Regra: fetch+rebase+recheck antes de todo merge. ClassInd: compra sem checagem de idade => 14 anos (secundário) — conflita com 'Livre'.
- 05/10 PR1b parado: o B1 (energia zera) derruba a torcida normal do PvP de 72,2% para 64,6%; aguardando decisão de calibração. WIP b830e846 local em combate-v3/pr1b.
- 05/10 dono: PvP ~65% aceito; Créditos com verificação de idade/supervisão parental (Livre); maldição/HoT inalcançáveis.
