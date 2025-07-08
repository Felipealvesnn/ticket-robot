# Script PowerShell para testar as correções de mensagens próprias
# Execute este script para verificar se as melhorias estão funcionando

Write-Host "🧪 Iniciando testes das correções de mensagens próprias..." -ForegroundColor Green

# 1. Verificar se o backend está executando
Write-Host "1. Verificando se o backend está executando..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend está executando" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend não está executando. Inicie com: npm run start:dev" -ForegroundColor Red
    exit 1
}

# 2. Verificar se o frontend está executando
Write-Host "2. Verificando se o frontend está executando..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend está executando" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend não está executando. Inicie com: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 INSTRUÇÕES DE TESTE MANUAL:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abra o WhatsApp Web"
Write-Host "2. Abra a aplicação de atendimento"
Write-Host "3. Crie ou acesse um ticket"
Write-Host "4. Envie uma mensagem pelo WhatsApp Web"
Write-Host "5. Verifique no console do navegador os logs:"
Write-Host "   - isMe: true (para mensagens proprias)"
Write-Host "   - Direcao determinada pelo campo 'isMe': true -> isOutbound: true"
Write-Host "6. Mensagem deve aparecer à direita (OUTBOUND)"
Write-Host "7. Mensagem recebida deve aparecer à esquerda (INBOUND)"
Write-Host ""
Write-Host "🐛 LOGS IMPORTANTES:" -ForegroundColor Cyan
Write-Host "- Abra o DevTools (F12)"
Write-Host "- Vá para a aba Console"
Write-Host "- Procure por logs com [mensagem], [analise], [direcao]"
Write-Host ""
Write-Host "✨ RECURSOS IMPLEMENTADOS:" -ForegroundColor Magenta
Write-Host "- Campo isMe priorizado para detecao de direcao"
Write-Host "- Health monitoring do socket (15s)"
Write-Host "- Reconexao automatica e manual"
Write-Host "- Logs detalhados para debugging"
Write-Host ""
Write-Host "📋 ARQUIVOS MODIFICADOS:" -ForegroundColor White
Write-Host "- backend/src/session/session.service.ts (adicionado campo isMe)"
Write-Host "- frontend/src/hooks/useRealtime.ts (adicionado priorizacao isMe)"
Write-Host "- frontend/src/store/socket.ts (adicionado priorizacao isMe)"
Write-Host "- frontend/src/store/tickets.ts (adicionado priorizacao isMe)"
Write-Host ""
Write-Host "🎯 Teste concluído! Execute os passos manuais acima." -ForegroundColor Green
