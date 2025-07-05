# Teste do Fluxo de Idade

## Fluxo Proposto:

1. **Mensagem**: "Bom dia! Como posso ajudar você?"
2. **Input**: "Digite sua idade:" (variável: idade)
3. **Decisão**: Se idade >= 18 → Nó 1, Se idade < 18 → Nó 2

## Estrutura Técnica:

### 1. Nó de Mensagem

```json
{
  "type": "message",
  "data": {
    "message": "Bom dia! Como posso ajudar você?",
    "awaitInput": false
  }
}
```

### 2. Nó de Input

```json
{
  "type": "input",
  "data": {
    "message": "Digite sua idade:",
    "variableName": "idade",
    "validation": "number",
    "required": true
  }
}
```

### 3. Nó de Decisão/Condição

```json
{
  "type": "condition",
  "data": {
    "conditions": [
      {
        "id": "cond_1",
        "field": "idade",
        "operator": "greater_equal",
        "value": "18",
        "label": "Maior de idade",
        "targetNodeId": "node_adulto"
      },
      {
        "id": "cond_2",
        "field": "idade",
        "operator": "less",
        "value": "18",
        "label": "Menor de idade",
        "targetNodeId": "node_menor"
      }
    ]
  }
}
```

## Status: ✅ FUNCIONAL

### Frontend:

- ✅ InputNode com campo `message` e `variableName`
- ✅ ConditionNode com acesso a variáveis de input anteriores
- ✅ **WebhookNode com acesso a variáveis de input anteriores** 🆕
- ✅ Interface para configurar condições baseadas em variáveis
- ✅ Preview das variáveis disponíveis
- ✅ **Botões para inserir variáveis no payload do webhook** 🆕

### Backend:

- ✅ Processamento de nó `input` com salvamento da variável
- ✅ Função `evaluateCondition` com busca inteligente de variáveis
- ✅ **Webhook com acesso completo às variáveis do fluxo**
- ✅ Suporte a operadores numéricos (greater_equal, less, etc.)
- ✅ Integração entre nós funcionando

## 🆕 Nova Funcionalidade: WebhookNode Inteligente

### O que foi implementado:

1. **Preview de variáveis** disponíveis na aba "Integração" do webhook
2. **Botões "Inserir"** para facilitar adição de variáveis no payload
3. **Detecção automática** de variáveis de nós de input anteriores
4. **Descrições contextuais** das variáveis (igual ao ConditionNode)

### Como usar:

- Na aba "Integração" do nó webhook
- Seção "📦 Dados do Payload"
- Preview mostra: `{{idade}}`, `{{nome}}`, etc.
- Botão "Inserir" adiciona automaticamente no payload JSON
