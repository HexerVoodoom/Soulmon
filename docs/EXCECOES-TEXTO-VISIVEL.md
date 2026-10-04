# Exceções ao "texto explicativo vai para o ?" (K6 / I13)

> 04/10/2026, 2ª passada da varredura (`feat/r6-sweep2`). Pedido do dono: o texto que **explica como uma regra ou tela funciona** sai da tela e vira o `InfoTip` (`src/components/ui/InfoTip.tsx`, o "?" ao lado do título ou da linha que ele explica). O que está listado aqui **continua escrito na tela** — uma linha por exceção, com o motivo. Quem criar texto novo segue a regra: explicação → `InfoTip`; só entra aqui se couber num dos motivos abaixo.

Motivos (a coluna "Motivo" usa estas siglas):
**OB** onboarding e termos/consentimento · **SEG** segurança e crise · **IA** divulgação de IA e provedor · **HON** aviso de honestidade exigido por guarda do projeto (ou por teste de contrato) · **EST** erro, vazio, estado, saldo ou limite · **NPC** fala do pet/NPC, narrativa e lore · **ROT** rótulo, título, botão ou sublegenda de linha-botão · **INT** ferramenta interna · **AJU** o conteúdo da ajuda É a explicação.

## Exceções por tela

| Onde | O que fica visível | Motivo |
|---|---|---|
| `SoulmonOnboarding.tsx` (todo o fluxo: portão, idade, termos, perguntas, nascimento, revelação) | frases de passo, avisos de idade e de data de nascimento, "Li e concordo", erros do Google | OB |
| `GameTutorialFlow.tsx` | a página de boas-vindas e o primer de loja; o aviso `data-ai-hint` ("este texto vai para o provedor de IA"); as falhas e o limite de sugestões | OB, IA, EST |
| `FirstDayCard.tsx` | as três dicas dos gestos do primeiro dia (carinho é o único jeito de curar e ninguém descobre sozinho) | OB |
| `catalog/CatalogOnboardingFlow.tsx`, `catalog/CatalogLevelInviteModal.tsx` | subtítulo de passo e corpo do convite | OB |
| `StepsCard.tsx` (`copy.privacy`), `TermsUpdateBanner.tsx`, `SettingsPage.tsx` (Disclosure da telemetria: o que é e o que nunca é enviado) | texto de consentimento e de privacidade | OB |
| `UnlockAccountModal.tsx`, `CreditsModal.tsx` (preço, "uma pessoa faz este app", bloqueio de reroll), `ProtectProgressModal.tsx`, `AccountSection.tsx` | termos da compra e do vínculo da conta | OB |
| `refugio/SupportNote.tsx`, `ChatBox.tsx` (aviso de ajuda de verdade), `play/CadernoSheet.tsx` ("parece um dia pesado"), `catalog/CatalogMindNotice.tsx` (quando NÃO usar), `play/PasseioSheet.tsx` (`data-travessias-seguranca`) | apoio, CVV 188, findahelpline, contraindicações, "escolha só o que for seguro" | SEG |
| `SettingsPage.tsx` (parágrafo de IA do bloco SOBRE), `AISettingsModal.tsx` | quais conteúdos são gerados por IA e por qual provedor | IA |
| `EvolutionPath.tsx` | "Segurar a forma não protege os corações"; a frase `tuneAuto` (a troca de rosto é anunciada ANTES — o teste de sprite exige visível) | HON |
| `ArenaGame.tsx` | "N rodadas… Perder custa a run — nunca os seus corações" (`ArenaGame.render.test` exige a promessa visível) | HON |
| `NewReadingModal.tsx`, `CreditsModal.tsx` (linha do reroll) | a equivalência mecânica D-05 (mesma resposta, mesma criatura; dinheiro nunca compra poder) e o que se mantém, junto do pedido de pagamento | HON |
| `RebirthModal.tsx` | a explicação central do Renascimento, "Acontece UMA vez… não tem como desfazer" e o alerta de confirmação | HON |
| `OraclePage.tsx` | os avisos "teste NÃO validado", "posições geocêntricas… sem validade preditiva", "Ascendente estimado" e a nota de controles desligados | HON |
| `SettingsPage.tsx` (SOBRE: os três limites da §16 da bíblia) | "não avalia, não diagnostica, não trata…" | HON |
| `GuideModal.tsx`, `HelpModal.tsx` | o corpo e as introduções do guia e do glossário | AJU |
| `App.tsx` (blocos de Renascimento `data-rebirth-block`; passos sugeridos pela IA: pensando, erro, "toque nos passos que você quer") | cópia §5.4/§5.6 da bíblia e estados da sugestão | NPC, EST |
| `MorningDream.tsx`, `DailyReportModal.tsx`, `NightmareBattle.tsx`, `DreamDex.tsx` (vazio/completo), `PetPage.tsx` (vazio e "assentou perto do seu Soulmon"), `AdventureDiary.tsx` (vazio), `MemoriesCard.tsx` | fala do pet, cena, relatório e narrativa de lore | NPC |
| `EvolutionPath.tsx` (estados da arte, "sua árvore ainda não foi revelada", desempate de galho), `TournamentPage.tsx` (carregando, vazio, falha de rede, "sem prêmio e sem custo"), `mercado/ShopShelf.tsx` (linha de bloqueio do item, saldo/custo da compra, "tudo daqui já é seu"), `LibraryPage.tsx`, `AccountDataSection.tsx` (falhas, prazo, "entre com seu e-mail"), `HabitConstancy.tsx`, `TriagePile.tsx` | mensagens de erro, vazio, estado, saldo e limite | EST |
| `AccountDataSection.tsx` | as listas "O que NÃO está aqui" e "Some / Fica / Continua existindo" (o rótulo e os itens; os porquês foram para o "?") | ROT |
| `FeedbackLink.tsx` (`ActionRow`), `TriagePile.tsx` (sublegenda dos 4 botões), `RespiracaoGame.tsx`, `GameKit.tsx` (`sub`) | sublegenda de linha que é um botão ou um link (um `InfoTip` é `<button>` e não cabe dentro de `<a>`/`<button>`) | ROT |
| `guild/GuildSheet.tsx` (`somenteAbriu`, `codigoNovo.nota`, `sair.nota`, `criar.codigo.corpo`, dica do código) | consequência de uma ação e permissão; testes de render e `guildSemCobranca.contract` leem o texto | EST, HON |
| `BalanceWeekModal.tsx` ("cada hábito continua acontecendo o mesmo número de vezes") | a frase que impede o mal-entendido mais provável; o teste de render exige em texto | HON |
| `MorningCheckIn.tsx` (`data-checkin-why`) | a linha única de benefício do check-in (decisão C9) | HON |
| `mercado/MercadoSheets.tsx` ("Sem pressa: isto fica aqui…") | o convite passivo da conta, sem urgência (guarda de cobrança) | HON |
| `GmPanel.tsx` | dicas das ações do painel de GM (só admin) | INT |
| `PlayCard.tsx`, `CompanionHUD.tsx` (energia insuficiente para brincar) | estado do botão | EST |

## O que a 2ª passada moveu (para o "?")

Os commits `feat(k6)` da branch `feat/r6-sweep2` têm o detalhe por área. Resumo: lojinha (descrição do item sai da linha, linha de apoio da moeda e "como ganhar" da conquista), conta (porquês do inventário e do "o que não está aqui", métricas de uso, "esconder números"), instalação, Biblioteca, Diário de aventuras, fuso horário, habilidade do Pet, caminhos do Ultra, meta do dia completo, "o que se mantém" no Renascimento, regra do bosque da guilda, requisito e faixa do Torneio, instruções de Troca e Picross, passo a passo do Oráculo e do Pixelador.

## Perguntas para o dono (conservador: ficaram visíveis)

1. As cinco notas da guilda (tabela acima) — vale mover para um "?" mesmo com os testes de render lendo o texto?
2. A linha do check-in (C9) e a "promessa de corações" da Arena — são benefício/honestidade; mantê-las escritas?
3. As introduções de `GuideModal` e `HelpModal` — também viram "?" ou o guia é, por definição, texto?
4. `ActionRow` (link/botão com sublegenda): aceita-se um "?" fora da linha, ao lado, ou a sublegenda fica como rótulo?
