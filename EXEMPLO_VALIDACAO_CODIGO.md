// 🎯 EXEMPLO PRÁTICO: Como a Validação Funciona no Código

// ===============================
// 1. VALIDAÇÃO EM TEMPO REAL
// ===============================

// No FlowBuilderToolbar.tsx, linha 55:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (nodes.length > 0) {
      runQuickValidation(); // ← Executa validação automaticamente
    }
  }, 1000); // Espera 1 segundo após mudança
  return () => clearTimeout(timeoutId);
}, [nodes, edges]); // ← Observa mudanças nos nós e conexões

// ===============================
// 2. FUNÇÃO DE VALIDAÇÃO RÁPIDA
// ===============================

const runQuickValidation = () => {
  if (nodes.length === 0) {
    setValidationResult(null);
    return;
  }

  // Cria instância do validador
  const validator = new FlowValidator(nodes, edges);
  
  // Executa todas as validações
  const result = validator.validateFlow();
  
  // Salva resultado para mostrar no toolbar
  setValidationResult(result);
};

// ===============================
// 3. EXEMPLO DE NÓ COM ERRO
// ===============================

// Imagine que você tem este nó:
const nodeComErro = {
  id: "input-123",
  type: "customNode",
  data: {
    type: "input",
    label: "Coletar Nome",
    // ❌ PROBLEMA: Campos obrigatórios estão vazios!
    message: "",        // ← Sem pergunta
    variableName: "",   // ← Sem nome da variável
  },
  position: { x: 100, y: 100 }
};

// ===============================
// 4. COMO O VALIDADOR DETECTA O ERRO
// ===============================

// No FlowValidator.ts, método validateNodeConfiguration():
private validateNodeConfiguration(): ValidationError[] {
  const errors: ValidationError[] = [];

  this.nodes.forEach((node) => {
    const nodeType = node.data?.type;
    const nodeLabel = node.data?.label || nodeType;

    switch (nodeType) {
      case "input":
        // ✅ Verifica se tem pergunta
        if (!node.data?.message?.trim()) {
          errors.push({
            id: `input-no-prompt-${node.id}`,
            type: "error",
            nodeId: node.id, // ← ID do nó com problema
            message: "Prompt obrigatório",
            description: `O nó de input "${nodeLabel}" precisa de uma pergunta`,
            suggestion: 'Configure a mensagem de prompt na aba "Básico"',
          });
        }
        
        // ✅ Verifica se tem nome da variável
        if (!node.data?.variableName?.trim()) {
          errors.push({
            id: `input-no-variable-${node.id}`,
            type: "error",
            nodeId: node.id, // ← Mesmo nó, outro erro
            message: "Nome da variável obrigatório",
            description: `O nó de input "${nodeLabel}" precisa salvar em uma variável`,
            suggestion: 'Configure o nome da variável na aba "Configuração"',
          });
        }
        break;
    }
  });

  return errors;
}

// ===============================
// 5. RESULTADO DA VALIDAÇÃO
// ===============================

// O resultado seria algo assim:
const validationResult = {
  isValid: false, // ← Tem erros, não pode salvar
  errors: [
    {
      id: "input-no-prompt-input-123",
      type: "error",
      nodeId: "input-123", // ← Identifica qual nó
      message: "Prompt obrigatório",
      description: "O nó de input \"Coletar Nome\" precisa de uma pergunta",
      suggestion: "Configure a mensagem de prompt na aba \"Básico\"",
    },
    {
      id: "input-no-variable-input-123",
      type: "error", 
      nodeId: "input-123", // ← Mesmo nó, outro erro
      message: "Nome da variável obrigatório",
      description: "O nó de input \"Coletar Nome\" precisa salvar em uma variável",
      suggestion: "Configure o nome da variável na aba \"Configuração\"",
    }
  ],
  warnings: [],
  info: [],
  summary: {
    totalIssues: 2,
    criticalIssues: 2,
    canSave: false, // ← Não pode salvar por causa dos erros
    lastValidated: new Date(),
  }
};

// ===============================
// 6. COMO APARECE NO TOOLBAR
// ===============================

// No FlowBuilderToolbar.tsx, o botão muda conforme o resultado:
<button
  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
    validationResult?.isValid === false
      ? "text-red-600 bg-red-50 hover:bg-red-100" // ← Vermelho se tem erro
      : validationResult?.isValid === true
      ? "text-green-600 bg-green-50 hover:bg-green-100" // ← Verde se OK
      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100" // ← Cinza se não validou
  }`}
>
  {validationResult?.isValid === false ? (
    <>
      <AlertCircle size={16} />
      <span>2 erro(s)</span> {/* ← Mostra quantos erros */}
    </>
  ) : validationResult?.isValid === true ? (
    <>
      <CheckCircle size={16} />
      <span>Válido</span>
    </>
  ) : (
    <>
      <Shield size={16} />
      <span>Validar</span>
    </>
  )}
</button>

// ===============================
// 7. NAVEGAÇÃO PARA NÓ COM ERRO
// ===============================

// Quando usuário clica em "Ver Nó" no painel:
const handleNodeSelect = (nodeId: string) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (node) {
    // Foca na visualização do nó com erro
    fitView({
      duration: 500,
      padding: 0.3,
      nodes: [{ id: nodeId }], // ← Centraliza o nó específico
    });
    setIsValidationPanelOpen(false); // Fecha o painel
  }
};

// ===============================
// 8. SALVAMENTO BLOQUEADO
// ===============================

// Quando usuário tenta salvar:
const handleSaveWithValidation = async () => {
  setIsValidating(true);
  
  const validator = new FlowValidator(nodes, edges);
  const result = validator.validateFlow();
  
  setIsValidating(false);
  
  // ❌ Se tem erros críticos, bloqueia salvamento
  if (result.errors.length > 0) {
    setValidationResult(result);
    setIsValidationPanelOpen(true); // ← Abre painel para mostrar erros
    showError(
      "Não é possível salvar",
      `Corrija ${result.errors.length} erro(s) antes de salvar`
    );
    return; // ← Para aqui, não salva
  }

  // ✅ Se só tem avisos, pergunta se quer salvar mesmo assim
  if (result.warnings.length > 0) {
    const confirmSave = window.confirm(
      `O fluxo tem ${result.warnings.length} aviso(s) de melhoria. Deseja salvar mesmo assim?`
    );
    if (!confirmSave) {
      setValidationResult(result);
      setIsValidationPanelOpen(true);
      return;
    }
  }

  // 🎉 Sem erros, pode salvar!
  await saveCurrentFlow();
  success("Fluxo salvo", "Todas as validações passaram!");
};

// ===============================
// 9. PAINEL DE VALIDAÇÃO
// ===============================

// No FlowValidationPanel.tsx, mostra os erros de forma organizada:
{validationResult.errors.map((error, index) => (
  <ValidationItem
    key={index}
    error={error}
    onNodeSelect={onNodeSelect} // ← Função para navegar para o nó
  />
))}

// Cada ValidationItem renderiza:
<div className="p-3 rounded-lg border bg-red-50 border-red-200">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-4 h-4 text-red-500" />
    <div className="flex-1">
      <h5 className="font-medium text-sm">Prompt obrigatório</h5>
      <p className="text-sm text-gray-600">
        O nó de input "Coletar Nome" precisa de uma pergunta
      </p>
      <p className="text-sm text-blue-600 italic">
        💡 Configure a mensagem de prompt na aba "Básico"
      </p>
      <button
        onClick={() => onNodeSelect("input-123")} // ← Vai para o nó
        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
      >
        Ver Nó
      </button>
    </div>
  </div>
</div>

// ===============================
// 10. RESUMO: FLUXO COMPLETO
// ===============================

/*
1. Usuário cria/edita nó ───→ 2. Sistema detecta mudança
                                      ↓
3. Aguarda 1 segundo (debounce) ───→ 4. Executa validação automática
                                      ↓
5. Analisa todos os nós ───→ 6. Encontra problemas
                                      ↓
7. Atualiza toolbar com status ───→ 8. Usuário vê erro visual
                                      ↓
9. Usuário clica "Validar" ───→ 10. Abre painel detalhado
                                      ↓
11. Usuário clica "Ver Nó" ───→ 12. Navega para nó problemático
                                      ↓
13. Usuário corrige configuração ───→ 14. Sistema re-valida automaticamente
                                      ↓
15. Status fica verde ───→ 16. Usuário pode salvar! ✅
*/
