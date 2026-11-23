// CARTAS GLOBAIS (§288): anúncio do app entregue pela caixa do Papus a TODA conta, sem push e sem dado pessoal.
// O conteúdo é versionado AQUI (código, revisado em PR). Cada carta tem `id` estável e janela `desde`/`ate`.
// A entrega acontece na leitura da caixa (`readMail`): vira uma carta comum `global:<id>` na fila da conta, UMA vez
// (o `mid` entra em `done` quando a carta é apagada ou expira), então "ver uma vez e marcar como lida" é o próprio fluxo da caixa.
// Publicar nova = acrescentar um item; retirar = deixar `ate` no passado (quem já recebeu continua com a carta até expirar).

// `ativa: false` = pronta, mas NÃO publicada. A carta da Hexsmith foi ligada depois que o PR dos botões de lápis e chama (#808) entrou na main.
export const CARTAS_GLOBAIS = [
  {
    id: 'widget-area-de-trabalho-2026-11',
    ativa: true,
    desde: Date.UTC(2026, 10, 11),
    ate: Date.UTC(2027, 0, 11),
    carta: {
      titlePt: 'Novidade: widget na área de trabalho',
      titleEn: 'New: desktop widget',
      bodyPt: 'O que é o widget? É o seu Soulmon na área de trabalho do celular. Agora você pode colocar o Soulmon na tela inicial. Escolha a moldura (o frame) que você mais gosta; veja um exemplo na imagem. Toque na sua foto de avatar e configure o seu widget por lá.',
      bodyEn: 'What is the widget? It is your Soulmon on your phone’s home screen. Now you can put your Soulmon right there. Pick the frame you like most; see an example in the image. Tap your avatar photo and set up your widget from there.',
      npc: 'mensageiro',
      tutorial: 'widget',
    },
  },
  {
    id: 'hexsmith-nomes-2026-11',
    ativa: true,
    desde: Date.UTC(2026, 10, 11),
    ate: Date.UTC(2027, 0, 11),
    carta: {
      titlePt: 'Novidade na Hexsmith',
      titleEn: 'New at the Hexsmith',
      bodyPt: 'Agora, aqui na Hexsmith, você pode trocar o nome do seu Soulmon (botão do lápis) e o nome do especial dele (botão da chama), por 200 Bits cada.',
      bodyEn: 'Now, here at the Hexsmith, you can rename your Soulmon (pencil button) and its special (flame button), for 200 Bits each.',
      npc: 'hexsmith',
    },
  },
];

/** As cartas globais vigentes em `now`, já com `mid` e `kind`. */
export function cartasGlobaisAtivas(now = Date.now()) {
  return CARTAS_GLOBAIS
    .filter(g => g.ativa === true && now >= g.desde && now < g.ate)
    .map(g => ({ ...g.carta, mid: `global:${g.id}`, kind: 'global' }));
}
