# Discussões e decisões — onde cada uma vive

> **Dono:** doc-historiador · **Data:** 15/09/2026 · **Estado:** verificado em 15/09/2026 por doc-verificador
> **Verificação:** abra cada caminho citado e confira a seção nomeada existe (`grep -n "^## " <caminho>`)
> **Não cobre:** o CONTEÚDO integral de cada discussão — este documento é um ÍNDICE, não a discussão. Para "como chegamos aqui" em datas e commits, veja `09-HISTORICO.md`
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde este índice apontar para um documento que discorda do código, o código está certo e o documento apontado tem defeito — não este índice.

Este documento responde **"onde está a discussão sobre X"**. Cada linha das
tabelas abaixo tem: **data** (do bloco datado ou da criação do arquivo no
git, marcada), **onde** (caminho + seção), **o que foi decidido** (uma linha,
citando a fonte), **alternativa que perdeu** e **gatilho de revisão**. Onde a
fonte não registra uma data por linha, a data usada é a do documento (dada no
próprio cabeçalho, ou `git log --diff-filter=A --format=%ad --date=short -- <arquivo>`
para a criação do arquivo) — nunca inventada.

**Índice fonte principal**: `docs/REGISTRO-DE-DECISOES.md` é o consolidado —
tem índice próprio em `## 0. Índice`, organizado em §5.1–§5.8 (por tema, o
mesmo agrupamento usado abaixo), §6/§6.1 (decisões de 07–09/09/2026, inclusive
som), §7 (12 apostas falseáveis), §8 (mapa de exposição), §9 (a crítica mais
forte), §10 (o que a pesquisa contradisse), §12 (o que a revisão adversarial
de 08/09/2026 confirmou e derrubou), §13 (as decisões do dono na rodada de
wireframes — 13.1–13.5 em 13/09/2026, 13.6–13.7 em 14/09/2026 no checkpoint
da Home, 13.8–13.9 em 14/09/2026 no checkpoint de Atividades, 13.10–13.11 em
14/09/2026 no checkpoint de Rituais, 13.12 em 14/09/2026 no checkpoint de
Evolução, 13.13 em 15/09/2026 no checkpoint de Jogos, 13.14 em 15/09/2026 no
checkpoint da Loja). Consolidado em 08/09/2026
(`git log --diff-filter=A --format=%ad --date=short -- docs/REGISTRO-DE-DECISOES.md`
→ `2026-09-08`, commit `01a64199`), revisado no mesmo dia por uma sessão de QA
adversarial (§12 do próprio documento). **As tabelas abaixo citam uma amostra
representativa de cada seção — para a tabela completa, abra a seção
apontada.**

---

## 1. Falha e perdão

Fonte principal: `../REGISTRO-DE-DECISOES.md#5-registro-de-decisões-por-tema`
§5.1 (16 linhas na tabela original) e §6 (P1/P2/P3/P5, 07–08/09/2026).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 (consolidação) | `REGISTRO-DE-DECISOES.md` §5.1, linha "Teto de 1 coração por dia" | "Um dia ruim é um sinal, não uma sentença" — `MAX_HEARTS_LOST_PER_DAY` | Perda proporcional sem teto (o produto original: zerava e degenerava num dia) | não declarado nesta linha |
| 08/09/2026 | §5.1, "Ausência ≥ 2 dias não cobra nada" | Finch + *what-the-hell effect* (Polivy & Herman): cobrar no retorno dispara abandono total — `ABSENCE_FORGIVENESS_DAYS` | Cobrar retroativamente os dias perdidos (padrão Habitica) | não declarado |
| 08/09/2026 | §5.1, "`perfectDays` só acumula, nunca zera" | Lally et al. 2010: pular um dia não prejudica mensuravelmente a automaticidade — a ciência autoriza o perdão | Streak visível de dias consecutivos (aversão à perda) | travado por teste; nenhum gatilho de reabertura declarado |
| 08/09/2026 | §5.1, "`REST_SHIELD_MAX = 3`" | Mantido em 3 apesar da evidência contra (linha abaixo) | — | **⏸️ Em aberto (H0)** — ver §7 aposta 2 |
| 07/09/2026 | §5.1, "Meta de coração = 60% da meta do dia (P1)" | `heartGoalFor = max(1, ceil(dailyGoalFor × 0,6))`; a meta do dia completo continua inteira | Afrouxar a meta do dia completo — quebraria o princípio 3 | Dado mostrando que 4 de 6 sem perder coração destrói o stake, "com número, não com intuição" |
| 07/09/2026 | §5.1, "Folga semanal automática e retroativa (P2)" | `REST_DAYS_PER_WEEK = 1`, absorvida na virada, sem acúmulo | "Modo férias" com datas — é planejamento, e planejamento é a fricção nº 2 | O achado do 3º escudo do Duolingo, transposto: "a folga treina ausência" |
| — (adiada) | §5.1, "Alívio adaptativo (P3)" | **⏸️ Adiada** — duas leituras incompatíveis, seria o 6º perdão | — | A pergunta que decide é de fato (dado), não de design |
| 07/09/2026 | §5.1, "A folga NÃO cobre o dreno de cocô ⚠️" | Achado do QA de 08/09: a folga absorve a perda da meta, não a do cocô | — | **⬜ Lacuna conhecida, não decidida** — decidir se cobre as duas fontes |
| 06/09/2026 | `../PLANO-MELHORIAS.md#10-decisões-que-só-o-dono-pode-tomar-e-o-que-cada-uma-destrava` D3/D4, respondidas em §15 | D3: escudo fica em 3, **RECUSADO** baixar para 2 (escudos do Soulmon são conquistados, não dados como os do Duolingo). D4: **a aura (`steadyWindow`) é o que dói, e só ela** — nenhuma outra mecânica ganha peso de perda | Baixar `REST_SHIELD_MAX` para 2 por transferir o dado do Duolingo | O dado do Duolingo "não transfere" — decisão fechada, sem gatilho declarado |
| 08/09/2026 | `../REGISTRO-DE-DECISOES.md#10-o-que-a-pesquisa-contradisse-e-o-que-continua-em-aberto` §10.1 | "O que ainda dói perder no Soulmon? Hoje, honestamente: quase nada além da criatura" — 10 mecanismos de perdão empilhados (8 + P1 + P2) | — | Prestígio cosmético (regra 5, §3) é a resposta candidata, não implementada |
| 08/09/2026 | `../REGISTRO-DE-DECISOES.md#7-falseabilidade--as-12-apostas-com-número-e-instrumento` aposta 1 | "O perdão retém mais do que a punição retinha" — a aposta-mãe de toda a Fase 1 e de P1/P2 | — | D30 < 4% sustentado **com** taxa de conclusão caindo — sinal de que sem consequência nada importa |

Descanso e Sonhos, tema irmão de falha-e-perdão (o "castigo" que a Janela de
Descanso deliberadamente recusa), tem tabela própria na §9 deste documento.

---

## 2. Hábitos, tarefas e planejamento (motor de tarefas)

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.2 (13 linhas) e
`../PLANO-TAREFAS.md` (criado 19/08/2026, mesma data de nascimento do módulo —
ver `09-HISTORICO.md` §2). O motor tem estudo dedicado do plano de melhorias:
`../plano-melhorias/estudo/constancia.md`, `../plano-melhorias/mobbin/constancia.md`,
`../plano-melhorias/ledger/constancia.md` (guarda `soulmon-guarda-constancia`,
WP2.1–2.9).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.2, "Otimizar o PLANEJAR, não o marcar o check" | Masicampo & Baumeister: a tensão da tarefa inacabada é aliviada por fazer um PLANO, não por concluí-la | Otimizar o check (Todoist Karma, Duolingo) — produz *gaming* | não declarado |
| 08/09/2026 | §5.2, "Recorrência contada da CONCLUSÃO" | Todoist `every!`: impede acúmulo de instâncias atrasadas, "a causa nº 1 documentada de abandono" | Contar do calendário | não declarado |
| 08/09/2026 | §5.2, "Esforço 1–3; recompensa escala com esforço, NUNCA com contagem" | O defeito exato do Karma do Todoist, crítica nº 1 àquele sistema | Recompensa por item | `dailyGoal.contract.test.ts` trava |
| 08/09/2026 | §5.2, "Marcos em 7 / 21 / 66 dias" | Lally et al.: mediana de 66 dias; "21 dias" é mito (Maxwell Maltz, 1960, cirurgia plástica) | 21 dias | não declarado |
| 08/09/2026 | §5.2, "Carga do dia é AVISO, nunca bloqueio" | *The Freedom Fallacy*: autonomia é volição, não ausência de direção | Bloquear criação acima do teto | não declarado |
| 07/09/2026 | §5.2, "Presets de 1 toque + Equilibrar minha semana (P4)" | Pesquisa negativa e útil: ninguém planeja a semana num app de hábito | Um planejador semanal completo | não declarado |
| 08/09/2026 | §5.2, "Reduzir o `cap` para proteger quem cadastra demais" | **❌ Recusado**: cadastrar muito é saudável; `min(cadastradas, requisito)` já neutraliza — o bug era o app MOSTRAR que penalizava, não o excesso em si | Reduzir o teto de cadastro | — |
| 03/09/2026 | `../plano-melhorias/estudo/constancia.md#4-o-que-este-guarda-mudou-de-opinião` | O guarda registra o que mudou de opinião ao ler o corpus pré-Mobbin, item a item | — | ver o arquivo — mudanças pontuais, não uma tese única |
| 02/09/2026 | `../plano-melhorias/mobbin/constancia.md#4-resposta-explícita-algum-padrão-do-dossiê-8-acrescenta-perdão-ou-cobrança-ao-motor` | Resposta explícita à pergunta-guarda: nenhum padrão do dossiê 8 acrescenta cobrança | — | — |
| 19/08/2026 | `../PLANO-TAREFAS.md#parte-2--o-desenho-proposto` | O desenho completo do motor (hábito=constância, tarefa=execução) | — | — |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.8 | 🧭 dono (14/09/2026, checkpoint de Atividades, em modal): "Excluir hábito com histórico pede confirmação que NOMEIA o marco" ("Este hábito é uma Muda — 30 dias. Excluir apaga esse histórico.") — nasceu como o pedido V1 de `../design/DECISOES-WIREFRAME.md` §6.2 (ressalva 4e do `soulmon-guarda-linha-vermelha`: nunca progresso por acidente); era regra, não wireframe, por isso voltou ao `REGISTRO` | Exclusão num toque (`EditModal`, botão quiet); "Guardar" para hábito (arquiva, preserva `totalDone`) — regra maior | "se a confirmação virar atrito medido (ninguém exclui), rever" |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.9 | 🧭 dono (14/09/2026, checkpoint de Atividades, em modal): "Passos aceitos no nudge de adiamento SOMAM à mesma tarefa" — a tarefa continua uma só, com passos, e o contador de adiamentos fica; nasceu como o pedido V3 de `../design/DECISOES-WIREFRAME.md` §6.2 (aceite 5 do guarda: substituir zeraria o contador, um perdão a mais); o `onDecompose` não definia | Substituir (a tarefa vira `dropped` e cada passo vira tarefa rápida) | "se somar deixar a tarefa-mãe assombrada por inércia, rever" |

---

## 3. Onboarding, identidade e o Oráculo

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.3 (10 linhas) e
`../ORACULO.md` (criado 15/08/2026, com rodadas datadas até a §"Nome da aba +
contraste do tema escuro (ago/2026, rodada 6)"). Estudo dedicado:
`../plano-melhorias/estudo/nascimento.md`, `../plano-melhorias/mobbin/nascimento.md`,
`../plano-melhorias/ledger/nascimento.md` (guarda `soulmon-guarda-nascimento`,
WP1.1–1.8). Plano específico da tela de identidade: `../PLANO-TELA-IDENTIDADE.md`.

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.3, "Cada pergunta muda a experiência visivelmente" | Tim Gabe (*Onboarding Paradox*): as 6 perguntas geram a criatura, viram parte do produto | Formulário de cadastro tradicional | não declarado |
| 08/09/2026 | §5.3, "Criatura comum grátis; criatura própria paga" | Decisão 1 do dossiê Mobbin | Paywall antes de qualquer criatura | não declarado |
| 08/09/2026 | §5.3, "Psicométrico INVISÍVEL" | Decisão 6 do dossiê — só alimenta a criatura | Mostrar perfil de personalidade | **✅ criou o Problema 1 do dossiê (20 telas de custo, retorno invisível) — em aberto** |
| 08/09/2026 | §5.3, "Não cobrar no reveal; value moment = 1º dia completo" | Paywall após value moment = 2,1× mais trial starts (dado externo) | Paywall no reveal (padrão Noom) | **conversão < 1% reabre o paywall no reveal** |
| 07/09/2026 | §5.3, "Conta é a PRIMEIRA tela" | 🧭 decisão do dono — o argumento técnico contra (consentimento antes de dado pessoal) estava certo no diagnóstico, errado na conclusão | Identidade depois do consentimento | ver §7 aposta 6, abaixo |
| 07/09/2026 | §5.3, "Idade por CAIXA de declaração" | 🧭 dono: menos dado pessoal para o mesmo efeito legal | Campo de mês/ano de nascimento | — |
| 08/09/2026 | `../REGISTRO-DE-DECISOES.md#7-falseabilidade--as-12-apostas-com-número-e-instrumento` aposta 6 | "A conta na primeira tela não mata o funil" — **a aposta mais arriscada** do documento inteiro | — | Drop-off na `IDENTITY_STEP` acima de qualquer outro passo; agravante: QA achou que o fallback de popup bloqueado pode estar barrado pela mesma proteção (`authDomain` ≠ domínio do app) |
| 17/08/2026 | `../ORACULO.md#a-fusão-ficha-bestiário-e-a-constelação-agosto2026-rodada-2` | Pipeline completo: ficha do class-system + companheiro capturável + criatura-inspiração do bestiário, antes de gerar a criatura | Geração isolada, sem fundir com o class-system | — |
| 17/08/2026 | `../ORACULO.md#revisão-de-unicidade-e-fidelidade-agosto2026-rodada-4` | Revisão de unicidade — nomes, papéis e identidades fantasma não colidem | — | — |
| 12/09/2026 (na verdade 08/09, título do doc) | `../PLANO-TELA-IDENTIDADE.md#3-bis-o-que-foi-ao-ar-07092026--substitui-a-secao-3` | O que efetivamente foi ao ar em 07/09, substituindo o plano original da seção 3 | O desenho original da seção 3 (não usado) | — |

---

## 4. Monetização

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.4 (11 linhas) e
`../PLANO-MELHORIAS.md#15-as-decisões-do-dono--respondidas-06092026` (D7, D10,
D12, D15 — tabela D1–D17 completa, 06/09/2026). Specs próprias:
`../ASSINATURA-SPEC.md` (06/09/2026), `../SHOP-PLAN.md` (02/07/2026, "loja de
Bits"), `../BILLING-SETUP.md` (30/07/2026). Estudo: `../plano-melhorias/estudo/sustento.md`,
`../plano-melhorias/mobbin/sustento.md`, `../plano-melhorias/ledger/sustento.md`
(guarda `soulmon-guarda-sustento`, WP0.6, WP5.1–5.5).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.4, "Nunca vender: evolução, `perfectDays`, HP irrestrito, escudos, conclusão, pular o dia, vantagem PvP, Glitchtama" | Princípio 1; crítica ao Premium Pass do Pokémon Sleep | — | — |
| 08/09/2026 | §5.4, "Cura instantânea por Créditos: REMOVIDA" | Pagar para pular o cuidado atravessa o afeto (§4.2) | Manter, ou limitar a 1/semana | resolvido |
| 06/09/2026 | §5.4 / `PLANO-MELHORIAS.md` §15, D7+D15 | Fechar os DOIS caminhos: cura instantânea removida **e** coraçãozinho sai da loja de Bits (só drop da masmorra) — a única resposta que deixa "dinheiro nunca compra cuidado" sem asterisco | Manter um dos dois caminhos | — |
| 08/09/2026 | §5.4, "Reroll: aleatoriedade com seed derivada" | Lei 15.211/2025; condenação de R$ 333M em jun/2026 | `Math.random()` puro, ou remover o reroll | resolvido — virou "Nova Leitura" determinística (ver linha H.4 abaixo) |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, H.4 | "Nova Leitura" determinística — semente vem das 6 respostas do Oráculo, não do acaso | Sorteio (`Math.random`) | fecha a única violação declarada de #16 (sorteio pago) que ainda estava de pé |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, D10 | **Vitalício + cosmético trimestral** (~R$ 9,90/trimestre, só cosmético, sem trial, nada expira) | Assinatura recorrente que afeta mecânica | spec em `../ASSINATURA-SPEC.md` |
| 06/09/2026 | `../ASSINATURA-SPEC.md#por-que-sem-trial-é-a-decisão-mais-consequente` | "Sem trial" — a decisão mais consequente da spec | Trial gratuito de N dias | — |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, D12 | A árvore grátis NÃO ramifica, e a copy do `UnlockAccountModal` para de prometer que "leva ao mesmo lugar" | Manter a ambiguidade | novo pacote WP5.9 |
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.4, "O × que dispensa o convite tem alvo de 44×44" | Achado do QA (08/09): tinha 32×32, único alvo abaixo da régua e o de ação terminal | 32×32 | corrigido |
| — | §5.4, "Preço sempre em R$, inclusive para quem está em inglês" | ⚠️ Achado do QA: usuário em EN vê preço em reais | — | **⬜ Em aberto**, ligado a H2 (preço regionalizado) |
| — | §5.4, "Assinatura recorrente" | Compra única não cobre custo recorrente de IA (que escala com DAU) | — | **⏸️ Dono (H1)**, com 3 travas declaradas |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.11 | 🧭 dono (14/09/2026, checkpoint de Rituais, em modal): "O '1×/semana' do convite de compra no relatório conta ao MOSTRAR, não ao tocar" (`offerShownWeek` carimbado na exibição) — nasceu como o pedido V5 de `../design/DECISOES-WIREFRAME.md` §7.2 (achado 3a-ii do `soulmon-guarda-linha-vermelha`: carimbado no toque, o convite voltava em todo dia completo até tocar ou dispensar); é o que WP5.1 aprovou (canal proativo 1×/semana); era regra (`offerMoment.ts`), não wireframe, por isso voltou ao `REGISTRO` | Carimbar ao tocar (`onOpenOffer`, como estava) | "se a conversão do canal proativo cair a zero por falta de repetição, rever — nunca acima de 1×/semana" |

---

## 5. Camada social (coop, biblioteca de amigos, Torneio)

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.5 (13 linhas) e
`../PLANO-COOP.md` (criado 07/09/2026, decisão do dono na
`#5-decidido-pelo-dono-em-07092026`).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.5, "Faixas ANTES do ranking global" | Tim Gabe: placar global "parece impossível de vencer e desmotiva"; 31,3% relataram efeito negativo de comparação | Ranking global cru | não declarado |
| 08/09/2026 | §5.5, "Exibir GALHO, não altura" | Mobbin: comparação vertical vira variedade horizontal SÓ se a UI exibir o galho | "estágio 4 de 5" | não declarado |
| 07/09/2026 | §5.5, "Coop: progresso COLETIVO + presença binária" | 31,3% (comparação social negativa): mostrar contribuição individual reinventaria o leaderboard entre amigos, onde dói mais | Mostrar quanto cada membro fez | — |
| 08/09/2026 | §5.5, "Meta 5×; sem recompensa; sem gate de Vínculo" | 🧭 dono (08/09): 5 e não 7 — exigir dia completo por pressão social desfaz o perdão da Fase 1 | Bits por meta batida | — |
| 08/09/2026 | §5.5, "Cada membro escreve só a PRÓPRIA presença" | Achado QA: `coopCheckin` fazia ler-modificar-gravar sobre o blob do grupo — corrida real | Blob compartilhado no caminho quente | **corrigido — a corrida foi removida, não mitigada** |
| — | §5.5, "O ESTADO da criatura é visível socialmente?" | Mobbin §17 Q7: criatura abatida na árvore de amigos é acusação pública | — | **⏸️ Em aberto** |
| 07/09/2026 | `../PLANO-COOP.md#5-decidido-pelo-dono-em-07092026` | As decisões específicas do coop, ratificadas pelo dono no mesmo dia do desenho | — | — |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, D14 | Parceria aprovada só como meta somada + kudos — ninguém vê o déficit do outro | Notificar da falha alheia | Nenhum WP depende disso hoje |

---

## 6. Recompensa, conteúdo e masmorra

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.6 (14 linhas). Estudo:
`../plano-melhorias/estudo/permanencia.md`, `../plano-melhorias/mobbin/permanencia.md`,
`../plano-melhorias/ledger/permanencia.md` (guarda `soulmon-guarda-permanencia`,
WP4.1–4.14). Plano-mãe: `../PLANO-EVOLUCAO.md` (07/08/2026).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.6, "Recompensa variável com TETO, nunca à venda" | *Hooked*: a variável saudável varia em SABOR, não em SE existe recompensa | Loot box | — |
| 08/09/2026 | §5.6, "A masmorra não cobra da barra de cuidado" | Empilhar punição é o que afunda o Habitica | Masmorra que custa HP | — |
| 08/09/2026 | §5.6, "Glitchtama: máx. 1/dia" | A conta: 59 runs seguidas comprariam a escada de evolução inteira num fim de semana | Sem teto | — |
| 08/09/2026 | §5.6, "Aventura da noite: narrativa, sem recompensa material" | Finch: "a recompensa é narrativa, não numérica — narrativa não satura"; 🧭 dono (08/09) | Bits/item pelo achado | ver §7 aposta 9 |
| 08/09/2026 | §5.6, "Emoji de interface só do bloco que a base de aparelhos desenha" | Achado QA (08/09): 9 emojis renderizam vazio (▯), atingem o marco de 21 dias e mais 5 categorias | — | `emojiSuportado.contract.test.ts` congela a dívida; **troca dos nove é decisão do dono** |
| — | §5.6, "Rota de redenção visível (Numemon → Monzaemon)" | V-Pet 97: "o bicho ruim não é um beco; é um retrato com saída" | — | **⬜ Não implementado** |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, D5+D6 | D5: apagar `daysToEvolve` (a escada fica só em `required`). D6: Ultra sem degeneração forçada | D5 alt.: escada crescente. D6 alt.: manter a exigência de negligência no topo | — |
| 06/09/2026 | `../RENASCIMENTO.md#a-ideia` | Rebirth: depois do Ultra, escolher quem a criatura volta a ser | — | seção "Aberto (próxima rodada)" do mesmo doc |
| 02/09/2026 | `../plano-melhorias/mobbin/permanencia.md#0b-correção-de-evidência-antes-dos-achados--o-roster-de-60-não-existe` | Correção de evidência registrada ANTES dos achados: uma premissa do corpus estava errada | — | — |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.6 | 🧭 dono (14/09/2026, checkpoint da Home, em modal): "Pastinha (Itens) só com itens especiais (🌀💗🦠💾💉); comida comum só pela folha Alimentar" — nasceu como o pedido V1 de `../design/DECISOES-WIREFRAME.md` §5.2 (W4 cruzado: `use()` → `onFeed` para qualquer item, "duas portas para a mesma geladeira"); era regra, não wireframe, por isso voltou ao `REGISTRO` | Manter as duas portas | "se alguém precisar comer pela pastinha (ex.: comida como item de uso), volta" |

---

## 7. Presença fora do app (push, widget, chat)

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.7 (4 linhas — a menor
tabela do documento). Estudo: `../plano-melhorias/estudo/vinculo.md`,
`../plano-melhorias/mobbin/vinculo.md`, `../plano-melhorias/ledger/vinculo.md`
(guarda `soulmon-guarda-vinculo`, WP3.1–3.7).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.7, "Nunca notificação de culpa ou medo" | Push de culpa é o padrão que os breakdowns condenam — o Duolingo usa com ironia consciente, "coisa que o Soulmon não deve imitar" | "Seu pet está morrendo sem você" | — |
| 08/09/2026 | §5.7, "Widget mostra O SEU pet" | Finch: widget personalizado é motor de retenção declarado | Widget genérico | **🔧 personalizar — P0 do guia, não fechado** |
| 08/09/2026 | §5.7, "O widget nunca cobra tarefas que o jogo não cobra" | BUG-1: `dailyTotal` cru mostrava razão baixa a quem já cumpriu a meta | Denominador cru | corrigido |
| 06/09/2026 | `../plano-melhorias/estudo/vinculo.md#cinco-fatos-novos-que-este-destrinchado-produziu-leia-antes-da-tabela` | Cinco fatos novos que reabriram leitura de WPs de vínculo | — | ver o arquivo |
| — | `.claude/skills/squad-som/SKILL.md#o-contexto-soulmon-embutido` | Som de presença (D11) é decisão que atravessa vínculo e som — ver §9 deste doc | — | — |

---

## 8. Telemetria e privacidade

Fonte principal: `../REGISTRO-DE-DECISOES.md` §5.8 (7 linhas). Estudo:
`../plano-melhorias/estudo/medicao.md`, `../plano-melhorias/ledger/medicao.md`
(guarda `soulmon-guarda-medicao`, WP0.1–0.5, WP0.7). Formulário:
`../PLAY-DATA-SAFETY.md` (criado 08/09/2026).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §5.8, "Sem telemetria, tudo é hipótese" | Rel. 07: "toda afirmação comportamental nos outros seis relatórios é hipótese não testada" | Priorizar por opinião | ✅ construído, ❌ sem usuário para ler |
| 08/09/2026 | §5.8, "Nunca coletar: texto de tarefa, `soulGoal`/`soulStruggle`, psicométrico, nascimento, humor individual, e-mail" | LGPD | — | teste confere a lista de eventos contra o código |
| 08/09/2026 | §5.8, "Humor NUNCA vira pontuação — mas pode alimentar a FALA" | Conflito C.3 #4: alimentar fala não é alimentar score | Meta adaptada ao humor | — |
| 08/09/2026 | §5.8, "O código de passo do funil não pode colidir ⚠️" | Achado do QA (08/09): folga de apenas 1 entre `GOOGLE_STEP`(-9→36) e `REGISTER`(35) | — | guard em `telemetry.test.ts`; ver §7 apostas 5 e 6 |
| 06/09/2026 | `PLANO-MELHORIAS.md` §15, D1+D2 | D1: escrever o leitor (`tools/metrics-read.mjs`) antes da chave. D2: ledger local aprovado — a conta de retenção fecha NO APARELHO | D1 alt.: esperar a chave para escrever o leitor | — |
| 08/09/2026 | §5.8, "Passos e humor DECLARADOS no Data Safety" | Achado 08/09: o save leva `steps`/`moodLog` para a nuvem e a política não nomeava nenhum | Declarar "não há dado de saúde" | corrigido — `PLAY-DATA-SAFETY.md` §2.6 |
| 03/09/2026 | `../plano-melhorias/estudo/medicao.md#estado-verificado-do-código-03092026--comandos-rodados` | Estado do código verificado por comando, não por leitura — precedente de método | — | — |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.10 | 🧭 dono (14/09/2026, checkpoint de Rituais, em modal): "Missão semanal `mood-checkins` FICA, com alvo 5 em vez de 3" (2 Emblemas por responder o humor 5×) — o humor continua opcional e fora de pontuação (a linha "Humor NUNCA vira pontuação" acima não muda) e as carinhas do relatório não levam rótulo de prêmio; nasceu como o pedido V4 de `../design/DECISOES-WIREFRAME.md` §7.2 (ressalva 5b do `soulmon-guarda-linha-vermelha`: recompensar RESPONDER um dado opcional faz "opcional" virar "vale ponto"); era regra (`weeklyMissions.ts`), não wireframe, por isso voltou ao `REGISTRO` | Tirar a missão do pool (recomendação do guarda); alvo 3 (como estava) | "se o alvo 5 mostrar que a pessoa responde para ganhar (humor uniforme na semana da missão), sai do pool" |

---

## 9. Som

Fonte principal: `../REGISTRO-DE-DECISOES.md#61-as-decisões-de-som-08092026`
§6.1 (decisões S1–S15, 08–09/09/2026 — a subseção mais recente e mais densa
do documento). Guia operacional: `../SOM.md` (criado 09/09/2026). Estado dos
portões: `.claude/skills/squad-som/SKILL.md#-portões-verdes--bloqueio-de-fase-0-fechado-em-08092026`.

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 08/09/2026 | `REGISTRO-DE-DECISOES.md` §6.1, S1 | A fonte do som novo é GERAÇÃO POR IA (Higgsfield/Seed Audio) — decisão do dono | Melhorar só o sintetizador procedural | Ver o híbrido admissível já previsto (SFX procedural + IA para trilha/ambiente) |
| 08/09/2026 | §6.1, S2 | A trilha existe mas nasce DESLIGADA, só começa por gesto (D11 por extensão) | Trilha ligada por padrão | Evidência de que trilha ligada por padrão não aumenta abandono |
| 08/09/2026 | §6.1, S3 | Alvo de loudness = AES/EBU R 128, ≤ −16 LUFS integrado, ≤ −1 dBTP true peak | −10/−12 dBFS (mistura pico com loudness) | Medição de que −16 LUFS fica inaudível no alto-falante de celular |
| 08/09/2026 | §6.1, S6 | Orçamento de áudio: 300 KB total, ZERO no bundle inicial | Sem teto de bytes | Medição de que o teto força qualidade inaceitável |
| 08/09/2026 | §6.1, S7 | Sem teste de escuta com pessoas de fora; o dono decide sozinho | Painel externo de escuta | ⚠️ consequência declarada: N=1 aprovando o próprio conceito |
| 09/09/2026 | §6.1, S10 (com emenda) | O som PROCEDURAL é a solução VIGENTE (não mais "provisória de dias") | Esperar recarga do gerador para travar o eixo | Crédito no gerador + A/B cego rodando, candidato de IA vencendo ≥2 de 3 pares |
| 09/09/2026 | §6.1, S11 | O carinho não ganha som próprio — usa a Presença já tocada no 1º toque da sessão | Som próprio no gesto de esfregar | Escuta do S8 lendo a sequência real como interação quebrada; ou D11 sendo revista |
| 09/09/2026 | §6.1, S12 | A Arena fica muda; toda superfície nova nasce MUDA (regra R-NOVA) | Dar som próprio à Arena | Medição de que a rodada de combate da Arena tem perfil de repetição distinto |
| 09/09/2026 | §6.1, S13 | O contrato adaptativo de camadas (E0–E6) é CONGELADO como proposta não verificada; só a regra E0 (mute condicional) e a chave separada da trilha valem hoje | Implementar as camadas sem nenhuma camada real gravada | ≥2 camadas reais no mesmo BPM **e** o dono ter ligado a trilha por gesto ao menos uma vez |
| 09/09/2026 | §6.1, S15 | Termos do gerador levantados na fonte; risco de PI segue ACEITO, com ponta NOVA aberta: o provedor terceiro do modelo `seed_audio` não é nomeado em lugar nenhum público | — | A plataforma nomear o provedor **e** a política dele ser mais restritiva |
| 08/09/2026 | `../SOM.md#8-quatro-armadilhas-que-este-run-pagou-para-aprender` | Registro das 4 armadilhas de método, para o próximo run não repetir | — | — |

---

## 10. Arte, propriedade intelectual e nomes

Fonte principal: `../Attributions.md` (criado 26/12/2025, com o bloco
"⚠️ 07/09/2026 — 'saiu tudo' era MEIA VERDADE" no topo) e a seção "Arte e
nomes: nada de terceiro entra no bundle" do `CLAUDE.md` da raiz. Parecer
cruzado: `../plano-melhorias/mobbin/linha-vermelha.md` (guarda da linha
vermelha, sem WP próprio de propósito — "se ele tivesse entrega própria,
teria incentivo para relativizar a própria proibição").

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 09/08/2026 | `../Attributions.md#sprites-e-propriedade-intelectual--resolvido-opção-b` | Substituir 74 sprites Bandai + itens de digievolução por arte e nomenclatura originais (opção b) | Manter e negociar licença (opção a) | resolvido |
| 07/09/2026 | `../Attributions.md#-07092026--saiu-tudo-era-meia-verdade` | "Saiu tudo" era meia verdade: a ARTE saiu em 09/08, os 57 NOMES (`LEGACY_FORM_TIERS`) só saíram em 07/09 | — | fechado — ver `09-HISTORICO.md` §4 |
| — | `CLAUDE.md` raiz, "Nenhum nome de criatura leva sufixo fixo tipo -mon" | Prefixo de linha + sufixo mecânico soletrava nomes reais (War+_mon=WarGreymon) | Sufixo `-mon` nos nomes curados | Regra passou a valer para os nomes curados em 08/09 (`056c116b`) — ver `09-HISTORICO.md` §4 |
| 17/08/2026 | `PLANO-MELHORIAS.md`/PR #15 (ver `09-HISTORICO.md#5-os-prs-mergeados`) | "Remove sufixo -mon da geração de nomes (risco de IP)" | — | — |
| 02/09/2026 | `../plano-melhorias/mobbin/linha-vermelha.md#5-proibição-nova-inscrita-21` | Proibição nova #21 inscrita a partir da leitura do dossiê Mobbin | — | — |
| 02/09/2026 | `../plano-melhorias/mobbin/linha-vermelha.md#6-a-metade-que-falta-o-que-perdoa-demais` | Parecer: a linha vermelha cobre bem o que NÃO fazer, mas tem metade fraca no que perdoa demais | — | — |
| 09/09/2026 | `REGISTRO-DE-DECISOES.md` §6.1, S4 | Nenhum som pode reintroduzir PI de terceiro (jingle reconhecível, timbre-assinatura de franquia) | — | linha vermelha, não trade-off |

---

## 11. Design e UI

Fonte principal: `../PLANO-DESIGN.md` (criado 19/08/2026 — mesmo dia do
início do redesenho "O Visor", ver `09-HISTORICO.md` §1.3) e as rodadas de
alinhamento em `product/soulmon-01/ui/align-round1.md` a `align-round6.md`.
Briefing do squad de revisão: `../squad/00-BRIEFING.md` (14/08/2026). Desde
13/09/2026 as decisões do redesenho em wireframes vivem em
`../design/DECISOES-WIREFRAME.md` (a cada `decidir`, o entra/volta/sai por
fluxo — §5 é a Home, §6 é Atividades, §7 é Rituais, §8 é Pet, §9 é Onboarding-funil, §10 é Evolução, §11 é Jogos, §12 é Loja) e as de REGRA que nascem ali
voltam para o `../REGISTRO-DE-DECISOES.md` §13.

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 19/08/2026 | `../PLANO-DESIGN.md#3-território-retrô--território-svg--a-lista-nominal` | Duas linguagens visuais convivem por território fixo (retrô vs. SVG), não por preferência de tela | Uma linguagem única para o app inteiro | — |
| 19/08/2026 | `../PLANO-DESIGN.md#4-os-bugs-de-identidade--decisão-item-a-item` | Cada bug de identidade visual julgado individualmente, com decisão registrada por item | — | — |
| 19/08/2026 | `../PLANO-DESIGN.md#7-riscos-e-o-que-eu-recuso` | Lista explícita do que o plano recusa fazer | — | — |
| 18/ago/2026 | `CLAUDE.md` raiz, "UI: regras visuais do dono" | Ícone NUNCA dentro de box — vale no app inteiro | Moldura/placa em ícones | — |
| — | `product/soulmon-01/ui/gap-analysis.md` e `gap-analysis-r2.md` | Duas rodadas de gap analysis entre a referência visual e o app | — | — |
| 06/09/2026 | `../STATUS.md` (seção "Antes disso: contraste do tema escuro", 17/ago/2026 — não tem heading próprio; a versão canônica do achado é o footgun 10 do `CLAUDE.md`) | `body` trocado para `--sm-bg`/`--sm-ink`; nunca reintroduzir `var(--foreground)`/`var(--background)` em texto novo | Manter o scaffold shadcn herdado do Figma como fonte de cor | achado de contraste (texto quase preto sobre card verde-escuro) |
| 13/09/2026 (checkpoint fechado em 14/09/2026) | `../design/DECISOES-WIREFRAME.md#5-home-entra--volta--sai-decisão-do-soulmon-design-lead-13092026` §5.1–§5.4 | Decisão do `soulmon-design-lead` sobre a Home, em três tabelas: **entra** (E1–E9 — "Play vira a 5ª célula do deck", "Slot de avisos abaixo do pet", "Medidores dentro do palco", regra única de célula inerte, "Piso ≥ 1 para todo dígito de 'feito'", sombra de contato, 4 copies `[novo]`), **volta** (V1–V7) e **sai** (S1–S7 — EvoTrail, PlayCard, léxico de cobrança da fala idle, o "(N)" da pilha, vetado pelo guarda). Canvas: [Soulmon — Wireframes Home](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332) (28 artboards, arquivos em `../design/wireframes/home/`). §5.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (E1, E2, E7 entram; 13.6 pastinha só especiais; 13.7 posse × dívida)" | Palco ≤ 140px (V5), skeleton "em forma de página" (V3), nível do Vínculo em dígito (V7) — recusados com motivo; medidores acima do palco (S3, "composição rejeitada em 27/08/2026") | "O código ainda faz o antigo; o wireframe desenha o novo e marca `[novo]`" — S1–S7 e E1–E7 são o diff da Home para o `staff-frontend`, sem mudar regra de jogo |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.7 | 🧭 dono (14/09/2026, checkpoint da Home, em modal): "Zero visível só em POSSE, nunca em DÍVIDA do dia" — escudos/coleção podem mostrar `0` (13.5); "N de M feitos" só ganha dígito com N ≥ 1 (piso); "é a mesma régua da 13.2" (widget) e a distinção E5 de `../design/DECISOES-WIREFRAME.md` §5.1, escrita "para não colidir com a 13.5" (parecer do `soulmon-guarda-linha-vermelha` 8b) | "dígito sempre visível, inclusive `0 de M`" | "se o piso esconder informação que o jogador pede (ex.: 'por que não aparece o contador?'), rever" |
| 13–14/09/2026 | `../STATUS.md#-1314092026--wireframes-da-home-desenhados-criticados-carimbados-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em três rodadas (`design-critic` rodada 1 "não passa" → rodada 3 "CARIMBO passa"; `soulmon-product-designer` mediu a dobra; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", 1 veto); as 48 linhas `HOME-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado`, com o link do canvas na tabela-mestra. Achados de passagem: `src/docsManual.contract.test.ts` falhava inteiro (0 testes) por um `#!/usr/bin/env node` em `scripts/docs-inventario.mjs` (corrigido) e o hook `.claude/hooks/session-start.sh` mascarava o FAIL por ler só a linha `Tests` (corrigido: lê `Test Files`, `708893c0`); dívidas de UI anotadas (`ScreenSkeleton` sem a forma da página, `HomeHud` entregando a regra por `title=`, "+10%" onde o código imprime `+20%` via `PLAY_BUFF_MULTIPLIER`) | — | próximos fluxos: Atividades, Rituais (P0) |
| 14/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#6-atividades-entra--volta--sai-decisão-do-soulmon-design-lead-14092026` §6.1–§6.4 | Decisão do `soulmon-design-lead` sobre Atividades, em três tabelas: **entra** (A1–A8 — "Um só modal de criação" (CTA → `CreateModal`; o `EditModal` só edita), "Linha de hábito com dois metadados" (janela de 7 + glifo de maturidade; o resto na ficha do hábito), "Tarefas concluídas hoje ficam no fim do painel" (regra `completeTask` intacta), "Cabeçalho `feitos/total` sobre o dia devido", "Carga do dia = 7ª entrada da fila 2", "Escudos por hábito", copies `[novo]`, "0 das últimas 7" = silêncio), **volta** (V1–V5 — V1 e V3 viraram 13.8 e 13.9) e **sai** (S1–S7 — o segundo modal de criação, a linha agregada de escudos, "N of the last 7" na linha, "Want to create without limits?", a concluída que some, o cartão tracejado de carga, o lápis que não existe no código). Canvas: [Soulmon — Wireframes Atividades](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1) (17 artboards, arquivos em `../design/wireframes/atividades/`). §6.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (A1–A8 entram; 13.8 confirmar Excluir nomeando o marco; 13.9 passos do nudge somam)" | Recompensa material ao terminar a triagem (V4, vetado pelo guarda 6d — não existe no código); foco do dia na lista (V5, não desenhado — seria funcionalidade sem regra); copy alternativa da recusa da barra (V2, volta ao código) | "A1–A8 e S1–S7 são o diff do motor de tarefas; nenhum item muda regra de jogo (`02`)" — a régua A4 é da UI, não do motor |
| 14/09/2026 | `../STATUS.md#-14092026--wireframes-de-atividades-desenhados-criticados-carimbados-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em três rodadas (`design-critic` rodada 1 "não passa", 9 bloqueantes → rodada 2 "CARIMBO passa" → rodada 3 com as 7 ressalvas de amostra aplicadas; `soulmon-product-designer` achou que o CTA da Home abre o `EditModal`, não o `CreateModal`; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", 3 vetos); as 27 linhas `ATIV-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado`, com o link do canvas na tabela-mestra. Achados de passagem (código): o cabeçalho `feitos/total` conta só `tasks` (cego às concluídas); `"0/3 steps"` impresso antes do primeiro passo (fura o piso); "Retomar" a 36px; "Want to create without limits?" mente para quem paga (C-S1); `handleAddNewTask` sem chamador; `03 §4.5` defasado (CTA → `CreateModal`; "toque no lápis") | — | próximo fluxo P0: Rituais |
| 14/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#7-rituais-entra--volta--sai-decisão-do-soulmon-design-lead-14092026` §7.1–§7.4 | Decisão do `soulmon-design-lead` sobre Rituais, em três tabelas: **entra** (R1–R8 — "O mapa completo do que vive fora das duas filas" (cerimônias de marco e evolução de propósito; `ProtectProgressModal` e `FirstTaskCompletedPopup` sem posição declarada; a VOZ como terceiro canal), "Relatório em ordem de tempo" (ontem → humor → convite → CTA), "Um caminho de volta por superfície" (a nota do carinho sai do relatório), "Retorno de ausência com o pet na peça" e sem o N de dias, "Piso de dígitos nos rituais" ("not logged", sem "0 of 4"), estado "aceitei" da oferta reduzida, "You two have a history now." no lugar de "You're on a good streak!", "Primeira tarefa concluída como cerimônia" fora das filas), **volta** (V1–V6 — V4 e V5 viraram 13.10 e 13.11; V1 o × da cerimônia, sai; V2 a carga do check-in cega ao foco, adiada ao `staff-frontend`) e **sai** (S1–S8 — "You were away N days…", os zeros de dívida, a nota do carinho, "streak", o × da cerimônia, o 4º candidato de foco, o "(s)", a `ModalSheet` da primeira tarefa). Canvas: [Soulmon — Wireframes Rituais](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a) (21 artboards, arquivos em `../design/wireframes/rituais/`). §7.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (R1–R8 entram; 13.10 `mood-checkins` fica com alvo 5; 13.11 a semana da oferta conta ao mostrar)" | × no topo da cerimônia do marco (V1, `MilestoneCeremony.render.test.tsx` trava UM botão; × é postura de dispensa); versão máxima do retorno sem as linhas de extrato (V3, volta parcial — "Complete days saved" é posse, 13.7); tirar a missão `mood-checkins` do pool (recomendação do guarda, perdeu para o alvo 5) | "R1–R8 e S1–S8 são o diff dos rituais; nenhum item muda regra de jogo (`02`)" — V4 e V5 eram regra e foram ao dono |
| 14/09/2026 | `../STATUS.md#-14092026--wireframes-de-rituais-desenhados-criticados-corrigidos-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa", 5 bloqueantes B1–B5 + 7 ressalvas, todos aplicados na rodada 2; `soulmon-product-designer` achou que o `FirstTaskCompletedPopup` monta POR BAIXO dos intersticiais e que o gatilho é a oferta reduzida; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", 1 veto de copy, 4 vetos ao código que o canvas já corrige); as 26 linhas `RIT-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado`, com o link do canvas na tabela-mestra. Achados de passagem (código): `FirstTaskCompletedPopup` (z-120) sob os intersticiais, alcançável pela oferta reduzida; `ProtectProgressModal` × `WelcomePromptModal` no mesmo `interstitial`; a carga do check-in cega ao foco escolhido; `WeeklyReportCard` "0 of 4"/"0 task(s) done"; oferta reduzida sem estado pós-aceite; `MilestoneCeremony` sem trap/Escape; "You're on a good streak!"; `restDayUsed`/`weeklyRelief` sem `!welcome`; `offerShownWeek` no toque; "You were away N days"; `03 §4.21` "substituiu o timer" — coexistem | — | próximo canvas: Pet (D1); para o `staff-frontend`, 13.10 muda `weeklyMissions.ts` e 13.11 muda `onOpenOffer`/`offerMoment.ts` |
| 14/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#8-pet-entra--volta--sai-decisão-do-soulmon-design-lead-14092026` §8.1–§8.4 | Decisão do `soulmon-design-lead` sobre o Pet (canvas próprio por D1), em três tabelas: **entra** (P1–P4 — Dex vazio sem barra em 0% e sem as três frações enquanto as três raridades estão em zero, o "0 of 30" fica como texto quieto; célula obtida com "#NN · data" (índice global do `DREAM_CATALOG` + `rest.dreamDates`); sub-abas como o código, três `<button>`, sem `tablist`; estados da ficha que o inventário não tinha), **volta** (V1–V5 — V1 o `[novo]` que suprimia o "0 of 30", vetado pelo guarda; V2 a data das formas anteriores mora no `FormAlbum`, não na ficha, adiado ao canvas Estatísticas) e **sai** (S1–S5 — a barra vazia, o `tablist` da rodada 1, o nível numérico na ficha, a seção do save legado em `PET-02`). Canvas: [Soulmon — Wireframes Pet](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e) (9 artboards, arquivos em `../design/wireframes/pet/`). §8.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (P1–P4 entram; sem decisão de regra nova — a tensão 13.7 × PRINCÍPIOS §9 no Dex vazio foi resolvida pelo lead com a régua de E5/A6)" | O `[novo]` que suprimia o "0 of 30" (V1, vetado pelo guarda 1a: reverteria 13.7); a data das formas na ficha (V2, adiada — uma casa só é o `FormAlbum`) | "P1–P4 e S1–S5 são o diff do Pet; nenhum item muda regra de jogo (`02`)" — nenhum V virou linha nova do `REGISTRO` (sem decisão de regra) |
| 14/09/2026 | `../STATUS.md#-14092026--wireframes-do-pet-desenhados-criticados-corrigidos-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa", 1 bloqueante sistêmico B1 (sub-abas desenhadas como `tablist` sem `[novo]`) + 2 ressalvas, aplicados na rodada 2; `soulmon-product-designer` 8 achados; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", 1 veto ao `[novo]` que suprimia o "0 of 30"); as 7 linhas `PET-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado` (`PET-02` fica `fora`, D4), com o link do canvas na tabela-mestra; canvas próprio por D1 (`EVO-22`→`EVO-29` viraram `PET-01`→`PET-08`, inventário §1.4a). Achados de passagem (código): `DreamDex` sempre renderiza contador + `progressbar` mesmo em zero; `rest.dreamDates` carimbado e nunca exibido; as sub-abas são três `<button>` sem grupo nem estado ativo para leitor de tela; a coluna ficha → Dex → diário sem sinal de posição ao rolar; três `ScreenSkeleton` empilhados; as duas habilidades do estágio sem seção no `02-REGRAS-DE-NEGOCIO.md`; o estado vazio da ficha (`formas.length === 0`) sem linha no inventário; a data das formas anteriores com dois candidatos a dono (`FormAlbum` × ficha) | — | próximo canvas: Onboarding-funil (D3) |
| 14/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#9-onboarding-funil-entra--volta--sai-decisão-do-soulmon-design-lead-14092026` §9.1–§9.4 | Decisão do `soulmon-design-lead` sobre o Onboarding-funil (canvas próprio por D3 — o Oráculo é o outro canvas), em três tabelas: **entra** (O1–O7 — o sprite grande do personagem no cadastro demo, a justificativa do campo de objetivo, o objetivo do tutorial pré-carregado com o `soulGoal`, "Back" nos três becos sem saída (`STRUGGLE_STEP`/`CHOICE_STEP`/`REGISTER`), skip da intro com rótulo e teclado, aviso da IA junto do botão de sugestão, os estados que a rodada 1 não tinha), **volta** (V1–V4 — **V1: reordenar o funil, recusado pelo dono**; V2–V4 adiados a lote de copy/STATUS) e **sai** (S1–S5). Canvas: [Soulmon — Wireframes Onboarding-funil](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6) (17 artboards, arquivos em `../design/wireframes/onboarding-funil/`). §9.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (O1–O7 entram; V1: a ordem de hoje do funil FICA — o lead recomendava reordenar, o dono decidiu manter; sem decisão de regra nova no `REGISTRO`)" | **V1 — reordenar o funil**: pôr as duas perguntas abertas (`soulGoal`/`soulStruggle`) depois do personagem e do cadastro, para a criatura subir da 7ª para a 5ª tela (recomendação do `soulmon-product-designer`); o dono decidiu **manter a ordem de hoje** — a criatura continua na 7ª tela | "O1–O7 e S1–S5 são o diff do funil; nenhum item muda regra de jogo" — V1 era regra (a ordem dos `step` em `SoulmonOnboarding.tsx`) e foi ao dono, que recusou mexer |
| 14/09/2026 | `../STATUS.md#-14092026--wireframes-do-onboarding-funil-desenhados-criticados-corrigidos-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa", B1 os três "Back" que o código não tem, B2 o "carregando" do portão, B3 o rótulo do teto como UI, B4 o skip sem teclado, W3 o par "Sign in" — todos aplicados na rodada 2; `soulmon-product-designer` 6 achados: o nascimento demo sem a criatura, a criatura só na 7ª tela, o objetivo perguntado 2×; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", nenhum veto: rotular o estado pós-marcação em ONB-09, disclosure da IA no tutorial); as 25 linhas `ONB-*` do funil de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado` (`ONB-13` fica `fora`, D4), com o link do canvas na tabela-mestra. Achados de passagem (código): três becos sem saída no funil (`back()` sem botão em `STRUGGLE_STEP`/`CHOICE_STEP`/`REGISTER`); o `REGISTER` demo sem `<img>`; o tick sem-Firebase do portão (quem toca "Continue" ali entra sem conta mesmo com Firebase configurado); o skip da intro sem rótulo nem `onKeyDown`; `/api/suggest-tasks` fora da política de privacidade; o objetivo perguntado 2× (ONB-14 e ONB-40); nenhuma copy diz que a 1ª atividade do tutorial é real; a régua "8 telas" (PP Parte 0) × 10 contadas | — | próximo canvas: Evolução |
| 14/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#10-evolução-entra--volta--sai-decisão-do-soulmon-design-lead-14092026` §10.1–§10.4 | Decisão do `soulmon-design-lead` sobre a Evolução, em três tabelas: **entra** (X1–X5 — a DATA na cerimônia (`formReachedAt`), "Let’s keep going together" no lugar de "Continue", a tag do cadeado do jogador vira "ON HOLD" (era "LOCKED", ambíguo com a forma não alcançada), a superfície do cadeado avisa que não protege os corações, estados que a rodada 1 não tinha — estado por nó, offline da geração de sprite (D9), reduced-motion como quadro antes → depois (D7), `role="dialog"`, plural real do `EvolveTaskModal`), **volta** (V1–V5 — V1 virou 13.12; V2 o gesto duplo do visor, adiado; V3 "N complete days to go.", adiada a lote de copy; V4 o × permanente do `UnlockNudge`, volta ao código por D11; V5 aceito como lacuna documental) e **sai** (S1–S5 — "Continue", a tag "LOCKED" do cadeado do jogador, a intercalação de 3s e o vídeo em loop em movimento reduzido, o "(s)" dos plurais do `EvolveTaskModal`, a ordem de foco começando no visor). Canvas: [Soulmon — Wireframes Evolução](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed) (15 artboards, arquivos em `../design/wireframes/evolucao/`). §10.4: "Checkpoint fechado em 14/09/2026 — o dono APROVOU (X1–X5 entram; 13.12: o `EvolveTaskModal` vira card na página, não modal)" | O gesto duplo do visor sem separar "travar" de "evoluir" (V2, adiado — funcionalidade nova); a leitura "N complete days to go." (V3, adiada a lote de copy); o × permanente do `UnlockNudge` (V4, volta ao código — D11 não é reaberta) | "X1–X5 e S1–S5 são o diff da Evolução; nenhum item muda regra de jogo (`02`)" — V1 era regra (o `EvolveTaskModal` sobre o clímax) e foi ao dono, que decidiu o card |
| 14/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.12 | 🧭 dono (14/09/2026, checkpoint de Evolução, em modal): "O aviso pós-evolução ('cadastre mais N tarefas para garantir o ponto de evolução') vira CARD na página de Evolução, não modal" — a cerimônia termina em silêncio; a mensagem mora onde a barra já mudou; nasceu como o pedido V1 de `../design/DECISOES-WIREFRAME.md` §10.2 (ressalva 4b do `soulmon-guarda-linha-vermelha` e achado #4 do `soulmon-product-designer`: `EvolveTaskModal` montado logo depois da cerimônia, dois toques seguidos em cima do clímax) | Manter o modal (visto com garantia) | "se a meta do estágio novo passar a ser ignorada (dia completo cai depois de evoluir), rever" |
| 14/09/2026 | `../STATUS.md#-14092026--wireframes-da-evolução-desenhados-criticados-corrigidos-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa", 3 bloqueantes B1–B3 (ordem de foco invertida, a cerimônia sem semântica de diálogo, risco de flash na intercalação) + W3 o estado por nó, todos aplicados na rodada 2; `soulmon-product-designer` 8 achados: a data e a saída relacional na cerimônia, o gesto duplo do visor, o modal em cima do clímax; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", sem veto: o cadeado avisa dos corações, a data, a pausa antes do modal); as 21 linhas `EVO-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado`, com o link do canvas na tabela-mestra. Achados de passagem (código): ⚠️ **flash** — a cerimônia intercala sprites brancos de 420 ms até 55 ms (~18 trocas/s) sobre fundo escuro, acima do piso do WCAG 2.3.1; capar em ≥ 334 ms sempre; `EvolutionCeremony` sem `role`/`aria-modal`/trap/Escape num z-500; não lê `prefers-reduced-motion` (o `MilestoneCeremony` lê); sem a data e com saída neutra; "LOCKED" nomeia duas coisas em EN; o cadeado não avisa que não protege de degeneração; `EvolveTaskModal` no kit antigo com botões só em inglês; o gesto duplo do visor; "Degenerate" fora do inventário; no demo os estados de sprite nunca disparam | — | próximo canvas: Jogos |
| 15/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#11-jogos-entra--volta--sai-decisão-do-soulmon-design-lead-15092026` §11.1–§11.4 | Decisão do `soulmon-design-lead` sobre Jogos, em três tabelas: **entra** (J1–J5 — o card do oponente no Torneio = criatura + nome + estágio, sem a faixa (veto 3b do guarda à faixa reaproveitada); o chrome persistente da run ("Dungeon · Floor N/5 · scene · enemy I/6" + ×) em todas as fases de luta; uma linha de instrução no pesadelo ("Tap when the marker crosses the middle."); estados que a rodada 1 não tinha (`sem-motor` da Arena, `fightError` do Torneio, relógio de defesa 3,0s por padrão, offline do Torneio — D9); fidelidade de a11y — × primeiro interativo, `aria-label` real dos cards, plural real), **volta** (V1 → virou 13.13; V2 confirmação ao sair da run pelo ×, adiada a `STATUS`; V3 a fonte pixelada do popup/placar, adiada a `STATUS`; V4 viewport curto, aceito como nota) e **sai** (S1–S4 — a faixa ao lado do oponente, o `aria-label` inventado da rodada 1, "(no time limit)" como padrão do pesadelo, a Biblioteca como card da página). Canvas: [Soulmon — Wireframes Jogos](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a) (16 artboards, arquivos em `../design/wireframes/jogos/`). §11.4: "Checkpoint fechado em 15/09/2026 — o dono APROVOU (J1–J5 entram; 13.13: o 'N pts' do resultado do Torneio fica, como poder da partida)" | Tirar o número "N pts" do resultado do Torneio (recomendação implícita da tensão levantada pelo `soulmon-product-designer`) | "V1 era regra (o 'N pts' do resultado) e foi ao dono, que decidiu manter" |
| 15/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.13 | 🧭 dono (15/09/2026, checkpoint de Jogos, em modal): "O resultado do Torneio mostra 'Against ‹oponente› · N pts', e o N é o poder DAQUELA partida" (`result.points`, com aleatoriedade) — nunca `lifetimePoints` do oponente; o número some com "Continue"; nasceu como o pedido V1 de `../design/DECISOES-WIREFRAME.md` §11.2 (tensão nova levantada pelo `soulmon-product-designer` #3 no checkpoint de Jogos; aceite 3c do guarda: poder da partida, não do jogador) | Tirar o número (o diálogo só com o nome e os Emblemas) | "se o 'N pts' virar comparação entre jogadores (ex.: aparecer fora do diálogo, ou como acumulado), sai" |
| 15/09/2026 | `../STATUS.md#-15092026--wireframes-dos-jogos-desenhados-criticados-corrigidos-e-aprovados-pelo-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa", B1–B6 todos aplicados na rodada 2; `soulmon-product-designer` 6 achados: o chrome da run some nas fases de luta, a fonte pixelada vaza para o texto, "N pts" por pessoa é tensão nova; `soulmon-guarda-linha-vermelha` "APROVADA COM RESSALVA", 1 veto — 3b à faixa ao lado do oponente); as 25 linhas `JOGO-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado`, com o link do canvas na tabela-mestra. Achados de passagem (código): o × da masmorra sai da run sem confirmação em qualquer fase, inclusive após gastar Bits em "Go deeper"; `sm-px-arcade-value/-label` (Silkscreen) no popup "PERFECT!" e no placar — fonte pixelada no corpo do texto (PRINCÍPIOS §7); os cards da página de Jogos sem `aria-label` (nome acessível = concatenação título + descrição + tag sem separador); "N match(es)" e o "(s)"; o pesadelo sem instrução da barra; a Arena tem um estado `sem-motor` e o Torneio um `fightError` sem linha no inventário | — | próximo canvas: Loja |
| 15/09/2026 (checkpoint fechado no mesmo dia) | `../design/DECISOES-WIREFRAME.md#12-loja-entra--volta--sai-decisão-do-soulmon-design-lead-15092026` §12.1–§12.4 | Decisão do `soulmon-design-lead` sobre a Loja, em três tabelas: **entra** (L1–L4 — o saldo do topo é UMA leitura por segmento (Bits no Shop, Emblemas no Tournament, como `ShopModal.tsx`); a seção Itens vende só os três chips de atributo ("+3 Power/Harmony/Benevolence", `CHIP_BOOST = 3`), o Coraçãozinho fora da vitrine (nota ⚰️: `SPECIAL_ITEMS`, fonte única = drop raro da masmorra, `HEART_HEAL = 1`); o card travado como `button disabled`, com o 🔒 como sinal não textual e o rótulo sem marcação vazada; fidelidade de detalhe — missão em dois `<p>`, borda da recusa em 1px, `chevron_right` no convite demo, saída por outra célula da `BottomNav`), **volta** (V1–V4 — legibilidade do número de Bits adiada à Fase 2; `mood-checkins` alvo 3 × 13.10, a troca sem teste e o `!asPage` ramo morto, todos adiados ao `STATUS`) e **sai** (S1–S5 — "Little Heart — 80 Bits" na seção Itens, os dois saldos juntos no topo, o "+2" dos chips (`CHIP_BOOST = 3`), a variante modal `LOJA-12` (D5), as cinco abas do `CLAUDE.md`). Canvas: [Soulmon — Wireframes Loja](https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8) (7 artboards, arquivos em `../design/wireframes/loja/`). §12.4: "Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono: fecha quando o `design-critic` carimba PASSA e o guarda não tem veto pendente); a única decisão de regra (o Coraçãozinho na vitrine) o dono já tinha tomado no início da meta → 13.14; os chips por Bits ficam" | O Coraçãozinho de volta à venda na seção Itens (rodada 1 — corrigido pelo veto 2b do guarda e pela decisão do dono no início da meta) | "L1–L4 e S1–S5 são o diff da Loja; nenhum item muda regra de jogo (`02`)" |
| 15/09/2026 | `../REGISTRO-DE-DECISOES.md#13-as-decisões-do-dono-de-13092026--cinco-reaberturas-na-rodada-de-wireframes` §13, linha 13.14 | 🧭 dono (15/09/2026, no modal de abertura da meta autônoma): "O Coraçãozinho NÃO volta à loja" — `heart` fica em `SPECIAL_ITEMS`, fonte única = drop raro da masmorra (`HEART_HEAL = 1`); a seção Itens vende só os três chips de atributo (+3, `CHIP_BOOST`), que ficam; nasceu porque a rodada 1 do wireframe da Loja o desenhou de volta por engano — D7+D15 (06/09/2026) já o tinham tirado | Vender de novo (Créditos → Bits → cura sem esforço, o furo que D7+D15 fecharam) | "se o drop da masmorra deixar de existir e a cura precisar de outra fonte, reabre — nunca por Bits" |
| 15/09/2026 | `../STATUS.md#-15092026--wireframes-da-loja-desenhados-criticados-corrigidos-e-aprovados-meta-autônoma-do-dono` | Registro de ESTADO, não decisão: crítica em duas rodadas (`design-critic` rodada 1 "não passa" — B1 os dois saldos juntos no topo (código mostra só a moeda do segmento), B2/B3 o Little Heart à venda (saiu em 06/09; "meio coração" era falso), B4 marcação vazada no `aria-label` do card travado, ressalvas 5–9, todos aplicados na rodada 2; `soulmon-product-designer` 5 achados; `soulmon-guarda-linha-vermelha` "APROVADA" — veto 2b ao Coraçãozinho na vitrine, ressalva 2a: os chips são +3); as 12 linhas `LOJA-*` de `../design/INVENTARIO-WIREFRAMES.md` passaram a `aprovado` (`LOJA-12` fica `fora`, D5), com o link do canvas na tabela-mestra. **Checkpoint fechado em 15/09/2026 — aprovação automática** (meta do dono: fecha quando o crítico carimba e o guarda não tem veto pendente). Achados de passagem (código): `weeklyMissions.ts` `mood-checkins` ainda com alvo 3 (13.10 pede 5); nenhum teste monta os botões da troca Créditos → Bits; `ShopModal` sem `asPage` é ramo morto; ⚠️ `03 §4.6` ainda cita `kind === 'heart'` na seção Itens | — | próximo canvas: Estatísticas |

---

## 12. Desktop e Steam

Fonte principal: `../../desktop/README.md` (31/07/2026), `../../desktop/STEAM.md`
(31/07/2026) e `../PLANO-DESKTOP-STEAM.md` (31/07/2026, com a seção
`#9-onde-este-documento-e-a-auditoria-discordaram--e-quem-venceu` registrando
o próprio doc perdendo para uma auditoria).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 31/07/2026 | `../PLANO-DESKTOP-STEAM.md#0-as-três-frentes` | Overlay é controle remoto do app, não um segundo app — lê/escreve save por `/api/save` | Reimplementar regras de jogo no desktop | fechado pela decisão de "regras deixaram de ser cópia" (`f6fb5f30`, ver `CLAUDE.md` footgun 9) |
| 26/08/2026 | `../PLANO-DESKTOP-STEAM.md#9-onde-este-documento-e-a-auditoria-discordaram--e-quem-venceu` | Registro de onde o plano e a auditoria discordaram, e qual dos dois venceu | O que o plano original previa (perdeu no item registrado) | — |
| 26/08/2026 | `../../desktop/STEAM.md#empacotamento-executado-pela-primeira-vez--26ago2026` | O empacotamento (`npm run dist:steam`) rodou pela primeira vez, 274 MB, EXIT=0 | — | falta só `steamcmd` com login de parceiro (dono) |
| — | `../../desktop/README.md#-duas-coisas-que-valem-saber-antes-de-mexer` | Duas advertências operacionais registradas antes de qualquer edição no overlay | — | — |
| 26/08/2026 | `CLAUDE.md` raiz, footgun 9 | "As tabelas de HP/energia NÃO são mais cópia" (`d56bba7a`) — desktop importa de `types/progression.ts` | Copiar as tabelas (causava rebaixamento de save mega a rookie) | — |

---

## 13. Deploy e infraestrutura

Fonte principal: seção "Deploy" do `CLAUDE.md` raiz (não reescrita aqui — só
apontada) e os blocos datados do `../STATUS.md` sobre infraestrutura ligada.

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 07/09/2026 | `../STATUS.md#-070926-sessão-local--a-infra-que-dependia-do-dono-foi-ligada` | Projeto Firebase próprio, `FIREBASE_PROJECT_ID` ligado, VAPID girado, KV/D1 próprios ativos | Continuar em modo aberto / KV compartilhado indefinidamente | — |
| 07/09/2026 | `../STATUS.md#-continuação-da-mesma-sessão--o-login-foi-ao-ar-e-foi-usado` | Login mudou de link-por-e-mail para Google + e-mail/senha; `.env.production` passou a ser COMMITADO | Manter `.env.production` fora do git (causava login quebrado a cada push do CI) | travado por `src/deploy/firebaseNoBuild.contract.test.ts` |
| — | `CLAUDE.md` raiz, seção Deploy | A URL de produção é `soulmon.mateus-sprnd.workers.dev`; referência canônica é `arquivo` + símbolo, nunca `arquivo:linha` | Citar linha numerada (apodreceu 3× em um único dia) | régua viva: `src/deploy/appUrl.contract.test.ts` |
| 26/08/2026 | `../STATUS.md#-a-previsão-se-confirmou-no-primeiro-apk--e-em-minutos` | O primeiro APK abriu o DigiApp (URL antiga assada em 4 arquivos) — corrigido e travado | Confiar em revisão manual das 4 fontes | régua: `appUrl.contract.test.ts` |
| — | `CLAUDE.md` raiz, seção Deploy, `CACHE_VERSION` | O número do cache sai do `CLAUDE.md` de propósito (apodreceu 3×); só o LUGAR (`public/sw.js`) fica documentado | Manter o número no `CLAUDE.md` | — |

---

## 14. Segurança

Fonte principal: `../STATUS.md#1-segurança--auditoria-de-2026-08` (a seção 1
inteira, com 1.1 Explorável agora / 1.2 Latente / 1.3 Auditado e seguro / 1.4
Segredos no histórico / 1.5 Cadeia de suprimentos). Rodadas de sweep:
`product/soulmon-01/sweeper/round1` a `round9` + `security-verification.md`.

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 07/09/2026 | `../STATUS.md#11-explorável-agora-em-produção`, linha SEC-1 | `denyUnlessOwner` — 5 de 11 ações sem autorização. **Fechado em produção** ao ligar `FIREBASE_PROJECT_ID` | Continuar em modo aberto | verificado na borda: `/api/save` sem token → 401 |
| 26/08/2026 | `../STATUS.md#-n-8--prompt-injection-o-texto-do-jogador-sai-da-lista-de-regras-e-vira-dado-delimitado` | Texto do jogador sai da lista de regras do prompt e vira dado delimitado | Interpolar o texto do jogador direto no prompt de regras | — |
| 26/08/2026 | `../STATUS.md#-15-cadeia-de-suprimentos--a-lacuna-inteira-que-ninguém-tinha-auditado` | O gate do CI estava MORTO — achado que abriu a rodada 1.5 inteira | Confiar que o CI protegia sem verificar | corrigido |
| 25/08/2026 | `../STATUS.md#-analisado-em-26082026--rebaixado-de-projeto-para-formulário` | Keystores vazados são do DigiApp (chave de upload, não de release) — risco rebaixado de 🔴 para 🟡 | `git filter-repo` (reescreveria todo o histórico sem mudar o risco real) | — |
| 09/08/2026 | `product/soulmon-01/sweeper/round9-billing.md` | Rodada dedicada de sweep no billing | — | — |
| 08/09/2026 | `../STATUS.md#-08092026--o-app-pede-o-microfone-e-manda-o-áudio-para-fora-e-a-data-safety-diz-que-não` | Achado fora de escopo (parecer de privacidade da squad de som) sobre o `ChatBox`/Supabase | — | resolvido em 09/09 — ver tema Separação do fork, e `09-HISTORICO.md` §4 |

---

## 15. Separação do fork (DigiApp → Soulmon)

Fonte principal: `../SEPARACAO-DIGIAPP.md` (criado 31/07/2026) e
`../AUDITORIA-ALINHAMENTO.md` (06–07/09/2026, com a seção
`#limpeza-da-herança-do-digiapp-autorizada-em-07092026`).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 31/07/2026 | `../SEPARACAO-DIGIAPP.md#ordem-segura-de-separação` | Ordem que separa sem derrubar o app no meio do caminho | Trocar tudo de uma vez (risco de janela de queda) | — |
| 07/09/2026 | `../AUDITORIA-ALINHAMENTO.md#limpeza-da-herança-do-digiapp-autorizada-em-07092026` | Autorização explícita do dono para a limpeza — nomes, chaves, KV, PI | — | — |
| 07/09/2026 | `../AUDITORIA-ALINHAMENTO.md#decisões-do-dono-07092026-fecham-achados-desta-auditoria` | Lote de decisões do dono fechando os achados da auditoria de alinhamento | — | — |
| 06/09/2026 | `../AUDITORIA-ALINHAMENTO.md#o-achado-que-vale-mais-que-os-outros-o-ledger-mente-em-seis-lugares` | O achado mais caro da auditoria: o ledger do plano de melhorias mentia em 6 lugares (marcava `VERIFICADO` sem prova) | — | — |
| 07/09/2026 | `CLAUDE.md` raiz, bloco "NINGUÉM NUNCA USOU O APP EM PRODUÇÃO" | 44 pontos entre código e docs decidiam sobre a premissa falsa de usuário existente | Continuar tratando "quebraria o save de quem já joga" como intocável | Decisão levada ao dono "com a conta na mão", não decidida sozinha |

---

## 16. Descanso e sonhos

Fonte principal: `../PLANO-TAREFAS.md#parte-3--saúde-e-sono` (Parte 3, 3a, 3b,
3c — 19/08/2026) e `../REGISTRO-DE-DECISOES.md` §3 "Os quatro critérios que
nasceram depois" (o critério que rege a Janela de Descanso).

| Data | Onde | O que foi decidido | Alternativa que perdeu | Gatilho de revisão |
|---|---|---|---|---|
| 19/08/2026 | `../PLANO-TAREFAS.md#parte-3--saúde-e-sono` | Premia o COMPORTAMENTO (deitar no horário), nunca o RESULTADO (dormir bem) — evita fabricar ortossonia | Score de sono / pontuar qualidade do sono | — |
| 19/08/2026 | `../PLANO-TAREFAS.md#parte-3a--pesadelos-o-sono-deixa-de-ser-passivo` | Pesadelos como mecânica ativa, não decoração passiva da noite | Sono como tela estática | — |
| 19/08/2026 | `../PLANO-TAREFAS.md#parte-3b--passos-o-sensor-certo-é-o-mais-burro` | O sensor de passos escolhido é deliberadamente o mais simples disponível | Sensor mais preciso (Health Connect) | Fase 4 (sensores) é decisão separada do dono, ver `../STATUS.md` §3.2 |
| 19/08/2026 | `../PLANO-TAREFAS.md#parte-3c--mais-parâmetros-de-v-pet-não--mais-consequências` | Recusa adicionar mais parâmetros de v-pet; prefere mais consequência aos parâmetros existentes | Adicionar novos medidores ao pet | — |
| 08/09/2026 | `../REGISTRO-DE-DECISOES.md` §5.6, "Sonhos sazonais continuam obteníveis fora da estação" | A regra que separa "estação" de "battle pass" | Exclusividade sazonal (fecha o sonho fora da janela) | — |
| 26/08/2026 | `CLAUDE.md` raiz, tabela de regras, linha 🌠 Sonhos | 30 sonhos no `DREAM_CATALOG`, raridade vem da REGULARIDADE, nunca da duração | Raridade por duração do sono | — |

---

## 17. Onde procurar quando não está aqui

| Diretório / arquivo | O que contém |
|---|---|
| `docs/REGISTRO-DE-DECISOES.md` | O consolidado — toda decisão de produto com evidência, alternativa perdedora e gatilho de revisão. Índice próprio em `## 0. Índice`. **Primeira parada.** |
| `docs/STATUS.md` | Registro vivo, cronológico, com blocos datados (`## ` e `> ## `) — achados de segurança, o que foi corrigido, o que depende do dono (§3), dívidas conhecidas (§4). Não é decisão de produto; é ESTADO. |
| `docs/reviews/2026-08-03/` | A rodada de revisão externa que originou o projeto de melhorias — 3 relatórios especialistas (growth/ASO, monetização, user research) + `00-CONSOLIDADO.md` |
| `docs/plano-melhorias/` | O sistema de guarda do plano de 86 pacotes (WP). `LEDGER.md` é o mapa de custódia; `ledger/*.md` é o estado por domínio (um arquivo por guarda); `estudo/*.md` é a leitura do corpus pré-Mobbin por domínio; `mobbin/*.md` é a leitura do dossiê Mobbin por domínio; `A-F-*.md` (`A-onboarding.md` … `F-conteudo.md`) são os pacotes originais por área, antes da rodada Mobbin |
| `docs/PLANO-MELHORIAS.md` | O plano em si — diagnóstico, ondas 0–5, guardrails (§9), decisões do dono (§10, respondidas em §15) |
| `docs/HANDOFF-*.md` | Handoffs de sessão para sessão — `HANDOFF-SESSAO-LOCAL.md`, `HANDOFF-QA-REVISAO.md`, `HANDOFF-ARTE-GEMINI.md`. Contam o que uma sessão entregou e o que a próxima precisa saber, não decisão de produto |
| `docs/AUDITORIA-ALINHAMENTO.md` | Duas auditorias (06/09 e o "Fecho da auditoria" de 07/09) comparando o que o ledger dizia com o que o código sustenta |
| `docs/squad/` | Briefing e rubrica do squad de revisão de 14 especialistas (`00-BRIEFING.md`, `01-RUBRICA.md`, `02-SQUAD.md`) |
| `product/soulmon-01/` | Execução técnica: `balance/` (a auditoria de carga diária que originou P1/P2/P5), `sweeper/` (9 rodadas de auditoria + segurança), `ui/` (6 rodadas de alinhamento visual + geração de arte) |
| `docs/guia-experiencia/` | O corpus de PESQUISA (não decisão): transcrições e relatórios do NotebookLM sobre Mobbin/Tim Gabe, psicologia do tamagotchi, streaks, monster-taming, onboarding, paywall, retenção, o dossiê Mobbin de 84 vídeos. É a fonte que o `REGISTRO-DE-DECISOES.md` cita com 📚/🎥/📰/🖼️ |
| `docs/SOM.md` | Guia operacional do eixo sonoro — onde cada regra mora, quem é dono, que gate roda |
| `.claude/skills/squad-som/SKILL.md` | Estado dos portões da squad de som, lições de método do run `som-01` |
| `docs/SEPARACAO-DIGIAPP.md` | Passo a passo da separação de dados/infra do fork — o que já saiu e o que ainda depende do dono |
| `docs/PLANO-*.md` (raiz de `docs/`) | Um plano por sistema: `PLANO-EVOLUCAO.md` (benchmark de agosto + fases), `PLANO-TAREFAS.md` (motor de hábitos/tarefas + sono), `PLANO-COOP.md`, `PLANO-DESIGN.md`, `PLANO-DESKTOP-STEAM.md`, `PLANO-PRODUTO.md`, `PLANO-TELA-IDENTIDADE.md` |
| `docs/RENASCIMENTO.md` | Spec do Rebirth — ideia, 4 decisões, 3 escolhas, o que fica aberto |
| `docs/ORACULO.md` | Como a criatura de alguém é decidida — as duas metades (leitura + criação), com rodadas datadas |
| `docs/SHOP-PLAN.md` | Catálogo e regras da loja de Bits |
| `docs/ASSINATURA-SPEC.md` | A spec da assinatura (WP5.4) — por que quase tudo nela é "não" |
| `docs/PLAY-DATA-SAFETY.md` | Respostas do formulário de Segurança de Dados do Google Play, tipo a tipo |
| `docs/BILLING-SETUP.md` | Setup técnico do billing — produtos, secrets, vínculo de recibo com conta |
| `docs/DEPENDE-DE-VOCE.md` | Lista consolidada do que só o dono pode fazer (parcialmente superada por `STATUS.md` §3 — checar as duas) |
| `docs/GUIA-EXPERIENCIA.md` | O guia mestre pré-Mobbin — sumário executivo, jornada etapa por etapa, DON'Ts, roadmap, decisões do dono (§H), rodada 2 pós-transcrição (§I) |
| `docs/Attributions.md` | Atribuições de código, sprites, áudio e tipografia — e o registro de que "saiu tudo" era meia verdade |
| `docs/design/` | O redesenho em duas fases (desde 13/09/2026): `PRINCIPIOS-DE-WIREFRAME.md` (a pesquisa reduzida ao que cada família de tela obriga e proíbe), `INVENTARIO-WIREFRAMES.md` (tela × estado, com o estado do wireframe — `a desenhar` → `aprovado` — e o link do canvas de cada fluxo), `DECISOES-WIREFRAME.md` (as decisões prévias do dono de 13/09/2026 e, por fluxo, o entra/volta/sai do `soulmon-design-lead`; §5 é a Home, 13–14/09/2026; §6 é Atividades, 14/09/2026; §7 é Rituais, 14/09/2026; §8 é Pet, 14/09/2026; §9 é Onboarding-funil, 14/09/2026; §10 é Evolução, 14/09/2026; §11 é Jogos, 15/09/2026; §12 é Loja, 15/09/2026) e `wireframes/<fluxo>/` (os `.dc.html` de cada canvas). Decisão de REGRA que nasce ali não fica ali: volta para o `REGISTRO-DE-DECISOES.md` §13 (13.1–13.14). Porta de entrada: `docs/HANDOFF-WIREFRAMES.md` |
| `desktop/README.md` / `desktop/STEAM.md` | Arquitetura do overlay Electron e o guia de empacotamento para a Steam |
| `memory/company.md` / `memory/product-context.md` | Contexto de operador e produto usado por agentes de outras squads (ProdSquad) — não é registro de decisão do Soulmon em si |

---

## 18. As decisões do dono em aberto

A lista viva é `../STATUS.md#3-depende-de-você` (§3.1 Segurança e direitos,
§3.2 Lançamento, §3.3 Steam, §3.4 Ordem que evita ficar fora do ar) — **não
duplicada aqui**, porque duplicar é criar uma segunda fonte que diverge em
silêncio (footgun 9 do `CLAUDE.md`, aplicado a prosa em vez de código). Em
09/09/2026 o topo do mesmo documento também trazia um bloco específico,
`../STATUS.md#-depende-do-dono-09092026--três-decisões-abertas`: o projeto
Supabase da transcrição, a decisão sobre `getRedirectResult` no login, e a
palavra do rótulo do Bestiário na Home.

Para decisões de PRODUTO (não infraestrutura) que aguardam o dono, a lista
correspondente é `docs/PLANO-MELHORIAS.md#10-decisões-que-só-o-dono-pode-tomar-e-o-que-cada-uma-destrava`
— e a maioria já foi respondida em
`#15-as-decisões-do-dono--respondidas-06092026` (D1–D17 + H.4). O que ainda
não tem resposta registrada em lugar nenhum, na data deste documento:

- A folga semanal não cobrir o dreno de cocô (tema 1, linha "A folga NÃO
  cobre o dreno de cocô").
- O preço em R$ para quem usa o app em inglês (tema 4).
- Os nove emojis que renderizam vazio — a escolha do glifo de troca é do
  dono, o guard só congela a dívida (tema 6).
- A hipótese do `signInWithRedirect` barrado pela mesma proteção que bloqueia
  popup (tema 3, aposta 6 do `REGISTRO-DE-DECISOES.md` §7).
