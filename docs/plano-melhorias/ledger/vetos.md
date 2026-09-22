# Ledger — guarda da linha vermelha (vetos e pareceres)

Dono: `soulmon-guarda-linha-vermelha`. Fonte: seção 9 do `PLANO-MELHORIAS.md`,
seção C do `GUIA-EXPERIENCIA.md`, tabela de regras do `CLAUDE.md`.

**Este guarda não possui WP nenhum, de propósito**: quem tem entrega própria tem
incentivo para relativizar a própria proibição.

## As proibições, e o que cada uma protege

**21 proibições: 13 travadas por teste (#1–#12 e #15) e 8 por tese (#13, #14, #16–#21)** — contagem de 21/09/2026 (noite) sobre `docs/manual/01-VISAO.md` §7 (`awk '/^## 7/{f=1} f' docs/manual/01-VISAO.md | grep -cE '^\| \*?\*?[0-9]+'` → 21). ⚰️ "12 por teste e 9 por tese" valeu de 02/09 até 21/09/2026, quando a #15 ganhou `src/copy.semFomo.contract.test.ts` (QA Rodada 1, `06-guardas-squads-r1.md` §7); ⚰️ "20 proibições, oito por tese" valeu até 02/09/2026, quando a #21 foi inscrita.

### Travadas por TESTE (remover o teste é remover o produto)
1. Streak que zera · 2. Humor como pontuação · 3. Bits→Créditos ·
4. Emblemas comprando vantagem · 5. `bondLevel` persistido · 6. Dia da regra
diária pelo relógio do aparelho · 7. Aritmética de HP no `App.tsx` · 8. Regra
dentro de updater inline · 9. `MAX_DAILY_FOCUS ≠ 3` · 10. `ABSENCE_FORGIVENESS_DAYS ≠ 2`
· 11. Traço de nascimento negativo · 12. Punição por sono ruim / score de sono ·
**15. Nunca "última chance"/FOMO que tira** (`src/copy.semFomo.contract.test.ts`, 21/09/2026 — mantém o id 15).

### Travadas por TESE (sem teste, e por isso mais frágeis)
13. Nunca vender proteção contra punição · 14. Nunca percentual cru de
constância na UI · 16. Nunca
recompensa por contagem de tarefas · 17. **Nunca um nono perdão sem responder
D4** · 18. Nunca texto do usuário em IA/telemetria sem D8 · 19. **Nunca mecânica
cuja resposta seja "querer a notificação" e não "querer fazer a tarefa"** ·
20. Chaves do bridge do widget e `digiapp_*`: só acrescentar ·
**21. Nunca métrica de desempenho de outro jogador — nem por reuso de
componente do próprio perfil.** A tela do outro só mostra presença (criatura,
nome, galho como palavra) e só oferece verbos de dar. *(Inscrita em
02/09/2026 a partir do dossiê Mobbin §14/§16.4: o Mimo não desenhou ranking e
produziu um, por simetria de componente. O código de hoje já cruza —
`LibraryPage.tsx:340`, `PlayerDetailModal.tsx:105`, `community.js:180-188`.)*

## Registro de vetos e pareceres

Formato: data · WP ou proposta · parecer (`APROVADO` / `APROVADO COM RESSALVA` /
`VETADO`) · qual proibição · o que o autor deve fazer.

| Data | Proposta | Parecer | Proibição | O que fazer |
|---|---|---|---|---|
| 02/09/2026 | Sistema de guarda criado | — | — | — |
| 02/09/2026 | **Dossiê Mobbin — inventário**: 73 achados anti/limítrofes; o Soulmon já evita 36; 4 sancionados por desenho (HP/energia: única punição, com teto e perdões); 12 parciais (regra ok, exibição/copy tropeça); **5 exposições reais E1–E5** | — | — | Análise completa em `../mobbin/linha-vermelha.md` |
| 02/09/2026 | **E1** Widget Android: `"Don't forget about me today!"` + `"N task(s) left, let's go!"` + corações vazios | `VETADO` (código atual) | #16, #19 | WP2.6 reescreve toda a copy; aceite: nenhum dígito quando `completed < total`; nenhuma frase de saudade-cobrança |
| 02/09/2026 | **E2** Créditos compram cura de 1 coração (`HEART_COST_CREDITS = 10`) | `VETADO` (código atual) | #13 | É a D7; parecer: **remover**. D4 e D7 são a mesma pergunta vista de dois lados — responder juntas |
| 02/09/2026 | **E3** Perfil do amigo exibe `rank N` e a escada Rookie→Mega com o nível atual marcado | `VETADO` (código atual) | **#21** | WP novo (permanência): perfil do amigo só com presença + galho como palavra + verbos de dar |
| 02/09/2026 | **E4** Aba Missões: 🔒 + `0/100 kills` em série | `VETADO` (código atual) | #15-adjacente (cadeado + zero em série = Withings/Tripadvisor) | WP novo (permanência): missão bloqueada mostra condição em palavra, nunca `0/N` |
| 02/09/2026 | **E5** Faixa do Torneio derivada dos pontos da **season** → caduca todo mês | `VETADO` (código atual) | monotonia (CLAUDE.md 🎪: "acumular pontos nunca rebaixa") | WP novo (permanência): faixa lê pontos **lifetime**; season só decide troféu |
| 02/09/2026 | §16.1 decisão 1 — comum grátis, própria paga | `APROVADO` | — | Ressalva ligada à Q1: a comum **tem que ramificar igual** (senão o grátis é pet pior, exposto socialmente) |
| 02/09/2026 | §16.1 decisão 2 — gênero neutro por nome | `APROVADO` | — | Não é regra de jogo; custo = disciplina de copy PT-BR (hoje "ele" e "ela" misturados — WP novo, vínculo) |
| 02/09/2026 | §16.1 decisão 3 — a criatura É o overlay | `APROVADO COM RESSALVA` | #16, #19 | A proibição do E1 vale no overlay; copy do overlay vem da mesma fonte do push (WP3.4) |
| 02/09/2026 | §16.1 decisão 4 — estoque de escudos invisível | `APROVADO COM RESSALVA` | — | **O código é melhor que a decisão**: mostra só `> 0`, esconde no zero (`HabitConstancy.tsx:255-264`). Manter ">0 only"; invisível total jogaria fora a leitura positiva do Yazio. Não vai ao widget |
| 02/09/2026 | §16.1 decisão 5 — árvore ramificada por comportamento | `APROVADO` | — | Já é. Consequência: a Evolução nunca nomeia a próxima forma — silhueta/`?` |
| 02/09/2026 | §16.1 decisão 6 — psicométrico invisível | `APROVADO COM RESSALVA` | #18-adjacente | "Invisível" ≠ "sem sinal" (Speak/Lovi/Noom); `Delete my answers` obrigatório (já existe em `AccountDataSection`); nada dos 20 itens vai a IA sem D8 |
| 02/09/2026 | §16.1 decisão 7 — completa sem os 20 | `APROVADO` | — | P6 passa: pular não custa |
| 02/09/2026 | §16.1 decisão 8 — camada social com criaturas visitáveis | `APROVADO COM RESSALVA` | **#21** | Condicionado à #21; hoje o código viola (E3). "Visitável" não existe — WP novo |
| 02/09/2026 | §16.1 decisão 8b — criatura do amigo no estágio real | `APROVADO COM RESSALVA` | #21 | Só se a UI mostrar **galho, não altura**. `PlayerDetailModal` mostra a escada = altura → aprovada no papel, vetada no código até E3 fechar |
| 02/09/2026 | §16.4 regras 1–6 da camada social | `APROVADO` | — | Regra 1 promovida a **#21**; regra 6 (convite pago em cosmético) = aceite de qualquer referral futuro |
| 02/09/2026 | §17 Q1 — a criatura grátis ramifica? | parecer: **sim, obrigatoriamente** | P6 | Vira decisão do dono (a copy atual do `UnlockAccountModal` diz que a árvore demo "leva ao mesmo lugar") |
| 02/09/2026 | §17 Q6 — `Buddy up` (falha de um decepciona o outro) | `VETADO` nessa forma | P2 (tira a paz com o amigo) | Alternativa: meta **somada** (regra 5) sem fileira vazia do parceiro; única ação = kudos |
| 02/09/2026 | §17 Q7 — estado da criatura visível socialmente | `VETADO` expor estado | #21 | Visita mostra forma + pose idle neutra. `publicProfile` hoje não expõe HP/sono (bom) mas expõe `tasksDone`/`rankPoints` (E3) |
| 02/09/2026 | §17 Q4 — piso de compartilhamento | parecer | — | Marco de evolução, nunca calendário, nunca zero (Uxcel/Marriott como contraexemplo) — aceite de WP4.8 |
| 02/09/2026 | §17 Q5 — a tela de amigos escala? | `APROVADO manter MAX_FRIENDS = 5` | — | Cinco cabem numa cena sem ordem; subir o teto reintroduz a lista |
| 02/09/2026 | WP5.1 oferta no 1º dia perfeito (padrão Me+) | `APROVADO COM RESSALVA` | — | Linha do pet primeiro; nunca no modal em que `heartsLost > 0`; cap 1/semana; `×` persistente (Garmin) |
| 02/09/2026 | **O que perdoa demais** (a metade que ninguém pede): "esqueci de marcar" é o candidato a nono perdão; um coração perdido tem **três** caminhos de volta antes do almoço | `RESPONDIDO` (D4: a AURA é o que dói, e só ela) (decisão do dono, 06/09/2026 — §15 do plano) para qualquer perdão adicional | #17 | A resposta à D4 deve **nomear** quais mecanismos são a linha, não contar. Onde NÃO perdoa demais e está certo: Vínculo (teto suave, não decai), constância (14%/falta), Torneio (XP na derrota < vitória) |
| 21/09/2026 | **Exceção da #20** (QA GERAL #29): `src/plugins/widgetSemCobranca.contract.test.ts` it "as chaves antigas são REMOVIDAS, não só deixadas de escrever" exige `editor.remove("constancy_pct"/"shields"/"bond_level")` em `SoulmonWidgetPlugin.kt` — a #14 (percentual cru) aplicada sobre o bridge quebrava a #20 (só acrescentar) sem registro | `APROVADO COM RESSALVA` — exceção inscrita | #20 (exceção), #14 | **Regra:** chave do bridge vetada por OUTRA proibição pode ser removida, e só assim: (a) por `remove()` explícito, nunca por deixar de escrever; (b) com tolerância a ausência provada no widget antigo (o layout lê a chave com default, nunca quebra); (c) registrada aqui com data e a proibição que a vetou. Fora disso, #20 continua: só acrescentar |
| 21/09/2026 | **`'tasks-100'` em `src/utils/achievements.ts`** — conquista cosmética que lê `completedTasks.length + activityLog.length >= 100`: literalmente recompensa por CONTAGEM de tarefas (QA GERAL #30; `09-guardas.md` §2 #16) | `VETADO` na forma atual | #16 | **Será renomeada para gatilho de COMPORTAMENTO** (decisão do dono, 21/09/2026); o código é de outro agente nesta rodada — esta linha só registra o veto e a saída. Aceite: nenhuma conquista lê `.length` de tarefas — **exceto a migração** `gatilhoAntigoTasks100` (`conquistasHerdadas`, herança única de quem já tinha `tasks-100`), que lê a contagem antiga UMA vez para não tirar o que já foi dado; ressalva registrada em 21/09/2026 (QA Rodada 1, `06-guardas-squads-r1.md` #13) para a régua futura não reprovar o próprio conserto |

## Perguntas que este guarda faz a QUALQUER proposta

1. Isto faz a pessoa querer **fazer a tarefa** ou querer **a notificação**?
2. Isto tira algo de alguém? Se sim, é recuperável (moeda, escudo) ou é
   identidade/progresso (proibido)?
3. Isto acrescenta **mais um perdão**? Então D4 precisa estar respondida.
4. Isto expõe um número que **desce**?
5. Se o usuário visse o mecanismo por dentro, se sentiria manipulado?
   (o teste do "homem atrás da cortina", GDC/Engelstein)
6. Isto cabe na frase "um avatar que evolui COM o usuário e o encoraja"?

## Pareceres — estudo pré-Mobbin (03/09/2026)

Fonte: seções "Candidatas" de `../estudo/{nascimento,constancia,vinculo,permanencia,sustento,medicao}.md`,
lidas contra as 21 proibições acima e contra `../mobbin/linha-vermelha.md` (nenhum parecer
abaixo contradiz um parecer de 02/09). **Ressalva vira critério de aceite do WP que a absorver.**
Copy/refactor/comentário não precisariam passar por aqui; registrados mesmo assim para o
consolidador não ter buraco na tabela.

| Candidata | Guarda | Parecer | Proibição/ressalva | Uma frase de motivo |
|---|---|---|---|---|
| C-N1 Eco do "porquê" | nascimento | `APROVADO` | — | Devolve o que a pessoa escreveu sem julgar; ecoa só `soulGoal` e nunca `soulStruggle` no dia do nascimento — devolver "o que te atrapalha" ali seria cobrança. |
| C-N2 Bifurcação em ganho concreto | nascimento | `APROVADO` | — | Custo (N perguntas, ~2 min) e irreversibilidade declarados, sem prometer "criatura melhor" — os dois caminhos continuam legítimos (decisão 7 do Mobbin). |
| C-N3 Feedback de ORIGEM no ritual | nascimento | `APROVADO COM RESSALVA` | #18-adjacente · trava de conteúdo | A trava "só de onde vem, nunca como ela vai ser" **é** o aceite (lista negativa de comportamento no teste), e mais uma: o `hint` não pode ensinar a MIRAR ("responda X para fogo") — senão a leitura vira formulário de encomenda e a criatura deixa de ser da pessoa. |
| C-N4 Micro-posse no demo (tonalidade) | nascimento | `APROVADO` | — | Cosmético puro, zero efeito mecânico, não gera sprite; screenshot obrigatório já está na spec. O grátis fica mais "meu" sem ficar mais forte. |
| C-N5 Consent enxuto | nascimento | `APROVADO COM RESSALVA` | dado pessoal | Cortar só redundância: links, caixa, campo de idade e a ORDEM (carimbo antes de qualquer dado do ritual) ficam intactos; o teste de `consent.ts` verde é o aceite, não o `≤3 <p>`. |
| C-N6 Link mágico com o pet presente | nascimento | `APROVADO` | — | Presença sem contador nem retry automático; "está te esperando" sem atribuição de causa é o pedido de ajuda do Tweenbot, não o bipe do Tamagotchi. |
| C-N7 Batismo no reveal | nascimento | `APROVADO` | — | Move um campo pré-preenchido para o clímax; nada vira obrigatório; o rascunho continua sem `petNameEdit`. |
| C-N8 `bornAt` no save | nascimento | `APROVADO COM RESSALVA` | footgun 9 · exibição | **Um campo só, um nome só**: C-V4 propõe `soulmonMeta.bornOn` para a mesma coisa — os dois guardas escrevem sobre o MESMO símbolo ou um deles cai. Save antigo nunca infere data. Exibido como data, nunca contador; o upgrade não reescreve (pergunta "nasceu de novo?" é do dono). |
| C-N9 Push D1/D2 na voz do pet | nascimento | `APROVADO COM RESSALVA` | **#19** · #18 | Passa na pergunta 1 porque o conteúdo é notícia do pet, não saudade-cobrança — **desde que**: D1 = dia SEGUINTE ao nascimento (nunca o D0, o dia de maior risco do ledger); sem condição sobre meta cumprida; só para quem já ligou notificações; copy na MESMA fonte única de WP3.4/`_pushCopy.js`; `bornAt` na KV de push é só dia-do-jogador e morre com a subscription. |
| C-C1 Intervenção never-miss-twice | constância | `APROVADO COM RESSALVA` | **#17** (confirmado: não é nono) | É um dos oito perdões saindo do papel, então **a contagem de D4 fica em oito** — e este guarda vigia a fronteira: "5 minutos conta como feito" só na 2ª falta seguida e só como oferta explícita; se algum dia "qualquer toque conta", virou perdão que esvazia. Nenhum dígito de faltas na tela (aceite). |
| C-C2 "Dias juntos" no perfil | constância | `APROVADO COM RESSALVA` | #14/#21-adjacente · footgun 9 | Número de identidade que só sobe — admissível. Ressalvas: obedece a `hideMetrics`; **não** vai ao widget nem ao `publicProfile` (#21: métrica de outro jogador); e é a SEGUNDA fonte de "há quanto tempo estamos juntos" (`saveDaysLived` × `bornAt` de C-N8/C-V4) — decidir uma, ou os dois números vão discordar na mesma tela. |
| C-C3 Selo de Foco do dia | constância | `APROVADO COM RESSALVA` | #16 · #9 | Não é recompensa por contagem: os 3 são a mecânica travada por teste (#9) e o selo é estado do dia, sem valor material. Aceites: nunca "2 de 3"; some na virada sem toast de perda; não sai para widget/perfil. |
| C-C4 Falas intermediárias (3/36/51) | constância | `APROVADO COM RESSALVA` | #16-adjacente · cadência | Fala de identidade, sem bônus, sem "faltam N" — aprovado; `HABIT_CHEER_AT` fora de `HABIT_MILESTONES` é aceite. Ressalva do WP3.2: entra na cadência única de falas do pet (B1/B3: pedido repetido sem teto é o que virou chore). |
| C-C5 Celebração rara (5%) | constância | `APROVADO COM RESSALVA` | #16 · pergunta 5 | Recompensa variável é o mecanismo do caça-níquel — só é aceitável porque o valor é ZERO (aceite: RNG fixo, resultado material idêntico). Ressalvas: nunca anunciada, nunca escalada por esforço/contagem/tipo de tarefa (o primeiro "mais rara na tarefa grande" reabre #16), e a taxa nunca vira variável de retenção. |
| C-C6 Emissores `welcome_back`/`shield_used` | constância | `APROVADO COM RESSALVA` | #18-adjacente | Só inteiros; ressalva: `days_away` em **bucket** (como C-V7 já diz), nunca dias crus; `privacidade.html` PT/EN cita os dois eventos. Duplicidade com C-V7 — um só emissor. |
| C-V1 Consumir `triggerMessage` (alívio) | vínculo | `APROVADO` | — | Fala de alívio sem "deveria/atrasou/finalmente" e o toast sai: o pet absorve a notícia. Corrige um comentário falso no código, não cria regra. |
| C-V2 Disclaimer + ponte de ajuda no chat | vínculo | `APROVADO COM RESSALVA` | #18 · dado pessoal · gate `D-dono` | **Obrigação de piso, não feature** — e condição de saída do WP3.1, como a spec diz. Ressalvas: a frase que casou com o léxico **nunca** vira evento de telemetria nem entra no save (nada de `crisis_detected`); a resposta local não diagnostica nem muda estado do pet (HP/humor/fala posterior); nunca push; texto final é do dono. |
| C-V3 Traço na voz e no toque | vínculo | `APROVADO` | #11 (mantida) | Só falas por traço já positivo por teste; `TRAIT:` para a IA entra como enum de 5 valores, nunca descrição — passa em #18. |
| C-V4 Nascimento e aniversário | vínculo | `APROVADO COM RESSALVA` | footgun 9 · #5-adjacente | Aprovado o aniversário sem XP e sem push. Ressalva: mesmo campo de C-N8 (`bornAt`, não `bornOn`); save antigo sem data não comemora nada (nunca "0 dias"); `anniversary` no `lastDayReport` é flag do dia, não estado novo persistido. |
| C-V5 Frases do widget PT/EN sem cobrança | vínculo | `APROVADO COM RESSALVA` | #16 · #19 (E1) | É o conserto do veto E1 — aceite negativo de E1 vale inteiro: nenhum dígito quando `completed < total`, nenhuma saudade-cobrança, nenhum coração vazio. Fonte única JSON + teste de paridade é o certo (footgun 9). Absorver em WP2.6. |
| C-V6 Lembrete de deitar | vínculo | `APROVADO COM RESSALVA` | #12 · #19 | É o único push de sono que a tese permite, e a pessoa escolheu a janela. Ressalvas: só com notificações ligadas E janela configurada (janela sozinha não é consentimento de push); nunca dispara dormindo; sem hora impressa, sem "deveria"; nunca condicionado à meta do dia; copy na fonte única de `_pushCopy.js`. |
| C-V7 Emitir `welcome_back` + `bond_level` | vínculo | `APROVADO COM RESSALVA` | #5 · #18-adjacente | `bond_level` como inteiro DERIVADO na hora (`bondLevelFor`), nunca lido de campo persistido; `welcome_back { bucket }`. Duplicidade com C-C6 — um emissor. |
| C-P1 Ligar `BOND_REWARDS` | permanência | `APROVADO COM RESSALVA` | Bits (conta) | Recompensa por RELAÇÃO, cosmética, sem Bits — passa. Ressalva: item já possuído marca `claimed` e **não devolve Bits** (reembolso seria fonte nova de Bits); WP4.3(a) resolve as duplicatas, não um refund. |
| C-P2 Fiar estações (nome, caminhos, medalha) | permanência | `APROVADO COM RESSALVA` | **#15** · E4 | Medalha-selo por `totalPerfectDays`/runs (não contagem de tarefas) passa em #16; `current/target` só com `current ≥ 1` (E4). Ressalva #15: virada de estação **não pode parecer prazo** — sem "faltam N dias para a estação acabar", sem push, e a copy diz o que já é verdade no código ("nada some"); caminho não concluído não é perda anunciada. |
| C-P3 Guia diz o gate real | permanência | `APROVADO` | — | Correção de mentira: guia, HUD e `handleEvolve` lendo o MESMO símbolo. |
| C-P4 Cron `closeSeason` | permanência | `APROVADO` | — | Só dispara o que já existe; troféu é cosmético. (A subtração −4 do oponente passivo é assunto do WP4.13, não deste item.) |
| C-P5 Rota de redenção na degeneração | permanência | `APROVADO COM RESSALVA` | pergunta 2 · #21-adjacente · gate D6 | Cosmético e "nunca melhor" — não cria incentivo a cair. Ressalvas: só depois de WP4.2 (senão vira caminho oficial); a variante lê como prestígio, **nunca como marca de queda** — exibir é escolha do jogador, e no perfil de amigo entra só se ele quiser (#21); copy da cerimônia sem "caiu/perdeu". |
| C-P6 Cabeçalho de `dungeon.ts` | permanência | `APROVADO` | — | Comentário mentindo é como o "roster de 60" nasceu; não muda regra. |
| C-P7 Silhueta da próxima forma | permanência | `APROVADO` | — | É exatamente a consequência da decisão 5 (silhueta/`?`, nunca nome); sem sprite, silêncio em vez de placeholder. |
| C-S1 Copy do `UnlockAccountModal` | sustento | `APROVADO COM RESSALVA` | #13 · verdade | "Apoio" à la Finch é bom; ressalvas: a criatura nunca PEDE dinheiro (voz do app, não do pet); e a frase "Pagar nunca deixa sua criatura mais forte" **só entra depois de D7+C-S3 decididas** — hoje 15 Créditos = +1 coração, e o app estaria mentindo na tela em que cobra. |
| C-S2 Travas do convite no `DailyReportModal` | sustento | `APROVADO` | — | É a trava que este guarda pediria: pet celebra, app convida, recusa vale 2 semanas, nunca modal sobre o relatório. Vira aceite de WP5.1b. |
| **C-S3 Trilho Créditos → Bits → 💗** | sustento | **`VETADO` a opção 1 (aceitar e nomear)** · decisão do dono | **#13** (E2/D7) · pergunta 5 | Dinheiro comprando a volta do ÚNICO recurso que a punição tira é vender proteção contra punição; indireto não muda o mecanismo, só o esconde (C5 #2) — e "nunca compra HP *diretamente*" é a frase que o homem atrás da cortina diria. **Alternativa** (opção 2): 💗 sai da loja de Bits e fica como drop da masmorra + recompensa de jogo; o câmbio continua servindo a cosmético. Isto também **perdoa menos**: um coração perdido deixa de ter três caminhos de volta antes do almoço. Resolver junto com D7; se o dono escolher a opção 1, este parecer e a decisão ficam registrados. |
| C-S4 Reroll → "Nova Leitura" determinística | sustento | `APROVADO COM RESSALVA` | pergunta 5 · cruza nascimento | Menos gacha, mais posse: mesma resposta = mesma criatura. Ressalvas: a tela diz isso ANTES de cobrar (para ninguém pagar por nada novo); geração antes da cobrança (C5 #1); "sorteado aleatoriamente" sai de `CreditsModal` e `termos.html` §5 no mesmo commit, senão o app mente. |
| C-S5 Preço localizado pela Play | sustento | `APROVADO` | — | Preço prometido = preço cobrado; o BRL vira fallback. |
| C-M1 Esforço como histograma | medição | `APROVADO` | — | Nenhum dado novo sai do aparelho; só o servidor deixa de mentir com média. |
| C-M2 `purchase { reason }` | medição | `APROVADO COM RESSALVA` | #18-adjacente | Enum 0–4, ok; ressalva: `privacidade.html` PT/EN cita a origem do convite, e o leitor não cruza com nada além da mesma semana. |
| C-M3 `after_bad_day` | medição | `APROVADO COM RESSALVA` | #18-adjacente · #20 | Bucket + enum, data nunca trafega, chave local apagada — passa. Ressalvas: linha na política PT/EN (já na spec); chave nova em `storageKeys.ts` (só acrescenta, #20); e o PROPÓSITO fica escrito no leitor: arbitrar se a virada vira convite de carinho — **nunca** calibrar quanto se pode cobrar. |
| C-M4 `app_open { source }` | medição | `APROVADO COM RESSALVA` | **#19** · #18 | Sem hora, sem campanha — bom. Ressalva de #19 na LEITURA: `app_open.push` só pode servir para **cortar** push que abre o app sem `day_active` (abertura sem tarefa), nunca para escolher horário/copy que maximize abertura — isso escrito no `metrics-read.mjs`. Bump de `CACHE_VERSION` ao tocar `sw.js`. |
| C-M5 Duração do onboarding em faixa | medição | `APROVADO` | — | Bucket em memória, nada gravado, entra junto de WP1.1. |
| C-M6 `haunted_done` | medição | `APROVADO` | — | Sem nome de tarefa; é a única régua de "a culpa virou loop de jogo". |
| C-M7 `checkin_shown` | medição | `APROVADO` | — | Denominador sem props; sem ele a taxa da onda 3 é opinião. |

**Fechamento (03/09/2026):** 41 candidatas — **17 `APROVADO` · 23 `APROVADO COM RESSALVA` · 1 `VETADO`** (C-S3, opção 1).

Onde este parecer disse "perdoa demais": C-S3 (três caminhos de volta do coração antes do almoço — tirar o 💗 da loja é a metade que ninguém pediu) e a fronteira de C-C1 ("5 minutos conta" só na 2ª falta, nunca "qualquer toque conta").

Duplicidades para o consolidador fundir:
- **C-N8 ↔ C-V4** — o mesmo campo com dois nomes (`bornAt` × `soulmonMeta.bornOn`); e **C-C2** é uma segunda fonte para o mesmo fato (`saveDaysLived` × data de nascimento).
- **C-C6 ↔ C-V7** — o mesmo emissor `welcome_back` proposto duas vezes (bucket, nunca dias crus).
- **C-V5 ↔ E1/WP2.6** — o conserto do veto de 02/09, que já tem WP.
- **C-N9 ↔ C-V6 ↔ WP3.4** — três copies de push que precisam da MESMA fonte única (`_pushCopy.js`); e **C-M4** é quem mede o efeito delas.
- **C-S4 ↔ nascimento §6 item 6** — os dois guardas já concordam que é um só item; dono da spec é o nascimento, do custo é o sustento.

## Parecer — `docs/NARRATIVA-E-UNIVERSO.md` (a bíblia do universo), 21/09/2026

**Veredito: `APROVADO COM RESSALVA`.** O documento não altera regra nenhuma
(tudo que exigiria mecânica está isolado na §14, "depende do dono"), não cria
perdão novo (a contagem de D4 **continua em oito**) e não expõe número que
desce. As ressalvas abaixo viram critério de aceite de quem escrever copy a
partir dele — e **três delas são "perdoa demais"**, não "pune demais".

### Ressalvas bloqueantes para a PRÓXIMA versão do doc (não para publicá-lo)

| # | Ressalva | Por quê |
|---|---|---|
| R1 | **L4 está escrita larga demais e se contradiz com a §5.4 e a §5.7.** "Nenhum número desce, na ficção também não" é falso sobre HP e energia, que descem por desenho. Restringir a: *vínculo, constância, coleção, marco, registro — nunca desce. Sustentação e disposição do dia descem, e o mundo pode descrever a descida.* | Lei que proíbe o que o produto faz torna a bíblia mentirosa no dia 1 e, pior, dá a quem escrever copy o argumento para esconder a única tensão que o produto tem. |
| R2 | **L11 proíbe o retorno do GESTO PRESENTE — isto esvazia o loop central.** Como está, a criatura nunca pode reagir a nada que venha da pessoa, inclusive ao carinho no instante em que ele acontece. Abrir a exceção: *a criatura pode reagir ao que está acontecendo AGORA, em contato (ela responde ao esfregar); o que ela nunca faz é sentir por causa do que a pessoa fez ou deixou de fazer ao longo do tempo.* | Carinho é a única cura de HP. Uma criatura que nunca responde ao toque protege contra culpa removendo a recompensa da presença — perdão que esvazia. |
| R3 | **Falta uma lei: L12 — o mundo pode nomear o ATO; nunca a pessoa, nunca o mérito.** Hoje L1 veta "Você merece" e L11 veta "ele gostou do que você fez": sobra um mundo que não pode reconhecer nada. A tese diz que o Soulmon **encoraja**. Encorajar sem julgar = falar do ato e do efeito na Malha ("Isso fechou um trecho. A fagulha firmou."), nunca da pessoa ("você é dedicado") nem de mérito ("você merece"). | Sem L12 a bíblia converge para um tom indiferente, que é o modo de falha de um v-pet. |
| R4 | **§5.4 precisa de PISO, não só de silêncio.** "Descreva o fenômeno; cale sobre a atribuição" é a regra certa para a voz do mundo, mas L10 só exige que a camada sóbria exista "em algum lugar alcançável". Para a perda de sustentação ela deixa de ser opcional e remota: **é o relatório do dia, que já existe** (`lastDayReport`), em voz de produto, dizendo o fato mecânico sem acusar ("meta do dia: 4 de 6 · 1 coração"). | A mecânica É contingente (`1 − feitas/metaDeCoração`). Mundo mudo + nenhuma camada sóbria no caminho = o jogador sente a causa e não a encontra escrita: é a pergunta 5 (o homem atrás da cortina) falhando ao contrário — o app parecendo esconder a própria regra. |
| R5 | **§10, linha do check-in de humor, está em conflito com o código NO AR.** `moodSummary` (`src/utils/mood.ts`) já devolve "Seus últimos dias têm sido pesados" e "tudo bem que seja assim" — devolutiva que interpreta o humor (vetada pela própria linha) e, na segunda, **normalização** que L9 proíbe expressamente. A regra 3 do cabeçalho de `mood.ts` ("o app DEVOLVE algo, senão é extração") é decisão anterior e boa. Resolver: a devolutiva é **voz de produto, não voz do mundo** (moldura, §16/L10) e a bíblia tem de dizer isso; e a frase de normalização sai. | Precedência é código > doc. Publicado como está, o doc nasce mentindo sobre a superfície mais sensível que existe. |
| R6 | **§7, linha das arenas, mente sobre a mecânica.** "As faixas são quanto tempo alguém frequenta" — `getTierStanding` deriva faixa de **pontos acumulados**, não de tempo. Trocar por: *"são o quanto alguém já acumulou por ali, e nunca descem"*. | A §10/§7 existem para traduzir mecânica; linha de lore que descreve errado apodrece igual a número em `CLAUDE.md`. |

### Onde este parecer disse "isto perdoa demais"

R1, R2 e R3 são essa metade. Somadas, L3+L4+L9+L11 e a §5.4 chegam perto de um
produto em que **nada que a pessoa faz tem eco declarado** — nem no mau, nem no
bom. Proibir a cobrança é a tese; proibir também o reconhecimento é a tese
virando preguiça. A linha que este guarda sustenta: **o mundo não atribui CULPA
e não emite VEREDITO sobre a pessoa; ele pode e deve nomear o ATO e o efeito
dele na Malha.**

### As 21 linhas vermelhas

Nenhuma violada, enfraquecida ou contornada. #20 respeitada explicitamente
(P1/P9/P11 trocam rótulo, nunca id); #14 e #16 reforçadas pela §10; #13 confirmada
(§10 lê o 💗 como drop de fenda, que é o estado pós-veto E2/C-S3 — a linha 🛒 do
`CLAUDE.md`, que ainda vende 💗 por 150 Bits, é quem está velha); #21 compatível.
#17: a bíblia **não acrescenta perdão** — D4 segue em oito.

### As 13 propostas da §14

| P | Parecer | Condição |
|---|---|---|
| P1 Ruptura/Trama/Guarda | `APROVADO COM RESSALVA` | Só entra **junto** de P13, e o guard tem de varrer `src/utils/oracle.ts` (o texto do Ultra interpola as três palavras), não só `.tsx`. Rótulo duplo sem guard volta na próxima feature. |
| P2 Frase no retorno | `APROVADO COM RESSALVA` | Os quatro critérios (a)–(d) viram aceite. **Acrescente (e):** não pode existir frase DIFERENTE para quem não sumiu — se a presença da frase é detectável, ela vira contador de ausência por outro meio. |
| P3 Nomear as 5 camadas | `APROVADO` | Rótulo; não passa por este guarda. |
| P4 Linha de mundo no reveal | `APROVADO COM RESSALVA` | Uma frase, sujeito = a Malha. E obedece à regra de ADJACÊNCIA da §6: não divide tela com a ficha da criatura. |
| P5 Trocar `Glitchtama` | `APROVADO` | O nome novo não pode sugerir atalho, compra ou saldo (o item tem teto de 1/dia). |
| P6 Jung público | `APROVADO` (fica interno) | Publicar é L8 + promessa clínica num produto que a §16 declara não ser tratamento. |
| P7 "Contraparte" na UI | `APROVADO` (não entra) | — |
| P8 A marca `Soulmon` | **sem parecer deste guarda** | É do dono + jurídico. Registro só do que é meu: trocar o nome **não toca regra nenhuma**, e nada nesta bíblia depende dele. |
| P9 Serah/Pyraka/Igni | `APROVADO` | Ids não mudam (#20). |
| P10 `Zeed` | `APROVADO` | — |
| P11 Escada de rótulos | `APROVADO COM RESSALVA` | **"Inteiro" como topo é vetado**: insinua que quem não chegou lá está incompleto, e a queda de forma por HP 0 passa a ler como "deixou de ser inteiro". É exatamente o dano que fez "dia perfeito" virar "dia completo" (P5 do canvas de carga). Peça outro topo (ex.: *Vasto*, *Aberto*). |
| P12 `fendas` → `dobras` | `APROVADO` | — |
| P13 Guard de vocabulário | `APROVADO`, e **pedido por este guarda** | Allowlist explícita para ids; cobre `oracle.ts`. É o que impede o léxico de apodrecer. |

### As seis perguntas, sobre o documento inteiro

1. *Faz querer a notificação?* Não — a bíblia veta FOMO, urgência e prêmio de
   retorno (P2, critério d). 2. *Tira algo?* Não; L5 restringe perda a coisa
   recuperável e apostada. 3. *Mais um perdão?* Não. 4. *Número que desce?* Não
   propõe nenhum; L4 precisa de R1 para não proibir os que já existem.
   5. *Homem atrás da cortina?* É o ponto frágil, e é R4. 6. *Cabe na tese?*
   Cabe em "evolui COM"; só cabe em "encoraja" depois de R2 e R3.
