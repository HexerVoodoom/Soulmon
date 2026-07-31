# Soulmon Desktop na Steam — guia de preparação

O que já está pronto no código e o que depende de você (conta Steamworks,
upload do build, assets da loja). Nada aqui foi publicado — é preparação.

O plano completo, incluindo a parte de dinheiro entre lojas, está em
`docs/PLANO-DESKTOP-STEAM.md`. Este arquivo é a parte operacional da Steam.

## O que já está pronto

- **`npm run dist:steam`** gera um build **desempacotado** (pasta
  `release/win-unpacked/`, não um instalador `.exe`) — é esse formato que o
  SteamPipe espera fazer upload como depot. Ele marca o build com
  `steamBuild: true` (injetado via `extraMetadata` do electron-builder) e
  **nunca publica no GitHub Releases** (`--publish never`).
- **Auto-update desligado nessa variante**: `main.js` só chama
  `autoUpdater.checkForUpdatesAndNotify()` quando `steamBuild` NÃO está
  presente. Isso é essencial — a Steam distribui e atualiza o jogo sozinha via
  SteamPipe; se o app também tentasse se auto-atualizar puxando do GitHub, os
  dois mecanismos brigariam pelo mesmo binário instalado.
- Tudo mais (overlay, janela de menu, sincronização por e-mail, login) segue
  idêntico — nenhuma regra de jogo muda pra rodar na Steam.

## O que ainda NÃO está no código

- **Steamworks API** (`steamworks.js`/`greenworks`): não há `steam_appid.txt`,
  não há `SteamAPI_Init`, não há conquistas nem overlay do Steam (Shift+Tab).
  Isso é necessário para três coisas do plano:
  1. detectar que o app foi lançado pela Steam;
  2. **verificar propriedade** (= conceder o tier pago a quem comprou na Steam);
  3. vender créditos por **MicroTxn**.
- **Provider `steam` no `/api/billing`**: hoje o endpoint só verifica compras da
  Google Play. A carteira já é compartilhada por conta (ver plano), falta só a
  segunda verificação.
- **Steam Cloud**: fica de fora de propósito. O save já é sincronizado pelo
  nosso servidor; dois sistemas competindo pelo mesmo estado é receita de
  corrupção. Se um dia entrar, só para configurações locais do overlay.

## Passo a passo pra você (fora deste repositório)

### 1. Conta Steamworks + App ID

1. Crie/acesse uma conta em [partner.steamgames.com](https://partner.steamgames.com).
2. Pague a taxa de registro do app (US$100, reembolsável após certas condições
   de vendas).
3. Reserve o **App ID** do Soulmon no painel. Você vai usar esse número nos
   scripts VDF do passo 3.

### 2. Gerar o build

No Windows (o alvo é Windows-only, ver `README.md`):

```bash
cd desktop
npm install
npm run dist:steam
```

Isso gera `desktop/release/win-unpacked/` — essa pasta inteira é o conteúdo do
depot.

### 3. Configurar o SteamPipe

Baixe o [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) e crie
dois arquivos VDF (fora deste repo, ou em `desktop/steam-build/` se preferir
versionar — não crie ainda porque dependem do seu App ID real):

**`app_build_<APPID>.vdf`**:
```vdf
"AppBuild"
{
	"AppID" "<SEU_APP_ID>"
	"Desc" "Soulmon Desktop"
	"ContentRoot" "..\release\win-unpacked\"
	"BuildOutput" "..\steam-build-output\"
	"Depots"
	{
		"<SEU_DEPOT_ID>" "depot_build_<DEPOTID>.vdf"
	}
}
```

**`depot_build_<DEPOTID>.vdf`**:
```vdf
"DepotBuild"
{
	"DepotID" "<SEU_DEPOT_ID>"
	"FileMapping"
	{
		"LocalPath" "*"
		"DepotPath" "."
		"recursive" "1"
	}
}
```

O App ID e o Depot ID vêm do painel Steamworks (Steamworks > seu app > "Steam
Pipe" > Depots). Depois:

```bash
steamcmd +login <seu_usuario> +run_app_build ..\app_build_<APPID>.vdf +quit
```

Isso sobe o build pra um branch (geralmente `default` fica em preview até você
promover pra `public` no painel).

### 4. Executável de lançamento

No Steamworks, em "Application > Installation > General Installation", aponte o
launch executable para `Soulmon.exe` (nome do `productName` no `package.json`)
dentro do depot.

### 5. Assets da loja (você precisa fornecer/produzir)

A Steam exige tamanhos exatos — posso ajudar a redigir texto/descrição, mas a
arte final precisa ser desenhada:

| Asset | Tamanho |
|---|---|
| Header capsule | 460×215 |
| Small capsule | 231×87 |
| Main capsule | 616×353 |
| Library capsule | 600×900 |
| Library hero | 3840×1240 |
| Library logo | 1280×720 (fundo transparente) |
| Screenshots | mín. 1280×720 |

### 6. Coisas pra decidir/preencher você mesmo

- Preço (ou gratuito) e regiões de venda — ver a comparação de opções A/B/C em
  `docs/PLANO-DESKTOP-STEAM.md`.
- Faixa etária / classificação de conteúdo (formulário da Steam).
- EULA, se quiser um custom.

## Um heads-up de produto

O Soulmon Desktop roda como uma criatura que anda na barra de tarefas, sem uma
janela "principal" tradicional ao abrir — um usuário da Steam pode achar
estranho não ver uma janela de jogo comum ao clicar em "Jogar". Isso não impede
a publicação (existem vários apps assim na Steam), mas vale abrir a janela de
menu automaticamente no primeiro lançamento. Está listado como pendência de
código na fase 3b do plano.
