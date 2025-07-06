import { BusinessHour, Holiday, ValidationError } from "@/app/settings/types";
import {
  getCurrentBusinessStatus,
  hasAtLeastOneActiveDay,
  validateAllBusinessHours,
} from "@/app/settings/utils/validation";
import { businessHoursApi, holidaysApi } from "@/services/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface BusinessHoursState {
  // Estados dos dados
  businessHours: BusinessHour[];
  originalBusinessHours: BusinessHour[];
  holidays: Holiday[];
  currentStatus: {
    isOpen: boolean;
    nextBusinessTime?: string;
  };

  // Estados da interface
  activeTab: "hours" | "holidays";
  newHoliday: Partial<Holiday>;

  // Estados de carregamento e mensagens
  isLoading: boolean;
  isLoadingData: boolean;
  error: string | null;
  success: string | null;
  validationErrors: ValidationError[];

  // Ações para dados
  loadData: () => Promise<void>;
  setBusinessHours: (hours: BusinessHour[]) => void;
  setHolidays: (holidays: Holiday[]) => void;
  setCurrentStatus: (status: {
    isOpen: boolean;
    nextBusinessTime?: string;
  }) => void;

  // Ações para interface
  setActiveTab: (tab: "hours" | "holidays") => void;
  setNewHoliday: (holiday: Partial<Holiday>) => void;

  // Ações para estados de carregamento
  setLoading: (loading: boolean) => void;
  setLoadingData: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setValidationErrors: (errors: ValidationError[]) => void;

  // Ações para horários de funcionamento
  handleBusinessHourChange: (
    dayIndex: number,
    field: keyof BusinessHour,
    value: string | boolean
  ) => void;
  saveBusinessHours: () => Promise<void>;

  // Ações para feriados
  addHoliday: () => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;

  // Utilitários
  getFieldError: (field: string) => string | undefined;
  hasFieldError: (field: string) => boolean;
  hasUnsavedChanges: () => boolean;
  createDefaultBusinessHours: () => BusinessHour[];
  clearMessages: () => void;
}

export const useBusinessHoursStore = create<BusinessHoursState>()(
  devtools(
    (set, get) => ({
      // Estados iniciais
      businessHours: [],
      originalBusinessHours: [],
      holidays: [],
      currentStatus: { isOpen: false },
      activeTab: "hours",
      newHoliday: {
        name: "",
        date: "",
        type: "HOLIDAY",
        isRecurring: false,
      },
      isLoading: false,
      isLoadingData: true,
      error: null,
      success: null,
      validationErrors: [],

      // Função para criar horários padrão
      createDefaultBusinessHours: (): BusinessHour[] => {
        return Array.from({ length: 7 }, (_, index) => ({
          dayOfWeek: index,
          isActive: index >= 1 && index <= 5, // Segunda a Sexta ativas por padrão
          startTime: "08:00",
          endTime: "17:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        }));
      },

      // Carregar dados da API
      loadData: async () => {
        const { createDefaultBusinessHours } = get();
        set({ isLoadingData: true, error: null });

        try {
          // Carregar horários de funcionamento
          const hoursResponse = await businessHoursApi.getBusinessHours();

          let businessHoursData: BusinessHour[];
          if (hoursResponse.length === 0) {
            // Se não há horários cadastrados, usar padrão
            businessHoursData = createDefaultBusinessHours();
          } else {
            // Garantir que temos todos os 7 dias
            businessHoursData = Array.from({ length: 7 }, (_, index) => {
              const existingHour = hoursResponse.find(
                (h) => h.dayOfWeek === index
              );
              return (
                existingHour || {
                  dayOfWeek: index,
                  isActive: false,
                  startTime: "08:00",
                  endTime: "17:00",
                  breakStart: "",
                  breakEnd: "",
                }
              );
            });
          }

          // Carregar feriados
          const holidaysResponse = await holidaysApi.getHolidays();

          // Calcular status atual
          const status = getCurrentBusinessStatus(businessHoursData);

          set({
            businessHours: businessHoursData,
            originalBusinessHours: JSON.parse(
              JSON.stringify(businessHoursData)
            ),
            holidays: holidaysResponse,
            currentStatus: {
              isOpen: status.isOpen,
              nextBusinessTime: status.nextBusinessTime || undefined,
            },
            isLoadingData: false,
          });
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          const defaultHours = createDefaultBusinessHours();

          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao carregar dados. Usando configuração padrão.",
            businessHours: defaultHours,
            originalBusinessHours: JSON.parse(JSON.stringify(defaultHours)),
            isLoadingData: false,
          });
        }
      },

      // Setters simples
      setBusinessHours: (hours) => set({ businessHours: hours }),
      setHolidays: (holidays) => set({ holidays }),
      setCurrentStatus: (status) => set({ currentStatus: status }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setNewHoliday: (holiday) => set({ newHoliday: holiday }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingData: (loading) => set({ isLoadingData: loading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      // Limpar mensagens
      clearMessages: () =>
        set({ error: null, success: null, validationErrors: [] }),

      // Verificar se há mudanças não salvas
      hasUnsavedChanges: () => {
        const { businessHours, originalBusinessHours } = get();
        return (
          JSON.stringify(businessHours) !==
          JSON.stringify(originalBusinessHours)
        );
      },

      // Alterar horário de funcionamento
      handleBusinessHourChange: (dayIndex, field, value) => {
        const { businessHours } = get();
        const newHours = businessHours.map((hour, index) =>
          index === dayIndex ? { ...hour, [field]: value } : hour
        );

        set({
          businessHours: newHours,
          error: null,
          success: null,
          validationErrors: [],
        });
      },

      // Salvar horários de funcionamento
      saveBusinessHours: async () => {
        const { businessHours } = get();
        set({ isLoading: true, error: null, success: null });

        try {
          // Validar dados antes de salvar
          const errors = validateAllBusinessHours(businessHours);

          if (errors.length > 0) {
            set({
              validationErrors: errors,
              error: "Por favor, corrija os erros antes de salvar.",
              isLoading: false,
            });
            return;
          }

          // Verificar se há pelo menos um dia ativo
          if (!hasAtLeastOneActiveDay(businessHours)) {
            set({
              error: "Pelo menos um dia da semana deve estar ativo.",
              isLoading: false,
            });
            return;
          }

          // Salvar cada horário individualmente
          const savePromises = businessHours.map(async (hour) => {
            try {
              const { dayOfWeek, ...updateData } = hour;
              return await businessHoursApi.updateBusinessHour(
                dayOfWeek,
                updateData
              );
            } catch (error) {
              // Se o horário não existe, criar
              if (
                error instanceof Error &&
                error.message.includes("não encontrado")
              ) {
                return await businessHoursApi.createBusinessHour(hour);
              }
              throw error;
            }
          });

          await Promise.all(savePromises);

          // Atualizar status atual
          const status = getCurrentBusinessStatus(businessHours);

          set({
            originalBusinessHours: JSON.parse(JSON.stringify(businessHours)),
            currentStatus: {
              isOpen: status.isOpen,
              nextBusinessTime: status.nextBusinessTime || undefined,
            },
            success: "Horários de funcionamento atualizados com sucesso!",
            validationErrors: [],
            isLoading: false,
          });
        } catch (error) {
          console.error("Erro ao salvar horários:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao salvar horários de funcionamento",
            isLoading: false,
          });
        }
      },

      // Adicionar feriado
      addHoliday: async () => {
        const { newHoliday, holidays } = get();

        if (!newHoliday.name || !newHoliday.date) {
          set({
            error: "Nome e data são obrigatórios para adicionar um feriado",
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const holidayData = {
            name: newHoliday.name,
            date: newHoliday.date,
            type: newHoliday.type || ("HOLIDAY" as const),
            startTime: newHoliday.startTime,
            endTime: newHoliday.endTime,
            isRecurring: newHoliday.isRecurring || false,
            description: newHoliday.description,
          };

          const createdHoliday = await holidaysApi.createHoliday(holidayData);

          set({
            holidays: [...holidays, createdHoliday],
            newHoliday: {
              name: "",
              date: "",
              type: "HOLIDAY",
              isRecurring: false,
            },
            success: "Feriado adicionado com sucesso!",
            error: null,
            isLoading: false,
          });
        } catch (error) {
          console.error("Erro ao adicionar feriado:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao adicionar feriado",
            isLoading: false,
          });
        }
      },

      // Remover feriado
      removeHoliday: async (id: string) => {
        if (!id || id.startsWith("temp-")) {
          // Remover apenas localmente se for temporário
          const { holidays } = get();
          set({ holidays: holidays.filter((holiday) => holiday.id !== id) });
          return;
        }

        const { holidays } = get();
        set({ isLoading: true, error: null });

        try {
          await holidaysApi.deleteHoliday(id);
          set({
            holidays: holidays.filter((holiday) => holiday.id !== id),
            success: "Feriado removido com sucesso!",
            isLoading: false,
          });
        } catch (error) {
          console.error("Erro ao remover feriado:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erro ao remover feriado",
            isLoading: false,
          });
        }
      },

      // Utilitários para validação
      getFieldError: (field: string) => {
        const { validationErrors } = get();
        const error = validationErrors.find((e) => e.field === field);
        return error?.message;
      },

      hasFieldError: (field: string) => {
        const { validationErrors } = get();
        return validationErrors.some((e) => e.field === field);
      },
    }),
    {
      name: "business-hours-store",
    }
  )
);
