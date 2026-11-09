# Libera o site do beta em PRODUCAO (soulmon.pages.dev/beta). Rodar SO pelo dono, na pasta site-beta:
#   powershell -ExecutionPolicy Bypass -File .\LIBERAR-PRODUCAO.ps1
# Idempotente: pode rodar de novo. Nenhum valor secreto e impresso ou gravado no repo.
# Chaves: ver COMO-CRIAR-AS-CHAVES.md. O HASH_SALT e gerado aqui e guardado FORA do repo,
# em $env:USERPROFILE\.soulmon-beta\hash_salt.txt (CARREGAR-SALT.ps1 le de la para os convites).
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$CONTA = '52a8625042461ea7d1395da4b9e25bdb'
$PROJETO = 'soulmon'
$BANCO = 'soulmon-beta'
$SALT_DIR = Join-Path $env:USERPROFILE '.soulmon-beta'
$SALT_ARQ = Join-Path $SALT_DIR 'hash_salt.txt'

function Passo($n, $t) { Write-Host ''; Write-Host "== Passo $n. $t" -ForegroundColor Cyan }
function Confirma($pergunta) { (Read-Host "$pergunta (S/N)").Trim().ToUpper() -eq 'S' }
function Texto([Security.SecureString]$s) {
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }
}
function Wr { & npx --yes wrangler @args; if ($LASTEXITCODE -ne 0) { throw "wrangler falhou: $($args -join ' ')" } }
function GravaSegredo($nome, $valor) {
  # O valor vai pela entrada padrao do wrangler; nunca aparece na tela nem em arquivo.
  $valor | & npx --yes wrangler pages secret put $nome --project-name $PROJETO | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Nao consegui gravar o segredo $nome." }
  Write-Host "  $nome gravado." -ForegroundColor Green
}

Passo 1 'Conferindo o login na Cloudflare'
$quem = (& npx --yes wrangler whoami 2>&1) -join "`n"
if ($quem -notmatch $CONTA) {
  Write-Host 'Voce nao esta logado na conta certa. Vou abrir o login no navegador.' -ForegroundColor Yellow
  Wr login
  $quem = (& npx --yes wrangler whoami 2>&1) -join "`n"
  if ($quem -notmatch $CONTA) { throw "A conta $CONTA nao aparece no wrangler whoami. Entre com a conta do Soulmon e rode de novo." }
}
Write-Host '  Conta certa.' -ForegroundColor Green

Passo 2 'Segredos do formulario'
$existentes = (& npx --yes wrangler pages secret list --project-name $PROJETO 2>&1) -join "`n"
function Precisa($nome) {
  if ($existentes -match "\b$nome\b") { return (Confirma "  $nome ja existe. Substituir?") }
  return $true
}
if (Precisa 'TURNSTILE_SECRET') {
  $v = Texto (Read-Host '  Cole a Secret Key do Turnstile' -AsSecureString)
  if (-not $v) { throw 'Secret do Turnstile vazia.' }
  GravaSegredo 'TURNSTILE_SECRET' $v; $v = $null
}
if (Precisa 'RESEND_API_KEY') {
  $v = Texto (Read-Host '  Cole a chave da Resend (comeca com re_)' -AsSecureString)
  if ($v -notmatch '^re_') { throw 'A chave da Resend deve comecar com re_.' }
  GravaSegredo 'RESEND_API_KEY' $v; $v = $null
}
if (Precisa 'NOTIFICAR_PARA') {
  $v = Texto (Read-Host '  E-mail que recebe o aviso de cada inscricao (Enter = soulmon.revisor@gmail.com)' -AsSecureString)
  if (-not $v) { $v = 'soulmon.revisor@gmail.com' }
  GravaSegredo 'NOTIFICAR_PARA' $v; $v = $null
}
# HASH_SALT: gerado uma vez e guardado so no seu PC. Trocar o salt quebra o vinculo com inscricoes antigas.
if (-not (Test-Path -LiteralPath $SALT_ARQ)) {
  New-Item -ItemType Directory -Force -Path $SALT_DIR | Out-Null
  $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [IO.File]::WriteAllText($SALT_ARQ, [Convert]::ToBase64String($bytes))
  Write-Host "  HASH_SALT novo gerado e guardado em $SALT_ARQ (faca backup desse arquivo)." -ForegroundColor Green
  GravaSegredo 'HASH_SALT' ([IO.File]::ReadAllText($SALT_ARQ).Trim())
} elseif ($existentes -notmatch '\bHASH_SALT\b') {
  GravaSegredo 'HASH_SALT' ([IO.File]::ReadAllText($SALT_ARQ).Trim())
} else {
  Write-Host '  HASH_SALT ja existe na Cloudflare e no seu PC; mantido.' -ForegroundColor Green
}

Passo 3 'Site key publica do Turnstile'
$sitekey = (Read-Host '  Cole a Site Key do Turnstile (comeca com 0x)').Trim()
if ($sitekey -notmatch '^0x[0-9A-Za-z_-]+$') { throw 'Site key invalida: deve comecar com 0x.' }

Passo 4 'Banco D1 (migracoes 0001 a 0003)'
Write-Host '  As migracoes ja aplicadas sao puladas pelo proprio wrangler.'
if (Confirma "  Aplicar as migracoes no banco REMOTO $BANCO?") { Wr d1 migrations apply $BANCO --remote }
else { Write-Host '  Migracoes puladas.' -ForegroundColor Yellow }

Passo 5 'Build com a site key real'
$env:PUBLIC_TURNSTILE_SITEKEY = $sitekey
& npm run build; if ($LASTEXITCODE -ne 0) { throw 'O build falhou.' }
Remove-Item Env:PUBLIC_TURNSTILE_SITEKEY
if (-not (Select-String -Path 'dist\beta\index.html' -SimpleMatch $sitekey -Quiet)) { throw 'A site key nao entrou no build.' }
Write-Host '  Build ok.' -ForegroundColor Green

Passo 6 'Publicar em PRODUCAO'
if (-not (Confirma '  Publicar agora em https://soulmon.pages.dev/beta/ ?')) { Write-Host 'Nada publicado.'; exit 0 }
Wr pages deploy dist --project-name $PROJETO --branch main --commit-dirty=true

Passo 7 'Conferindo o site no ar (so leitura)'
Start-Sleep -Seconds 10
$ok = $true
foreach ($u in 'https://soulmon.pages.dev/beta/', 'https://soulmon.pages.dev/beta/en/', 'https://soulmon.pages.dev/beta/privacidade/', 'https://soulmon.pages.dev/api/vagas') {
  try { $r = Invoke-WebRequest -Uri $u -Method Get -UseBasicParsing -TimeoutSec 20; Write-Host "  $($r.StatusCode)  $u" -ForegroundColor Green }
  catch { $ok = $false; Write-Host "  FALHOU  $u  ($($_.Exception.Message))" -ForegroundColor Red }
}
if ($ok) { Write-Host ''; Write-Host 'Pronto: o site esta no ar. Faca uma inscricao de teste com seu e-mail.' -ForegroundColor Cyan }
else { Write-Host ''; Write-Host 'Alguma pagina falhou. Espere 1 minuto e abra no navegador; se continuar, avise.' -ForegroundColor Yellow }
