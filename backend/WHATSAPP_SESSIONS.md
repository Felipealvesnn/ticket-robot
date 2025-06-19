# Sistema de Gerenciamento de Sessões WhatsApp

Este sistema permite gerenciar múltiplas sessões do WhatsApp Web usando a biblioteca `whatsapp-web.js`.

## Funcionalidades Implementadas

### 🔐 Gerenciamento de Sessões
- **Criar nova sessão**: Cria uma nova sessão do WhatsApp Web
- **Listar sessões**: Visualiza todas as sessões ativas
- **Restaurar sessões**: Automaticamente restaura sessões salvas ao iniciar a aplicação
- **Remover sessões**: Remove sessões específicas
- **Limpeza automática**: Remove sessões inativas automaticamente

### 📱 Recursos WhatsApp
- **QR Code**: Geração e exibição de QR codes para autenticação
- **Envio de mensagens**: Envia mensagens através das sessões ativas
- **Status de conexão**: Monitora o status de cada sessão
- **Informações do cliente**: Armazena dados do usuário conectado

### 💾 Persistência
- **Armazenamento local**: Sessões são salvas na pasta `./sessions`
- **Configuração em JSON**: Metadados das sessões em `sessions.json`
- **Restauração automática**: Sessões são restauradas ao reiniciar a aplicação

## Endpoints da API

### Sessões
- `POST /session` - Criar nova sessão
- `GET /session` - Listar todas as sessões
- `GET /session/:id` - Obter informações de uma sessão
- `GET /session/:id/qr` - Obter QR code de uma sessão
- `GET /session/:id/status` - Verificar status de uma sessão
- `PATCH /session/:id` - Atualizar informações da sessão
- `DELETE /session/:id` - Remover sessão

### Mensagens
- `POST /session/:id/message` - Enviar mensagem

### Manutenção
- `GET /session/cleanup` - Executar limpeza de sessões inativas

## Como Usar

### 1. Criar uma Nova Sessão
```bash
curl -X POST http://localhost:3000/session \
  -H "Content-Type: application/json" \
  -d '{"name": "Minha Sessão"}'
```

### 2. Escanear QR Code
Após criar a sessão, verifique o console da aplicação para ver o QR code ou use:
```bash
curl http://localhost:3000/session/{session-id}/qr
```

### 3. Verificar Status
```bash
curl http://localhost:3000/session/{session-id}/status
```

### 4. Enviar Mensagem
```bash
curl -X POST http://localhost:3000/session/{session-id}/message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }'
```

### 5. Listar Sessões
```bash
curl http://localhost:3000/session
```

### 6. Limpeza de Sessões Inativas
```bash
curl http://localhost:3000/session/cleanup
```

## Status das Sessões

- **connecting**: Aguardando QR code ser escaneado
- **connected**: Sessão ativa e funcional
- **disconnected**: Sessão desconectada
- **error**: Erro na autenticação ou conexão

## Estrutura de Arquivos

```
sessions/
├── sessions.json          # Configurações das sessões
├── session_123_abc/       # Dados da sessão 1
│   └── Default/
├── session_456_def/       # Dados da sessão 2
│   └── Default/
└── ...
```

## Recursos Automáticos

### Inicialização
- Verifica e cria o diretório `./sessions`
- Carrega sessões salvas automaticamente
- Reconecta sessões existentes

### Limpeza Automática
- Remove sessões desconectadas há mais de 24 horas
- Limpa arquivos órfãos de sessões removidas
- Atualiza arquivo de configuração automaticamente

## Logs
O sistema gera logs detalhados sobre:
- Criação e remoção de sessões
- Status de conexão
- Erros de autenticação
- Mensagens recebidas (modo debug)
- Operações de limpeza

## Segurança
- Sessões são isoladas por ID único
- Dados de autenticação ficam locais
- Cada sessão tem seu próprio diretório
- Validação de parâmetros de entrada

## Exemplo de Uso Completo

1. **Inicie a aplicação**:
   ```bash
   npm run start:dev
   ```

2. **Crie uma sessão**:
   ```bash
   curl -X POST http://localhost:3000/session -H "Content-Type: application/json" -d '{"name": "Bot Principal"}'
   ```

3. **Escaneie o QR code** que aparecerá no console

4. **Envie uma mensagem**:
   ```bash
   curl -X POST http://localhost:3000/session/{session-id}/message \
     -H "Content-Type: application/json" \
     -d '{"number": "5511999999999", "message": "Olá!"}'
   ```

5. **Para parar e reiniciar**: As sessões serão restauradas automaticamente!

## Troubleshooting

### Sessão não conecta
- Verifique se o QR code foi escaneado corretamente
- Verifique a conexão com a internet
- Tente remover e recriar a sessão

### Erro ao enviar mensagem
- Verifique se a sessão está no status "connected"
- Confirme o formato do número (com código do país)
- Verifique se o número existe no WhatsApp
