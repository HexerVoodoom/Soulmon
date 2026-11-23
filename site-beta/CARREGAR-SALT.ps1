# Carrega o HASH_SALT (gerado pelo LIBERAR-PRODUCAO.ps1) nesta janela do PowerShell, para os scripts de convite.
# Uso (com o ponto na frente):  . .\CARREGAR-SALT.ps1
# O valor nunca e impresso; fica so na variavel de ambiente desta janela.
$arq = Join-Path $env:USERPROFILE '.soulmon-beta\hash_salt.txt'
if (-not (Test-Path -LiteralPath $arq)) { Write-Host "Nao achei $arq. Rode o LIBERAR-PRODUCAO.ps1 antes (ou restaure o backup do salt)." -ForegroundColor Red; return }
$env:HASH_SALT = [IO.File]::ReadAllText($arq).Trim()
Write-Host 'HASH_SALT carregado nesta janela.' -ForegroundColor Green
