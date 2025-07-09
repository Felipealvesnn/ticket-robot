const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIsMe() {
  console.log('🔍 Verificando mensagens com campo isMe...\n');

  try {
    // Buscar algumas mensagens para verificar o campo isMe
    const messages = await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        direction: true,
        isMe: true,
        isFromBot: true,
        createdAt: true,
      },
    });

    if (messages.length === 0) {
      console.log('⚠️  Nenhuma mensagem encontrada no banco de dados');
      return;
    }

    console.log(`📱 Encontradas ${messages.length} mensagens:`);
    console.log('');

    messages.forEach((msg, index) => {
      console.log(`Mensagem ${index + 1}:`);
      console.log(`  ID: ${msg.id}`);
      console.log(`  Conteúdo: ${msg.content.substring(0, 50)}...`);
      console.log(`  Direção: ${msg.direction}`);
      console.log(`  isMe: ${msg.isMe}`);
      console.log(`  isFromBot: ${msg.isFromBot}`);
      console.log(`  Data: ${msg.createdAt.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Estatísticas
    const totalMessages = messages.length;
    const myMessages = messages.filter((m) => m.isMe === true).length;
    const otherMessages = messages.filter((m) => m.isMe === false).length;
    const outboundMessages = messages.filter(
      (m) => m.direction === 'OUTGOING',
    ).length;
    const inboundMessages = messages.filter(
      (m) => m.direction === 'INCOMING',
    ).length;

    console.log('📊 Estatísticas:');
    console.log(`  Total de mensagens: ${totalMessages}`);
    console.log(`  Minhas mensagens (isMe=true): ${myMessages}`);
    console.log(`  Mensagens de outros (isMe=false): ${otherMessages}`);
    console.log(`  Mensagens enviadas (OUTGOING): ${outboundMessages}`);
    console.log(`  Mensagens recebidas (INCOMING): ${inboundMessages}`);
  } catch (error) {
    console.error('❌ Erro ao verificar mensagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIsMe();
