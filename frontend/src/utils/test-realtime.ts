/**
 * Utilitário para testar o fluxo de mensagens em tempo real
 * Este arquivo será temporário e pode ser removido após os testes
 */

import { UnifiedMessage } from "@/store/realtime";

export function createTestMessage(
  overrides: Partial<UnifiedMessage> = {}
): UnifiedMessage {
  return {
    id: `test_${Date.now()}`,
    ticketId: "test-ticket-123",
    sessionId: "test-session-456",
    contactId: "test-contact-789",
    content: "Mensagem de teste do sistema realtime",
    messageType: "TEXT",
    direction: "INBOUND",
    status: "DELIVERED",
    isFromBot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function logMessageFlow(message: UnifiedMessage) {
  console.group("🧪 Teste de Fluxo de Mensagem");
  console.log("📨 Mensagem:", message);
  console.log("🎫 TicketId:", message.ticketId);
  console.log("👤 ContactId:", message.contactId);
  console.log("📱 SessionId:", message.sessionId);
  console.log("💬 Conteúdo:", message.content);
  console.log("📊 Status:", message.status);
  console.log("🔄 Direção:", message.direction);
  console.log("🤖 IsFromBot:", message.isFromBot);
  console.groupEnd();
}

export function validateMessageStructure(message: any): boolean {
  const requiredFields = [
    "id",
    "contactId",
    "content",
    "messageType",
    "direction",
    "status",
    "createdAt",
    "updatedAt",
  ];

  for (const field of requiredFields) {
    if (!message[field]) {
      console.error(`❌ Campo obrigatório ausente: ${field}`);
      return false;
    }
  }

  // Validar tipos de enum
  const validMessageTypes = ["TEXT", "IMAGE", "AUDIO", "VIDEO", "DOCUMENT"];
  const validDirections = ["INBOUND", "OUTBOUND"];
  const validStatuses = ["SENT", "DELIVERED", "READ", "FAILED"];

  if (!validMessageTypes.includes(message.messageType)) {
    console.error(`❌ messageType inválido: ${message.messageType}`);
    return false;
  }

  if (!validDirections.includes(message.direction)) {
    console.error(`❌ direction inválida: ${message.direction}`);
    return false;
  }

  if (!validStatuses.includes(message.status)) {
    console.error(`❌ status inválido: ${message.status}`);
    return false;
  }

  console.log("✅ Estrutura da mensagem válida");
  return true;
}
