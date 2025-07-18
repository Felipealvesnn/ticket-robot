# 🔗 Gerenciamento de Conexões no Flow Builder

## Nova Funcionalidade: Deletar Conexões

Agora você pode facilmente **deletar conexões** entre os nós no Flow Builder!

## 🎯 Como Usar

### 1. **Seleção Visual**

- Clique em qualquer **conexão** (edge) para selecioná-la
- A conexão selecionada ficará **vermelha** e **animada**
- Aparecerá uma notificação no topo da tela

### 2. **Métodos para Deletar**

#### **Método 1: Teclado (Recomendado)**

1. Clique na conexão para selecioná-la
2. Pressione `Delete` ou `Backspace`
3. A conexão será removida instantaneamente

#### **Método 2: Menu Contextual**

1. **Clique direito** na conexão
2. Selecione "**Deletar Conexão**" no menu
3. A conexão será removida

## 🎨 Recursos Visuais

- **Conexão Normal**: Cor cinza (`#6b7280`)
- **Conexão Selecionada**: Cor vermelha (`#ef4444`) + animação
- **Notificação**: Banner informativo no topo
- **Menu Contextual**: Clique direito para opções avançadas

## ⌨️ Atalhos de Teclado

| Tecla       | Ação                        |
| ----------- | --------------------------- |
| `Delete`    | Deletar conexão selecionada |
| `Backspace` | Deletar conexão selecionada |
| `Escape`    | Fechar menu contextual      |

## 🔧 Recursos Técnicos

### **Performance**

- Uso de `useCallback` para otimização de handlers
- `useMemo` para estilização eficiente das edges
- Estados otimizados para evitar re-renders desnecessários

### **UX/UI**

- Feedback visual imediato
- Instruções claras na interface
- Menu contextual intuitivo
- Suporte a múltiplos métodos de interação

## 🚀 Melhorias Futuras (Em Desenvolvimento)

- **Editar Labels** das conexões
- **Propriedades das Conexões** (tipo, condições, etc.)
- **Undo/Redo** para operações de deletar
- **Seleção múltipla** de conexões

## 📝 Exemplo de Uso

1. Criar dois nós no flow
2. Conectar os nós arrastando de um para outro
3. Clicar na conexão criada (fica vermelha)
4. Pressionar `Delete` para remover a conexão
5. ✅ Conexão deletada com sucesso!

---

**💡 Dica**: Use `Ctrl+Z` para desfazer ações no flow builder (funcionalidade de undo/redo já implementada).
