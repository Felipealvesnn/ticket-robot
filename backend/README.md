# Ticket Robot - Backend API

Backend da aplicação Ticket Robot, construído com NestJS, implementando um sistema multi-tenant SaaS com autenticação JWT, sistema de roles e gerenciamento de tickets.

## 🚀 Características

- **Multi-tenant SaaS**: Suporte a múltiplas empresas com isolamento de dados
- **Autenticação JWT**: Sistema robusto com access/refresh tokens
- **Sistema de Roles**: SUPER_ADMIN, COMPANY_OWNER, MANAGER, AGENT, USER
- **Prisma ORM**: Integração com SQL Server
- **Swagger**: Documentação automática da API
- **WhatsApp Integration**: Sessões e mensagens do WhatsApp
- **Sistema de Tickets**: Gerenciamento completo de atendimento

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- SQL Server (via Docker ou instalação local)
- npm ou yarn

## 🛠️ Configuração do Ambiente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Execute o SQL Server via Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=StrongPassword123!" \
  -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="sqlserver://sa:StrongPassword123!@localhost:1433/ticketrobot;encrypt=false"

# JWT
JWT_SECRET="sua-chave-secreta-muito-segura"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="sua-chave-refresh-muito-segura"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
BCRYPT_ROUNDS=12

# Application
PORT=3000
NODE_ENV=development
```

### 4. Executar Migrações

```bash
# Executar migrações
npx prisma migrate dev --name init

# Popular banco com dados iniciais
npx prisma db seed
```

## 🏃‍♂️ Executando a Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação

### Swagger UI

Acesse a documentação interativa: `http://localhost:3000/api`

### Autenticação

Consulte o guia completo de autenticação: [AUTHENTICATION.md](./AUTHENTICATION.md)

## 🔑 Conta Padrão

O sistema vem com uma conta de administrador pré-configurada:

- **Email**: `admin@ticketrobot.com`
- **Senha**: `Admin123!`

> ⚠️ **Importante**: Troque a senha no primeiro login!

## 🧪 Testando os Endpoints

### Via Swagger

1. Acesse `http://localhost:3000/api`
2. Clique em "Authorize" e insira o token JWT
3. Teste os endpoints interativamente

### Via curl

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ticketrobot.com","password":"Admin123!"}'

# Usar token retornado para acessar endpoints protegidos
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📁 Estrutura do Projeto

```
src/
├── auth/           # Módulo de autenticação
│   ├── dto/        # Data Transfer Objects
│   ├── guards/     # Guards de autenticação e autorização
│   ├── decorators/ # Decorators customizados
│   └── strategies/ # Estratégias JWT
├── prisma/         # Serviços do Prisma
├── config/         # Configurações da aplicação
├── message/        # Módulo de mensagens WhatsApp
├── session/        # Módulo de sessões WhatsApp
└── util/           # Utilitários e gateways
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Prisma
npm run prisma:generate    # Gerar cliente Prisma
npm run prisma:migrate     # Executar migrações
npm run prisma:seed        # Popular dados iniciais
npm run prisma:studio      # Interface visual do banco
```

## 🌍 Ambientes

### Desenvolvimento

- Logs detalhados habilitados
- Hot reload ativo
- Swagger disponível

### Produção

- Logs otimizados
- Compressão habilitada
- Validações rigorosas

## 📦 Dependências Principais

- **NestJS**: Framework Node.js
- **Prisma**: ORM para SQL Server
- **Passport**: Autenticação
- **JWT**: Tokens de acesso
- **Bcrypt**: Hash de senhas
- **Class Validator**: Validação de dados
- **Swagger**: Documentação da API

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação de autenticação](./AUTHENTICATION.md)
2. Consulte a documentação Swagger em `/api`
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ usando NestJS**

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
