# Guia de Implantação (Docker Hub & Portainer)

Este guia contém os comandos necessários para compilar, enviar as imagens para o Docker Hub e atualizar o ambiente de produção via Portainer.

## 🛠️ 1. Build e Push Automatizado

A forma recomendada de gerar as imagens é utilizando o script automatizado que gerencia versões e tags `latest`.

### No Windows (PowerShell):
```powershell
.\build-images.ps1
```

### No Linux/WSL (Bash):
```bash
chmod +x build-images.sh
./build-images.sh
```

---

## 🚀 2. Atualização no Portainer

Após enviar as imagens para o Docker Hub (`cayquesilva/simplicorre-*`), siga estes passos:

1. **Acesse o Portainer**.
2. Vá em **Stacks** e selecione a stack `eduagenda`.
3. No painel de edição da Stack clique em **Update the stack**.
4. Certifique-se de que a opção **"Re-pull image"** está ativada.

---

## ⚠️ 3. Solução de Problemas (FAQ)

### Erro P3005: "The database schema is not empty"
Se ao iniciar o container o log mostrar o erro P3005 durante o `prisma migrate deploy`, significa que o histórico de migrações está em branco mas as tabelas já existem.

**Solução (Baseline):**
Execute os comandos abaixo no console do container do backend (via Portainer) para sincronizar o histórico sem mexer nos dados:

```bash
npx prisma migrate resolve --applied 20260206135426_init_postgres
npx prisma migrate resolve --applied 20260210112112_add_event_staff_model
npx prisma migrate resolve --applied 20260210184920_add_learning_tracks
npx prisma migrate resolve --applied 20260210185412_update_certificate_and_tracks
npx prisma migrate resolve --applied 20260212121408_add_space_management
npx prisma migrate resolve --applied 20260212124036_add_reservation_config
npx prisma prisma migrate resolve --applied 20260212130802_refine_reservation_form
npx prisma migrate resolve --applied 20260212131842_add_equipment_inventory
```

---

## 📋 4. Notas Importantes
- **Namespace**: `cayquesilva`
- **Imagens**: `simplicorre-backend`, `simplicorre-frontend`, `simplicorre-facialrec`
- **Fuso Horário**: `America/Sao_Paulo`.
- **URLs**: APIs em `https://corre.simplisoft.com.br/api`.

Desenvolvido por **Antigravity AI**.
