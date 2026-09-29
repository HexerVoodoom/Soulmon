# Corvinho de Lanterna e Cartola - 11 formas (recolor programatico)

Origem: `src/assets/soulmon/mascot-raven.png` (512x512 RGBA, mascote proprio). Nenhuma IA de terceiros, nenhum credito gasto.
Script: `scripts/gen-corvo-forms.py` (deterministico, PIL puro, params no topo). Conferencia: `scripts/check-corvo-forms.py`.

## Verificacao do original
Corpo/cartola = matiz 195-255 (marinho ~210), chama da lanterna = matiz 165-195 turquesa/ciano (confirmado: o dono esta certo), olho/correntes ouro (~30-60), bico off-white, faixa/patas cinza.

## Matizes finais (corpo / chama)
- VIRUS (brasa): 8 / 32 · DADO (musgo-limao): 112 / 78 · VACINA (cobalto): 214 / 192
- champion = sat x0.65, brilho x0.85 · ultimate = sat x1.0, brilho x1.30 · mega = sat x1.2, brilho x1.6, chama mais forte
- ultra = P&B (corpo quase preto, bico/chama brancos, faixa prata). rookie = original byte a byte.
- Brilho por caminho: virus x0.70, dado x0.95, vacina x1.38 (separa em cinza).
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
OK   champion-virus: 512x512 RGBA
OK   champion-virus: cantos transparentes
OK   champion-virus: alfa identico ao original
OK   champion-virus: pixels saturados 270-340 graus = 0
OK   champion-data: 512x512 RGBA
OK   champion-data: cantos transparentes
OK   champion-data: alfa identico ao original
OK   champion-data: pixels saturados 270-340 graus = 0
OK   champion-vaccine: 512x512 RGBA
OK   champion-vaccine: cantos transparentes
OK   champion-vaccine: alfa identico ao original
OK   champion-vaccine: pixels saturados 270-340 graus = 0
OK   ultimate-virus: 512x512 RGBA
OK   ultimate-virus: cantos transparentes
OK   ultimate-virus: alfa identico ao original
OK   ultimate-virus: pixels saturados 270-340 graus = 0
OK   ultimate-data: 512x512 RGBA
OK   ultimate-data: cantos transparentes
OK   ultimate-data: alfa identico ao original
OK   ultimate-data: pixels saturados 270-340 graus = 0
OK   ultimate-vaccine: 512x512 RGBA
OK   ultimate-vaccine: cantos transparentes
OK   ultimate-vaccine: alfa identico ao original
OK   ultimate-vaccine: pixels saturados 270-340 graus = 0
OK   mega-virus: 512x512 RGBA
OK   mega-virus: cantos transparentes
OK   mega-virus: alfa identico ao original
OK   mega-virus: pixels saturados 270-340 graus = 0
OK   mega-data: 512x512 RGBA
OK   mega-data: cantos transparentes
OK   mega-data: alfa identico ao original
OK   mega-data: pixels saturados 270-340 graus = 0
OK   mega-vaccine: 512x512 RGBA
OK   mega-vaccine: cantos transparentes
OK   mega-vaccine: alfa identico ao original
OK   mega-vaccine: pixels saturados 270-340 graus = 0
OK   ultra: 512x512 RGBA
OK   ultra: cantos transparentes
OK   ultra: alfa identico ao original
OK   ultra: pixels saturados 270-340 graus = 0
luminancia media (0-255): {'rookie': 60.5, 'champion-virus': 55.2, 'champion-data': 68.1, 'champion-vaccine': 72.0, 'ultimate-virus': 64.4, 'ultimate-data': 81.6, 'ultimate-vaccine': 84.4, 'mega-virus': 77.8, 'mega-data': 96.0, 'mega-vaccine': 93.0, 'ultra': 51.3}
OK   luminancia distinta por forma (menor diferenca 2.8 >= 1.5)
folha: /home/user/Soulmon/docs/reviews/admin-corvo/folha-de-contato.png
```

Folha de contato: `docs/reviews/admin-corvo/folha-de-contato.png`.

## Ids / caminhos finais
`src/assets/soulmon/corvo/corvo-<id>.png` (512) e `corvo-<id>-256.png` (256); id em: rookie, champion-virus, champion-data, champion-vaccine, ultimate-virus, ultimate-data, ultimate-vaccine, mega-virus, mega-data, mega-vaccine, ultra.

## INSTALAR.md (minimo)
- Quem importa: a fatia de integracao (`utils/sprites.ts`, mapa forma -> PNG; NAO feito aqui). Os PNGs viram WebP no `npm run build`.
- 512 para pet/ficha; 256 para masmorra/widget.
- Nada registrado em src/utils nesta fatia.
