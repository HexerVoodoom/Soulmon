# Soulmon Desktop na Steam — guia de preparação

O que já está pronto no código e o que depende de você (conta Steamworks,
upload do build, assets da loja). Nada aqui foi publicado — é preparação.

O plano completo, incluindo a parte de dinheiro entre lojas, está em
`docs/PLANO-DESKTOP-STEAM.md`. Este arquivo é a parte operacional da Steam.

## Empacotamento: EXECUTADO pela primeira vez — 26/ago/2026

Até esta data `dist:steam` **nunca tinha sido rodado por ninguém**
(`docs/PLANO-DESKTOP-STEAM.md` §4a: `[não verificado]`). Rodou. Saída real,
Windows 10 x64, `desktop/node_modules` instalado do zero (426 pacotes, 28s):

```
> vite build && electron-builder --win --dir --publish never -c.extraMetadata.steamBuild=true
✓ 66 modules transformed.  ✓ built in 428ms
  • electron-builder  version=25.1.8 os=10.0.19045
  • executing @electron/rebuild  electronVersion=33.4.11 arch=x64
  • packaging  platform=win32 arch=x64 electron=33.4.11 appOutDir=release\win-unpacked
  • updating asar integrity executable resource  executablePath=release\win-unpacked\Soulmon.exe
  • signing with signtool.exe  path=release\win-unpacked\Soulmon.exe
  • no signing info identified, signing is skipped  signHook=false cscInfo=null
EXIT=0
```

Saiu `release/win-unpacked/` com **274 MB**, `Soulmon.exe` de 188 MB e
`resources/app.asar` de 5,1 MB. E a marcação de Steam, que era a única coisa
que o `--dir` não provava, **funciona de verdade** — lida de dentro do asar:

```
$ node -e "…extractFile('release/win-unpacked/resources/app.asar','package.json')…"
steamBuild = true | typeof boolean
main.js:17 (`=== true`) daria: true
```

Isso fecha a dúvida real: `-c.extraMetadata.steamBuild=true` na linha de comando
vira **booleano**, não a string `"true"`, então a comparação estrita de
`main.js:17` acerta e o auto-update fica desligado no build de Steam
(`main.js:67`). Se tivesse virado string, o build de Steam se auto-atualizaria
pelo GitHub por cima do que o SteamPipe instalou — exatamente o conflito que
esta variante existe para evitar, e ninguém teria visto.

### O tropeço no caminho, porque ele vai voltar

Na **primeira** tentativa o empacotamento falhou depois de já ter gerado o
`Soulmon.exe`, ao baixar o `winCodeSign`:

```
  • downloading  url=…/winCodeSign-2.6.0/winCodeSign-2.6.0.7z size=5.6 MB
  ⨯ cannot execute  cause=exit status 2
    errorOut=ERROR: Cannot create symbolic link : A required privilege is not
    held by the client. : …\winCodeSign\…\darwin\10.12\lib\libcrypto.dylib
  • Above command failed, retrying 3 more times
EXIT=1
```

**Não é defeito do repositório.** É o Windows: criar link simbólico exige o
**Modo de Desenvolvedor** ligado (ou terminal como administrador), e o pacote
`winCodeSign` traz dois symlinks de macOS — `libcrypto.dylib` e `libssl.dylib`
— que não servem para nada num build `--win`. As quatro tentativas do
electron-builder falham todas pelo mesmo motivo e o build inteiro morre por
causa de dois arquivos irrelevantes.

Duas saídas, ambas fora do código:

1. **Ligar o Modo de Desenvolvedor** (Configurações → Privacidade e segurança →
   Para desenvolvedores). É a saída limpa, e é uma **decisão sua** — mexe em
   configuração do sistema.
2. Pré-extrair o `.7z` na mão para
   `<cache>/winCodeSign/winCodeSign-2.6.0/` (o `7za` extrai tudo menos os dois
   symlinks; basta renomear a pasta para o nome que o electron-builder espera).
   Foi assim que o build acima passou.

O cache do electron-builder e o do Electron podem sair do `C:` com
`ELECTRON_BUILDER_CACHE` e `electron_config_cache` — é ~1 GB somando o binário
do Electron.

### Aviso que sobrou, e é seu

```
  • author is missed in the package.json  appPackageFile=…\desktop\package.json
```

Só aviso no `--dir`, mas o `nsis` do `npm run dist` usa o `author` como
**Publisher** do instalador — é o nome que aparece no aviso do Windows e nas
propriedades do `.exe`. Não preenchi porque é identidade, não código: escolha o
nome e coloque em `desktop/package.json`.

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

## Um heads-up de produto (já tratado)

O Soulmon Desktop roda como uma criatura que anda na barra de tarefas, sem uma
janela "principal" tradicional — um usuário da Steam poderia clicar em "Jogar"
e achar que nada aconteceu. Por isso o **menu abre sozinho no primeiro
lançamento** (marcador em `userData`; nas vezes seguintes o app volta a ser só
o pet na barra). Continua valendo conferir a primeira impressão com alguém de
fora antes de publicar.
