"use client";

import { LoadingSpinner } from "@/components/ui";
import { businessHoursApi, holidaysApi } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { canManageBusinessHours } from "@/utils/permissions";
import {
  AlertCircle,
  Calendar,
  Clock,
  Eye,
  Lock,
  Plus,
  RefreshCw,
  Save,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BusinessHour, Holiday, ValidationError } from "../types";
import {
  DAYS_OF_WEEK,
  getCurrentBusinessStatus,
  hasAtLeastOneActiveDay,
  validateAllBusinessHours,
} from "../utils/validation";

interface BusinessHoursSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function BusinessHoursSettings({
  onUnsavedChanges,
}: BusinessHoursSettingsProps) {
  // Hook de autenticação e permissões
  const { user } = useAuthStore();
  const canEdit = canManageBusinessHours(user);

  // Estados de carregamento e mensagens
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Estados dos dados
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [originalBusinessHours, setOriginalBusinessHours] = useState<
    BusinessHour[]
  >([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentStatus, setCurrentStatus] = useState<{
    isOpen: boolean;
    nextBusinessTime?: string;
  }>({ isOpen: false });

  // Estados da interface
  const [activeTab, setActiveTab] = useState<"hours" | "holidays">("hours");
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({
    name: "",
    date: "",
    type: "HOLIDAY",
    isRecurring: false,
  });

  // Função para criar horários padrão se não existirem
  const createDefaultBusinessHours = (): BusinessHour[] => {
    return Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      isActive: index >= 1 && index <= 5, // Segunda a Sexta ativas por padrão
      startTime: "08:00",
      endTime: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00",
    }));
  };

  // Carregar dados da API
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);

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
          const existingHour = hoursResponse.find((h) => h.dayOfWeek === index);
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

      setBusinessHours(businessHoursData);
      setOriginalBusinessHours(JSON.parse(JSON.stringify(businessHoursData)));

      // Carregar feriados
      const holidaysResponse = await holidaysApi.getHolidays();
      setHolidays(holidaysResponse);

      // Calcular status atual
      const status = getCurrentBusinessStatus(businessHoursData);
      setCurrentStatus({
        isOpen: status.isOpen,
        nextBusinessTime: status.nextBusinessTime || undefined,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados. Usando configuração padrão."
      );

      // Em caso de erro, usar dados padrão
      const defaultHours = createDefaultBusinessHours();
      setBusinessHours(defaultHours);
      setOriginalBusinessHours(JSON.parse(JSON.stringify(defaultHours)));
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Verificar se há mudanças não salvas
  const checkForChanges = useCallback(() => {
    const hasChanges =
      JSON.stringify(businessHours) !== JSON.stringify(originalBusinessHours);
    onUnsavedChanges(hasChanges);
  }, [businessHours, originalBusinessHours, onUnsavedChanges]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verificar mudanças sempre que os dados mudarem
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Limpar mensagens após um tempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleBusinessHourChange = (
    dayIndex: number,
    field: keyof BusinessHour,
    value: string | boolean
  ) => {
    setBusinessHours((prev) =>
      prev.map((hour, index) =>
        index === dayIndex ? { ...hour, [field]: value } : hour
      )
    );

    // Limpar mensagens ao fazer alterações
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
  };

  const handleSaveBusinessHours = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar dados antes de salvar
      const errors = validateAllBusinessHours(businessHours);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setError("Por favor, corrija os erros antes de salvar.");
        return;
      }

      // Verificar se há pelo menos um dia ativo
      if (!hasAtLeastOneActiveDay(businessHours)) {
        setError("Pelo menos um dia da semana deve estar ativo.");
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

      // Atualizar estado original para refletir os dados salvos
      setOriginalBusinessHours(JSON.parse(JSON.stringify(businessHours)));

      // Atualizar status atual
      const status = getCurrentBusinessStatus(businessHours);
      setCurrentStatus({
        isOpen: status.isOpen,
        nextBusinessTime: status.nextBusinessTime || undefined,
      });

      setSuccess("Horários de funcionamento atualizados com sucesso!");
      setValidationErrors([]);
      onUnsavedChanges(false);
    } catch (error) {
      console.error("Erro ao salvar horários:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao salvar horários de funcionamento"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter erro de validação específico do campo
  const getFieldError = (field: string): string | undefined => {
    const error = validationErrors.find((e) => e.field === field);
    return error?.message;
  };

  // Função para verificar se campo tem erro
  const hasFieldError = (field: string): boolean => {
    return validationErrors.some((e) => e.field === field);
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      setError("Nome e data são obrigatórios para adicionar um feriado");
      return;
    }

    setIsLoading(true);
    setError(null);

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

      setHolidays((prev) => [...prev, createdHoliday]);
      setNewHoliday({
        name: "",
        date: "",
        type: "HOLIDAY",
        isRecurring: false,
      });

      setSuccess("Feriado adicionado com sucesso!");
      setError(null);
    } catch (error) {
      console.error("Erro ao adicionar feriado:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao adicionar feriado"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveHoliday = async (id: string) => {
    if (!id || id.startsWith("temp-")) {
      // Remover apenas localmente se for temporário
      setHolidays((prev) => prev.filter((holiday) => holiday.id !== id));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await holidaysApi.deleteHoliday(id);
      setHolidays((prev) => prev.filter((holiday) => holiday.id !== id));
      setSuccess("Feriado removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover feriado:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao remover feriado"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Se está carregando dados iniciais
  if (isLoadingData) {
    return <LoadingSpinner message="Carregando configurações..." />;
  }

  return (
    <div className="space-y-6">
      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">✓</span>
          </div>
          <div>
            <p className="text-green-700 font-medium">Sucesso</p>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Status Atual */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={20} />
          Status Atual
        </h3>
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
              currentStatus.isOpen
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                currentStatus.isOpen ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {currentStatus.isOpen ? "Aberto" : "Fechado"}
          </div>
          {currentStatus.nextBusinessTime && (
            <p className="text-sm text-gray-600">
              Próximo atendimento:{" "}
              {new Date(currentStatus.nextBusinessTime).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("hours")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "hours"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Horários de Funcionamento
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "holidays"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Feriados e Dias Especiais
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === "hours" && (
        <div className="space-y-4">
          {/* Banner de permissão */}
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Eye className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-700 font-medium">
                  Modo Somente Leitura
                </p>
                <p className="text-yellow-600 text-sm">
                  Você pode visualizar os horários de funcionamento, mas apenas
                  administradores ou proprietários podem editá-los.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {businessHours.map((hour, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <p className="font-medium text-gray-900">
                        {DAYS_OF_WEEK[index]}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        canEdit &&
                        handleBusinessHourChange(
                          index,
                          "isActive",
                          !hour.isActive
                        )
                      }
                      className="flex items-center transition-colors"
                      disabled={isLoading || !canEdit}
                      title={
                        !canEdit
                          ? "Somente visualização - Sem permissão para editar"
                          : ""
                      }
                    >
                      {hour.isActive ? (
                        <ToggleRight
                          size={24}
                          className={
                            canEdit ? "text-green-500" : "text-green-300"
                          }
                        />
                      ) : (
                        <ToggleLeft
                          size={24}
                          className={
                            canEdit ? "text-gray-400" : "text-gray-300"
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>

                {hour.isActive && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4 border-l-2 border-blue-100">
                    {/* Horário de Abertura */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Abertura
                      </label>
                      <input
                        type="time"
                        value={hour.startTime}
                        onChange={(e) =>
                          handleBusinessHourChange(
                            index,
                            "startTime",
                            e.target.value
                          )
                        }
                        disabled={isLoading || !canEdit}
                        className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                          hasFieldError(`startTime_${hour.dayOfWeek}`)
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {hasFieldError(`startTime_${hour.dayOfWeek}`) && (
                        <p className="text-red-600 text-xs mt-1">
                          {getFieldError(`startTime_${hour.dayOfWeek}`)}
                        </p>
                      )}
                    </div>

                    {/* Horário de Fechamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fechamento
                      </label>
                      <input
                        type="time"
                        value={hour.endTime}
                        onChange={(e) =>
                          handleBusinessHourChange(
                            index,
                            "endTime",
                            e.target.value
                          )
                        }
                        disabled={isLoading || !canEdit}
                        className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                          hasFieldError(`endTime_${hour.dayOfWeek}`)
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {hasFieldError(`endTime_${hour.dayOfWeek}`) && (
                        <p className="text-red-600 text-xs mt-1">
                          {getFieldError(`endTime_${hour.dayOfWeek}`)}
                        </p>
                      )}
                    </div>

                    {/* Início do Intervalo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo (início)
                      </label>
                      <input
                        type="time"
                        value={hour.breakStart || ""}
                        onChange={(e) =>
                          handleBusinessHourChange(
                            index,
                            "breakStart",
                            e.target.value
                          )
                        }
                        disabled={isLoading || !canEdit}
                        placeholder="Opcional"
                        className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                          hasFieldError(`breakStart_${hour.dayOfWeek}`)
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {hasFieldError(`breakStart_${hour.dayOfWeek}`) && (
                        <p className="text-red-600 text-xs mt-1">
                          {getFieldError(`breakStart_${hour.dayOfWeek}`)}
                        </p>
                      )}
                    </div>

                    {/* Fim do Intervalo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo (fim)
                      </label>
                      <input
                        type="time"
                        value={hour.breakEnd || ""}
                        onChange={(e) =>
                          handleBusinessHourChange(
                            index,
                            "breakEnd",
                            e.target.value
                          )
                        }
                        disabled={isLoading || !canEdit}
                        placeholder="Opcional"
                        className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                          hasFieldError(`breakEnd_${hour.dayOfWeek}`)
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {hasFieldError(`breakEnd_${hour.dayOfWeek}`) && (
                        <p className="text-red-600 text-xs mt-1">
                          {getFieldError(`breakEnd_${hour.dayOfWeek}`)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Recarregar
              </button>
            </div>

            <button
              onClick={handleSaveBusinessHours}
              disabled={isLoading || !canEdit}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                canEdit
                  ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={
                !canEdit
                  ? "Você não tem permissão para editar os horários de funcionamento"
                  : ""
              }
            >
              {!canEdit ? <Lock size={16} /> : <Save size={16} />}
              {!canEdit
                ? "Somente Leitura"
                : isLoading
                ? "Salvando..."
                : "Salvar Horários"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="space-y-6">
          {/* Banner de permissão */}
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Eye className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-700 font-medium">
                  Modo Somente Leitura
                </p>
                <p className="text-yellow-600 text-sm">
                  Você pode visualizar os feriados, mas apenas administradores
                  ou proprietários podem editá-los.
                </p>
              </div>
            </div>
          )}

          {/* Adicionar Feriado - Apenas para usuários com permissão */}
          {canEdit && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={16} />
                Adicionar Feriado ou Dia Especial
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newHoliday.name || ""}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: Natal, Black Friday, etc."
                    disabled={isLoading}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newHoliday.date || ""}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    disabled={isLoading}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newHoliday.type || "HOLIDAY"}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({
                        ...prev,
                        type: e.target.value as Holiday["type"],
                      }))
                    }
                    disabled={isLoading}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="HOLIDAY">Feriado (Fechado)</option>
                    <option value="SPECIAL_HOURS">Horário Especial</option>
                    <option value="CLOSED">Dia Fechado</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={newHoliday.isRecurring || false}
                      onChange={(e) =>
                        setNewHoliday((prev) => ({
                          ...prev,
                          isRecurring: e.target.checked,
                        }))
                      }
                      disabled={isLoading}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">
                      Repetir anualmente
                    </span>
                  </label>
                </div>

                {newHoliday.type === "SPECIAL_HOURS" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário de Abertura
                      </label>
                      <input
                        type="time"
                        value={newHoliday.startTime || ""}
                        onChange={(e) =>
                          setNewHoliday((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário de Fechamento
                      </label>
                      <input
                        type="time"
                        value={newHoliday.endTime || ""}
                        onChange={(e) =>
                          setNewHoliday((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newHoliday.description || ""}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Ex: Funcionamento especial das 10h às 14h"
                    disabled={isLoading}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddHoliday}
                  disabled={isLoading || !newHoliday.name || !newHoliday.date}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                  {isLoading ? "Adicionando..." : "Adicionar"}
                </button>
              </div>
            </div>
          )}

          {/* Lista de Feriados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar size={16} />
                Feriados e Dias Especiais Cadastrados ({holidays.length})
              </h4>

              {holidays.length > 0 && (
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors text-sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Recarregar
                </button>
              )}
            </div>

            {holidays.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Nenhum feriado cadastrado
                </p>
                <p className="text-gray-400 text-sm">
                  Adicione feriados e dias especiais para personalizar o
                  atendimento
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-medium text-gray-900">
                          {holiday.name}
                        </h5>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            holiday.type === "HOLIDAY"
                              ? "bg-red-100 text-red-700"
                              : holiday.type === "SPECIAL_HOURS"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {holiday.type === "HOLIDAY"
                            ? "Feriado"
                            : holiday.type === "SPECIAL_HOURS"
                            ? "Horário Especial"
                            : "Fechado"}
                        </span>
                        {holiday.isRecurring && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Anual
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          📅{" "}
                          {new Date(holiday.date).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>

                        {holiday.type === "SPECIAL_HOURS" &&
                          holiday.startTime &&
                          holiday.endTime && (
                            <p>
                              🕐 {holiday.startTime} às {holiday.endTime}
                            </p>
                          )}

                        {holiday.description && (
                          <p className="text-gray-500">
                            💬 {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleRemoveHoliday(holiday.id!)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remover feriado"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
