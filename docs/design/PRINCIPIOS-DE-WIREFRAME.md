# Princípios de wireframe — o que a pesquisa obriga e proíbe, por família de tela

**Dono:** `design-curador-padroes` (SQUAD-DESIGN) · **Data:** 13/09/2026 · **Método:** W1–W10 de
`.claude/skills/squad-design/METODO.md`

**Fontes lidas, com as seções:**

| Sigla usada aqui | Arquivo | Seções lidas |
|---|---|---|
| `MOB §N` | `docs/guia-experiencia/09-mobbin-dossie.md` | §6A/§6B (celebração), §8 (coleção), §8A/§8B (prestígio), §10A/§10B (win-back), §11A/§11B (oferta), §13A/§13B (social), §15.1–§15.6, §16.1–§16.5 |
| `M-nasc` · `M-const` · `M-vinc` · `M-perm` · `M-sust` · `M-LV` | `docs/plano-melhorias/mobbin/{nascimento,constancia,vinculo,permanencia,sustento,linha-vermelha}.md` | inteiros |
| `BRIEF` | `docs/plano-melhorias/BRIEF-MOBBIN.md` | restrições + os 12 dossiês |
| `G01` · `G03` · `G05` · `G07` | `docs/guia-experiencia/01-youtube-mobbin-timgabe.md` · `03-gamificacao-streaks.md` §1.3 · `05-onboarding.md` · `07-retencao-engajamento.md` | §2 lições 1–23 · §1.3 · §2–§4 · §4–§8 |
| `PD §N` | `docs/PLANO-DESIGN.md` | §0, §5, §5.1, §6, §7 |
| `REG §N` | `docs/REGISTRO-DE-DECISOES.md` | §3 (princípios + 4 critérios + 5 regras sobre perda), §5.1–§5.8 |
| `V §N` | `docs/manual/01-VISAO.md` | §4 princípios, §5 critérios, §6 regras sobre perda, §7 as 21 linhas vermelhas |
| `02 §N` | `docs/manual/02-REGRAS-DE-NEGOCIO.md` | só as linhas **"O que NÃO faz"** e **"Onde a UI mostra"** das seções citadas |
| `03 §N` | `docs/manual/03-FLUXO-DE-TELAS.md` | §3.1/§3.2 (as duas filas) |
| `PP` | `docs/PLANO-PRODUTO.md` | Parte 0 (time-to-value medido), Parte 3 (proposta de valor) |

**O que este documento NÃO cobre:** não desenha tela (→ `design-wireframer`), não decide o que
entra (→ `soulmon-design-lead`), não trata identidade visual — cor, tipografia, "O Visor", sprite
(Fase 2, `PD §0`), não substitui o inventário de superfícies, não reabre decisão registrada. Onde
a pesquisa contradiz uma decisão, a tensão está em **§14** e **não foi decidida aqui**.

---

## §0 Como o wireframer usa isto

1. Abra a família da tela que vai desenhar; **Obrigatório** e **Proibido** são checklist, não leitura.
2. Todo item tem fonte com seção (W8). Se você quiser algo que não está aqui, ache a fonte antes — ou marque `[novo]` e leve ao `design-lead`.
3. **Proibido vence Obrigatório**, sempre: as 21 linhas vermelhas (`V §7`) valem no wireframe cinza igual (W6).
4. **Estados** é a lista mínima do W3 para aquela família — um wireframe só do caso feliz volta na crítica.
5. Se a tela responde duas perguntas, ela é duas telas (W4). A "Pergunta da tela" de cada seção é a que vai no rodapé do artboard.

---

## §1 Home / visor do pet

**Pergunta da tela:** *"como está meu bicho, e o que eu faço agora?"*

**Obrigatório**
- Pet **fixo**, lista rolando por baixo — arquitetura BitePal, e já é regra do dono (`MOB §6 dossiê 5`; `M-vinc §1`; `CLAUDE.md` › UI, `.sm-pet-sticky`).
- **Nome do pet imediatamente acima ou abaixo da criatura**, nunca em página secundária. É convergência (b) do dossiê 5 e hoje é LACUNA medida (`M-vinc §1`, Replika: pílula nome-em-bold + relação em cinza).
- **Sombra de contato elíptica** sob o sprite: convergência (a) de 5 apps (Finch, Yazio, Abode, Tolan, BitePal) e a única invariante de presença ausente (`M-vinc §4`).
- **Estado por pose / adereço / balão, nunca por frase que descreve o estado.** "Nenhum app do dossiê escreve 'seu pet está feliz'" (`MOB §6`; `M-vinc §1`, Ahead). Balão com **cauda** apontando para o pet (Yazio) — já existe.
- **Slot de avisos com UM cartão + botão `+N`**, na ordem literal `firstDay → hp → semanal → triagem → priming → recomeço` (`03 §3.2`; W7).
- Teto de **5 leituras numéricas simultâneas**: HP, energia, x/y de rituais, Bits, Vínculo (`PD §5.1`). Atributos e Créditos **saem da Home** por decisão do mesmo §.
- Máx. **8 ícones** no chrome somado (`PD §5`); ícone grande e **pelado**, nunca em box (`PD §0.7`).

**Proibido**
- Qualquer oferta na Home. O Soulmon tirou até o saldo de Créditos; o próprio risco residual do Garmin é "ainda é o primeiro conteúdo ao abrir" (`M-sust §3 rejeitados`; `MOB §11A`).
- Medidor que **sobe e desce sozinho com o relógio** (barra de diversão/felicidade) — critério B (`REG §3`; `V §5`).
- Barra de Vínculo em `0/75` sob o nome no D1 — é o Paired com `0 days` ×3: "mecânica generosa não compensa exibição punitiva" (`MOB §10A`; `M-vinc §2`).
- Fileira semanal `S M T W T F S` com dias vazios desenhados na Home sem legenda (`MOB §8B`; `M-const §3`).
- Fala idle que **pede trabalho** ("Vamos completar tarefas!") — dispara sozinha, não é reação (`M-vinc §8`).

**Padrão de referência** — **Finch, primeira home** (`MOB §15.1`): quarto ilustrado, pet **no ninho** (imóvel), card de aventura, lista de tarefas, tab bar de 6. **Copiar:** a limitação inicial que dá sentido à primeira ação (pose, não engenharia); o card de convite acima da lista. **NÃO copiar:** `7 goals left for today!` (contagem de dívida) nem a economia de energia `0/15` que zera diariamente exibida como fração. **Tolan home** (`MOB §15.6`): chrome reduzido a 3 ícones nus — copiar a densidade, não o `COMPATIBILITY 92%`.

**Estados:** primeira vez (FirstDayCard) · dia normal · HP ≤ 1 · dormindo · cocô presente · retorno após ausência · demo × pago · sem nenhuma atividade cadastrada · reduced-motion · `+N` avisos expandido.

**Regras do produto que mordem aqui:** `02 §1` (a barra de corações; o card de 1 coração usa `tasksToAvoidHeartLoss`, não meio requisito) · `02 §2` (carinho não cura com HP cheio: o gesto vira só animação) · `02 §6` (energia não enche com o tempo) · `02 §13` (`needsAttention` devolve **no máximo UM** desejo por vez) · `02 §55` (nível e título do Vínculo sob o nome).

---

## §2 Lista de atividades e tarefa (criar / editar / triagem / foco)

**Pergunta da tela:** *"o que eu escolho fazer, e como eu saio do que não vou fazer?"*

**Obrigatório**
- **Contar o feito, nunca o restante.** Hatch (`6 remaining`) e Shopify (`0/6`) são os anti-padrões nominais (`MOB §15.1`/§4; `M-nasc §1` 3.6; `M-LV` #11).
- **Quatro saídas com o mesmo peso** na triagem (hoje / esta semana / algum dia / deixar pra lá), distinguidas por **glifo + palavra**, nunca por cor (`02 §34`).
- Contador de adiamentos **visível** e intervenção em 3 (`REG §5.2`, Sunsama).
- Tarefa assombrada: esmaecer por **cor dedicada**, o pet **olha**, e **nenhuma palavra** acompanha o olhar (`02 §29`).
- `RitualRow`: **1 selo + 1 checkbox + no máx. 2 metadados** visíveis; o resto em "mais" (`PD §5`).
- Aviso de carga do dia é **texto**, e o botão de confirmar continua ativo (`02 §33`).

**Proibido**
- Vermelho de atraso, "você está atrasado", total de pendências no topo (`02 §34`).
- Percentual de conclusão como leitura principal — monday.com usa `33%` e serve, mas percentual cru de constância é proibição #14 (`V §7`); na lista, prefira a fração de **feitos**.
- Recompensa por **contagem** de tarefas (proibição #16, `V §7`; `REG §5.2` — é o defeito do Karma do Todoist).
- Bloquear a criação/o foco por sobrecarga (`02 §33`: "o certo é mudar o TEXTO, não a permissão").

**Padrão de referência** — **Noom, `Your challenges`** (`MOB §8A`): pips `◆◇◇◇◇` que **só enchem** (o estado "perdi progresso" é visualmente inexprimível) + etiqueta **`One-time`** declarando o que é permanente. **Copiar** os dois. **NÃO copiar** a inconsistência de layout (um card com pips, o vizinho com botão) nem `Did it today` como único affordance. **Finch `Daily Quests`** (`MOB §15.5`): quest concluída fica no topo, **riscada**, como prova; linha tracejada liga os marcadores sugerindo sequência sem impor ordem. **NÃO copiar** o `⏱ 4d 22h`.

**Estados:** vazio (nenhuma atividade) · só hábitos · só tarefas · com assombrada · com vencida · someday/dropped visíveis · foco escolhido (0/1/2/3) · sobrecarga · demo no teto de criação · edição de recorrente · reduced-motion.

**Regras do produto que mordem aqui:** `02 §23` (meta é PESO, nunca itens) · `02 §24` (não existe fila de ocorrências atrasadas) · `02 §30` (não esconde, não reagenda sozinho) · `02 §31` (não deleta, não marca como concluída) · `02 §32` (foco não mostra progresso parcial, não dá moeda) · `02 §35` (quick add não valida nem recusa).

---

## §3 Onboarding e oráculo (identidade → free/pago → perguntas → reveal)

**Pergunta da tela:** *"quem é essa criatura, e por que ela é minha?"*

**Obrigatório**
- **A criatura antes do pedágio.** Finch entrega na tela 2 de 21; Replika entrega na última, atrás do paywall. "A posição da recompensa dentro do fluxo importa mais que o comprimento do fluxo" (`MOB §15.1`).
- **O reveal tem a criatura desenhada.** Hoje o bloco `REVEAL` tem **zero `<img>`** — é "Finch entregar o birb como um parágrafo", a maior alavanca única do funil (`M-nasc §1` 1.1; `G05` F1).
- **Nome do arquétipo antes do texto**; um único botão primário de largura total, sem garfo — convergência de 5+ apps, e o Soulmon já faz (`MOB §2`; `M-nasc §1` 1.2).
- **Marcar os termos que vieram das respostas** (Lovi: destaque cromático dentro da frase) e **ecoar o `soulGoal`** — é a prova de que a resposta foi usada (`MOB §2`; `M-nasc §1` 1.3; `G05` P1#8/#9).
- **Justificativa por campo** em toda coleta (Replika faz bem isto dentro de arquitetura ruim; as duas coisas são separáveis — `MOB §15.1`).
- **Estado de "gerando" com personagem + 1 linha em gerúndio na 1ª pessoa do sistema** + **skeleton fiel à forma do resultado** (GoFundMe) e estimativa **verbal** (`MOB §3`; `M-nasc §1` 2.2/2.7).
- **Erro que preserva o input** e devolve à bifurcação, sem drama e sem desculpa (ABY/Chase UK; já é o que o app faz — `M-nasc §1` 2.8).
- **Priming de push com o PET como remetente**, prévia derivada da mesma fonte da copy real, escopo declarado e frase de reversibilidade (`MOB §5`; `M-nasc §1` 4.1/4.5/4.6). O pedido vem **depois de valor entregue**.

**Proibido**
- Preço, SKU ou `UnlockNudge` dentro do reveal (`M-sust §5`: Replika e Shopify rejeitados por `REG §5.3`, conflito C.3 #1).
- Checkbox de consentimento pré-marcado no clímax (MyFitnessPal, `MOB §2`; proibição #18, `V §7`).
- Diálogo nativo do SO desenhado com seta apontando para `Allow` (Duolingo/Liven, `MOB §5`; `M-LV` #13).
- "Pode sair estranho" / aviso de qualidade sobre um output permanente (`M-nasc §1` 2.4).
- Pedir follow/compartilhamento durante a espera (Any Distance, `MOB §3`).
- `You can change this later.` aplicado à criatura — ela é declaradamente insubstituível; o princípio (baixar o custo da 1ª decisão) precisa de outro equivalente (`MOB §15.1`, nota de colisão).

**Padrão de referência** — **Finch, fluxo de 21 telas** (`MOB §15.1`), o fluxo de referência mais próximo do Soulmon em todo o acervo. **Copiar:** criatura primeiro; **reciprocidade de nomeação** (o pet pergunta o seu nome depois de ser nomeado); permissão no meio, não no fim. **NÃO copiar:** a promessa de reversibilidade do nome. **Replika** (`MOB §15.1`): **ANTI-PADRÃO como arquitetura** (venda → intimidade → conta → pedágio), **PADRÃO no detalhe** da justificativa por campo.

**Estados:** intro · escolha grátis × completo · GOAL/STRUGGLE preenchido e **pulado** · bifurcação dos 20 itens (aceito/recusado) · gerando · **sprite pendente** (silhueta) · erro de geração · reveal demo × reveal pago · link mágico enviado (com o pet esperando, `G05` P2#12) · rascunho interrompido no item 15 de 20 (`M-nasc §3` C-B).

**Regras do produto que mordem aqui:** `02 §21` (o "porquê" não vira nota, meta, cobrança nem lembrete) · `02 §22` (o Oráculo não mostra diagnóstico nem pontuação de eixo) · `PP` Parte 0 (o caminho grátis medido são **8 telas** + `WelcomePromptModal`; Finch ~6 — o wireframe não pode adicionar tela sem tirar outra).

---

## §4 Rituais (check-in, relatório diário, semanal, fresh start, humor)

**Pergunta da tela:** *"o que aconteceu, e o que eu escolho para hoje?"* — **são duas perguntas, logo duas telas** (W4): relatório olha para trás, check-in olha para frente. A fila já as separa.

**Obrigatório**
- Ordem dos intersticiais, literal: `triagem → relatório diário → check-in → sonho → pesadelo → welcome`. Um por vez; quem está abaixo **fica pendente**, nada é descartado (`03 §3.1`; W7).
- **Pendências de ontem primeiro** no check-in (Shutdown do Sunsama invertido) — `CLAUDE.md` › Rituais.
- Relatório de retorno = **absolvição + crédito ao presente**: a linha do Finch `It's okay to miss a day. The important thing is you're here today` é o melhor exemplo de copy de acolhimento do arquivo (`MOB §10A`).
- **CTA orientado ao futuro** — `Start today` / `Let's start!` / `keep moving forward`. Nenhum dos 5 apps de win-back usa "recupere" ou "volte ao que era" (`MOB §10A` convergência).
- Relatório semanal é **cartão, não modal**, posição 2 do slot, e vem **antes** da triagem (`02 §38`; `03 §3.2`).
- Humor: 5 carinhas **dentro** do relatório que já abre 1×/dia, alvo de 44px, `aria-pressed` (`02 §12`).
- Fresh start: o mais adiável da fila, posição 5, dois botões "Recomeçar" / "Agora não" (`02 §39`).

**Proibido**
- **Quantificar a ausência.** "Para o Soulmon, quantificar é criar uma consequência para depois anunciar que ela não existe" (`MOB §10B` divergência; `M-vinc §2`). Buckets internos (2–3 / 4–13 / 14+), N nunca impresso (`M-vinc §6`).
- Qualquer zero exposto no retorno — Paired imprime `0 days` três vezes com a chama apagada e é "a tela mais desanimadora do dossiê" apesar da melhor mecânica (`MOB §10A`).
- Oferta de reparo com preço riscado / `1ST TIME OFFER` no momento de vulnerabilidade (`MOB §10A`, metade inferior do Finch — LIMÍTROFE; `M-vinc §5`).
- Usar a **mesma tela** de re-login e de win-back: "desperdiça o único momento em que o tom importa" (`MOB §10B`).
- Mostrar "o que faltou" a quem cumpriu a própria meta (`02 §11`).
- Humor alimentando qualquer pontuação (proibição #2, travada por teste — `V §7`).

**Padrão de referência** — **Lovi** (`MOB §10A`): zero métrica, zero pedido, `You've been missed!` na voz passiva (o sentimento é do produto, não a falha do usuário). **Copiar** integralmente o eixo. **NÃO copiar** o vocativo `Sunshine` — intraduzível sem trocar de registro em PT-BR, e o produto é bilíngue. **Todoist** (`MOB §10A`): descanso definido **antes** de ser necessário — mas o modelo do Soulmon (escudo automático, sem descoberta) é declarado **superior** pelo próprio dossiê. **Runna**: duas formas legítimas de seguir com a consequência declarada — **não adotar**, o Soulmon não tem plano a reorganizar (`M-vinc §2`).

**Estados:** relatório de dia completo · dia com perda de coração · dia de folga usada (`restDayUsed`) · **welcomeBack** · degenerado · humor respondido e não respondido · check-in sem hábito devido hoje · check-in com intervenção (`never miss twice`) · semanal com `stackingSuggestion === null` · fresh start dispensado.

**Regras do produto que mordem aqui:** `02 §11` (não cura sozinho, não paga nada, não vira push, não reabre no mesmo dia) · `02 §37` (não bloqueia, não coleta humor, não exige horário, Escape = "hoje não") · `02 §38` (não dá veredito; nenhum número pode diminuir por castigo) · `02 §39` (não apaga progresso) · `02 §27` (a primeira falha **não gera alerta**; nenhum número de dívida aparece).

---

## §5 Celebração (marco, evolução, dia completo) × toast

**Pergunta da tela:** *"o que acabou de acontecer comigo, e eu posso parar um segundo?"*

**Obrigatório**
- **A composição é uma só, repetida por 9 apps** (`MOB §6A` convergência): (1) `×` no topo · (2) emblema/ilustração centralizado no terço superior · (3) nome em bold · (4) 1–2 linhas de corpo · (5) **um** botão de largura total na base.
- **A DATA na peça.** 4 de 11 apps a estampam, e é o que converte celebração em registro arquivável (`MOB §6A`; `02 §28`: "marco é memória, não aviso").
- **O modal espera o gesto.** Não fecha sozinho, não tem timer de saída (`M-const §2` WP2.4; `02 §28`).
- **Saída de relação**, não de transação: `Let's continue together!` do Ahead é "a copy mais alinhada a 'avatar que evolui COM o usuário' de todo o arquivo", e é o único app do acervo que a executa (`MOB §6A` divergência).
- **Fechar devolve à coleção**: Mindvalley desfoca e revela a grade de emblemas atrás — a saída *é* a transição para o acervo (`MOB §6A`). No Soulmon: voltar à lista com o glifo do tier **já trocado**.
- **Reduced-motion reduz o MOVIMENTO, nunca a pausa** — cair para toast entrega menos cerimônia a quem pediu acessibilidade (`M-const §2` WP2.4; `CLAUDE.md` › Marcos).
- Toast é para **transição de estado de baixa carga afetiva e alta necessidade de informação**, custo de interrupção zero, sem botão e sem fechar (Alma, `MOB §6B`).

**Proibido**
- `CLAIM REWARD` / `Collect my Gold Badge` como saída: **VETADO** sob #19 e #16 — a celebração vira guichê de prêmio e promete um segundo momento (`M-LV §3`; `MOB §6A`).
- Vocabulário de raridade inflado ("Legendary day!" para um dia comum): "escala de raridade gasta rápido se você começa no topo" (`MOB §6A`, Me+).
- Qualquer oferta visível atrás ou dentro da celebração (Me+ deixa um card promocional legível — `M-LV` #22).
- Número que pode zerar na peça (`125 week streak!` do Beli — ANTI-PADRÃO central: quanto maior o número que pode zerar, maior o dano) (`MOB §6A`).
- Confete cobrindo o próprio título (Weverse — erro de camada, ANTI-PADRÃO) (`MOB §6A`).
- Prévia com a arte **integral** de algo não conquistado: "prévia integral compra desejo e gasta revelação" (Deepstash, `MOB §6A`). Para marco de hábito, exibir "faltam N dias para árvore" é contagem regressiva sobre a pessoa (`M-const §1`).

**Padrão de referência** — **Alan** (`MOB §6A`/`§8A`): recompensa cosmética **já vestida**, zero números, zero data. "A celebração de prestígio mais compatível com as regras do Soulmon em todo o arquivo". **Copiar:** prova pelo uso. **NÃO copiar:** chamar item de vestuário de `badge`, e a projeção de inveja de amigos (falha em quem usa o app sozinho). **Runna**: cenografia de palco e zero copy — só funciona quando a métrica é autoexplicativa; "o mesmo tratamento aplicado a 'estágio 3 de 5' não seria" (`MOB §6A`).

**Estados:** marco 7 / 21 / 66 · evolução · dia completo · item cosmético obtido · **celebração adiada por `busy`** (nunca descartada) · reduced-motion · toast de estado.

**Regras do produto que mordem aqui:** `02 §28` (não fecha sozinha, não dá moeda, multiplicador nunca < 1) · `02 §17` (a cerimônia de evolução é z-500 e quem dispara é o jogador) · `02 §7` (dia não-completo não tira `perfectDays`).

---

## §6 Evolução / progressão

**Pergunta da tela:** *"quem meu bicho está virando, e por quê?"*

**Obrigatório**
- **Exibir GALHO, não altura.** Ramificação converte comparação vertical em variedade horizontal — mas só se a UI mostrar o galho (`MOB §16.2`; `REG §5.5`; regra 3 de `MOB §16.4`).
- **A próxima forma não é nomeável** (consequência da decisão 5): a tela precisa de silhueta, `?` ou branco liso; o modelo `Evolve Lee into Toddler` do Finch **não serve** (`MOB §16.5`).
- **Espiada opt-in que não persiste** para a forma futura — o mecanismo do `revealed` de sessão já existe e é declarado **melhor que o Deepstash** (`M-perm §1`).
- Vocabulário único de ausência: `???` (curiosidade), nunca misturado com "bloqueada/locked" na mesma célula — hoje a página mistura os dois (`M-perm §3` item 6).
- `perfectDays` só acumulam; a barra só cresce (`V §6` regra 3; `02 §14`).
- O cadeado de evolução é **controle do jogador**, não estado de coleção — o wireframe tem de deixar isso óbvio (`02 §17`).

**Proibido**
- "Faltam N dias perfeitos" como leitura dominante — é a família Hatch `6 remaining` (`M-LV` #11, PARCIAL hoje). Preferir o feito.
- Atributos com `▲` que impliquem `▼` (Life Reset — ANTI-PADRÃO nominal, `MOB §15.2`).
- `Owned by X%` ou qualquer raridade populacional sobre a **criatura** ou sobre a **forma**: só cosmético (`MOB §15.3`; `M-perm §1`, "73% têm" humilha o comum).
- Escada Rookie→Mega com o nível atual marcado **em qualquer tela que não seja a própria** (é altura, e na tela do amigo é exposição E3 — `M-LV §2`).
- Grade indexada por calendário fechado (Duolingo `Monthly Badges`: "a versão anual da streak que zera") (`MOB §8`; `M-perm §4`).

**Padrão de referência** — **Reddit, `Exploration`** (`MOB §8`): não obtido = **branco liso sem detalhe nenhum**; **barra de progresso suprimida nos itens em zero**; data nos obtidos; família nomeada em degraus (`Enthusiast → Advocate → Pro → Legend`) revelando a escada sem revelar a arte. **Copiar os quatro.** **NÃO copiar:** branco liso demais lê como skeleton de carregamento — no Soulmon a receita é silhueta cheia + `???`. **Withings** (`MOB §8`): a técnica de **desfoque** da arte real é PADRÃO isolada; `Unlocked 0/30` + cadeado é ANTI-PADRÃO ("o pior estado inicial possível de uma coleção").

**Estados:** barra incompleta · barra cheia com cadeado travado · barra cheia destravada (o jogador dispara) · empate de atributos (ritmo desempata, só com `confident`) · degenerado · renascimento disponível/indisponível (`not-paid` / `not-ultra` / `already-used`) · demo (com `UnlockNudge` variante) · reduced-motion.

**Regras do produto que mordem aqui:** `02 §14` (a escada decide o NÍVEL, não QUEM é a criatura) · `02 §16` (o ritmo não é score, não aparece como percentual, não é exposto quando é chute) · `02 §17` (a virada não evolui, não destrava, e o cadeado **não** protege de degeneração) · `02 §18` (degeneração não zera `perfectDays`) · `02 §20` (renascimento não apaga o registro).

---

## §7 Jogos (masmorra, arena, dino, PPT)

**Pergunta da tela:** *"quanto eu aguento hoje — e nada do que eu cuidei está em jogo."*

**Obrigatório**
- Perda **só sobre recurso recuperável e voluntariamente apostado**: a run, o placar — nunca identidade, coleção ou progresso (`G03 §1.3` regra 1; `V §6`).
- O jogo é **compartimentado**: identidade visual própria, marcada como anexo (o `+Babbel` é "uma linha de tipo que declara: isto é um anexo") (`MOB §15.2`).
- Pixel art **confinado a uma janela**; a UI em volta é contemporânea e legível (Life Reset — o achado central do eixo retrô) (`MOB §15.2`). Casa com a fronteira "O Visor" (`PD §0.1`).
- Bestiário/encontros: fração **por linha** e só onde há ≥1 (`M-perm §3` item 2).

**Proibido**
- Custo de entrada ou de derrota em corações (`02 §51`: "não cobra coração para entrar nem para perder").
- Contagem regressiva de escassez (`4d 22h` do evento sazonal do Finch é o único elemento daquela tela a descartar) (`MOB §15.5`; proibição #15, `V §7`).
- Fonte pixelada em corpo de texto: o Babbel mostra o custo, e em PT-BR **muitas fontes pixeladas não têm `ã`, `ç`, `õ`** — o fallback quebra a estética exatamente onde ela deveria funcionar (`MOB §15.2`).
- Check-in diário com reset por meia-noite + recompensa escalonada + multiplicador que se perde — Crypto.com/Xbox/ShopBack são "referência de **como não** estruturar a economia diária" (`MOB §15.5`; proibições #19 e #16).

**Padrão de referência** — **Life Reset** (`MOB §15.2`): a divisão é "pixel na arte, sans-serif no texto, e um único gesto de ponte (a barra de blocos) para costurar os dois". **Copiar.** **NÃO copiar:** os cinco atributos com `▲`, e as abas `Day 1 / Day 66` (horizonte fixo que não tem para onde ir se ultrapassado). **Character AI quests** (`MOB §15.5`): único do grupo **sem prazo** — é o aproveitável.

**Estados:** entrada · andar em curso · andar limpo · run concluída (5 andares, drop de Glitchtama) · derrota · recorde novo · bestiário com célula não vista · offline · reduced-motion.

**Regras do produto que mordem aqui:** `02 §51` (não tem limite diário, não dropa comida, não vende Glitchtama) · `02 §52` (o bestiário não mostra percentual, não mostra "faltam N", não ordena por quantidade, não some quando completo) · `02 §54` (minijogos não tocam HP, energia, atributo nem `perfectDays`).

---

## §8 Loja, itens, oferta / paywall

**Pergunta da tela:** *"o que eu posso ter, com o que eu já ganhei?"*

**Obrigatório**
- **As quatro decisões do Garmin são necessárias juntas** (`MOB §11A`): (1) `×` no **próprio card**, dispensa em um toque, permanente; (2) **botão de largura parcial** quando os CTAs do app são de largura total — a assimetria diz "opcional" sem dizer; (3) **container idêntico** ao do card não-comercial; (4) acima do conteúdo, mas removível.
- **Anti-FOMO declarado**: `The items below are always available!` (Finch) — a frase que separa card de anúncio (`MOB §8A`; `M-sust §1` #5).
- **A recusa com peso tipográfico do primário**: `Skip for now` do Character AI, bold, largura total, logo abaixo do CTA (`MOB §11A`; `REG §5.4`, "Agora não" com a mesma largura).
- **Três moedas visualmente inconfundíveis** (`02 §46`); o `×` que dispensa o convite tem alvo **44×44** — a ação é terminal (`REG §5.4`, achado do QA).
- Detalhe de item na espinha do Finch: identificador → arte no centro → nome próprio em display → **uma** linha de metadados curtos → parágrafo descritivo → ação ou estado → registro histórico no rodapé (`MOB §15.3` convergência).
- Máx. **5 abas** na loja; nenhuma nova sem tirar uma (`PD §5`).

**Proibido**
- **Tabela comparativa Free × Pago.** É o padrão dominante (6+ apps) e é exatamente onde o Soulmon deve estar **contra** a maioria: funciona por **privação visualizada** — a coluna grátis preenchida com `—` ou `×` desenha linha por linha o que a pessoa não tem (`MOB §11B` convergência; `M-sust §4`).
- Paywall de tela cheia que interrompe fluxo; faixa promocional permanente sem dispensa (9 + 9 apps, todos ANTI-PADRÃO) (`MOB §11B`).
- Preço riscado, `SAVE 13%`, `38% OFF`, ancoragem com plano pré-selecionado, `instant` como gatilho (`MOB §11B`; `M-sust §4`).
- Paywall **sem preço** (Craft) ou `unlock` sem dizer o quê (Revolut) (`MOB §11B`).
- Oferta enxertada dentro do checklist de ativação / do onboarding (Shopify — "cerca o onboarding") (`MOB §11B`; `M-sust §5`).
- **Preço na célula de coleção** (Replika): "coleção precificada em duas moedas é loja disfarçada de dex" (`MOB §8`; `M-perm §4`).
- Vender proteção contra punição (Deepstash, `2 extra freezes com Pro`) — proibição #13, e `HEART_COST_CREDITS` já foi apagado por causa dela (`MOB §8B`; `V §7`; `REG §5.4`).
- Cadeado + fração zero em série na vitrine (Withings/Tripadvisor): suprimir a fração enquanto `cur === 0` e deixar a condição em palavras (`M-LV §2` E4).

**Padrão de referência** — **Garmin Connect** (`MOB §11A`), o **único das 20 telas** cuja oferta pode ser dispensada permanentemente pelo próprio card. **Copiar as quatro decisões.** **NÃO copiar a posição:** no Soulmon o "feed" equivalente é o corpo do relatório diário e o **fim** da seção Itens da loja, nunca a Home (`M-sust §2`). **Meetup** (`MOB §11A`): oferece proativamente lembrete de fim de trial 2 dias antes — jogada de confiança única no acervo, vale como trava de qualquer trial futuro. **Alan `Charities`** (`MOB §11A`): **não adotar** — o próprio dossiê declara o custo (culpa assimétrica + infra de doação) (`M-sust §1` #4).

**Estados:** saldo suficiente × insuficiente · item travado por missão · item equipado · item que não combina com o cenário (a loja **explica**, não some) · demo × pago · oferta nunca vista / dispensada permanentemente · segmento Torneio (Emblemas) · pastinha vazia.

**Regras do produto que mordem aqui:** `02 §47` (não vende Glitchtama, não aplica o chip na compra, não cobra em duas moedas) · `02 §46` (não converte Bits em Créditos; nenhuma moeda repete ícone) · `02 §48` (chip não enche energia) · `02 §49` (missão permanente não paga moeda e não some quando travada) · `02 §50` (missão semanal não paga Bits nem Créditos e não muda ao reabrir o app).

---

## §9 Estatísticas / coleção (bestiário, sonhos, memórias)

**Pergunta da tela:** *"o que nós dois já vivemos?"*

**Obrigatório**
- **`?` em vez de cadeado.** Cadeado comunica *bloqueio* (algo te impede); `?` comunica *desconhecido* (algo a descobrir) — "para uma coleção de criaturas, curiosidade é o motor certo, e o cadeado convoca o motor errado" (`MOB §8`, Finch).
- **Barra suprimida nos itens em zero** (Reddit): "zeros em série é a maneira mais eficaz de desanimar alguém numa tela de coleção" (`MOB §8`).
- **Frações por subcategoria**, não uma fração geral: "é matematicamente impossível estar em zero em todas" (`MOB §8`, Finch).
- **Número de catálogo no obtido** (`#25`) — uma linha que insinua um mundo maior sem exibir zero (`MOB §8`; `M-perm §3` item 4).
- **Data no obtido, `-` no não obtido** (Reddit/Runna): o travessão é "tipograficamente silencioso, muito menos agressivo que `0/10`" (`MOB §8`). É o que torna a coleção *daquela pessoa*.
- **Slot vazio rotulado com o que vai ali**, em vez de cadeado (Life Reset — "modelo de empty state de coleção muito superior") (`MOB §15.2`).

**Proibido**
- `Not obtained` repetido (Me+): "legibilidade comprada com acúmulo de negativa — num produto que não quer cobrar, é um preço alto" (`MOB §8`).
- `Unlocked 0/30` no topo de uma grade inteiramente cadeada (`MOB §8`).
- Percentual, "faltam N", ordenação por quantidade (`02 §52`).
- Card compartilhável com **qualquer campo em zero** — Marriott faz "brag a little" sobre quatro zeros (`MOB §13`; `M-perm §1b`).
- Grade sem nenhum estado obtido/não obtido: "sem estado, a pessoa não sabe o que já tem — a grade perde a função de troféu e vira lista de tarefas" (GoHenry, LIMÍTROFE — `MOB §8`).

**Padrão de referência** — **Finch, ficha do Micropet** (`MOB §15.3`), "o achado mais transferível de todo o levantamento": `#25` · arte quebrando o container · **`BABY` como rótulo de estágio separado do nome** (o mesmo indivíduo em múltiplos estágios sem trocar de identidade — exatamente o modelo de 5 estágios do Soulmon) · nome próprio · linha de metadados de **caráter** · lore · ação · **`Hatched on Aug 31 2025` no rodapé, fora do card**. **NÃO copiar:** `She/Her` (decisão 2: neutro por nome próprio) e a barra de energia `0/15` que zera. **Apple Games** (`MOB §8`): `2%` de raridade só funciona quando o número é baixo — "`73%` seria humilhante".

**Estados:** coleção vazia (mas o rookie está sempre vivido — nunca zero no álbum de formas) · parcial · completa (não some) · item obtido em save antigo **sem data** (`-`) · ficha do obtido · espiada opt-in do não obtido · card de memórias abaixo do piso (não é oferecido).

**Regras do produto que mordem aqui:** `02 §41` (o Dex não diz "faltam N", não mostra percentual; o não coletado é SILHUETA, convite e não dívida) · `02 §52` (bestiário) · `02 §45` (o aniversário rende UMA fala, não XP nem push) · `02 §57` (estação não expira, não tem contagem regressiva, não vende passe).

---

## §10 Social / torneio / ranking / coop

**Pergunta da tela:** *"quem mais está por aqui, e o que eu posso dar?"*

**Obrigatório** — as 6 regras de `MOB §16.4`, todas com evidência:
1. **Nenhum componente de métrica reusado do próprio perfil.** A tela do amigo tem componentes próprios, sempre. **É a única que não pode ser negociada depois** — é decisão de design system, não de tela. O Mimo não desenhou leaderboard: **a comparação emergiu da simetria de componente** (`MOB §13B`; proibição #21, `V §7`).
2. **Posição sem ordem.** Árvore/cena, nunca lista vertical nem fileira horizontal (Finch × Duolingo `FRIEND STREAKS`).
3. **Galho, não altura.** "Forma: Brasa", nunca "estágio 4 de 5".
4. **Só verbos de dar** — `Share Goal` · `Send Good Vibes` · `Send Gift`, **e a ausência de uma quarta ação ("ver progresso") é a decisão de produto** (`MOB §13A`).
5. **Meta somada, nunca confrontada.**
6. **Convite pago em cosmético**, nunca dinheiro, nunca vantagem.
- Faixa **antes** do ranking; ranking é **janela de ±3**, a season inteira a um toque (`02 §53`).
- `Send Gift` desabilitado comunica limite diário **sem cronômetro, sem contador e sem aviso de escassez** (`MOB §13A`).
- Pet e humano como entidade única (`Baby Minty & Alex`) — torna a visita menos invasiva (`MOB §13A`).

**Proibido**
- Qualquer número por pessoa. O Finch "não mitiga a comparação com copy gentil; ele **remove o substrato de dados**" (`MOB §13A`).
- Estado zero social empilhado (`0 Total` / `0 Wins` / `0 Completed` do Apple Games: "você não tem ninguém e não fez nada") (`MOB §13B`).
- Contador de seguidores — eixo de status importado de rede social sem necessidade funcional (`MOB §13B`).
- Streak social recíproco e accountability com prazo (`REG §5.5`, Snapchat).
- Expor o **estado** da criatura do amigo (HP, sono): criatura abatida na árvore é acusação pública (`MOB §17` Q7; `REG §5.5`, em aberto).
- Push avisando que alguém do grupo faltou — "é o cobrador que a essência proíbe, entregue por terceiro" (`02 §56`).

**Padrão de referência** — **Finch, árvore de amigos + ficha do amigo** (`MOB §13A`), "o único do acervo inteiro com tela social sem uma única métrica" e **modelo de referência declarado para a camada social do Soulmon**. **Copiar:** a cena no lugar da lista; `???` como slot vazio (não cadeado); as três ações de dar; o convite pago em micropet. **NÃO copiar:** a escala — "30 pets numa copa é ilegível, e a solução óbvia (paginar, listar) reintroduz a ordem que a metáfora existia para evitar". No Soulmon `MAX_FRIENDS = 5` já resolve, e **subir o teto é o que reintroduz a lista** (`M-LV §4` Q5).

**Estados:** sem amigos (empty state — **não verificado no levantamento**, `M-LV` #62) · 1 a 5 amigos · presente já enviado hoje · fora da Rodada do Torneio · dentro da Rodada · coop sem grupo · coop com grupo e meta parcial · PvP travado por Vínculo < 5 · diretório com consentimento recusado.

**Regras do produto que mordem aqui:** `02 §56` (não mostra quanto cada membro fez; não reusa componente de métrica do próprio perfil) · `02 §53` (não tranca fora da janela; não mostra a lista completa do ranking) · `02 §55` (o Vínculo não persiste o nível, não subtrai XP, não dá vantagem).

---

## §11 Conta / configurações

**Pergunta da tela:** *"o que é meu, e como eu saio?"*

**Obrigatório**
- **`Delete my answers` / saída de dados na própria superfície** onde o dado íntimo foi dado (Speak, `MOB §15.6`) — a saída dos 20 itens é obrigatória e já existe em `AccountDataSection` (`M-LV §4` decisão 6).
- **Ocultar métrica é uma opção legítima**: o ícone de olho do Headspace é "a única concessão do acervo à ideia de que a métrica pode ser opcional para quem ela machuca" (`MOB §8B`). `hideMetrics` já faz isso na Janela de Descanso.
- Permissão pedida **como consequência de o usuário ligar um toggle** (Buddy — padrão-ouro de momento, e o único do acervo fora do onboarding) (`MOB §5`; `M-nasc §1` 4.8).
- Escolher a própria janela de descanso; `hideMetrics` esconde números e **preserva as recompensas** (`02 §40`).
- SettingsPage em grupos (`PD §8`, Onda 5).

**Proibido**
- Tela de re-login usando a copy afetiva do win-back (`MOB §10B`).
- Prevenção enterrada em Configurações como **única** proteção: "protege só quem já é organizado" — no Soulmon o escudo age sem descoberta, e o dossiê declara esse modelo superior (`MOB §10A`, Todoist).
- Percentual cru de constância em qualquer lugar (proibição #14).

**Estados:** demo × pago · notificação concedida / negada / não pedida · janela de descanso configurada e padrão · `hideMetrics` ligado · exclusão de conta solicitada / confirmada · offline.

**Regras do produto que mordem aqui:** `02 §40` (não lê sensor nenhum, não pontua) · `02 §44` (passos não viram HP, energia nem peso de esforço) · `02 §58` (não notifica durante a noite, não pede uma quarta visita, não inventa fallback de copy).

---

## §12 Fora do app (widget, overlay de desktop, push)

**Pergunta da tela:** *"ele está bem?"* — e **nada mais**. Esta é a superfície vista dezenas de vezes por dia **sem que ninguém decida abri-la**, e é por isso que ela é a mais perigosa (`M-const §1`).

**Obrigatório**
- **O sprite é o traço que sobrevive a todos os tamanhos.** Hierarquia de descarte (MD Vinyl): histórico → rótulos → ações → identidade (`MOB §10`; `M-const §2` WP2.6).
- **Do grande ao pequeno, REMOVER funções inteiras**, nunca comprimir. O widget 1×1 é sprite + cocô, **sem texto algum** (modelo GitHub/one year).
- **Mascote em repouso + elogio pós-fato** (Mimo `Well done!`, Alma `Streak secured! Nice work.`): mesma estrutura de dados, afeto invertido (`MOB §10`; `M-const §1`).
- PT **e** EN — as frases hoje são hardcoded só em inglês num lado e só em português no outro; o idioma tem de vir pela bridge (`M-const §2`; `CLAUDE.md` › Idioma).
- O overlay de desktop é **o widget do desktop**: as mesmas proibições valem, e a copy tem de vir da **mesma fonte** da do push para não divergir (`M-LV §4` decisão 3).
- Push: máx. 1 de campanha/dia; nunca dois canais para a mesma mensagem (`G07 §4`).

**Proibido**
- **O anti-padrão mais puro do arquivo inteiro**, e está dentro do nosso APK: `Don't forget about me today!` + `N task(s) left, let's go!` + corações vermelho/escuro. É o widget da coruja raivosa do Duolingo em tom baixo — **VETADO** (`MOB §8B`; `M-LV §2` E1).
- Fileira semanal de 7 pontos **em qualquer tamanho de widget**: "no app ela tem legenda e contexto; no widget, vista 40×/dia, quatro círculos vazios são quatro falhas" (`M-const §2`).
- Estoque de escudos no widget (`shields` está vetada na bridge) e **`constancy_pct`** (proibição #14) (`M-const §2`; `02 §26`).
- Qualquer frase que cite quantidade que falta (`M-const §2`, aceite: nenhuma frase contém dígito quando `completed < total`).
- Push de culpa, medo ou cobrança preventiva ("Study tomorrow to keep your streak") (`REG §5.7`; proibições #15/#19).

**Padrão de referência** — **Mimo widget** (`MOB §10`): mascote descansando + elogio. **Copiar o tom.** **NÃO copiar** a fileira semanal com seis vazios. **Duolingo widget** (`MOB §8B`): ANTI-PADRÃO de referência — ameaça + culpa + antropomorfismo hostil na home screen.

**Estados:** 1×1 · 3×1 chat · 3×1 completo · 2×2 · 3×2 · dormindo · cocô presente · sem dados (APK antigo, bridge sem as chaves novas) · PT e EN.

**Regras do produto que mordem aqui:** `02 §26` (o escudo não aparece como número no widget; vai uma FAIXA, `habit_steady`) · `02 §58` (não manda push de culpa, não notifica de noite) · `CLAUDE.md` › Widgets (o bridge só ACRESCENTA chave — proibição #20).

---

## §13 Transversal

**Navegação inferior.** 4 destinos + menu (`PD §5`; a Biblioteca sai da nav e vira card em Atividades). Seleção = **sublinhado ciano**, nunca placa preenchida; ícone nunca em box (`PD §0.7`). Rótulo sob o ícone é a convergência do acervo (Finch, Mimo, Garmin), mas o teto de ícones manda.

**As duas filas são estrutura, não overlay (W7).** Intersticiais: `triagem → relatório → check-in → sonho → pesadelo → welcome`, um por vez, nada descartado. Slot de avisos: renderiza `avisos[0]`, o resto colapsa em `+N`, ordem `firstDay → hp → semanal → triagem → priming → recomeço` (`03 §3.1`/`§3.2`). **Superfície nova entra numa das duas, com posição declarada** — a auditoria de 06/09/2026 achou quatro superfícies fora das filas, e é ali que empilhava (`CLAUDE.md` › UI).

**Celebração × toast.** Modal que espera o gesto **só** para marco, evolução e dia completo; toast para transição de estado. O acervo tem 10 modais e **um único toast** — o limite é da ferramenta (celebração não-bloqueante é estado transitório de 100–800 ms que a captura estática não pega), não evidência de que toast não sirva (`MOB §6B`, "o que falta em 6B — declarado").

**Oferta que não bloqueia (`MOB §15.4`/§11A).** As quatro decisões do Garmin, juntas. Canal **passivo** (loja, permanente, sem `×`, `always available`) × canal **proativo** (relatório, 1×/semana, `×` que dispensa para sempre) (`M-sust §2`). A tese fecha o argumento: *"se dinheiro nunca compra vantagem de progresso, então a oferta nunca tem urgência legítima — e sem urgência legítima, o paywall interruptivo não tem justificativa funcional, só extrativa"* (`MOB §11` divergência).

**Comparação (`MOB §13B`).** A comparação não precisa ser desenhada; **ela emerge da simetria de componente**. E o alerta que nenhum app do acervo enfrenta: **no Soulmon a forma da criatura É a métrica** — um estágio 4 ao lado de um estágio 1 comunica desempenho relativo sem um único número, e nenhuma decisão de copy conserta isso (`MOB §16.3`, Problema 2).

**Win-back (`MOB §10A`).** Eixo **Lovi + Todoist**: silenciar a métrica, proteção agindo sozinha por trás, tom do Finch (a linha 2), descartando a metade inferior da tela dele onde a mecânica contradiz a copy. Normalização explícita da falha é convergência de 5 apps; **nenhum** usa "recupere".

**Retrô dentro de invólucro limpo (`MOB §15.2`).** Pixel na arte, sans-serif no texto, **um** gesto de ponte. Alternativa de baixo custo registrada: retrô por **tipografia monoespaçada e caracteres como layout** (Co–Star, Poolsuite), "liberando o orçamento de arte para as criaturas" — compatível com a fronteira "O Visor" (`PD §0.1`), que já decide o mesmo por outro caminho.

**Acessibilidade no wireframe (W10, `PD §6`).** Alvo 44px inclusive em checkbox e chevron; ordem de foco declarada; focus-trap + Escape em todo modal; rótulo em **PT + EN** em toda ação; nenhuma informação existe só no movimento.

---

## §14 Tensões pesquisa × decisão registrada (NÃO decididas aqui)

| # | A pesquisa diz | A decisão registrada diz | Onde |
|---|---|---|---|
| T1 | **Paywall no reveal.** "O paywall que converte é o que chega como conclusão do investimento do quiz"; quiz longo converte +40% quando o resultado é vendido ali | **Não cobrar no reveal**; value moment = 1º dia completo. Paywall após value moment = 2,1× mais trial starts. Gatilho de revisão declarado: **conversão < 1%** | `G01` lição 4 · `G05` F4 × `REG §5.3` (conflito C.3 #1) · `M-sust §5` |
| T2 | **Contador do dia no widget** ("2/4 hoje", visível sem abrir) | Sai `"$completed de $total feitas"` e `"N task(s) left"`; **nenhuma frase do widget cita quantidade** | `G07 §5` item 2 × `M-const §2` WP2.6 · `M-LV §2` E1 |
| T3 | **"FOMO saudável"**: live-ops semanal com visita especial rotativa | Proibição **#15** — nunca "última chance"/FOMO que tira | `G07 §6` item 13 × `V §7` |
| T4 | **Card compartilhável mensal** ("o mês do meu Soulmon") | O gatilho é a **forma nova**, nunca o calendário; e **piso obrigatório** (nenhum campo em zero) | `G01` lição 18 × `MOB §16.5` · `M-perm §2` WP4.8 |
| T5 | **Estoque de escudo com leitura positiva** (`1 Streak Freeze`, Yazio, em seção de "propriedade do sistema") | Decisão 4: **estoque invisível**. E o código é "melhor que a decisão": mostra só quando `> 0` | `MOB §15.5` × `MOB §16.1` #4 · `M-const §1`/`M-LV §4` |
| T6 | **Prestígio visual** é a 5ª das regras sobre perda e está declarada como "a única ainda não implementada" | O código a implementou em parte (`steadyWindow`, 28 dias, silenciosa) — **e o guarda alerta**: prestígio que depende de não ter usado escudo cria pressão para não usar proteção automática. Depende da decisão **D4** | `REG §3` × `V §6` (nota) · `M-const §4.1` |
| T7 | **Decisão 8b**: criatura do amigo no estágio real, "aceita comparação" | **VETADO no código** sob #21: `rank N` + escada com o nível marcado é altura. "Aprovada no papel e vetada no código" | `MOB §16.1` × `M-LV §2` E3 e §4 |
| T8 | **Psicométrico invisível** (decisão 6) | Cria o **Problema 1**: 20 telas de custo, retorno invisível — a configuração que produz a maior taxa de abandono no meio do quiz. Solução mapeada, **em aberto** | `MOB §16.1` × `MOB §16.3` · `REG §5.3` |
| T9 | **Valor antes de cadastro** (gradual engagement) | **Conta é a PRIMEIRA tela** (decisão do dono, 07/09) — o próprio registro marca como tensionado (aposta 9) | `G01` lição 1 · `G05` §3 × `REG §5.3` |

---

## §15 Tabela final: padrão → procedência (para o `design-critic` conferir)

| Padrão adotado | App · seção | Classificação na fonte | Onde ele manda neste doc |
|---|---|---|---|
| Criatura entregue antes de qualquer pedido | Finch · `MOB §15.1` | PADRÃO (fluxo de referência) | §3 |
| Justificativa curta por campo coletado | Replika · `MOB §15.1` | PADRÃO no detalhe, ANTI na arquitetura | §3 |
| Skeleton fiel à forma do resultado | GoFundMe · `MOB §3` | PADRÃO | §3 |
| Erro que preserva o input | ABY Journal / Chase UK · `MOB §3` | PADRÃO | §3 |
| Prévia de push com o **pet** como remetente | Finch · `MOB §5` | PADRÃO | §3 |
| Recusa com peso tipográfico do primário | Character AI · `MOB §11A` | PADRÃO | §8, §3 |
| Composição única da celebração (5 elementos) | 9 apps · `MOB §6A` | convergência | §5 |
| Data estampada na celebração | Duolingo, Weverse, Tonal, Mindvalley · `MOB §6A` | PADRÃO (4 de 11) | §5, §9 |
| Saída de **relação** (`Let's continue together!`) | Ahead · `MOB §6A` | PADRÃO | §5 |
| Fechar devolve à coleção (desfoque revelando a grade) | Mindvalley · `MOB §6A` | PADRÃO | §5 |
| Cosmético **já vestido**, zero números | Alan · `MOB §6A`/`§8A` | PADRÃO | §5 |
| Toast de transição de estado, custo de interrupção zero | Alma · `MOB §6B` | PADRÃO | §5, §13 |
| Contador que **só enche** (pips `◆◇◇◇◇`) + etiqueta `One-time` | Noom · `MOB §8A` | PADRÃO | §2 |
| Substantivo no slot do número (categoria, não saldo) | Mimo `Wooden` · `MOB §8A` | LIMÍTROFE (o degrau mais baixo lê como demérito) | §6 |
| Raridade populacional **só em cosmético** | Opal `Owned by 23%` · `MOB §8A`/`§15.3` | PADRÃO (com o `Top 17%` da mesma tela como ANTI) | §6, §9 |
| `?` em vez de cadeado; fração por subcategoria; `#25` | Finch · `MOB §8` | PADRÃO | §9 |
| Branco liso sem detalhe; **barra suprimida no zero**; data no obtido | Reddit · `MOB §8` | PADRÃO | §6, §9 |
| `-` como placeholder de data | Runna · `MOB §8` | PADRÃO | §9 |
| Slot de equipamento **rotulado** em vez de cadeado | Life Reset · `MOB §15.2` | PADRÃO | §9 |
| Desfoque da arte real (um asset, dois estados) | Withings · `MOB §8` | PADRÃO isolado (a tela inteira é ANTI) | §6 |
| Ficha de item: espinha de 7 decisões, estágio separado do nome | Finch Micropet · `MOB §15.3` | PADRÃO — modelo direto | §9 |
| Seletor recíproco `You / <criatura>` | Tolan · `MOB §15.3` | PADRÃO o seletor, ANTI a barra que desce | §9 |
| Oferta dispensável: `×` no card + botão parcial + container irmão + removível | Garmin · `MOB §11A`/`§15.4` | PADRÃO (único das 20 telas) | §8, §13 |
| `always available` (anti-FOMO declarado) | Finch · `MOB §8A` | PADRÃO | §8 |
| Lembrete proativo de fim de trial | Meetup · `MOB §11A` | PADRÃO (único do acervo) | §8 |
| Absolvição + crédito ao presente | Finch · `MOB §10A` | PADRÃO (a linha 2; a metade inferior é LIMÍTROFE) | §4 |
| Win-back sem métrica nenhuma | Lovi · `MOB §10A` | PADRÃO | §4 |
| Escudo **automático**, com cadência de reposição declarada | Paired / Yazio · `MOB §10A`/`§15.5` | PADRÃO (a exibição do zero é o modo de falha) | §4, §12 |
| `Pause & preserve` (verbo + garantia) | Numo · `MOB §10A` | PADRÃO a frase, ANTI o `don't stop!` | §4 |
| Cena compartilhada sem métrica; `???` como slot vazio | Finch árvore · `MOB §13A` | PADRÃO — modelo declarado da camada social | §10 |
| Só verbos de dar; `Send Gift` desabilitado como limite | Finch ficha do amigo · `MOB §13A` | PADRÃO | §10 |
| Convite pago em **cosmético** | Finch · `MOB §13A` | PADRÃO (os 7 de dinheiro, ANTI) | §10 |
| Pixel confinado a uma janela, UI moderna em volta | Life Reset · `MOB §15.2` | PADRÃO | §7, §13 |
| Modo de jogo como **anexo** assinado (`+Babbel`) | Babbel · `MOB §15.2` | LIMÍTROFE (fonte pixelada em corpo de texto) | §7 |
| Retrô por monospace/ASCII, custo zero de asset | Co–Star / Poolsuite · `MOB §15.2` | PADRÃO | §13 |
| Sprite como traço que sobrevive a todos os tamanhos | MD Vinyl · `MOB §10` | PADRÃO | §12 |
| Mascote em repouso + elogio pós-fato no widget | Mimo / Alma · `MOB §10` | PADRÃO | §12 |
| Ícone de olho para **ocultar** a métrica | Headspace · `MOB §8B` | achado positivo dentro de um ANTI | §11 |
| `Delete my answers` na própria tela de resultado | Speak · `MOB §15.6` | PADRÃO | §11 |
| `Imperfect` no nome do desafio (permissão de falhar no título) | Ten Percent Happier · `MOB §15.6` | PADRÃO | §5 (nomenclatura) |
| Quests **sem prazo** | Character AI · `MOB §15.5` | LIMÍTROFE (o único aproveitável do grupo) | §7 |

**Anti-padrões nomeados que o crítico deve procurar no wireframe:** tabela Free × Pago com `—`/`×`
· paywall de tela cheia · faixa promocional sem dispensa · preço riscado · cadeado + fração zero ·
`Not obtained` repetido · grade indexada por calendário · fileira `S M T W T F S` com vazios ·
estoque de escudo no zero · escudo à venda · `CLAIM REWARD` como saída de celebração · componente
de métrica reusado na tela do amigo · fileira de streaks de amigos · `Group Leaderboard` · três
zeros sociais em coluna · contador de seguidores · contagem regressiva de evento · check-in diário
com multiplicador · preço na célula de coleção · barra de relação que desce · widget com frase de
saudade-cobrança.
