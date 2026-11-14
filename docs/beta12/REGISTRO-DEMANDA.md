# Beta12 — Registro de Demanda (congelado 12/11/2026)

Fonte: `docs/BACKLOG-BETA12.md` (§F decisões do dono prevalecem) + pedido do dono de 12/11 (beta12 inteira em branch separada `feat/beta12`, QA, dono testa antes do merge). Dúvidas não bloqueantes: seguida a recomendada (backlog Q1–Q9, E2.7) e anotada em `docs/beta12/DECISOES-*.md`.

Nota: a decisão §F 8 ("só domingo 15/11") foi substituída pelo pedido de 12/11 (desenvolver agora em branch, sem merge).

| ID | Item | Critério de aceite (resumo; completo no backlog) | Frente |
|---|---|---|---|
| D-01 | A1 molduras remotas | moldura nova só por web aparece; cache em disco; fallback nas embutidas | A |
| D-02 | A2 widget sem moldura vertical | 1×2+ células; fala abaixo do sprite; horizontal igual | A |
| D-03 | Cage | widget com moldura rotulado "Cage" (pt/en) | A |
| D-04 | A3 Companheiro | 3ª opção no seletor; conteúdo do Cage; sprite grande se ajusta 2x2/3x3; receivers antigos ficam | A |
| D-05 | H keep-awake nativo | plugin KeepAwake nativo detectado por `keepAwake.ts` | A |
| D-06 | I alarme exato Pomodoro | método com timestamp ms, exato com fallback | A |
| D-07 | versão | versionCode 32 / 1.3.0-beta12 | A |
| D-08 | B1 Big Five complementar | mapa documentado; Soulmon derivado do teste por dimensão; sem teste = neutro; tipo nunca visível | B |
| D-09 | B2 falas + COMPLEMENTAR/SIMILAR | falas diretas sem cobrar; toggle em Configurações (padrão complementar); veto prevalece em similar; chat recebe personalidade | B |
| D-10 | C limite 20/dia | grátis: 20 msgs/dia; depois fala padrão | B (servidor) |
| D-11 | B3 fichas de NPC | ficha p/ cada NPC principal; ultra só Vesca/Hexsmith/Tessária+poucos; régua falha sem ficha; nada visível; falas reescritas; tabela no relatório | B |
| D-12 | C1 meia tela | painel até metade; ~20 msgs da sessão; fechar à esq.; mic/ações/safety ok | C |
| D-13 | C2 tela cheia | maximizar; sprite canto sup. esq. + fechar; volta sem perder sessão | C |
| D-14 | G balões dourados | G1–G8 | GJ |
| D-15 | J tarefas linkadas | A1–A12 com Q1–Q9 recomendadas | GJ |
| D-16 | E2 tabela Soulmons+NPCs | E2.6 1–12; artefato privado | E |
| D-17 | D revisão PT | 3 lotes; falas do B fora | tarefa agendada dom 15/11 (não pôde ser pausada daqui) → merge da main na branch |
| D-18 | Assets | só listados em `docs/ASSETS-A-GERAR.md` com placeholder até a operacional liberar | todas |
| D-19 | Entrega | PR draft com CI verde, QA alpha-qa, fiscal com evidência, AAB unsigned em E:\Soulmon-apk-teste\ | orquestrador |
