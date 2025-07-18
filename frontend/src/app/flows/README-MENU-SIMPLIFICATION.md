# 🍽️ Simplificação do Sistema de Menu

## 📋 Resumo das Mudanças

**Objetivo**: Simplificar o sistema de menus removendo a distinção entre `menu` e `mainMenu`, mantendo apenas `menu` com uma checkbox "É menu principal?"

## 🔧 Alterações Técnicas Implementadas

### 1. **Tipos de Nó Simplificados**

```typescript
// ANTES (flows.ts)
type: "menu" | "mainMenu";

// DEPOIS (flows.ts)
type: "menu";
// + propriedade isMainMenu: boolean
```

### 2. **Store - flows.ts**

- ✅ Removido tipo `mainMenu` da interface `FlowNode`
- ✅ Simplificado `getNodeLabel()` nos métodos `addNode` e `addNodeWithConnection`
- ✅ Removido defaults específicos para `mainMenu`
- ✅ **Implementada lógica de menu único**: `updateNodeData()` agora automaticamente desmarca outros menus quando um é marcado como principal

### 3. **CustomNode.tsx**

- ✅ Removido tipo `mainMenu` de todas as configurações (labels, icons, colors, borders)
- ✅ Simplificado condições `nodeType === "menu"` (removido `|| nodeType === "mainMenu"`)
- ✅ Atualizado `hasMultipleOutputs` para usar apenas `menu`

### 4. **MenuNode.tsx**

- ✅ Mudado interface `MenuNodeProps` para aceitar apenas `nodeType: "menu"`
- ✅ Implementada lógica `isMainMenu = data.isMainMenu === true`
- ✅ Atualizado visual dinâmico baseado na flag `isMainMenu`

### 5. **page.tsx**

- ✅ Adicionado `menu: CustomNode` no registro de tipos de nó
- ✅ Removido registro do tipo `mainMenu`

### 6. **MenuTab.tsx (Painel de Propriedades)**

- ✅ **Adicionada checkbox "🏠 Menu Principal"** no painel de propriedades
- ✅ Incluída explicação "(apenas um menu pode ser principal)"
- ✅ Integração com `onUpdateProperty("isMainMenu", boolean)`

### 7. **FlowValidator.ts**

- ✅ Removida validação específica para tipo `mainMenu`
- ✅ **Adicionada validação para múltiplos menus principais** em `validateBestPractices()`
- ✅ Atualizado filtros de menu para usar apenas `type === "menu"`

## 🎯 Como Funciona Agora

### **Criação de Menu**

1. Usuário arrasta "Menu" da paleta
2. Por padrão, `isMainMenu = false`
3. Usuário pode marcar como principal no painel de propriedades

### **Lógica de Menu Principal Único**

```typescript
// Quando marcar um menu como principal...
updateNodeData(nodeId, { isMainMenu: true });

// Automaticamente desmarca outros menus principais:
otherMenuNodes.forEach((node) => {
  if (node.data.isMainMenu === true) {
    node.data.isMainMenu = false;
  }
});
```

### **Validação Automática**

- ✅ **FlowValidator** detecta múltiplos menus principais
- ✅ Mostra warning com sugestão de correção
- ✅ Lista todos os nós com problema

## 🎨 Interface do Usuário

### **Visual do Menu**

- **Menu Normal**: Ícone 📋, cores cinza/slate
- **Menu Principal**: Ícone 🏠, cores verde/emerald
- **Checkbox**: "🏠 Menu Principal (apenas um menu pode ser principal)"

### **Feedback Visual**

- Badge "🏠 Principal" aparece apenas em menus marcados como principais
- Cores dinâmicas baseadas na flag `isMainMenu`

## 🔍 Validações Implementadas

### **Múltiplos Menus Principais**

```typescript
// FlowValidator detecta:
const mainMenuNodes = this.nodes.filter(
  (node) => node.data?.type === "menu" && node.data?.isMainMenu === true
);

// Se length > 1, mostra warning para todos
```

### **Auto-correção**

```typescript
// Store automaticamente corrige ao marcar:
if (data.isMainMenu === true) {
  // Desmarca outros menus principais
  state.nodes.map((node) => {
    if (node.data?.type === "menu" && node.data?.isMainMenu === true) {
      return { ...node, data: { ...node.data, isMainMenu: false } };
    }
  });
}
```

## ✅ Benefícios da Simplificação

1. **Menos Confusão**: Apenas um tipo de menu
2. **UX Melhor**: Checkbox clara e intuitiva
3. **Validação Automática**: Sistema garante apenas um menu principal
4. **Código Limpo**: Menos tipos, menos condições, mais simples
5. **Flexibilidade**: Qualquer menu pode virar principal com um clique

## 🧪 Como Testar

1. **Criar múltiplos menus** no flow builder
2. **Marcar um como principal** via checkbox no painel
3. **Marcar outro como principal** → primeiro deve ser desmarcado automaticamente
4. **Executar validação** → deve mostrar warning se múltiplos principais (caso de edge case)
5. **Verificar visual** → menu principal deve ter cores verdes e ícone 🏠

---

**Status**: ✅ **Implementado e Funcionando**  
**Data**: Julho 2025  
**Impacto**: Simplificação significativa do sistema de menus
