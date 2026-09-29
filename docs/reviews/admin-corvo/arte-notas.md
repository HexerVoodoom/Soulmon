# Corvinho de Lanterna e Cartola - 11 formas (recolor programatico)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Origem: `src/assets/soulmon/mascot-raven.png` (512x512 RGBA, mascote proprio). Nenhuma IA de terceiros, nenhum credito gasto.
Script: `scripts/gen-corvo-forms.py` (deterministico, PIL puro, params no topo). Conferencia: `scripts/check-corvo-forms.py`.

## Verificacao do original
Corpo/cartola = matiz 195-255 (marinho ~210), chama da lanterna = matiz 165-195 turquesa/ciano (confirmado: o dono esta certo), olho/correntes ouro (~30-60), bico off-white, faixa/patas cinza.

## Matizes finais (corpo / chama) - ajuste de 29/09 apos a folha
- PODER (brasa): corpo 6 / chama 32 (champion -14 e ultimate -6 graus: chama ja quente e avermelhada) - sat x1.55, chama sat x1.15 / brilho x1.12
- HARMONIA (musgo): 112 / 78, sat x1.0 (inalterada) - BENEVOLENCIA (cobalto/ceu): 211 / 192, sat x1.9
- champion = sat x0.65 · ultimate = x1.0 · mega = x1.2 (chama mais forte com o estagio)
- Brilho do corpo por FORM_V (uma constante por forma), resolvido por bisseccao ate a luminancia media-alvo; PATH_V = 1 (o caminho nao mexe mais no brilho, so a sat).
- Alvos de luminancia (0-255), passo >= 3,5: rookie 60,5 · c-power 64 · c-harmony 67,5 · ultra 71 · c-benevolence 74,5 · u-power 78 · u-harmony 81,5 · u-benevolence 85 · m-power 88,5 · m-harmony 92 · m-benevolence 96. Progressao champion < ultimate < mega em cada caminho.
- Por que benevolencia ficou no alto: azul saturado tem luma baixa, entao o cobalto so fica vivo com brilho alto; o cinza-azulado anterior era pouca saturacao. Poder foi o inverso (vermelho ja e escuro em luma).
- Mascara do corpo ganhou corte para pixels claros/pouco saturados (patas e faixa): sem isso, com brilho alto, as patas viravam salmao.
- ultra = P&B: corpo com curva de gama (LO 0,03 / HI 0,661 / G 1,4) - preto quase puro nas sombras e cinza-escuro/prata nas penas claras; contorno quase preto, bico/mascara/chama brancos, faixa prata. Silhueta e alfa identicos. rookie = original byte a byte.
- 256: LANCZOS (mascote tem bordas suavizadas, nao e grade estrita de pixel).

## Resultado da conferencia (`python3 scripts/check-corvo-forms.py`, limiar de luminancia 3,0)
```
OK   11 arquivos 512 (11)
OK   11 arquivos 256
OK   rookie == mascote byte a byte
OK   rookie: 512x512 RGBA
OK   rookie: cantos transparentes
OK   rookie: alfa identico ao original
OK   rookie: pixels saturados 270-340 graus = 0
OK   champion-power: 512x512 RGBA
OK   champion-power: cantos transparentes
OK   champion-power: alfa identico ao original
OK   champion-power: pixels saturados 270-340 graus = 0
OK   champion-harmony: 512x512 RGBA
OK   champion-harmony: cantos transparentes
OK   champion-harmony: alfa identico ao original
OK   champion-harmony: pixels saturados 270-340 graus = 0
OK   champion-benevolence: 512x512 RGBA
OK   champion-benevolence: cantos transparentes
OK   champion-benevolence: alfa identico ao original
OK   champion-benevolence: pixels saturados 270-340 graus = 0
OK   ultimate-power: 512x512 RGBA
OK   ultimate-power: cantos transparentes
OK   ultimate-power: alfa identico ao original
OK   ultimate-power: pixels saturados 270-340 graus = 0
OK   ultimate-harmony: 512x512 RGBA
OK   ultimate-harmony: cantos transparentes
OK   ultimate-harmony: alfa identico ao original
OK   ultimate-harmony: pixels saturados 270-340 graus = 0
OK   ultimate-benevolence: 512x512 RGBA
OK   ultimate-benevolence: cantos transparentes
OK   ultimate-benevolence: alfa identico ao original
OK   ultimate-benevolence: pixels saturados 270-340 graus = 0
OK   mega-power: 512x512 RGBA
OK   mega-power: cantos transparentes
OK   mega-power: alfa identico ao original
OK   mega-power: pixels saturados 270-340 graus = 0
OK   mega-harmony: 512x512 RGBA
OK   mega-harmony: cantos transparentes
OK   mega-harmony: alfa identico ao original
OK   mega-harmony: pixels saturados 270-340 graus = 0
OK   mega-benevolence: 512x512 RGBA
OK   mega-benevolence: cantos transparentes
OK   mega-benevolence: alfa identico ao original
OK   mega-benevolence: pixels saturados 270-340 graus = 0
OK   ultra: 512x512 RGBA
OK   ultra: cantos transparentes
OK   ultra: alfa identico ao original
OK   ultra: pixels saturados 270-340 graus = 0
luminancia media (0-255): {'rookie': 60.5, 'champion-power': 64.0, 'champion-harmony': 67.5, 'champion-benevolence': 74.5, 'ultimate-power': 78.0, 'ultimate-harmony': 81.5, 'ultimate-benevolence': 85.0, 'mega-power': 88.5, 'mega-harmony': 92.0, 'mega-benevolence': 96.0, 'ultra': 71.0}
OK   luminancia distinta por forma (menor diferenca 3.5 >= 3.0)
folha: /home/user/Soulmon/docs/reviews/admin-corvo/folha-de-contato.png
```

Folha de contato: `docs/reviews/admin-corvo/folha-de-contato.png`.

## Ids / caminhos finais
`src/assets/soulmon/corvo/corvo-<id>.png` (512) e `corvo-<id>-256.png` (256); id em: rookie, champion-power, champion-harmony, champion-benevolence, ultimate-power, ultimate-harmony, ultimate-benevolence, mega-power, mega-harmony, mega-benevolence, ultra.

## INSTALAR.md (minimo)
- Quem importa: a fatia de integracao (`utils/sprites.ts`, mapa forma -> PNG; NAO feito aqui). Os PNGs viram WebP no `npm run build`.
- 512 para pet/ficha; 256 para masmorra/widget.
- Nada registrado em src/utils nesta fatia.
