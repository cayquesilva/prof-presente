# --- 1. Estágio de Construção (Builder) ---
# Usamos uma imagem Node completa para instalar todas as dependências, incluindo as de desenvolvimento
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies como o 'prisma')
# Usamos 'npm install' aqui porque precisamos do Prisma CLI para o 'prisma generate'
RUN npm install

# Copia todo o resto do código-fonte do projeto
COPY . .

# Gera o cliente do Prisma, que é necessário para a aplicação se comunicar com o banco
RUN npx prisma generate

# Remove as dependências de desenvolvimento para limpar a pasta node_modules
# Deixando apenas o necessário para produção
RUN npm prune --production


# --- 2. Estágio de Produção (Final Image) ---
# Começamos de uma imagem Node limpa e leve
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Cria um usuário não-root para rodar a aplicação (mais seguro)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copia apenas o necessário do estágio de 'builder'
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/scripts ./scripts


# REMOVIDO: A linha 'RUN mkdir -p uploads/...' foi removida.
# A pasta 'uploads' será criada e gerenciada pelo Volume do Docker.

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação, referenciando o script 'start' do seu package.json
CMD [ "npm", "start" ]