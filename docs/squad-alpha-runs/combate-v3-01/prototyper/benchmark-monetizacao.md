# Benchmark de monetização: aceleração aceitável × P2W (run combate-v3-01)

Data da coleta: 05/10/2026. Escopo: o que dinheiro acelera, o que nunca compra, proteção do PvP, reação da comunidade, modelos de passe. Não repete `discovery/benchmark.md` nem `benchmark-progressao.md`. 6 buscas + 4 WebFetch (2 falharam: Axios 403, Habitica wiki 402). Sem telemetria do Soulmon: todo número do Soulmon abaixo é `[suposição]` até haver usuário.

## 1. Fontes (credibilidade 0.0-1.0)

| # | Fonte | Data | Score | Usada para |
|---|---|---|---|---|
| F1 | trophycoach.com, guia de Global Tournaments (WebFetch) | atualizado 29/08/2026 | 0.5 | níveis normalizados 11-14 no torneio, sem taxa de entrada |
| F2 | Deconstructor of Fun, deconstrução do Marvel Snap (WebFetch) | 23/05/2023 | 0.65 | o que não se compra; cubos só por jogo; passe US$9,99 |
| F3 | Axios, entrevista Ben Brode (só snippet de busca; WebFetch 403) | 10/11/2022 | 0.6 | filosofia "monetização responsável" |
| F4 | Habitica fandom wiki, Subscription (só snippet; WebFetch 402) | sem data na página | 0.35 | teto de gemas por mês |
| F5 | Sportskeeda, GamerUrge, Medio Sick, ZLeague sobre Clash Royale nível 16 | 24/11/2025 em diante | 0.5-0.6 | reação da comunidade |
| F6 | Screen Rant, GuruGamer, BitTopup sobre Welkin Moon | 2023-2025 | 0.4-0.6 | preço e teto de 6 bênçãos |
| F7 | TheGamer, GameRant, DotEsports sobre Pokémon Sleep Premium Pass | 2023-2024 | 0.6 | preço e benefícios |
| F8 | Class Central, HowToGeek, Change.org sobre Duolingo Energy | abr/2025 em diante | 0.5 / 0.5 / 0.2 | reação à troca Hearts→Energy |
| F9 | Bustle, RecurDash, Calmevo sobre Finch Plus | 2026 | 0.5 | preço e conteúdo do Plus |
| F10 | Pokémon GO Hub / Bulbapedia sobre Remote Raid Pass | limite de 10/dia desde 13/05/2025 | 0.6 | teto diário |

Afirmações só em fonte <0.6 estão marcadas `[indício]`.

## 2. Matriz (o que o dinheiro acelera × o que nunca compra)

| Produto | Teto de compra | Dinheiro acelera | Dinheiro nunca compra | Proteção do PvP | Modelo |
|---|---|---|---|---|---|
| Marvel Snap | sem pacotes de carta; só gold para variantes | cosmético; "acelera" o sistema de upgrade visual (F2) | cartas, boosters, rank de cubo (F2) | cubos só por vitória; zero poder pago | passe US$9,99 (US$14,99 com +10 níveis) |
| Clash Royale | sem teto; ouro, gemas e Wild Cards comprados | tempo de nível de carta (nível 16 desde 24/11/2025) | nada no torneio global: cartas nivelam a 11-14 `[indício F1]` | torneio normaliza nível; ladder não protege (queixa recorrente) | Pass Royale + pacotes |
| Habitica | assinante compra gemas até 25/mês, subindo a 50 com meses consecutivos `[indício F4]` | tempo de aquisição de itens cosméticos/equipamento | nada de HP/XP pago | PvP quase inexistente (só party/desafios) | assinatura |
| Pokémon GO | Remote Raid Pass com limite de 10 usos/dia (F10) | frequência de raid | captura, IVs e nível seguem por jogo | PvP GO Battle League com ranking por CP (CP é teto de liga) | pacotes de moeda |
| Pokémon Sleep | Premium US$9,99/mês ou US$49,99/6 meses (F7) | pontos extras, biscoito premium diário, doces | dormir é a fonte do progresso | sem PvP | assinatura |
| Genshin | Welkin US$4,99: 90 primogems/dia por 30 dias, máx 6 empilhadas (F6) | velocidade de pull | nada de nível de personagem direto (EXP é recurso com cap diário de resina) | PvE; sem PvP | passe mensal + battle pass |
| Duolingo | Super (assinatura) | remove limite de energia | XP, ligas, streak dependem de lição feita | ligas por XP semanal | assinatura; limite de Energy (F8) |
| Finch | Plus US$9,99/mês ou US$69,99/ano (F9) | cosmético, aventuras extras, sons | ferramentas de autocuidado ficam grátis | sem PvP | assinatura |

## 3. Leituras estratégicas

1. **Padrão consolidado de "aceleração aceitável"**: dinheiro compra *conveniência e vistosidade* (cosmético, frequência, mais tentativas por dia), com teto diário duro (raid pass 10/dia; Welkin 6 empilhadas; gemas Habitica 25-50/mês). Nunca compra a *chave do ranking* (rank de cubo, posição de liga, vitória).
2. **O caso que o dono NÃO quer repetir é o Clash Royale**: quando a compra de tempo de upgrade ficou desproporcional à velocidade grátis (nível 16, nov/2025), a comunidade chamou de P2W e relatou queda de jogadores `[indício, F5 imprensa de nicho]`. O sintoma é gap entre velocidade paga e grátis, não a existência de compra.
3. **Duolingo** mostra o limite oposto: restringir o grátis (energia) para vender o pago gerou rejeição pública (F8, abr/2025), embora a empresa reporte aumento de DAU e conversão. Para um app de hábito com `copy.semFomo`, é padrão a evitar: nunca travar o loop principal (tarefa feita → progresso).
4. **Proteção do PvP, três famílias**: (a) normalizar poder no modo competitivo (torneio CR, níveis 11-14); (b) rank só por vitória (cubos Marvel Snap); (c) liga por faixa de poder (GO Battle League). O Soulmon já aceita 5% de vantagem de talento/equipamento no PvP (§2.9); o que o benchmark sugere é que nenhum desses 5% venha de compra.
5. **Diferencial possível**: nenhum concorrente de hábito/pet vende aceleração de progresso de combate. Finch e Habitica vendem cosmético/itens. Gap aberto por razão provável: "não importa" (Finch não tem PvP) e "é arriscado" (CR). `[suposição]`

## 4. Os 4 defaults re-propostos (diretriz: não P2W, ok acelerar um pouco, comedido)

Regra de ouro derivada do benchmark: **dinheiro compra tempo de recurso com teto diário e nunca compra o produto final (nível, atributo, vitória)**. Teto numérico sugerido de aceleração paga: **no máximo +25% de ganho de recurso sobre quem joga grátis com a mesma atividade real** `[suposição, calibrar na simulação]`. Âncora: Habitica 25 gemas/mês e GO 10 passes/dia são limites de frequência, não de poder. Genshin Welkin dá cerca de +90 primogems/dia, mas o grátis ganha ~60/dia, ou seja, o pago é ~+150%: valor que o dono provavelmente considera acima de "comedido" `[indício F6]`.

### (1) Piso de 15% por atributo
Game design puro; o benchmark não tem nada a dizer (nenhum concorrente publica piso de distribuição). Confirmar o default. O único ponto de contato: com o piso, nenhuma compra nem build consegue concentrar poder além de 45% (já decidido), e isso protege o PvP como o torneio do CR protege por normalização.
- Proposta: manter 15% por atributo, teto de concentração 45%.
- Teto de aceleração: 0% (não é monetizável).
- Pergunta: "O piso de 15% por atributo fica como está?" (a) Manter 15% (recomendado) (b) Reduzir para 10% (c) Sem piso, só o teto de 45%.

### (2) Moeda do equipamento (Bits ganhos; Créditos→Bits CREDIT_TO_BITS=10)
Risco: Créditos→Bits transforma dinheiro em equipamento, que dá ~5% no PvP (quebra a linha vermelha "Créditos não compram atributo"). Padrão do benchmark: Marvel Snap deixa o dinheiro só no cosmético; Genshin/GO limitam por dia.
- Proposta: conversão existe mas com **teto diário de Bits convertíveis = 25% do ganho médio diário** de Bits por jogo, equipamento comprado só em lojas de Bits, e **todo equipamento com bônus de PvP fica fora da conversão** (Créditos compram só cosmético do equipamento). Preço de conversão fixo; nenhum item exclusivo pago.
- Teto de aceleração: +25% de Bits/dia por dinheiro; zero em itens que dão %.
- Pergunta: "Créditos podem virar Bits para o equipamento?" (a) Sim, teto diário de 25% e só para equipamento sem bônus de PvP (recomendado) (b) Sim, sem teto de itens, só teto diário (c) Não: Créditos só cosmético, Bits só por jogo.

### (3) Renascimento pago + Vínculo
Risco: Vínculo é o level do usuário e agora gate de PvP; vender Renascimento pago = vender nível. Padrão: Marvel Snap "rank não se compra"; CR nível 16 é o contra-exemplo.
- Proposta: Renascimento **nunca pago**; o que o dinheiro acelera é o **recurso do Renascimento** (matéria que ele consome), com teto semanal. Vínculo sobe só por atividade real (XP 66/34 já decidido). Pago opcional: **cosmético do Renascimento** (aura, nome).
- Teto de aceleração: +10% de XP de Vínculo no máximo, ou 0% e só cosmético; recomendado 0% de XP e 25% de recurso.
- Pergunta: "O Renascimento pode ser pago?" (a) Só o recurso, com teto semanal de 25%, e Vínculo nunca (recomendado) (b) Renascimento pago com limite de 1 por mês (c) Nada pago, só cosmético.

### (4) Caminho Comércio só moeda
Comércio é o caminho de talento fora do PvP (§2.7). Por ser PvE/econômico, é o lugar mais seguro para o dinheiro acelerar, como Finch e Habitica (itens e conveniência).
- Proposta: Comércio rende só moeda (Bits), nunca atributo nem XP; dinheiro real pode comprar **mais slots/tentativas diárias de Comércio** com teto (como GO 10 passes/dia), sem mudar a taxa de câmbio.
- Teto de aceleração: +25% de Bits/dia, somado ao teto de (2), **total combinado 25%**, não 25% + 25%.
- Pergunta: "Como o Comércio rende?" (a) Só moeda, com mais slots pagos até +25% de Bits/dia (recomendado) (b) Só moeda, sem nada pago (c) Moeda mais materiais de Renascimento.

## 5. Passe/assinatura recomendados (para o estrategista de negócio)
- Modelo Marvel Snap/Finch: passe mensal de **US$ 4,99-9,99** com cosmético, slots de conveniência e histórico; progresso de combate idêntico ao grátis, exceto o teto de recurso acima.
- Evitar modelo Duolingo (limitar grátis) e CR (vender tempo de nível).
- Copy sem cobrança: passe sem renovação automática obrigatória (Welkin não renova sozinho, F6).

## 6. Limitações
- Dois WebFetch falharam (403/402); Axios e wiki do Habitica só via snippet de busca.
- Duas fontes sobre o torneio CR se contradizem (uma diz sem trilha premium, outra diz bônus de gemas pelas mesmas vitórias); o que vale para o Soulmon é igual nos dois casos (gemas não sobem ranking).
- Números de preço são dos EUA e mudam; a tabela de Genshin "grátis ~60/dia" não foi checada em fonte primária `[suposição]`.
- Nenhum dado de conversão ou receita do Soulmon (sem usuário). O teto de 25% é hipótese a calibrar por simulação.
- Não consultei Duolingo/Finch em fonte oficial, só imprensa.
