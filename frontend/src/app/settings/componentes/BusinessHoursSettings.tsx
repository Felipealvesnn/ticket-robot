"use client";

import {
  Calendar,
  Clock,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BusinessHoursSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

interface BusinessHour {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface Holiday {
  id?: string;
  name: string;
  date: string;
  type: "HOLIDAY" | "SPECIAL_HOURS" | "CLOSED";
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  description?: string;
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export default function BusinessHoursSettings({
  onUnsavedChanges,
}: BusinessHoursSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hours" | "holidays">("hours");

  // Estado dos horários de funcionamento
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(() =>
    Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      isActive: index >= 1 && index <= 5, // Segunda a Sexta ativas por padrão
      startTime: "08:00",
      endTime: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00",
    }))
  );

  // Estado dos feriados
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({
    name: "",
    date: "",
    type: "HOLIDAY",
    isRecurring: false,
  });

  // Status atual
  const [currentStatus, setCurrentStatus] = useState<{
    isOpen: boolean;
    nextBusinessTime?: string;
  }>({ isOpen: false });

  useEffect(() => {
    // Detectar mudanças (simplificado para exemplo)
    onUnsavedChanges(false);
  }, [businessHours, holidays, onUnsavedChanges]);

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
    setError(null);
    setSuccess(null);
  };

  const handleSaveBusinessHours = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Aqui você faria a chamada para a API
      // await api.businessHours.updateAll(businessHours);

      // Simulação
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Horários de funcionamento atualizados com sucesso!");
      onUnsavedChanges(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao salvar horários de funcionamento"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      setError("Nome e data são obrigatórios para adicionar um feriado");
      return;
    }

    const holiday: Holiday = {
      id: `temp-${Date.now()}`,
      name: newHoliday.name,
      date: newHoliday.date,
      type: newHoliday.type || "HOLIDAY",
      startTime: newHoliday.startTime,
      endTime: newHoliday.endTime,
      isRecurring: newHoliday.isRecurring || false,
      description: newHoliday.description,
    };

    setHolidays((prev) => [...prev, holiday]);
    setNewHoliday({
      name: "",
      date: "",
      type: "HOLIDAY",
      isRecurring: false,
    });
    setError(null);
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((holiday) => holiday.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
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
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentStatus.isOpen
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {currentStatus.isOpen ? "🟢 Aberto" : "🔴 Fechado"}
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
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "hours"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Horários de Funcionamento
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
          <div className="space-y-3">
            {businessHours.map((hour, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="w-28">
                  <p className="font-medium text-gray-900">
                    {DAYS_OF_WEEK[index]}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleBusinessHourChange(index, "isActive", !hour.isActive)
                  }
                  className="flex items-center"
                >
                  {hour.isActive ? (
                    <ToggleRight size={24} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={24} className="text-gray-400" />
                  )}
                </button>

                {hour.isActive && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Abertura:</label>
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
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">
                        Fechamento:
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
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Almoço:</label>
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
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Início"
                      />
                      <span className="text-gray-400">até</span>
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
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Fim"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveBusinessHours}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {isLoading ? "Salvando..." : "Salvar Horários"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="space-y-6">
          {/* Adicionar Feriado */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={16} />
              Adicionar Feriado
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
                    setNewHoliday((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Natal"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                    setNewHoliday((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="HOLIDAY">Feriado (Fechado)</option>
                  <option value="SPECIAL_HOURS">Horário Especial</option>
                  <option value="CLOSED">Dia Fechado</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newHoliday.isRecurring || false}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({
                        ...prev,
                        isRecurring: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Anual</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddHoliday}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista de Feriados */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar size={16} />
              Feriados Cadastrados
            </h4>

            {holidays.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum feriado cadastrado
              </p>
            ) : (
              holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{holiday.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(holiday.date).toLocaleDateString("pt-BR")} •{" "}
                      {holiday.type === "HOLIDAY"
                        ? "Feriado"
                        : holiday.type === "SPECIAL_HOURS"
                        ? "Horário Especial"
                        : "Fechado"}
                      {holiday.isRecurring && " • Anual"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(holiday.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
