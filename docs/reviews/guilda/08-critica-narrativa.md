# 08 — Crítica narrativa da Guilda (29/09/2026, `narrative-critic`)

Alvo: texto de jogador de `docs/PLANO-GUILDA.md` (§1, §4, §5, §6, §9, §12) e `03-lore.md` §3–4,
contra L1..L12 (`NARRATIVA-E-UNIVERSO.md` §2), `src/narrativa.contract.test.ts` e D-G4.
Correções de redação **já aplicadas** no plano (só texto/vocabulário; nenhuma regra ou número).

## BLOQUEANTE

**B1 — A Feira da lore é confronto entre grupos (contradiz D-G4).** `03-lore.md` §3 "Arena — vitória:
as manifestações se encontraram e a sua passou" / "derrota: o encontro terminou para o outro lado";
§4 6 "As arenas estão de pé", 6b "Tem gente de outros bosques. Vamos?", 7 "O encontro terminou para o
outro lado", 7b "Eles pulam alto". Dano: o redator herda um adversário com gente dentro; "recuou" vira
"outra roda nos venceu", e a comparação social que D-G4 tirou volta pela fala (31,3% de efeito negativo
em só-leaderboard, `PLANO-EVOLUCAO.md` 4.2). Substituta (aplicada no plano, §12 "Strings-modelo da Feira"):
aberta "A maré abriu a Feira. Algo chegou da névoa." / "The tide opened the Fair. Something came in from
the mist."; pet "Tá tudo embaçado ali. Vamos?" / "It's all fuzzy over there. Shall we go?"; dissipado
"O fenômeno se desfez diante da roda." / "The phenomenon came apart before the circle."; recuou "O fenômeno
voltou para a névoa. O bosque segue como estava." / "…went back into the mist. The grove stays as it was.";
pet "Ele foi embora sozinho." / "It went away on its own." O `03-lore.md` fica como registro; a fonte
passa a ser o plano (G14 atendido no texto).

**B2 — O inimigo da Feira é a pilha de pendências (nota de rodapé que é tema).** §9: "A névoa casa com o
tema do fenômeno ('a pilha que pesa'), sem nomear pendência como culpa"; `04-arena.md` §2: "Nevoeiro de
Pendências… a ameaça é a mesma pilha de culpa". A ressalva admite o risco de passagem. Dano: a roda passa
a bater, junta, na pendência de cada um; semana que "recuou" lê como "a pilha ganhou de nós", e quem está
em episódio depressivo, com backlog assombrado, entende que a própria pilha é o monstro que os outros
tiveram de enfrentar por ele — cobrança terceirizada (§0.3) pela ficção (L3). Substituta (aplicada): "O
fenômeno é **tempo da Malha** (névoa, maré alta, estática, enxame: camada que não assentou), **nunca** a
pilha de pendências de ninguém". Os FX `fx-fair-*` não mudam. `04-arena.md` precisa do mesmo corte no
próximo passe.

**B3 — A promessa iguala meta cumprida a "cuidar de si" (lentes 2 e 4).** §1: "cresce quando alguém da roda
cuida de si". A mecânica (D-G2) dá o fio a quem **cumpre a própria meta do dia**. Dano: dia sem fio =
"não cuidei de mim", diagnóstico sobre a pessoa escrito como promessa; quem descansou ou estava mal recebe
a leitura contrária a L9. Substituta (aplicada): "Um bosque que ganha um fio cada vez que alguém da roda
alcança a própria meta do dia, e nunca encolhe." / "A grove that gains a strand each time someone in the
circle reaches their own goal for the day, and never shrinks." O ato no lugar da virtude.

## CORRIGIR

**C1 — "Sem conexão. Nada se perdeu." / "Nothing was lost."** (§5). Promessa que a mecânica não garante: um
fio ou gesto que não chegou ao servidor não foi registrado. Substituta (aplicada): "Sem conexão. Nada
mudou." / "No connection. Nothing changed." (constata, igual à coluna "nada muda").

**C2 — Fronteira da ficção (L10).** A Feira só tem voz de mundo ("se desfez", "recuou") e o valor
(4 ou 2 Emblemas, 1 rodada/dia) não aparece em superfície sóbria antes do WPG-15. Sem isso a ficção é a
única descrição do que aconteceu. Pedido ao WPG-0: toda tela da Feira mostra ao lado a linha sóbria
("Uma rodada por dia. Semana dissipada: 4 Emblemas; senão, 2." / "One round a day. Cleared week:
4 Emblems; otherwise, 2."), e o WPG-15 põe Feira e Bosque no `HelpModal`.

**C3 — "Tangle" (EN do estágio Ramagem).** Emaranhado lê como bagunça/preso; estágio de crescimento que
soa como defeito. Substituta (aplicada em §12): **Boughs**. `03-lore.md` §2 ainda diz Tangle (registro).

## OBSERVAÇÃO

- O1 — "maré"/"tide" colide com `season-tide` / "Tide Season" (`src/utils/seasons.ts`): duas marés de
  comprimento diferente. A bíblia já usa maré como ciclo; o redator só não põe "Season" junto.
- O2 — GUI-05 ("fio firmado × meta ainda não cumprida"): o estado sem fio precisa ser **silêncio**, não
  "ainda não". Nenhuma string escrita; só registrar.
- O3 — "Copa"/"Mata" têm segundo sentido em PT (taça; verbo matar). Em contexto de lugar, aceitável.

## Lentes sem achado (e por quê)

- **Cobrança**: gestos (§4) são anônimos, para a roda, sem contagem — certo, não mexer. Tabela "Nunca
  dizer" da §12 é o melhor pedaço do plano.
- **Indiferença**: o mundo responde — "Um fio firmou", "Seu fio firmou hoje" só para você, cerimônia de
  marco que espera o gesto, gestos recebidos em lote. Não há universo mudo.
- **Voz**: pet fala de si ("Tá mais alto que eu agora", "Oi. O bosque tá aqui") e reage ao agora (L11);
  nenhuma string parabeniza. "Seguir o próprio caminho" para sair é certo.
- **Quem mais lê**: sem chat livre e agregado só ≥5 protegem menor e quem sumiu.
- **Régua** (`narrativa.contract.test.ts`): nenhum termo proposto casa com `TERMOS`; a nota da §12 sobre
  Ruptura/Trama/Guarda em arquivo novo e Glitchtama fora está correta. Semente/Broto já vetados (colidem
  com `tournamentTiers.ts`) — certo.

## Franquia

Bosque/Grove, roda/circle, Feira/Fair, fio/strand e os estágios são palavras comuns sem uso distintivo
achado em WebSearch rápido (29/09/2026; só genéricos de guilda em apps). Descartado sem acionar o
`soulmon-ip-brand-guardian`; o ⚠️ do plano pode ficar até o parecer formal do WPG-0.
