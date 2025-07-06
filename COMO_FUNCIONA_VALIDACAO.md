# 🔍 Como Funciona a Validação de Fluxos

## 📋 O que é a Validação?

A validação é um sistema que **analisa seu fluxo automaticamente** e detecta problemas antes de você salvar. É como ter um assistente que verifica se tudo está configurado corretamente!

---

## 🚨 O que é um "Node com Erro"?

Um **node com erro** é um nó (bloquinho) no seu fluxo que tem algum problema de configuração que impede o fluxo de funcionar corretamente.

### 🔴 **Exemplos de Nodes com ERRO CRÍTICO:**

#### 1. **Nó de Input sem Pergunta**
```
❌ PROBLEMA: Nó de input vazio
┌─────────────────┐
│   📝 Input      │ ← Este nó está vermelho/com erro
│   (sem pergunta)│
└─────────────────┘

✅ SOLUÇÃO: Adicionar pergunta
┌─────────────────┐
│   📝 Input      │
│ "Qual seu nome?"│
└─────────────────┘
```

#### 2. **Nó de Condição sem Regras**
```
❌ PROBLEMA: Nó de decisão vazio
┌─────────────────┐
│   🔀 Condição   │ ← Este nó tem erro
│   (sem regras)  │
└─────────────────┘

✅ SOLUÇÃO: Adicionar condições
┌─────────────────┐
│   🔀 Condição   │
│ Se idade >= 18  │
└─────────────────┘
```

#### 3. **Nó Desconectado (Órfão)**
```
❌ PROBLEMA: Nó isolado
    ┌─────┐          ┌─────┐
    │ Msg │ ───────→ │Input│
    └─────┘          └─────┘
    
    ┌─────┐  ← Este nó está sozinho (órfão)
    │ Msg │     TEM ERRO!
    └─────┘

✅ SOLUÇÃO: Conectar ao fluxo
    ┌─────┐          ┌─────┐          ┌─────┐
    │ Msg │ ───────→ │Input│ ───────→ │ Msg │
    └─────┘          └─────┘          └─────┘
```

---

## 🎯 Como a Validação Funciona na Prática

### **1. Validação Automática (Tempo Real)**
```typescript
// Enquanto você edita, o sistema verifica automaticamente:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (nodes.length > 0) {
      runQuickValidation(); // ← Roda a cada 1 segundo
    }
  }, 1000);
}, [nodes, edges]);
```

**O que você vê:**
- 🟢 **Botão Verde**: "Válido" - pode salvar
- 🔴 **Botão Vermelho**: "X erro(s)" - não pode salvar
- 🟡 **Botão Amarelo**: "X aviso(s)" - pode salvar, mas há melhorias

### **2. Validação Completa (Manual)**
```typescript
// Quando você clica em "Validar":
const handleFullValidation = () => {
  setIsValidating(true);
  setIsValidationPanelOpen(true); // ← Abre painel detalhado
};
```

---

## 📊 Tipos de Problemas Detectados

### 🔴 **ERROS CRÍTICOS** (Impedem salvamento)

#### **Estrutura do Fluxo:**
- ❌ Fluxo vazio (sem nós)
- ❌ Sem nó de início
- ❌ Múltiplos nós de início  
- ❌ Nós desconectados (órfãos)
- ❌ Nós sem saída (dead ends)
- ❌ Loops infinitos

#### **Configuração dos Nós:**
- ❌ **Mensagem**: Texto vazio
- ❌ **Input**: Sem pergunta ou sem nome da variável
- ❌ **Condição**: Sem regras ou regras incompletas
- ❌ **Webhook**: Sem URL ou URL inválida
- ❌ **Menu**: Opções sem destino

#### **Variáveis:**
- ❌ Usar variável que não foi definida
- ❌ Referenciar campo que não existe

### 🟡 **AVISOS** (Recomendações)

#### **Performance:**
- ⚠️ Fluxo muito longo (>15 passos)
- ⚠️ Muitos webhooks seguidos (>3)
- ⚠️ Nós muito próximos

#### **Usabilidade:**
- ⚠️ Mensagem muito longa (>800 chars)
- ⚠️ Menu com muitas opções (>6)
- ⚠️ Muitas perguntas seguidas (>3)
- ⚠️ Sem mensagem de boas-vindas

---

## 🛠️ Como Corrigir Nodes com Erro

### **Passo 1: Identificar o Erro**
1. Olhe o **toolbar** - se estiver vermelho, há erros
2. Clique em **"Validar"** para ver detalhes
3. No painel, veja a lista de erros

### **Passo 2: Navegar para o Nó**
1. No painel de validação, clique em **"Ver Nó"**
2. O sistema automaticamente vai para o nó com problema
3. O nó fica destacado na tela

### **Passo 3: Corrigir o Problema**
1. Clique no nó com erro
2. No painel lateral, vá para a aba correspondente:
   - **"Básico"** - para mensagens e labels
   - **"Configuração"** - para variáveis e validações
   - **"Condições"** - para regras de decisão
   - **"Integração"** - para webhooks
3. Preencha os campos obrigatórios

---

## 🎮 Exemplo Prático

### **Cenário: Criando um Fluxo de Cadastro**

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌─────────┐
│ Início  │───→│ Mensagem │───→│    Input    │───→│  Salvar │
└─────────┘    └──────────┘    └─────────────┘    └─────────┘
                                      │
                                      ▼
                              ❌ ERRO DETECTADO!
```

**Erro encontrado:**
- **Nó**: Input (coletar nome)
- **Problema**: Não tem pergunta configurada
- **Mensagem**: "Prompt obrigatório"
- **Sugestão**: "Configure a mensagem de prompt na aba 'Básico'"

**Como corrigir:**
1. Clicar em "Ver Nó" na validação
2. Selecionar o nó de Input
3. Na aba "Básico", digitar: "Qual é o seu nome?"
4. ✅ Erro corrigido!

---

## 🚦 Interface Visual da Validação

### **No Toolbar:**
```
🟢 [Válido]     ← Tudo OK, pode salvar
🔴 [3 erro(s)]  ← Tem problemas críticos
🟡 [2 aviso(s)] ← Tem melhorias sugeridas
⚪ [Validar]    ← Não validado ainda
```

### **No Painel de Validação:**
```
┌─────────────────────────────────────┐
│ 🔍 Validação do Fluxo               │
├─────────────────────────────────────┤
│ ❌ Problemas Encontrados            │
│ • 2 erro(s) crítico(s)             │
│ • 1 aviso(s) de melhoria           │
├─────────────────────────────────────┤
│ 🔴 ERROS CRÍTICOS (2)               │
│                                     │
│ ❌ Prompt obrigatório               │
│ Nó Input precisa de pergunta        │
│ 💡 Configure na aba "Básico"       │
│ [Ver Nó] ←─ Clique para navegar    │
│                                     │
│ ❌ Nó desconectado                  │
│ Nó Mensagem não está conectado      │
│ 💡 Conecte ao fluxo principal       │
│ [Ver Nó]                           │
├─────────────────────────────────────┤
│ 🟡 AVISOS (1)                       │
│                                     │
│ ⚠️ Mensagem muito longa             │
│ 850 caracteres (máx: 800)          │
│ 💡 Divida em mensagens menores      │
└─────────────────────────────────────┘
```

---

## 🎯 Benefícios da Validação

### **Para Você (Criador):**
- ✅ **Detecta problemas** antes de publicar
- ✅ **Orienta correções** com sugestões claras
- ✅ **Navega direto** para nós com problema
- ✅ **Melhora qualidade** automaticamente

### **Para Usuários Finais:**
- ✅ **Fluxos funcionais** - sem travamentos
- ✅ **Experiência fluida** - sem confusões
- ✅ **Respostas consistentes** - sem erros

### **Para o Sistema:**
- ✅ **Menos bugs** em produção
- ✅ **Melhor performance** - fluxos otimizados
- ✅ **Código mais limpo** - problemas evitados

---

## 🚀 Resumo Rápido

**Um "node com erro" é simplesmente um nó mal configurado!**

**Como saber se há erro:**
- 🔴 Toolbar vermelho = tem erro
- 🟢 Toolbar verde = tudo OK

**Como corrigir:**
1. Clique em "Validar"
2. Veja a lista de erros
3. Clique em "Ver Nó"
4. Configure o nó corretamente
5. ✅ Pronto!

**Dica importante:** 
- **Erros vermelhos** = não pode salvar
- **Avisos amarelos** = pode salvar, mas pode melhorar

É como ter um **corretor ortográfico para fluxos**! 🎯
