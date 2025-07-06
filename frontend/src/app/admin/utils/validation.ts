export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validações para empresa
export const validateCompanyForm = (data: {
  name: string;
  slug: string;
  plan: string;
  userEmail?: string;
  userName?: string;
  userPassword?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validar nome da empresa
  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Nome da empresa é obrigatório" });
  } else if (data.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Nome deve ter pelo menos 2 caracteres",
    });
  } else if (data.name.trim().length > 100) {
    errors.push({
      field: "name",
      message: "Nome não pode ter mais de 100 caracteres",
    });
  }

  // Validar slug
  if (!data.slug.trim()) {
    errors.push({ field: "slug", message: "Slug é obrigatório" });
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({
      field: "slug",
      message: "Slug deve conter apenas letras minúsculas, números e hífens",
    });
  } else if (data.slug.length < 2) {
    errors.push({
      field: "slug",
      message: "Slug deve ter pelo menos 2 caracteres",
    });
  } else if (data.slug.length > 50) {
    errors.push({
      field: "slug",
      message: "Slug não pode ter mais de 50 caracteres",
    });
  }

  // Validar plano
  const validPlans = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  if (!validPlans.includes(data.plan)) {
    errors.push({ field: "plan", message: "Plano inválido" });
  }

  // Validações para usuário (se fornecido - modal de criação)
  if (
    data.userEmail !== undefined ||
    data.userName !== undefined ||
    data.userPassword !== undefined
  ) {
    if (!data.userEmail?.trim()) {
      errors.push({
        field: "userEmail",
        message: "Email do proprietário é obrigatório",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userEmail)) {
      errors.push({ field: "userEmail", message: "Email inválido" });
    }

    if (!data.userName?.trim()) {
      errors.push({
        field: "userName",
        message: "Nome do proprietário é obrigatório",
      });
    } else if (data.userName.trim().length < 2) {
      errors.push({
        field: "userName",
        message: "Nome deve ter pelo menos 2 caracteres",
      });
    }

    if (!data.userPassword?.trim()) {
      errors.push({ field: "userPassword", message: "Senha é obrigatória" });
    } else if (data.userPassword.length < 6) {
      errors.push({
        field: "userPassword",
        message: "Senha deve ter pelo menos 6 caracteres",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validações para usuário
export const validateUserForm = (data: {
  email: string;
  name: string;
  password?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validar email
  if (!data.email.trim()) {
    errors.push({ field: "email", message: "Email é obrigatório" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: "email", message: "Email inválido" });
  }

  // Validar nome
  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Nome é obrigatório" });
  } else if (data.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Nome deve ter pelo menos 2 caracteres",
    });
  } else if (data.name.trim().length > 100) {
    errors.push({
      field: "name",
      message: "Nome não pode ter mais de 100 caracteres",
    });
  }

  // Validar senha (se fornecida)
  if (data.password !== undefined && data.password.trim()) {
    if (data.password.length < 6) {
      errors.push({
        field: "password",
        message: "Senha deve ter pelo menos 6 caracteres",
      });
    } else if (data.password.length > 50) {
      errors.push({
        field: "password",
        message: "Senha não pode ter mais de 50 caracteres",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Função helper para gerar slug automático
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplos
    .replace(/^-|-$/g, "") // Remove hífens do início e fim
    .trim();
};
