# Corvinho de Lanterna e Cartola - 11 formas (recolor programatico)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Origem: `src/assets/soulmon/mascot-raven.png` (512x512 RGBA, mascote proprio). Nenhuma IA de terceiros, nenhum credito gasto.
Script: `scripts/gen-corvo-forms.py` (deterministico, PIL puro, params no topo). Conferencia: `scripts/check-corvo-forms.py`.

## Verificacao do original
Corpo/cartola = matiz 195-255 (marinho ~210), chama da lanterna = matiz 165-195 turquesa/ciano (confirmado: o dono esta certo), olho/correntes ouro (~30-60), bico off-white, faixa/patas cinza.

## Matizes finais (corpo / chama)
- PODER (brasa): 8 / 32 · HARMONIA (musgo-limao): 112 / 78 · BENEVOLENCIA (cobalto): 214 / 192
- champion = sat x0.65, brilho x0.85 · ultimate = sat x1.0, brilho x1.30 · mega = sat x1.2, brilho x1.6, chama mais forte
- ultra = P&B (corpo quase preto, bico/chama brancos, faixa prata). rookie = original byte a byte.
- Brilho por caminho: power x0.70, harmonia x0.95, benevolência x1.38 (separa em cinza).
- 256: LANCZOS (mascote tem bordas suavizadas, nao e grade estrita de pixel).

## Resultado da conferencia (`python3 scripts/check-corvo-forms.py`)
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
luminancia media (0-255): {'rookie': 60.5, 'champion-power': 55.2, 'champion-harmony': 68.1, 'champion-benevolence': 72.0, 'ultimate-power': 64.4, 'ultimate-harmony': 81.6, 'ultimate-benevolence': 84.4, 'mega-power': 77.8, 'mega-harmony': 96.0, 'mega-benevolence': 93.0, 'ultra': 51.3}
OK   luminancia distinta por forma (menor diferenca 2.8 >= 1.5)
folha: /home/user/Soulmon/docs/reviews/admin-corvo/folha-de-contato.png
```

Folha de contato: `docs/reviews/admin-corvo/folha-de-contato.png`.

## Ids / caminhos finais
`src/assets/soulmon/corvo/corvo-<id>.png` (512) e `corvo-<id>-256.png` (256); id em: rookie, champion-power, champion-harmony, champion-benevolence, ultimate-power, ultimate-harmony, ultimate-benevolence, mega-power, mega-harmony, mega-benevolence, ultra.

## INSTALAR.md (minimo)
- Quem importa: a fatia de integracao (`utils/sprites.ts`, mapa forma -> PNG; NAO feito aqui). Os PNGs viram WebP no `npm run build`.
- 512 para pet/ficha; 256 para masmorra/widget.
- Nada registrado em src/utils nesta fatia.
