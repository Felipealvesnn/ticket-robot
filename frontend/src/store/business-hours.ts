import { BusinessHour, Holiday, ValidationError } from "@/app/settings/types";
import {
  getCurrentBusinessStatus,
  hasAtLeastOneActiveDay,
  validateAllBusinessHours,
} from "@/app/settings/utils/validation";
import { businessHoursApi, holidaysApi } from "@/services/api";
import { toast } from "@/utils/toast";
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

  // Estados de carregamento
  isLoading: boolean;
  isLoadingData: boolean;
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
        set({ isLoadingData: true });

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

          // Mostrar toast de erro
          toast.error(
            "Erro ao carregar dados",
            error instanceof Error
              ? error.message
              : "Usando configuração padrão"
          );

          set({
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
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      // Limpar validações
      clearValidations: () => set({ validationErrors: [] }),

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
          validationErrors: [],
        });
      },

      // Salvar horários de funcionamento
      saveBusinessHours: async () => {
        const { businessHours } = get();
        set({ isLoading: true });

        try {
          // Validar dados antes de salvar
          const errors = validateAllBusinessHours(businessHours);

          if (errors.length > 0) {
            set({
              validationErrors: errors,
              isLoading: false,
            });
            toast.error(
              "Erro de validação",
              "Por favor, corrija os erros antes de salvar."
            );
            return;
          }

          // Verificar se há pelo menos um dia ativo
          if (!hasAtLeastOneActiveDay(businessHours)) {
            set({ isLoading: false });
            toast.error(
              "Configuração inválida",
              "Pelo menos um dia da semana deve estar ativo."
            );
            return;
          }

          // Salvar cada horário individualmente
          const savePromises = businessHours.map(async (hour) => {
            try {
              // Filtrar apenas os campos aceitos pelo backend para update
              const {
                dayOfWeek,
                id,
                companyId,
                createdAt,
                updatedAt,
                ...updateData
              } = hour;

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
                // Para create, filtrar campos não aceitos também
                const { id, companyId, createdAt, updatedAt, ...createData } =
                  hour;

                return await businessHoursApi.createBusinessHour(createData);
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
            validationErrors: [],
            isLoading: false,
          });

          // Mostrar toast de sucesso
          toast.success(
            "Sucesso!",
            "Horários de funcionamento atualizados com sucesso!"
          );
        } catch (error) {
          console.error("Erro ao salvar horários:", error);
          set({ isLoading: false });

          // Mostrar toast de erro
          toast.error(
            "Erro ao salvar",
            error instanceof Error
              ? error.message
              : "Erro ao salvar horários de funcionamento"
          );
        }
      },

      // Adicionar feriado
      addHoliday: async () => {
        const { newHoliday, holidays } = get();

        if (!newHoliday.name || !newHoliday.date) {
          toast.error(
            "Dados obrigatórios",
            "Nome e data são obrigatórios para adicionar um feriado"
          );
          return;
        }

        set({ isLoading: true });

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
            isLoading: false,
          });

          // Mostrar toast de sucesso
          toast.success("Sucesso!", "Feriado adicionado com sucesso!");
        } catch (error) {
          console.error("Erro ao adicionar feriado:", error);
          set({ isLoading: false });

          // Mostrar toast de erro
          toast.error(
            "Erro ao adicionar feriado",
            error instanceof Error ? error.message : "Erro ao adicionar feriado"
          );
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
        set({ isLoading: true });

        try {
          await holidaysApi.deleteHoliday(id);
          set({
            holidays: holidays.filter((holiday) => holiday.id !== id),
            isLoading: false,
          });

          // Mostrar toast de sucesso
          toast.success("Sucesso!", "Feriado removido com sucesso!");
        } catch (error) {
          console.error("Erro ao remover feriado:", error);
          set({ isLoading: false });

          // Mostrar toast de erro
          toast.error(
            "Erro ao remover feriado",
            error instanceof Error ? error.message : "Erro ao remover feriado"
          );
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
