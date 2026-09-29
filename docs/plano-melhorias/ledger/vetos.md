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
| 22/09/2026 | **WP4.29** — geração tardia (D-G5b: nasce só o rookie) + incubação de 30 min (D-G8b/c/d) para **todo jogador do v1** | `APROVADO COM RESSALVA` (8 condições, **R-I..R-P**) | #15, #19 (a um passo) · **#13 vetada preventivamente** (R-J: espera comprável/encurtável) · pergunta 2 (R-L) | Parecer completo no fim deste arquivo. As bloqueantes: R-I sem contagem regressiva · R-J espera uniforme e nunca comprável · R-K marcador passivo + zero prêmio por voltar cedo · **R-L a espera é paga uma vez por `formId`** (hoje a §6.3 faz o HP recobrar) · R-M D-G8d vira teste + arte de reserva em silêncio · R-N copy diz na entrada que nada se perde · R-O um aviso, uma vez, pet não cobra · R-P `spriteTrigger.semPrazo.contract.test.ts` é condição de merge do v1 |

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

## Parecer — alocação manual de pontos de ELEMENTO destravada pelo Renascimento, 22/09/2026

**Veredito: `APROVADO COM RESSALVA`** — com **oito condições bloqueantes**
(R-A..R-H). Nenhuma das 21 linhas vermelhas é cruzada *pela forma decidida*;
duas ficam a um passo de serem cruzadas **pela implementação**, e é sobre esse
passo que as condições valem. Nada aqui reabre a decisão do dono sobre a forma.

O que faz a proposta passar na pergunta 1 (querer fazer a tarefa vs. querer a
notificação): a alocação **não é ganho por desempenho e não é comprável** — é
redistribuição de um orçamento que o oráculo já distribui sozinho. Ela não cria
recompensa condicional nova, então não converte a tarefa em meio para um fim
(Errant Signal). O ponto de ruptura é o **push de incubação** (R-D) e a
**vantagem de combate** (R-B), não a alocação em si.

### As condições

| # | Condição bloqueante | Por quê |
|---|---|---|
| **R-A** | **A cascata não-linear precisa de PRÉ-VISUALIZAÇÃO e de CONFIRMAÇÃO em dois tempos, dentro do estágio.** Exigências mínimas: (a) a tela mostra, ANTES de confirmar, o que a alocação atual DESTRAVA e o que ela deixa a N pontos de destravar (`CUSTO_PONTO_PAR = 2`, par em `passivos >= 10` — os dois números saem das constantes, nunca escritos à mão); (b) enquanto o estágio está aberto a alocação é **livremente refeita** (só fecha na virada declarada); (c) **piso anti-armadilha**: nenhuma alocação válida pode resultar em ficha com zero par destravado — se a escolha do jogador levar a isso, o sistema **não o impede**, mas a tela nomeia o fato em palavra antes do commit. | "Subiu a escada inteira e pagou" **não atenua nada** — agrava. Perda sobre identidade/progresso permanente é a proibição da pergunta 2, e aqui o jogador não perde por escolha errada: ele perde por **não ter como saber**. Cascata com transbordo de sinergia de alvo único não é computável de cabeça. Sem (a), isto falha na pergunta 5 (homem atrás da cortina) do jeito mais caro: o mecanismo é oculto *e* o resultado é permanente. |
| **R-B** | **`getArenaAttributes` é a brecha, e tem de ser blindada explicitamente.** `getArenaPlayerStats` já é imune (hp/dmg vêm de `STAGE_BUDGET` + `ROLE_SHAPE`, hp×dmg ≈ constante — está certo e não pode mudar). Mas `principal`/`secundario` saem **dos pontos de elemento**, e alimentam `ADVANTAGE_MULT`/`DISADVANTAGE_MULT` em `enemyHitDamage`/`playerHitDamage`. Alocar para cobrir os elementos mais comuns do roster **é** vantagem mecânica. Aceites: (i) a alocação **nunca** altera `STAGE_BUDGET`, `ROLE_SHAPE`, `SPECIAL_EFFECTS` nem nenhuma saída de `realSkillPower.ts`; (ii) a distribuição de elementos dos inimigos de masmorra/Arena **não pode ser previsível o bastante** para haver um principal dominante — ou a simulação de `arena.test.ts` roda de novo com fichas ALOCADAS adversarialmente e a janela 40–80% / spread ≤20pp se mantém; (iii) **teste novo** exigindo que, para a mesma ficha, mudar só a alocação não mude `getArenaPlayerStats`; (iv) `REBIRTH_BUDGET_MULTIPLIER` 1.5 **não** pode virar mais pontos alocáveis do que a fatia declarada — o multiplicador já existe para a geração de arte, não para poder. | A equivalência "é identidade, não poder" (modelo shiny) é o que sustenta a #4 e a decisão §16.1-1 (o grátis não pode ser pet pior, exposto socialmente). Renascer é PAGO. Se a alocação mexer em resultado de combate, o app vende poder — e vende para quem já tinha tudo. |
| **R-C** | **O ganho do renascido é declarado como ESCOLHA, nunca como força — e a copy tem de ser verdadeira no dia 1.** Nenhum texto pode dizer "mais forte", "melhor", "otimizar" ou "build". A palavra é *escolher a essência*. E a frase "Pagar nunca deixa sua criatura mais forte" (C-S1) **só pode ser escrita depois que R-B tiver teste verde** — senão o app mente na tela em que cobra. | Princípio 1: dinheiro compra identidade, nunca comportamento. A forma decidida passa (ver §4 abaixo) **porque** o conteúdo destravado é escolha estética/identitária. Some R-B e a frase vira propaganda falsa. |
| **R-D** | **O push de incubação é VETADO na forma proposta. Fica o aviso na fila da Home; o push só entra sob as quatro travas:** (a) só para quem já ligou notificações; (b) **cede a vez à janela de descanso** com a mesma regra da copy das 20h — se a janela do jogador começa em ≤2h30, ele não sai; (c) **nunca dispara com o pet dormindo**, e nunca depois do `sleepReminderAt`; (d) copy na fonte única `_pushCopy.js`, sem hora impressa, sem "última chance", sem "falta(m) N", sem contagem regressiva — e **sem condicionar a nada que o jogador tenha ou não feito no dia**. Se alguma das quatro não couber, o push não existe: o aviso na fila basta. | 24h com fechamento automático **é** prazo, mesmo sem contador na tela — tirar o dígito não tira o relógio. Um push que diz "isto fecha" é exatamente a mecânica cuja resposta é *querer a notificação* (**#19**), e a beira de **#15** (FOMO que tira: fechar a alocação tira uma escolha). O que salva é a janela ser longa, a alocação já estar pré-visualizada (R-A) e o fechamento não tirar NADA — ver R-E. |
| **R-E** | **`hideMetrics` vale aqui inteiro**: com ele ligado, nenhum número da alocação aparece na Home nem em push — a superfície vira palavra ("a essência deste estágio já se fixou"). E a alocação **nunca** vai ao widget nem ao `publicProfile` (**#21**: elemento alocado é métrica de build de outro jogador). | #14/#21. A tela do outro só mostra presença. |
| **R-F** | **Fechar a janela sem alocar NUNCA pode resultar em pontos perdidos.** Não alocar = o oráculo distribui aquele estágio como distribui hoje, e a tela diz isso antes. A incubação fecha a *escolha*, não o *recurso*. | Pergunta 2. Perda por omissão sobre progresso permanente é a linha vermelha mais dura que existe aqui — e o jogador que não abriu o app em 24h é, por definição, o que estava em falta. Cobrar dele é a tese invertida. |
| **R-G** | **Degeneração dentro da incubação: a trava 3 de `spriteTrigger` (§3.5, "queda não gera lote") vale IGUAL para a janela de alocação.** Degenerar **não** abre janela, **não** fecha a janela aberta e **não** desfaz alocação já feita. Re-subir a mesma forma **não** reabre alocação (o chaveamento é por `sprites[formId]`/alocação AUSENTE, nunca por "já passei aqui"). Teste exigindo isso. | Degeneração é caminho normal até o ultra. Se a queda mexesse na alocação, o HP — a única punição sancionada, com teto e perdões — passaria a cobrar **identidade permanente**. Isso é cruzar a pergunta 2 por via indireta, e seria a punição mais severa do produto inteiro. |
| **R-H** | **`rebirth` vira CHAVE DE MODO, e isso tem de ficar escrito no código.** Aceites: (a) comentário-lápide no `src/utils/rebirth.ts` dizendo que o registro deixou de ser só histórico e que apagá-lo **rebaixa o pet, apaga um modo pago e é irreversível**; (b) **teste de contrato** provando que nenhum caminho (load da nuvem, higienização, migração, fresh start, `applyFreshStart`) remove ou sobrescreve `rebirth`; (c) a alocação **não é lida de `rebirth`**: grava-se um campo próprio (`elementAllocation`) que existe por si — dois fatos, dois campos, e o modo sobrevive mesmo se alguém mexer no registro. | O `CLAUDE.md` já diz "o registro `rebirth` no save é o que impede a segunda vez, então ele nunca é apagado" — mas o motivo escrito hoje é *impedir repetição*, e um agente futuro lê isso como "histórico". Sobrecarregar um campo com dois significados é o footgun 9 na forma mais cara: aqui o dano é apagar conteúdo pago sem nada ficar vermelho. |

### As seis perguntas

1. *Querer a tarefa ou a notificação?* A alocação, a tarefa. O **push**, a
   notificação — por isso R-D. 2. *Tira algo?* Só se R-A, R-F ou R-G caírem;
   nas três o que se perderia é **identidade permanente**, que é proibido.
   3. *Mais um perdão?* **Não** — a contagem de D4 continua em oito.
   4. *Número que desce?* Não (R-E cuida da exibição). 5. *Homem atrás da
   cortina?* É o ponto frágil: cascata não-linear invisível. R-A é a resposta.
   6. *Cabe na tese?* Cabe — "evolui COM" fica mais literal, já que o jogador
   passa a dizer para ONDE.

### Onde este parecer diz "isto perdoa demais"

**R-F é perdão, e é o certo. R-A(b) é onde a linha tem de parar**: refazer
livremente *dentro do estágio* é o perdão suficiente. **Alocação reversível
depois do fechamento é vetada** — e este guarda veta preventivamente qualquer
futuro "reset de pontos" (grátis, por Bits, por Créditos ou por item). Escolha
que pode ser desfeita a qualquer momento não é escolha, e um reset pago seria
**#13 com outro nome** (vender saída de uma consequência). A permanência é o que
dá significado à única decisão de identidade que o jogador toma sozinho; sem
ela a mecânica esvazia.

## Parecer — WP4.29: geração tardia (D-G5b) + incubação de 30 min (D-G8b/c/d) no **v1**, 22/09/2026

**Veredito: `APROVADO COM RESSALVA`** — com **oito condições bloqueantes
(R-I..R-P)**. Nenhuma das 21 linhas vermelhas é cruzada *pela forma decidida*.
Duas ficam a um passo de serem cruzadas pela implementação (**#15**, FOMO que
tira — travada por teste desde 21/09/2026 — e **#19**, querer a notificação), e
uma terceira (**#13**, vender proteção contra punição) é **vetada
preventivamente** na sua forma futura óbvia: vender o pulo da espera.

### A pergunta que o autor pediu para responder

*Trinta minutos obrigatórios entre "mereci" e "posso" ferem uma linha vermelha?*
**Não, na forma decidida.** E a fronteira entre **ritual de incubação** e
**timer gate** não é o tempo — é o que o relógio pode FAZER. Um timer gate tem
três órgãos, e a proposta não tem nenhum dos três:

| Órgão do timer gate | A proposta |
|---|---|
| **Expira** (voltar tarde custa) | Não. `agora − since ≥ INCUBATION_MIN_MS` só LIBERA (D-G8, D-G8b, régua `spriteTrigger.semPrazo.contract.test.ts`) |
| **Puxa de volta** (push/badge) | Não. Decisão #76 cortou o push; só o aviso na fila da Home |
| **Vende o pulo** (gema/moeda que acelera) | Não existe — e **R-J** o veta antes de alguém propor |

Tirados os três, o que sobra é o v-pet clássico: o tempo é conteúdo, não
alavanca. **`MANUAL_EVOLUTION` continua íntegro**: o portão decide o *quando
mais cedo*, nunca o *se* nem o *quando de fato* — e o app já tem um portão de
tempo dessa espécie aceito há muito (`perfectDays` são dias, não minutos).
Passa na pergunta 1 (Errant Signal): a espera não é recompensa condicional nova
e não converte tarefa em meio para um fim — ela não tem como ser farmada.

**O 23h50 não perde nada** — confirmada a leitura do autor. `perfectDays` só
acumulam, o gesto espera indefinidamente e nenhuma virada consome a incubação.
**Mas isso só é verdade se R-L valer** (ver abaixo): hoje a §6.3 manda limpar a
incubação quando `faltam > 1`, e é por aí que a espera vira cobrança.

### As condições

| # | Condição bloqueante | Por quê |
|---|---|---|
| **R-I** | **Nenhuma contagem regressiva, em lugar nenhum.** Nem na Home, nem na página de Evolução, nem na fala do pet, nem no título da aba: proibido dígito que decresce, barra que enche em tempo real e hora impressa de conclusão. A superfície diz em palavra grossa ("a forma seguinte está tomando corpo") e, depois de liberada, em palavra ("já pode nascer"). `hideMetrics` vale inteiro. | **Pergunta 4** (número que desce) na forma mais literal que existe. E um relógio visível tiquetaqueando é o motor exato da reabertura compulsória: quem vê o número olha o número. O aviso descritivo da §6.5 já entrega a informação útil — que há algo tomando corpo — sem instalar um cronômetro na cabeça do jogador. |
| **R-J** | **VETO PREVENTIVO: a espera nunca é encurtável, comprável, pulável ou premiável.** Nada de item "choca na hora", Créditos/Bits que aceleram, "primeira evolução sem espera", redução por vínculo/assinatura/traço, nem espera menor para quem pagou. `INCUBATION_MIN_MS` é **uma constante única, uniforme para todo jogador** (teste: nenhum caminho de código multiplica, divide ou condiciona esse valor). E o inverso também: nunca **alongá-la** como consequência de nada que o jogador fez ou deixou de fazer. | É a **#13** com outro nome, e é a evolução comercial inevitável de qualquer espera em jogo mobile. Enquanto a espera é uniforme e não-comprável, ela é ritual (todo mundo incuba igual) e sobrevive à **pergunta 5**: mostrada por dentro, "seu bicho leva meia hora para tomar forma" não constrange. No instante em que existe um botão de pular, o mecanismo passa a ser *fabricar impaciência para vendê-la*, e a espera deixa de ser conteúdo para virar preço. Uma espera vendável também transformaria a **#4** (Emblemas não compram vantagem) em letra morta por analogia. |
| **R-K** | **Sem push, o marcador tem de ser PASSIVO E DURÁVEL — e voltar cedo não pode render nada.** Aceites: (a) o estado "pronta para nascer" é persistente e aparece no MESMO lugar sempre, de modo que o jogador o **encontra** na próxima abertura em vez de precisar **conferir**; (b) nenhuma recompensa, bônus, cosmético, fala especial ou vantagem por evoluir logo aos 30 min em vez de dias depois — o resultado da evolução é **byte a byte o mesmo** (teste de unidade: mesma entrada, `since` de 30 min e de 30 dias ⇒ mesmo estado resultante); (c) proibido badge/contador no ícone do app e qualquer sinal fora do app (widget incluso, **#20**). | Sem push a pergunta legítima do autor é se a mecânica vira "abra o app para conferir". A resposta não é pôr push — é **tirar o motivo de conferir**. Só existe motivo se chegar antes valer mais; com (b) travado por teste, conferir é literalmente inútil, e a ansiedade morre na raiz. Um push aqui cairia direto na **#19**: uma notificação cuja resposta é *querer a notificação* (o pet está pronto!) e não *querer fazer a tarefa*. A #76 do dono está certa e deve continuar. |
| **R-L** | **A espera é paga UMA VEZ por forma.** Se a incubação for limpa (§6.3, `faltam > 1` por degeneração ou por qualquer outro caminho), o `since` da forma **sobrevive** e é reaproveitado quando o jogador volta a ficar apto à MESMA `formId`; nunca um segundo relógio de 30 min. Aceite: guardar o carimbo por forma (não um campo único sobrescrito) e caso de teste "degenerar dentro da incubação e re-subir ⇒ libera imediatamente, sem nova espera". | **Esta é a única linha vermelha que a proposta cruza de verdade, e é por acidente de implementação.** Com a §6.3 como está, perder HP dentro da janela devolve o jogador a uma segunda espera: o HP — a **única punição sancionada, com teto, folga semanal e perdão por ausência** — passaria a cobrar *tempo sobre a evolução*, que é identidade e progresso (**pergunta 2**). Seria uma punição nova, sem teto declarado, nascida de um mecanismo que existe para ser neutro. R-G do parecer de 22/09 dizia isto para a alocação; vale igual para o relógio. |
| **R-M** | **D-G8d vira teste, e a falha de arte nunca aparece como culpa nem como trabalho do jogador.** Aceites: (a) caso de unidade com acervo vazio + geração reprovada + `sprite-form-cap`/`sprite-lifetime-cap` ⇒ **libera aos 30 min**; (b) a cerimônia degrada para a arte de reserva por hash (`fallbackSpriteForStage`) **em silêncio** — sem erro, sem "tentar de novo", sem placeholder vazio, sem cadeado; (c) sprite que chegar depois preenche a forma pelo `formId`, sem repetir cerimônia. | D-G8d é a decisão certa e é do autor — este guarda a endossa e a transforma em régua. O risco que D-G5b acrescenta é concreto: hoje a ocasião A pré-gera o champion **justamente** para que a primeira evolução (o momento de maior significado de um jogador novo) tenha arte. Encolhendo o lote de nascimento, esse momento passa a depender de um terceiro. Aos 30 min a exposição é pequena, mas não-nula — e cobrar do jogador um erro que não é dele é exatamente o que a tese proíbe. |
| **R-N** | **A copy diz a verdade inteira na ENTRADA da incubação**, em uma frase: que leva um tempo, que ele **volta quando quiser** e que **nada se perde**. Proibidos: "última chance", "não perca", "corra", "ainda dá tempo", "expira", "faltam N", hora impressa, e qualquer construção que sugira prazo (**#15**, travada por `src/copy.semFomo.contract.test.ts` — estender a varredura à copy nova). PT + EN no mesmo commit. | Perdão que o jogador não soube que recebeu faz a cobrança seguinte parecer arbitrária — é o argumento escrito do `lastDayReport.restDayUsed`. Aqui é pior: quem **não sabe** que nada expira vai se comportar como se expirasse, e a ausência de prazo deixa de ter efeito nenhum sobre a ansiedade que ela existe para evitar. Um desenho sem prazo com copy ambígua entrega o dano da #15 sem sequer entregar o ganho de retenção — o pior dos dois mundos. |
| **R-O** | **Um aviso, uma vez, e o pet não cobra.** A incubação entra pela fila declarada da Home (§6.5, posição depois de HP), `notified` é one-shot, e **o pet nunca menciona a incubação de forma repetida nem ofertada** — sem fala idle sobre estar esperando, sem modal próprio, sem intersticial. Régua: `filaDeAvisos.contract.test.ts` + a cadência única de falas do WP3.2. | As DUAS FILAS existem porque avisos fora delas empilham, e a auditoria de 06/09 achou quatro superfícies fazendo isso. Um pet que lembra que está esperando é saudade-cobrança na voz mais eficaz que o produto tem (**#19**, e é o veto E1 mudando de superfície). |
| **R-P** | **A régua `spriteTrigger.semPrazo.contract.test.ts` é condição de merge do v1, não da v2.0**, e nomeia explicitamente a ÚNICA comparação de data permitida (`agora − since >= INCUBATION_MIN_MS`), reprovando qualquer outra aritmética sobre `since` que produza perda — expirar, cancelar, fechar, devolver "tarde demais". Varredura de fonte, não só unidade. | D-G8b e D-G8c são inseparáveis da régua: sem ela, o campo `since` é um prazo esperando um agente futuro que leia "data no save" e escreva o `if` óbvio. É a mesma família do veto E5 (faixa que caducava) — nada anunciava a perda, ela simplesmente acontecia. Este é o item que impede a #15 de voltar por implementação seis meses depois. |

### As duas perguntas restantes do autor

**A página de Evolução sem arte da próxima forma é perda ou antecipação?**
**Antecipação legítima, e já é a decisão §16.1-5 deste ledger** ("a Evolução
nunca nomeia a próxima forma — silhueta/`?`") e C-P7 (`APROVADO`: sem sprite,
silhueta; nunca placeholder de erro). O bestiário já ensinou esse vocabulário
ao jogador. **Condição**: silhueta, não vazio, não cadeado, não "gerando…" com
spinner — o estado tem de ler como *mistério*, que é ganho, e nunca como
*conteúdo que falta*, que é perda. Isto já estava aprovado; D-G5b só o torna a
rota principal.

**Sem push a mecânica vira "conferir o app"?** Não, **se R-K(b) valer**. O
remédio contra conferir é tirar o prêmio de chegar cedo, não acrescentar um
puxão. Push aqui seria trocar uma ansiedade voluntária por uma involuntária, e
essa é a que o produto proibiu.

### Onde este parecer diz "isto perdoa demais"

Em um ponto, e é contra o próprio autor. **R-L não pode virar "a espera nunca é
paga"**: se o `since` sobreviver a *tudo* — inclusive ao Renascimento, que é
uma criatura nova, e a uma troca de criatura pelo upgrade — a incubação deixa
de existir como ritual e vira um carimbo herdado que libera na hora. A linha é
**por `formId` dentro da mesma vida**: nova vida, nova criatura, nova
incubação. Perdão que atravessa a fronteira de identidade esvazia a única
mecânica de tempo do produto.

E a fronteira geral que este guarda sustenta aqui: **a espera só se justifica
enquanto for uniforme, silenciosa e inútil de encurtar.** No dia em que ela for
encurtável por qualquer meio (R-J), ela não é mais incubação — é um preço, e o
produto passou a fabricar a impaciência que vende.

### As seis perguntas

1. *Querer a tarefa ou a notificação?* A tarefa — não há notificação (#76), e
   R-K(b) tira o prêmio de voltar cedo. 2. *Tira algo?* Não, **desde que R-L**;
   sem ela, HP passa a cobrar tempo de evolução. 3. *Mais um perdão?* **Não** —
   D4 continua em oito; a incubação não perdoa nada, ela adia. 4. *Número que
   desce?* Só se alguém desenhar o contador — é R-I. 5. *Homem atrás da
   cortina?* Passa: "seu bicho leva meia hora para tomar forma, e espera por
   você" é dizível em voz alta. Falha no instante em que existir o botão de
   pular (R-J). 6. *Cabe na tese?* Cabe — incubar é evoluir COM, em tempo de
   criatura viva, não em tempo de jogo de espera.

## Parecer — `docs/PLANO-GUILDA.md` (a Guilda: Bosque e Feira), 29/09/2026

**Veredito geral: APROVADO COM RESSALVA.** É plano congelado (Camada 3); nenhuma ressalva abaixo libera código antes do gatilho da §0.1.

| Seção | Parecer | Motivo / ressalva (vira aceite do WP) |
|---|---|---|
| §0/§3 regras | APROVADO COM RESSALVA | Fio = 1 por pessoa por META cumprida (`dailyGoalFor`), idempotente, nunca peso/contagem: não cruza "recompensa por contagem de tarefas" nem LV-G8. `STAGE_UNLOCK_DAYS` = dias distintos, sem streak (LV-G9). Ressalva: o TTL de 120 d do `coop:<gid>` apaga o Bosque de guilda parada — regressão por ausência (LV-G3). Levado ao dono como **G17** (recomendação: sem TTL com `bosqueProgress > 0`). |
| §4 interação | APROVADO COM RESSALVA | Presença binária só ≤4 (autorizada por `02` §2.2); agregado ≥5, sem nomes; sem push. Ressalva (corrigida no texto): agregado **não desenhado quando 0** — placar vazio de manhã lê como chamada. |
| §5 entrar/sair | APROVADO COM RESSALVA | Sair = um toque, sem perda, cenário fica (LV-G5). Texto do viajante corrigido para "enquanto a guilda existir" até G17. |
| §6 salas / §9 estética | APROVADO | Sem número, sem "faltam X", sem ausentes; proibido desenhar decadência. |
| §7 benefícios | APROVADO | Só cosmético + Emblemas; nunca coração, Créditos, energia, `perfectDays`, Glitchtama. Emblemas seguem comprando só `TOURNAMENT_ITEMS` cosméticos. |
| 🎪 Feira | APROVADO | Roda × fenômeno, sem confronto entre guildas nem ranking (D-G4); golpe não toca Bosque, coração nem Créditos; dano sorteado no servidor e nunca exibido (sem número por pessoa, REGISTRO 13.13). |
| §8 balanceamento | APROVADO | **Isto perdoa demais, no limite**: piso de 2 Emblemas por UM toque semanal, mesmo em recuo, é forma de bônus de login. Aceito porque é gesto dentro da Feira, sem push e < 1 vitória do Torneio; se algum dia virar aviso/nudge ("pegue seus Emblemas"), cai. Não acrescenta perdão de punição — D4 segue em oito. |
| §10 servidor | APROVADO COM RESSALVA | Vista sem contagem por pessoa, sem estado de criatura (LV-G1/G10); nada no save; exportação só do titular. Ressalva = G17. |
| §11 widget | APROVADO | Só nome do estágio, chave nova, sob `widgetSemCobranca`. |
| §13/§14/§16 | APROVADO | Réguas por LV; alavanca em falha é baixar `GUILD_MAX_MEMBERS`, nunca identificar contribuição. |

Seis perguntas: (1) o fio nasce da meta, não o contrário; a Feira premia um gesto, não tarefa; (2) sai algo? só via TTL — G17; (3) nenhum perdão novo sobre punição; (4) único número que desce é o HP do fenômeno em faixa (é progresso); (5) cortina: dano oculto é sorteio honesto, declarado; (6) cabe na tese.

## Parecer — `L1-copy-critica.md` obs. 1, 2 e 3 (Guilda, copy), 29/09/2026

| Item | Parecer | Motivo / o que muda |
|---|---|---|
| Obs 1 `guild.bosque.agregado.*` + `guild.roda.contagem` | **VETADO na forma numérica** (LV-G2, Recusa 3) | "Hoje, 3 fios" ao lado de "8 na roda" = "3 de 8 vieram", a lista de ausentes em aritmética. Alternativa adotada (a do relatório): "Hoje o bosque recebeu fios." / "The grove took in strands today.", só com `size ≥ 5` e ≥ 1 fio; 0 = silêncio. `{n}` proibido na família. `threadedToday` passa de `number\|null` a `true\|null`; o número deixa de trafegar. |
| Obs 2 `guild.roda.presente` (≤4) | **APROVADO COM RESSALVA** | PLANO §3.3 e REGISTRO 13.13 autorizam presença binária; com ≤4 é companhia. LV-G2 lido como "nunca mostra ESTADO de ausência". Ressalvas (aceite): só o dia corrente, sem histórico de semana/estação, sem ordenar por presença, sem "apagado" visual nos demais, some ao chegar a 5. Teste `guild.vista.test.js`: `presence === null` com 5+. |
| Obs 3 `guild.bosque.perto` | **APROVADO COM RESSALVA** | Sem número; ressalva: binário (perto/silêncio), nunca razão exata nem tempo estimado. |

Perdoa demais? Não aplicável: nenhuma das três mexe em perdão.
