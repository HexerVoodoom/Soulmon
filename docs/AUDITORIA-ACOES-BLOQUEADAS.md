# Auditoria: ações bloqueadas × aviso padrão (09/11/2026)

Regra do dono: toda ação que o jogador tenta e não pode abre o MESMO modalzinho (`BlockedActionModal`, `src/components/ui/`)
dizendo POR QUÊ — fecha com OK, X ou toque fora. O botão bloqueado mantém a cara de bloqueado (`aria-disabled`), mas é tocável.
Texto: `explainBlocked({ kind, faltam, fonte, n })` em `src/utils/blockedAction.ts`. Lugar de "pode ser obtido em" é tocável
(`requestGoToBuilding` → `App › handleMaterialGoTo`).

## Aplicado (fatia 2)

| Área | Ação | Motivos cobertos | PR |
|---|---|---|---|
| Soulsmith / Forja | Aprimorar (lista e mapa) | falta material (tem/precisa/faltam + prédio tocável); Vínculo e outros via `forgeRefusalText` | #708 |
| Mercado › Restaurante | Cozinhar | comidas, ingrediente especial (prédio tocável quando é material), Bits, Bits ganhos; limite do dia | #710 |
| Fenda / Masmorra | Descer | energia (custo e falta); recuperação (minutos) | #711 |
| Arena › Duelo | Sortear de novo | Bits (tem/precisa/faltam) | #712 |
| Arena › Torneio | Desafiar | partidas do dia esgotadas | #712 |
| Laboratório › Hexsmith | Forjar HEX | poções (Centro de Evolução tocável), fragmentos (Fenda tocável), Bits ganhos | #713 |
| Hall › Grove | Cuidar do Bosque | "Complete mais N tarefas" + pendentes (a fala da Lilia continua) | #714 |
| Salão de jogos | Comprar tickets / Jogar sem ticket | energia (custo do lote); tickets de sobra; sem ticket | #715 |
| Mercado › Cambista | Comprar essência / Trocar Créditos | Créditos (tem/precisa/faltam); teto por elemento; teto de Bits | #717 |

## Pendente (fatia 3) — candidatas, por prioridade

Prioridade A = bloqueio de jogo com dado para explicar e hoje mudo (`disabled` sem motivo).

| Pri | Arquivo | Ação | Bloqueio | Hoje | Dado disponível |
|---|---|---|---|---|---|
| ⚠ | `guild/GuildLoja.tsx` (~44) | Comprar decoração da guilda | saldo < preço | disabled mudo | `saldo`, `i.preco` — **conflito:** a Guilda tem a regra "sem cobrança" (`guildSemCobranca.contract.test.ts` veta "falta/missing"), e o aviso padrão lista "faltam N". Decisão do dono antes de aplicar em qualquer tela da Guilda (o Grove, #714, usa só "Complete mais N tarefas", que passa na regra). |
| A | `ElementPotionSheet.tsx` (~67) | Fazer poção | essências/ingredientes | disabled/silêncio | `potionCost`, `potionIngredients`, `essences` |
| A | `Match3Game.tsx` (~765) | Dica | sem dicas e sem Bits | disabled mudo | `hintsLeft`, `bits`, `M3_HINT_PRICE_BITS` |
| A | `NewReadingModal.tsx` (~75) | Nova leitura | Créditos | disabled | `credits`, `REROLL_COST_CREDITS` |
| A | `ui/AvatarFrame.tsx` (~184) | Comprar moldura | Bits | disabled | `bits`, `f.price` |
| A | `CompanionHUD.tsx` (~1915) | Evoluir | barra incompleta / travado | botão some | `evolutionPoints`, `pointsToEvolve` |
| B | `nav/AreaView.tsx` (~378) | Abrir lote trancado | Vínculo/cristal/BB/demo | faixa `lockNote` 5 s | `g.minBond`, textos prontos |
| B | `mercado/MercadoSheets.tsx` (~386/414), `FrameShelf.tsx` | Comprar fundo/item/moldura | Bits | aviso "Faltam Bits" sem número | `balance`, `price` |
| B | `TalentTree.tsx` (~133/153) | Refazer talentos | Bits / demo | aviso inline | `r.cost`, `gamePoints` |
| B | `guild/GuildSheet.tsx` (~1062) | Doar Bits à Casa | teto / mínimo / saldo | texto / disabled | `bits`, `CASA_BITS_MIN` |
| B | `guild/GuildSheet.tsx` (~1296/1323) | Rodada da Feira / mandar missão | limite do dia / missão fora | disabled + rótulo | `raid.hitToday`, `msUntilReturn` |
| B | `play/PasseioSheet.tsx` (~178) | Concluir passeio | feito hoje / espera | rótulo/contagem | `strollWaitMs` |
| B | `LibraryPage.tsx` (~819/844) | Presentear / adicionar amigo | limite do dia / `MAX_FRIENDS` | disabled | contagem |
| B | `CreditsModal.tsx` (~193) | Ver anúncio | `AD_DAILY_CAP` | disabled | `adsLeft` |
| B | `App.tsx` (~4170) | Usar item especial | limite do dia / estágio | toast | `CHIPS_PER_STAGE` |
| C | `App.tsx refuseDemo` (~1851, 12 handlers) | qualquer ação da demo | demo | toast `demoRefusalText` | `kind: 'demo'` |
| C | `DailyRituals.tsx` (~510), `JourneyScreen.tsx` (~129), `CreateModal.tsx` (~462) | ritual fora do ritmo / pausa / teto | — | disabled | — |

Fora de escopo (não são bloqueio de jogo): `disabled` por ocupado/carregando/campo vazio (formulários, contas, onboarding,
guilda em voo, desfazer de minijogos).

Notas: nas folhas com texto de "convite, nunca cobrança" (Fenda), a frase da tela continua; o modal só soma o custo e a falta,
como o dono pediu. Lotes da Exploração: fragmentos saem da Fenda (`exploracao.fenda`); poções do Centro de Evolução
(`laboratorio.evolucao`).
