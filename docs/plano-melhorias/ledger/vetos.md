# Ledger — guarda da linha vermelha (vetos e pareceres)

Dono: `soulmon-guarda-linha-vermelha`. Fonte: seção 9 do `PLANO-MELHORIAS.md`,
seção C do `GUIA-EXPERIENCIA.md`, tabela de regras do `CLAUDE.md`.

**Este guarda não possui WP nenhum, de propósito**: quem tem entrega própria tem
incentivo para relativizar a própria proibição.

## As proibições, e o que cada uma protege

### Travadas por TESTE (remover o teste é remover o produto)
1. Streak que zera · 2. Humor como pontuação · 3. Bits→Créditos ·
4. Emblemas comprando vantagem · 5. `bondLevel` persistido · 6. Dia da regra
diária pelo relógio do aparelho · 7. Aritmética de HP no `App.tsx` · 8. Regra
dentro de updater inline · 9. `MAX_DAILY_FOCUS ≠ 3` · 10. `ABSENCE_FORGIVENESS_DAYS ≠ 2`
· 11. Traço de nascimento negativo · 12. Punição por sono ruim / score de sono.

### Travadas por TESE (sem teste, e por isso mais frágeis)
13. Nunca vender proteção contra punição · 14. Nunca percentual cru de
constância na UI · 15. Nunca "última chance"/FOMO que tira · 16. Nunca
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
| 02/09/2026 | **O que perdoa demais** (a metade que ninguém pede): "esqueci de marcar" é o candidato a nono perdão; um coração perdido tem **três** caminhos de volta antes do almoço | `BLOQUEADO:D4` para qualquer perdão adicional | #17 | A resposta à D4 deve **nomear** quais mecanismos são a linha, não contar. Onde NÃO perdoa demais e está certo: Vínculo (teto suave, não decai), constância (14%/falta), Torneio (XP na derrota < vitória) |

## Perguntas que este guarda faz a QUALQUER proposta

1. Isto faz a pessoa querer **fazer a tarefa** ou querer **a notificação**?
2. Isto tira algo de alguém? Se sim, é recuperável (moeda, escudo) ou é
   identidade/progresso (proibido)?
3. Isto acrescenta **mais um perdão**? Então D4 precisa estar respondida.
4. Isto expõe um número que **desce**?
5. Se o usuário visse o mecanismo por dentro, se sentiria manipulado?
   (o teste do "homem atrás da cortina", GDC/Engelstein)
6. Isto cabe na frase "um avatar que evolui COM o usuário e o encoraja"?
