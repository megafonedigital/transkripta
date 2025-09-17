# Build script for Transkipta Frontend (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando build do Transkipta Frontend..." -ForegroundColor Green

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js." -ForegroundColor Red
    exit 1
}

# Verificar se o npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado. Por favor, instale o npm." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm ci

Write-Host "🔧 Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado. Copiando .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Por favor, configure suas chaves de API no arquivo .env" -ForegroundColor Cyan
}

Write-Host "⚙️  Gerando arquivos de configuração..." -ForegroundColor Yellow
node scripts/generate-env-config.js

Write-Host "🏗️  Executando build..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivos de build estão em: .\build" -ForegroundColor Cyan

# Verificar se o build foi bem-sucedido
if (Test-Path "build") {
    Write-Host "📊 Estatísticas do build:" -ForegroundColor Cyan
    $buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Host "   Tamanho total: $buildSizeMB MB" -ForegroundColor White
    
    Write-Host "📄 Arquivos principais:" -ForegroundColor Cyan
    Get-ChildItem -Path "build" -Recurse -Include "*.js", "*.css" | Select-Object -First 10 | ForEach-Object {
        Write-Host "   $($_.Name)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Erro: Diretório build não foi criado" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Build finalizado!" -ForegroundColor Green
Write-Host "" 
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure suas chaves de API no arquivo .env" -ForegroundColor White
Write-Host "   2. Execute 'npm start' para desenvolvimento" -ForegroundColor White
Write-Host "   3. Ou use 'docker build .' para criar imagem Docker" -ForegroundColor White