# Progresso do Projeto - 20/03/2026

## Alterações Realizadas (Fase 2 - Refinamento e Correção de Bugs)

### Backend (`cracha-virtual-system`)
- **Flexibilização da Validação de CPF**: A regex de validação do CPF no `userController.js` foi atualizada para aceitar tanto os 11 dígitos puros (`00000000000`) quanto o formato com pontuação (`000.000.000-00`). Isso evita erros quando os dados migrados ou digitados estão sem máscara.
- **Detalhamento de Logs de Erro**: Adicionado um bloco de log (`console.warn`) na função `updateUser` que imprime no console do servidor (Portainer) exatamente quais campos falharam na validação, facilitando diagnósticos futuros.
- **Inclusão de Campos na Listagem Geral**: A função `getAllUsers` foi atualizada para incluir os campos `birthDate`, `address` e `neighborhood` no `select` do Prisma. Isso garante que, ao clicar em "Editar", o formulário já venha preenchido com as informações atuais do banco.
- **Permissão de Campos Vazios**: Confirmada a configuração de `.optional({ checkFalsy: true })` para `cpf` e `birthDate`, permitindo que o administrador salve o perfil mesmo deixando esses campos em branco.

### Frontend (`cracha-virtual-frontend`)
- **Máscara Automática ao Carregar**: Criada a função `formatCPF` e aplicada no momento de abertura do diálogo de edição. Mesmo que o dado venha "puro" do banco, ele é formatado visualmente para o padrão brasileiro assim que o editor abre.
- **Sincronização de Campos do Editor**: Garantido que todos os estados (`editBirthDate`, `editAddress`, `editNeighborhood`, etc.) sejam inicializados corretamente com os dados vindos da API.
- **Correção da Lógica de Professor**: A verificação de visibilidade para os campos de Série e Componente Curricular agora é case-insensitive (`.toLowerCase() === 'professor'`), corrigindo a falha onde os campos sumiam caso o banco retornasse "Professor" com P maiúsculo.

### Infraestrutura e Deploy
- **Nova Versão da Stack (2.4.1)**: As imagens do Backend e Frontend foram reconstruídas e submetidas ao Docker Hub sob a tag `2.4.1`.
- **Deploy Realizado**: Confirmado o funcionamento da edição de usuários após o redeploy forçado no Portainer.

## Problemas Resolvidos (Finalizado)
1. **Erro 400 (Bad Request)** no diálogo de edição de usuário: Resolvido através da flexibilização da regex e tratamento de campos vazios.
2. **Dados Incompletos no Editor**: Resolvido adicionando os campos de data, endereço e bairro tanto na listagem da API quanto no formulário do frontend.
3. **Bug nos Campos de Professor**: Resolvido com a comparação de strings em minúsculo.
4. **Persistência**: Mantida a integridade do banco de dados utilizando volumes nomeados no Docker Swarm/Portainer.

## Próximos Passos
- Monitorar os logs do backend para assegurar que não há outros campos gerando falhas de validação.
- Validar a usabilidade do novo DatePicker no celular.
