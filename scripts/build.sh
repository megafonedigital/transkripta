#!/bin/bash

# Build script for Transkipta Frontend

set -e

echo "🚀 Iniciando build do Transkipta Frontend..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm."
    exit 1
fi

echo "📦 Instalando dependências..."
npm ci

echo "🔧 Verificando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.example..."
    cp .env.example .env
    echo "📝 Por favor, configure suas chaves de API no arquivo .env"
fi

echo "🏗️  Executando build..."
npm run build

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos de build estão em: ./build"

# Verificar se o build foi bem-sucedido
if [ -d "build" ]; then
    echo "📊 Estatísticas do build:"
    du -sh build/
    echo "📄 Arquivos principais:"
    find build -name "*.js" -o -name "*.css" | head -10
else
    echo "❌ Erro: Diretório build não foi criado"
    exit 1
fi

echo "🎉 Build finalizado!"