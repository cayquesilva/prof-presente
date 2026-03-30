# PowerShell Script for Docker build and push (v1.0.2)
# Usage: .\build-images.ps1 [version]
# Example: .\build-images.ps1 1.0.2

$VERSION_FILE = "version.txt"
$DOCKER_USERNAME = "cayquesilva"
$BACKEND_IMAGE = "simplicorre-backend"
$FRONTEND_IMAGE = "simplicorre-frontend"
$FACIALREC_IMAGE = "simplicorre-facialrec"

# Setup / Auto-increment version
if ($args[0]) {
    $VERSION = $args[0]
} else {
    if (Test-Path $VERSION_FILE) {
        $lastVersion = (Get-Content $VERSION_FILE).Trim()
        $parts = $lastVersion.Split('.')
        if ($parts.Length -ge 3) {
            $major = [int]$parts[0]
            $minor = [int]$parts[1]
            $patch = [int]$parts[2]
            $patch++
            $VERSION = "$major.$minor.$patch"
        } else {
            $VERSION = "2.4.0"
        }
    } else {
        $VERSION = "2.4.0"
    }
}

# Save new version to cache
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $VERSION_FILE), $VERSION)

Write-Host "--- Iniciando build das imagens Docker (Versao: $VERSION) ---" -ForegroundColor Cyan

# Update docker-compose.yml tags automatically if it exists
$COMPOSE_FILE = "docker-compose.yml"
if (Test-Path $COMPOSE_FILE) {
    Write-Host "Atualizando a tag de imagem no docker-compose.yml para $VERSION ..." -ForegroundColor Cyan
    $composeContent = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $COMPOSE_FILE))
    
    $composeContent = $composeContent -replace "(image:\s*cayquesilva/$BACKEND_IMAGE):[^\s]+", "`$1:$VERSION"
    $composeContent = $composeContent -replace "(image:\s*cayquesilva/$FRONTEND_IMAGE):[^\s]+", "`$1:$VERSION"
    $composeContent = $composeContent -replace "(image:\s*cayquesilva/$FACIALREC_IMAGE):[^\s]+", "`$1:$VERSION"
    $composeContent = $composeContent -replace "(image:\s*vydhal/eduagenda-backend):[^\s]+", "`$1:$VERSION"
    $composeContent = $composeContent -replace "(image:\s*vydhal/eduagenda-frontend):[^\s]+", "`$1:$VERSION"
    $composeContent = $composeContent -replace "(image:\s*vydhal/eduagenda-facialrec):[^\s]+", "`$1:$VERSION"

    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $COMPOSE_FILE), $composeContent)
}

# Backend Build
Write-Host "[1/3] Fazendo build da imagem do Backend..." -ForegroundColor Yellow
Set-Location cracha-virtual-system
docker build -t "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" .
Set-Location ..

# Frontend Build
Write-Host "[2/3] Fazendo build da imagem do Frontend..." -ForegroundColor Yellow
Set-Location cracha-virtual-frontend
docker build -t "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" --build-arg VITE_API_URL=https://corre.simplisoft.com.br/api .
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
