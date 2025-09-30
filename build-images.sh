#!/bin/bash

# Script para build e push das imagens Docker
# Execute este script para preparar as imagens para o Docker Hub

set -e

# Configurações
DOCKER_USERNAME="seu-usuario"
BACKEND_IMAGE="cracha-backend"
FRONTEND_IMAGE="cracha-frontend"
VERSION="latest"

echo "🐳 Iniciando build das imagens Docker..."

# Build da imagem do backend
echo "📦 Fazendo build da imagem do backend..."
cd cracha-virtual-system
docker build -t ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION} .
cd ..

# Build da imagem do frontend
echo "📦 Fazendo build da imagem do frontend..."
cd cracha-virtual-frontend
docker build -t ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION} .
cd ..

echo "✅ Build das imagens concluído!"

# Fazer login no Docker Hub (opcional)
read -p "Deseja fazer push para o Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Fazendo login no Docker Hub..."
    docker login
    
    echo "📤 Fazendo push da imagem do backend..."
    docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}
    
    echo "📤 Fazendo push da imagem do frontend..."
    docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}
    
    echo "✅ Push das imagens concluído!"
    echo "📋 Imagens disponíveis:"
    echo "   - ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}"
    echo "   - ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}"
else
    echo "ℹ️  Imagens criadas localmente:"
    echo "   - ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}"
    echo "   - ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}"
fi

echo "🎉 Processo concluído!"

