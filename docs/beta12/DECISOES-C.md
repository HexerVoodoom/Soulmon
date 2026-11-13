# Beta12 frente C: decisões (chat evolutivo, só front)

- **Abertura:** tocar/focar no campo do chat abre a meia tela (50% da área visível via `visualViewport`). Fechar à esquerda, maximizar (seta para cima) à direita; na tela cheia a seta volta para a meia. Escape fecha.
- **Ícones:** o subset da fonte não tem `open_in_full`; usei `expand_less`/`expand_more` (já existem) para não regerar a fonte.
- **Barra no painel:** o campo, o microfone e o cartão de ação moram num nó movido entre o dock da Home e o painel (portal estável), então o `<input>`, a gravação e o texto digitado sobrevivem à troca de modo. O foco é devolvido após o movimento.
- **Mensagens:** só em memória (`useState` no `ChatBox`), até 20 visíveis (§F.11); o servidor segue recebendo 3 turnos (`history`). Fechar o painel/tela cheia não apaga a sessão, pois o `ChatBox` continua montado no dock.
- **Fala de limite diário (B):** qualquer resposta de texto da API vira fala do Soulmon na lista; nenhuma lógica nova de cota no front. `functions/api/chat.js` intocado.
- **Balão de 5 s:** continua acontecendo (`onSendMessage`). Com o painel aberto ele duplica o texto da lista; não suprimi para não tocar mais no `CompanionHUD` (outra frente mexe nos balões). Possível ajuste: o HUD ignorar o balão do chat quando o painel estiver aberto.
- **CompanionHUD:** só a prop `spriteSrc={sprite}` no ponto de montagem.
- **Sprite na tela cheia:** estático (não reage a humor/pose), para poupar bateria.
