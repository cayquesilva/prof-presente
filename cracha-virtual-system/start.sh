#!/bin/sh
set -e

# Aguarda o banco de dados estar pronto (opcional, o Prisma handle internamente,
# mas é boa prática ter)
echo "Sincronizando banco de dados (migrate deploy)..."
npx prisma migrate deploy

echo "Iniciando a aplicação..."
exec npm start
