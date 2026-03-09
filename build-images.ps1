# PowerShell Script for Docker build and push (v1.0.2)
# Usage: .\build-images.ps1 [version]
# Example: .\build-images.ps1 1.0.2

$VERSION = if ($args[0]) { $args[0] } else { "1.0.4" }
$DOCKER_USERNAME = "vydhal"
$BACKEND_IMAGE = "eduagenda-backend"
$FRONTEND_IMAGE = "eduagenda-frontend"
$FACIALREC_IMAGE = "eduagenda-facialrec"

Write-Host "--- Iniciando build das imagens Docker (Versao: $VERSION) ---" -ForegroundColor Cyan

# Backend Build
Write-Host "[1/3] Fazendo build da imagem do Backend..." -ForegroundColor Yellow
Set-Location cracha-virtual-system
docker build -t "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" .
Set-Location ..

# Frontend Build
Write-Host "[2/3] Fazendo build da imagem do Frontend..." -ForegroundColor Yellow
Set-Location cracha-virtual-frontend
docker build -t "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" --build-arg VITE_API_URL=https://eduagenda.simplisoft.com.br/api .
Set-Location ..

# Facial Recognition Build
Write-Host "[3/3] Fazendo build da imagem de Reconhecimento Facial..." -ForegroundColor Yellow
Set-Location cracha-virtual-facialrec
docker build -t "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}" .
Set-Location ..

Write-Host "Build das imagens concluido com sucesso!" -ForegroundColor Green

$confirmation = Read-Host "Deseja fazer push para o Docker Hub agora? (y/n)"
if ($confirmation -eq "y") {
    Write-Host "Fazendo login no Docker Hub..." -ForegroundColor Cyan
    docker login
    
    Write-Host "Fazendo push das imagens..." -ForegroundColor Yellow
    docker push "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}"
    docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}"
    docker push "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}"
    
    Write-Host "Push das imagens concluido!" -ForegroundColor Green
    Write-Host "Imagens disponiveis no Docker Hub:"
    Write-Host " - ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}"
    Write-Host " - ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}"
    Write-Host " - ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}"
} else {
    Write-Host "Imagens criadas localmente prontas para uso." -ForegroundColor Blue
}

Write-Host "Processo finalizado!" -ForegroundColor Cyan
