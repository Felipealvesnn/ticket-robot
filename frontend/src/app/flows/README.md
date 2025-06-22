# Flow Builder - Estrutura de Componentes

Este diretório contém a implementação refatorada do Flow Builder, organizada em componentes modulares para facilitar a manutenção e escalabilidade.

## 📁 Estrutura de Arquivos

```
flows/
├── page.tsx                 # Página principal (orquestrador)
└── components/
    ├── index.ts            # Exportações centralizadas
    ├── CustomChatNode.tsx  # Componente de nó customizado do ReactFlow
    ├── FlowsPanel.tsx      # Painel de listagem e gerenciamento de flows
    ├── TemplatesPanel.tsx  # Painel de templates predefinidos
    ├── ElementsPanel.tsx   # Painel de elementos/nós disponíveis
    ├── PropertiesPanel.tsx # Painel de propriedades do nó selecionado
    ├── FlowCanvas.tsx      # Canvas principal com ReactFlow
    ├── CreateFlowModal.tsx # Modal para criar novo flow
    └── EditNodeModal.tsx   # Modal para editar nós
```

## 🎯 Responsabilidades dos Componentes

### `page.tsx`

- **Responsabilidade**: Orquestrador principal, gerencia estado da UI e coordena comunicação entre componentes
- **Estado gerenciado**: Painéis ativos, modais, estados dos formulários
- **Store utilizado**: `useFlowsStore` (100% integrado com Zustand)

### `CustomChatNode.tsx`

- **Responsabilidade**: Renderização visual dos nós no canvas
- **Características**: Estilos dinâmicos por tipo, preview de condições, handles de conexão

### `FlowsPanel.tsx`

- **Responsabilidade**: Listagem, seleção e ações básicas nos flows (duplicar, excluir)
- **Funcionalidades**: Exibição de flows, status visual, botões de ação

### `TemplatesPanel.tsx`

- **Responsabilidade**: Catálogo de templates predefinidos
- **Funcionalidades**: Templates prontos, aplicação de templates, dicas de uso

### `ElementsPanel.tsx`

- **Responsabilidade**: Paleta de elementos disponíveis para adicionar ao canvas
- **Funcionalidades**: Tipos de nós, tooltips explicativos, guia de uso

### `PropertiesPanel.tsx`

- **Responsabilidade**: Exibição e edição das propriedades do nó selecionado
- **Funcionalidades**: Informações do nó, botões de edição e exclusão

### `FlowCanvas.tsx`

- **Responsabilidade**: Canvas principal com ReactFlow, header e ações do flow
- **Funcionalidades**: Editor visual, controles de visualização, preview e publicação

### `CreateFlowModal.tsx`

- **Responsabilidade**: Interface para criação de novos flows
- **Funcionalidades**: Formulário de criação, validação

### `EditNodeModal.tsx`

- **Responsabilidade**: Interface para edição detalhada de nós
- **Funcionalidades**: Formulários dinâmicos por tipo de nó, validação

## 🔄 Integração com Zustand Store

Todos os componentes utilizam o `useFlowsStore` para:

- ✅ Gerenciamento de flows (CRUD completo)
- ✅ Gerenciamento de nós e edges (ReactFlow)
- ✅ Estado de seleção e edição
- ✅ Aplicação de templates
- ✅ Persistência automática

## 🚀 Benefícios da Refatoração

1. **Manutenibilidade**: Cada componente tem uma responsabilidade específica
2. **Testabilidade**: Componentes isolados são mais fáceis de testar
3. **Reusabilidade**: Componentes podem ser reutilizados em outras partes do app
4. **Legibilidade**: Código mais organizado e fácil de entender
5. **Escalabilidade**: Fácil adicionar novos painéis ou funcionalidades
6. **Performance**: Renderização otimizada com componentes menores

## 🛠️ Tecnologias Utilizadas

- **React 18** com hooks
- **TypeScript** para tipagem
- **ReactFlow** para o editor visual
- **Zustand** para gerenciamento de estado
- **Flowbite React** para componentes UI
- **Tailwind CSS** para styling
- **React Icons** para ícones

## 📝 Próximos Passos

- [ ] Adicionar testes unitários para cada componente
- [ ] Implementar drag & drop avançado
- [ ] Adicionar mais tipos de nós
- [ ] Melhorar responsividade móvel
- [ ] Implementar sistema de versionamento de flows
