#!/bin/bash

# Script para testar as correções de mensagens próprias
# Execute este script para verificar se as melhorias estão funcionando

echo "🧪 Iniciando testes das correções de mensagens próprias..."

# 1. Verificar se o backend está executando
echo "1. Verificando se o backend está executando..."
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend está executando"
else
    echo "❌ Backend não está executando. Inicie com: npm run start:dev"
    exit 1
fi

# 2. Verificar se o frontend está executando
echo "2. Verificando se o frontend está executando..."
curl -s http://localhost:3001 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend está executando"
else
    echo "❌ Frontend não está executando. Inicie com: npm run dev"
    exit 1
fi

echo ""
echo "🔧 INSTRUÇÕES DE TESTE MANUAL:"
echo ""
echo "1. Abra o WhatsApp Web"
echo "2. Abra a aplicação de atendimento"
echo "3. Crie ou acesse um ticket"
echo "4. Envie uma mensagem pelo WhatsApp Web"
echo "5. Verifique no console do navegador os logs:"
echo "   - 🔍 isMe: true (para mensagens próprias)"
echo "   - 🎯 Direção determinada pelo campo 'isMe': true -> isOutbound: true"
echo "6. Mensagem deve aparecer à direita (OUTBOUND)"
echo "7. Mensagem recebida deve aparecer à esquerda (INBOUND)"
echo ""
echo "🐛 LOGS IMPORTANTES:"
echo "- Abra o DevTools (F12)"
echo "- Vá para a aba Console"
echo "- Procure por logs com 📨, 🔍, 🎯"
echo ""
echo "✨ RECURSOS IMPLEMENTADOS:"
echo "- Campo isMe priorizado para detecção de direção"
echo "- Health monitoring do socket (15s)"
echo "- Reconexão automática e manual"
echo "- Logs detalhados para debugging"
echo ""
echo "📋 ARQUIVOS MODIFICADOS:"
echo "- backend/src/session/session.service.ts (+ campo isMe)"
echo "- frontend/src/hooks/useRealtime.ts (+ priorização isMe)"
echo "- frontend/src/store/socket.ts (+ priorização isMe)"
echo "- frontend/src/store/tickets.ts (+ priorização isMe)"
echo ""
echo "🎯 Teste concluído! Execute os passos manuais acima."
