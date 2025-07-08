export type Plan = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    tickets: number;
    sessions: number;
  };
}

// Re-export AdminCompany from store
export type { AdminCompany } from "@/store/admin-companies";

export const planColors: Record<Plan, string> = {
  FREE: "bg-gray-100 text-gray-800",
  BASIC: "bg-blue-100 text-blue-800",
  PRO: "bg-purple-100 text-purple-800",
  ENTERPRISE: "bg-yellow-100 text-yellow-800",
};

export const planNames: Record<Plan, string> = {
  FREE: "Gratuito",
  BASIC: "Básico",
  PRO: "Profissional",
  ENTERPRISE: "Empresarial",
};
