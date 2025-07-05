export interface Condition {
  id: string;
  field: string;
  operator:
    | "equals"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater"
    | "greater_equal"
    | "less"
    | "less_equal"
    | "exists"
    | "not_exists"
    | "regex"
    | "in_list";
  value: string;
  label: string;
  targetNodeType?: string;
  targetNodeId?: string;
}

export type TabType =
  | "basic"
  | "conditions"
  | "config"
  | "integration"
  | "timing"
  | "contact"
  | "media"
  | "menu"
  | "advanced";

export interface NodeIconConfig {
  Icon: any;
  color: string;
  bg: string;
}

export const operatorLabels = {
  equals: "É igual a",
  contains: "Contém",
  starts_with: "Começa com",
  ends_with: "Termina com",
  greater: "Maior que",
  greater_equal: "Maior ou igual a",
  less: "Menor que",
  less_equal: "Menor ou igual a",
  exists: "Existe (não vazio)",
  not_exists: "Não existe (vazio)",
  regex: "Expressão regular",
  in_list: "Está na lista (separado por vírgulas)",
};

export const fieldOptions = [
  { value: "message", label: "Mensagem do usuário" },
  { value: "user_name", label: "Nome do usuário" },
  { value: "user_phone", label: "Telefone do usuário" },
  { value: "last_message_time", label: "Última mensagem" },
  { value: "conversation_count", label: "Número de conversas" },
  { value: "custom_field", label: "Campo personalizado" },
];

export const nodeTypeOptions = [
  { value: "message", label: "Mensagem de Texto", icon: "💬" },
  { value: "image", label: "Imagem", icon: "🖼️" },
  { value: "file", label: "Arquivo", icon: "📎" },
  { value: "delay", label: "Aguardar", icon: "⏰" },
  { value: "condition", label: "Condição", icon: "🔀" },
  { value: "webhook", label: "Webhook", icon: "🔗" },
  { value: "email", label: "Enviar Email", icon: "📧" },
  { value: "transfer", label: "Falar com Atendente", icon: "🎧" },
  { value: "ticket", label: "Criar Ticket", icon: "🎫" },
  { value: "end", label: "Fim do Flow", icon: "🏁" },
];
