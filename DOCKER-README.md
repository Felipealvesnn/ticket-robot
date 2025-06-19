# Ticket Robot - Docker Setup

Este projeto inclui um setup completo com Docker Compose para executar o backend NestJS e SQL Server.

## 🚀 Como executar

### 1. Preparar o ambiente

```bash
# Copiar arquivo de ambiente
cp backend/.env.example backend/.env

# Editar as configurações se necessário
nano backend/.env
```

### 2. Executar com Docker Compose

```bash
# Executar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f sqlserver
```

### 3. Verificar se está funcionando

- **Backend API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api
- **SQL Server**: localhost:1433

### 4. Comandos úteis

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Rebuild das imagens
docker-compose up --build

# Ver status dos containers
docker-compose ps

# Acessar container do backend
docker-compose exec backend sh

# Acessar SQL Server
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TicketRobot@2025
```

## 🗄️ Banco de Dados

### Configurações do SQL Server:

- **Host**: localhost
- **Port**: 1433
- **Username**: sa
- **Password**: TicketRobot@2025
- **Database**: TicketRobotDB

### Conectar externamente:

```bash
# Via sqlcmd (se instalado)
sqlcmd -S localhost,1433 -U sa -P TicketRobot@2025 -d TicketRobotDB

# Via Docker
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TicketRobot@2025 -d TicketRobotDB
```

## 📁 Estrutura de arquivos

```
.
├── docker-compose.yml          # Configuração dos serviços
├── backend/
│   ├── Dockerfile             # Build do backend
│   ├── .dockerignore          # Arquivos ignorados no build
│   └── .env.example           # Exemplo de configuração
└── sql-scripts/
    └── 01-init-database.sql   # Script de inicialização do banco
```

## 🔧 Troubleshooting

### Problema: SQL Server não inicializa

```bash
# Verificar logs
docker-compose logs sqlserver

# Recriar container
docker-compose rm sqlserver
docker-compose up sqlserver
```

### Problema: Backend não conecta no banco

```bash
# Verificar se SQL Server está healthy
docker-compose ps

# Testar conexão manualmente
docker-compose exec backend npm run test:db
```

### Problema: Porta já em uso

```bash
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :1433

# Alterar portas no docker-compose.yml se necessário
```

## 🛡️ Segurança

⚠️ **IMPORTANTE**:

- A senha padrão é para desenvolvimento
- Em produção, use senhas mais seguras
- Configure SSL/TLS para conexões externas
- Use secrets do Docker em produção

## 🎯 Próximos passos

1. Configure seu ORM (TypeORM, Prisma, etc.)
2. Ajuste as variáveis de ambiente
3. Configure backup automático do banco
4. Adicione monitoramento (Prometheus, Grafana)
5. Configure CI/CD
