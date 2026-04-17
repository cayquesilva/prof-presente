#!/bin/bash

# Script for Docker build and push
# Usage: ./build-images.sh [version]

set -e

# Config
DOCKER_USERNAME="cayquesilva"
BACKEND_IMAGE="simplicorre-backend"
FRONTEND_IMAGE="simplicorre-frontend"
FACIALREC_IMAGE="simplicorre-facialrec"
VERSION_FILE="version.txt"

# Get version
if [ -n "$1" ]; then
    VERSION=$1
else
    if [ -f "$VERSION_FILE" ]; then
        VERSION=$(cat $VERSION_FILE | tr -d '[:space:]')
    else
        VERSION="2.4.5"
    fi
fi

echo "🐳 Iniciando build das imagens Docker ($VERSION)..."

# Build Backend
echo "📦 Fazendo build da imagem do backend..."
cd cracha-virtual-system
docker build -t ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION} -t ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest .
cd ..

# Build Frontend
echo "📦 Fazendo build da imagem do frontend..."
cd cracha-virtual-frontend
docker build -t ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION} -t ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest --build-arg VITE_API_URL=https://corre.simplisoft.com.br/api .
cd ..

# Build Facial Recognition
echo "📦 Fazendo build da imagem de reconhecimento facial..."
cd cracha-virtual-facialrec
docker build -t ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION} -t ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:latest .
cd ..

echo "✅ Build das imagens concluído!"

# Update compose files (optional but helpful)
for FILE in docker-compose.yml docker-compose.swarm.yml; do
    if [ -f "$FILE" ]; then
        echo "📝 Atualizando $FILE para a versão $VERSION..."
        sed -i "s|image: .*/${BACKEND_IMAGE}:.*|image: ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}|g" $FILE
        sed -i "s|image: .*/${FRONTEND_IMAGE}:.*|image: ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}|g" $FILE
        sed -i "s|image: .*/${FACIALREC_IMAGE}:.*|image: ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}|g" $FILE
    fi
done

# Push
read -p "Deseja fazer push para o Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Fazendo login no Docker Hub..."
    docker login
    
    echo "📤 Fazendo push das imagens..."
    docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}
    docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest
    
    docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}
    docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest
    
    docker push ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}
    docker push ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:latest
    
    echo "✅ Push concluído!"
fi

echo "🎉 Fim!"

