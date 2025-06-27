# Refatoração dos Endpoints de Sessão WhatsApp

## Resumo das Mudanças

### ❌ Endpoints Removidos (não implementados no backend)

- `POST /session/:id/connect`
- `POST /session/:id/disconnect`

### ✅ Endpoint Mantido

- `POST /session/:id/restart` - Reinicia uma sessão WhatsApp

## Arquitetura Atual

### Como Funciona a Conexão WhatsApp

1. **Criação**: `POST /session` cria uma nova sessão e inicia o processo de conexão
2. **QR Code**: O WhatsApp Web gera automaticamente o QR Code
3. **Escaneamento**: Usuário escaneia o QR Code no celular
4. **Conexão Automática**: Sessão se conecta automaticamente após escaneamento
5. **Reconexão Automática**: WhatsApp Web tenta reconectar automaticamente em caso de queda

### Quando Usar o Restart

- Sessão travada em estado "connecting"
- Sessão desconectada e não reconecta automaticamente
- Forçar nova geração de QR Code
- Resolver problemas de cache/estado

## Mudanças no Frontend

### API (services/api.ts)

```typescript
// ❌ Removido
sessions.connect(id);
sessions.disconnect(id);

// ✅ Mantido/Adicionado
sessions.restart(id);
```

### Store (store/sessions.ts)

```typescript
// ✅ Métodos mantidos como aliases para compatibilidade
connectSession(id); // → chama internamente restartSession(id)
disconnectSession(id); // → chama internamente restartSession(id)
restartSession(id); // → método principal
```

### UI (app/sessions/page.tsx)

```tsx
// ❌ Antigo
{
  session.status === "connected" ? (
    <button onClick={() => disconnectSession(id)}>Desconectar</button>
  ) : (
    <button onClick={() => connectSession(id)}>Conectar</button>
  );
}

// ✅ Novo
{
  session.status === "connected" ? (
    <button onClick={() => restartSession(id)}>Reiniciar</button>
  ) : (
    <button onClick={() => restartSession(id)}>Reconectar</button>
  );
}
```

## Benefícios

1. **Clareza**: A UI agora reflete melhor o que realmente acontece (restart, não connect/disconnect manual)
2. **Consistência**: Frontend alinhado com backend - apenas endpoints que existem
3. **Funcionalidade**: Mesma funcionalidade, mas com nomes mais precisos
4. **Compatibilidade**: Métodos antigos mantidos como aliases para não quebrar código existente

## Status de Conexão via Socket.IO

A mudança de status das sessões continua sendo transmitida em tempo real via Socket.IO:

- `session-status-change` - quando status muda (connected, disconnected, etc.)
- `qr-code` - quando novo QR Code é gerado
- `session-authenticated` - quando usuário escaneia QR Code

## Próximos Passos Recomendados

1. ✅ **Concluído**: Remover endpoints inexistentes do frontend
2. ✅ **Concluído**: Atualizar UI para usar `restartSession`
3. 🔄 **Opcional**: Adicionar mais feedback visual para o processo de restart
4. 🔄 **Opcional**: Implementar timeout visual para QR Code expirado
5. 🔄 **Opcional**: Adicionar confirmação antes do restart de sessões conectadas
