 🚫 Sistema de Contatos Ignorados

## Visão Geral

O sistema de contatos ignorados permite que você configure números de telefone que **não devem receber respostas automáticas** do chatbot. Isso é muito útil para:

- 📞 **Números internos da empresa** (diretoria, gerência)
- 🧪 **Números de teste** (para desenvolvimento)
- 👑 **Clientes VIP** (que preferem atendimento manual)
- 🚫 **Números problemáticos** (que devem ser bloqueados)

## Como Funciona

### 🔍 Verificação Automática

Sempre que uma mensagem chega no WhatsApp, o sistema:

1. ✅ **Extrai o número** do remetente
2. 🔍 **Consulta a lista** de contatos ignorados
3. 🚫 **Bloqueia respostas automáticas** se o número estiver na lista
4. 📝 **Registra a mensagem** no banco (mas não processa fluxos)

### 🎯 Tipos de Ignore

#### 🌍 **Global** (toda a empresa)

```bash
# Ignora o número em todas as sessões da empresa
POST /ignored-contacts
{
  "phoneNumber": "5511999999999",
  "name": "CEO - João Silva",
  "reason": "INTERNAL"
}
```

#### 📱 **Por Sessão** (apenas uma sessão específica)

```bash
# Ignora apenas na sessão de atendimento específica
POST /ignored-contacts
{
  "phoneNumber": "5511999999999",
  "messagingSessionId": "session-123",
  "name": "Cliente VIP - Maria",
  "reason": "VIP"
}
```

#### ⚙️ **Tipo de Ignore**

- `ignoreBotOnly: true` ➜ Ignora só respostas automáticas (padrão)
- `ignoreBotOnly: false` ➜ Ignora todas as mensagens

## 🚀 Exemplos de Uso

### 1. 📞 Números Internos da Empresa

```bash
POST /ignored-contacts
{
  "phoneNumber": "5511987654321",
  "name": "Diretoria - WhatsApp Interno",
  "reason": "INTERNAL",
  "ignoreBotOnly": true,
  "notes": "Número da diretoria, não deve receber mensagens automáticas"
}
```

### 2. 🧪 Números de Teste

```bash
POST /ignored-contacts
{
  "phoneNumber": "5511123456789",
  "name": "Número de Teste - Desenvolvimento",
  "reason": "TEST",
  "ignoreBotOnly": true,
  "notes": "Usado para testes durante desenvolvimento"
}
```

### 3. 👑 Cliente VIP (apenas uma sessão)

```bash
POST /ignored-contacts
{
  "phoneNumber": "5511555666777",
  "messagingSessionId": "atendimento-geral",
  "name": "Cliente VIP - Empresa XYZ",
  "reason": "VIP",
  "ignoreBotOnly": true,
  "notes": "Cliente prefere atendimento manual"
}
```

## 📋 Endpoints da API

### ➕ Adicionar à Lista

```bash
POST /ignored-contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "phoneNumber": "5511999999999",
  "messagingSessionId": "opcional",
  "name": "Nome do contato",
  "reason": "INTERNAL|TEST|VIP|BLOCKED|OTHER",
  "ignoreBotOnly": true,
  "notes": "Observações"
}
```

### 📋 Listar Ignorados

```bash
# Todos os ignorados da empresa
GET /ignored-contacts

# Apenas de uma sessão específica
GET /ignored-contacts?sessionId=session-123

# Apenas ignorados globais
GET /ignored-contacts?global=true
```

### 🔍 Verificar Número

```bash
# Verifica se um número está ignorado
GET /ignored-contacts/check/5511999999999?sessionId=session-123&botMessage=true

# Resposta
{
  "phoneNumber": "5511999999999",
  "shouldIgnore": true,
  "reason": "Número interno da empresa",
  "isBotMessage": true,
  "sessionId": "session-123"
}
```

### 📊 Estatísticas

```bash
GET /ignored-contacts/stats

# Resposta
{
  "data": {
    "total": 15,
    "global": 8,
    "bySession": 7,
    "byReason": {
      "INTERNAL": 5,
      "TEST": 3,
      "VIP": 4,
      "BLOCKED": 2,
      "OTHER": 1
    }
  }
}
```

### ✏️ Atualizar

```bash
PATCH /ignored-contacts/{id}
{
  "name": "Novo nome",
  "reason": "VIP",
  "notes": "Atualizado para VIP"
}
```

### 🗑️ Remover

```bash
DELETE /ignored-contacts/{id}
```

## 🔧 Integração no Código

### Backend (SessionService)

O sistema já está integrado automaticamente no `SessionService`. Quando uma mensagem chega:

```typescript
// ✅ Verificação automática no handleIncomingMessage
const ignoreCheck = await this.ignoredContactsService.shouldIgnoreContact(
  companyId,
  phoneNumber,
  session.id,
  true // É mensagem do bot
);

if (ignoreCheck.shouldIgnore) {
  // 🚫 Não processa fluxos, apenas registra a mensagem
  return;
}
```

### Manual em Outros Serviços

```typescript
// Injetar o service
constructor(
  private readonly ignoredContactsService: IgnoredContactsService,
) {}

// Verificar antes de enviar mensagem automática
const shouldIgnore = await this.ignoredContactsService.shouldIgnoreContact(
  companyId,
  phoneNumber,
  sessionId,
  true, // É mensagem do bot
);

if (shouldIgnore.shouldIgnore) {
  console.log(`Contato ignorado: ${shouldIgnore.reason}`);
  return;
}
```

## 📱 Frontend (Futuro)

### Interface de Gerenciamento

```tsx
// Lista de contatos ignorados
<IgnoredContactsList />

// Adicionar novo
<AddIgnoredContactForm />

// Verificador rápido
<IgnoreChecker phoneNumber="5511999999999" />
```

## 🎯 Casos de Uso Avançados

### 1. 🕐 Ignore Temporário

```bash
# Adicione com data de expiração nas notes
POST /ignored-contacts
{
  "phoneNumber": "5511999999999",
  "reason": "OTHER",
  "notes": "Ignorar até 31/12/2024 - Cliente em férias"
}
```

### 2. 🔄 Ignore por Padrão

```bash
# Ignore todos os números que começam com +55119999
# (implementar regex no futuro)
```

### 3. 📈 Relatórios

```bash
# Quantos contatos estão sendo ignorados
GET /ignored-contacts/stats

# Quais são os motivos mais comuns
# Temporal analytics no futuro
```

## ⚡ Performance

- ✅ **Consulta rápida** - índice no banco por companyId + phoneNumber
- ✅ **Cache** - pode ser implementado para números frequentes
- ✅ **Mínimo impacto** - apenas uma consulta extra por mensagem
- ✅ **Escalável** - suporta milhares de números ignorados

## 🔒 Segurança

- ✅ **Multi-tenant** - cada empresa vê apenas seus ignorados
- ✅ **Auditoria** - registra quem criou cada ignore
- ✅ **Soft delete** - não remove permanentemente do banco
- ✅ **Autorização** - apenas usuários autenticados

## 🚀 Próximos Passos

1. 🖥️ **Interface Frontend** - tela de gerenciamento
2. 📅 **Expiração automática** - ignorar por período
3. 🔄 **Patterns/Regex** - ignorar por padrão de número
4. 📊 **Analytics** - relatórios de uso
5. 🔔 **Notificações** - alertar quando VIP envia mensagem
6. 🤖 **Auto-detecção** - detectar números problemáticos automaticamente

---

✅ **Pronto para usar!** O sistema já está funcionando automaticamente em todas as sessões WhatsApp.
