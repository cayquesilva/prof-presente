# Dockerfile para Backend Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Criar diretório de uploads
RUN mkdir -p uploads/profiles uploads/events uploads/qrcodes uploads/badges uploads/misc

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]

