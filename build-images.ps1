# PowerShell Script for Docker build and push (v1.0.3)
# Usage: .\build-images.ps1 [version]
# Example: .\build-images.ps1 1.0.3

$VERSION_FILE = "version.txt"
$DOCKER_USERNAME = "cayquesilva"
$BACKEND_IMAGE = "simplicorre-backend"
$FRONTEND_IMAGE = "simplicorre-frontend"
$FACIALREC_IMAGE = "simplicorre-facialrec"

# Setup / Auto-increment version
if ($args[0]) {
    $VERSION = $args[0]
}
else {
    if (Test-Path $VERSION_FILE) {
        $lastVersion = (Get-Content $VERSION_FILE).Trim()
        $parts = $lastVersion.Split('.')
        if ($parts.Length -ge 3) {
            $major = [int]$parts[0]
            $minor = [int]$parts[1]
            $patch = [int]$parts[2]
            $patch++
            $VERSION = "$major.$minor.$patch"
        }
        else {
            $VERSION = "2.4.5"
        }
    }
    else {
        $VERSION = "2.4.5"
    }
}

# Save new version to cache
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $VERSION_FILE), $VERSION)

Write-Host "--- Iniciando build das imagens Docker (Versao: $VERSION) ---" -ForegroundColor Cyan

# Update docker-compose files automatically
$COMPOSE_FILES = @("docker-compose.yml", "docker-compose.swarm.yml")
foreach ($FILE in $COMPOSE_FILES) {
    if (Test-Path $FILE) {
        Write-Host "Atualizando tags de imagem no $FILE para $VERSION ..." -ForegroundColor Cyan
        $content = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $FILE))
        
        $content = $content -replace "(image:\s*$DOCKER_USERNAME/$BACKEND_IMAGE):[^\s]+", "`$1:$VERSION"
        $content = $content -replace "(image:\s*$DOCKER_USERNAME/$FRONTEND_IMAGE):[^\s]+", "`$1:$VERSION"
        $content = $content -replace "(image:\s*$DOCKER_USERNAME/$FACIALREC_IMAGE):[^\s]+", "`$1:$VERSION"
        
        # Retro-compatibility check for old names
        $content = $content -replace "(image:\s*cayquesilva/eduagenda-backend):[^\s]+", "`$1:$VERSION"
        $content = $content -replace "(image:\s*cayquesilva/eduagenda-frontend):[^\s]+", "`$1:$VERSION"
        $content = $content -replace "(image:\s*cayquesilva/eduagenda-facialrec):[^\s]+", "`$1:$VERSION"

        [System.IO.File]::WriteAllText((Join-Path (Get-Location) $FILE), $content)
    }
}

# Build Backend
Write-Host "[1/3] Fazendo build da imagem do Backend..." -ForegroundColor Yellow
Set-Location cracha-virtual-system
docker build -t "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" -t "${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest" .
Set-Location ..

# Build Frontend
Write-Host "[2/3] Fazendo build da imagem do Frontend..." -ForegroundColor Yellow
Set-Location cracha-virtual-frontend
docker build -t "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" -t "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest" --build-arg VITE_API_URL=https://corre.simplisoft.com.br/api .
Set-Location ..

# Build Facial Recognition
Write-Host "[3/3] Fazendo build da imagem de Reconhecimento Facial..." -ForegroundColor Yellow
Set-Location cracha-virtual-facialrec
docker build -t "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}" -t "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:latest" .
Set-Location ..

Write-Host "Build das imagens concluido com sucesso!" -ForegroundColor Green

$confirmation = Read-Host "Deseja fazer push para o Docker Hub agora? (y/n)"
if ($confirmation -eq "y") {
    Write-Host "Fazendo login no Docker Hub..." -ForegroundColor Cyan
    docker login
    
    Write-Host "Fazendo push das imagens (v$VERSION e latest)..." -ForegroundColor Yellow
    docker push "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}"
    docker push "${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest"
    
    docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}"
    docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest"
    
    docker push "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}"
    docker push "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:latest"
    
    Write-Host "Push das imagens concluido!" -ForegroundColor Green
}
else {
    Write-Host "Imagens criadas localmente prontas para uso." -ForegroundColor Blue
}

Write-Host "Processo finalizado!" -ForegroundColor Cyan
