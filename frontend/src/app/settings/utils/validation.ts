import { BusinessHour, ValidationError } from "../types";

// Validar formato de horário (HH:mm)
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Converter string de tempo em minutos para comparação
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Validar se o horário de fim é posterior ao de início
export const isEndTimeAfterStartTime = (
  startTime: string,
  endTime: string
): boolean => {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
};

// Validar se o intervalo está dentro do horário de funcionamento
export const isBreakTimeValid = (
  startTime: string,
  endTime: string,
  breakStart?: string,
  breakEnd?: string
): boolean => {
  if (!breakStart || !breakEnd) return true;

  const workStart = timeToMinutes(startTime);
  const workEnd = timeToMinutes(endTime);
  const breakStartMin = timeToMinutes(breakStart);
  const breakEndMin = timeToMinutes(breakEnd);

  return (
    breakStartMin > workStart &&
    breakEndMin < workEnd &&
    breakEndMin > breakStartMin
  );
};

// Validar horário de funcionamento individual
export const validateBusinessHour = (hour: BusinessHour): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Se não está ativo, não precisa validar horários
  if (!hour.isActive) {
    return errors;
  }

  // Validar formato dos horários obrigatórios
  if (!isValidTimeFormat(hour.startTime)) {
    errors.push({
      field: `startTime_${hour.dayOfWeek}`,
      message: "Horário de início deve estar no formato HH:mm",
    });
  }

  if (!isValidTimeFormat(hour.endTime)) {
    errors.push({
      field: `endTime_${hour.dayOfWeek}`,
      message: "Horário de fim deve estar no formato HH:mm",
    });
  }

  // Se os formatos estão corretos, validar lógica
  if (isValidTimeFormat(hour.startTime) && isValidTimeFormat(hour.endTime)) {
    if (!isEndTimeAfterStartTime(hour.startTime, hour.endTime)) {
      errors.push({
        field: `endTime_${hour.dayOfWeek}`,
        message: "Horário de fim deve ser posterior ao horário de início",
      });
    }
  }

  // Validar formato dos horários de intervalo (se fornecidos)
  if (hour.breakStart && !isValidTimeFormat(hour.breakStart)) {
    errors.push({
      field: `breakStart_${hour.dayOfWeek}`,
      message: "Horário de início do intervalo deve estar no formato HH:mm",
    });
  }

  if (hour.breakEnd && !isValidTimeFormat(hour.breakEnd)) {
    errors.push({
      field: `breakEnd_${hour.dayOfWeek}`,
      message: "Horário de fim do intervalo deve estar no formato HH:mm",
    });
  }

  // Validar lógica do intervalo
  if (
    isValidTimeFormat(hour.startTime) &&
    isValidTimeFormat(hour.endTime) &&
    hour.breakStart &&
    hour.breakEnd &&
    isValidTimeFormat(hour.breakStart) &&
    isValidTimeFormat(hour.breakEnd)
  ) {
    if (
      !isBreakTimeValid(
        hour.startTime,
        hour.endTime,
        hour.breakStart,
        hour.breakEnd
      )
    ) {
      errors.push({
        field: `breakStart_${hour.dayOfWeek}`,
        message: "Intervalo deve estar dentro do horário de funcionamento",
      });
    }
  }

  return errors;
};

// Validar todos os horários de funcionamento
export const validateAllBusinessHours = (
  businessHours: BusinessHour[]
): ValidationError[] => {
  const allErrors: ValidationError[] = [];

  businessHours.forEach((hour) => {
    const hourErrors = validateBusinessHour(hour);
    allErrors.push(...hourErrors);
  });

  return allErrors;
};

// Verificar se há pelo menos um dia ativo
export const hasAtLeastOneActiveDay = (
  businessHours: BusinessHour[]
): boolean => {
  return businessHours.some((hour) => hour.isActive);
};

// Nomes dos dias da semana
export const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Obter o status atual do negócio
export const getCurrentBusinessStatus = (businessHours: BusinessHour[]) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().substring(0, 5); // HH:mm

  const todayHours = businessHours.find((h) => h.dayOfWeek === currentDay);

  if (!todayHours || !todayHours.isActive) {
    return {
      isOpen: false,
      nextBusinessTime: findNextBusinessTime(businessHours, now),
    };
  }

  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(todayHours.startTime);
  const endMinutes = timeToMinutes(todayHours.endTime);

  let isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  // Verificar se está no intervalo (se houver)
  if (isOpen && todayHours.breakStart && todayHours.breakEnd) {
    const breakStartMinutes = timeToMinutes(todayHours.breakStart);
    const breakEndMinutes = timeToMinutes(todayHours.breakEnd);

    if (
      currentMinutes >= breakStartMinutes &&
      currentMinutes <= breakEndMinutes
    ) {
      isOpen = false;
    }
  }

  return {
    isOpen,
    nextBusinessTime: isOpen ? null : findNextBusinessTime(businessHours, now),
  };
};

// Encontrar próximo horário de funcionamento
const findNextBusinessTime = (
  businessHours: BusinessHour[],
  from: Date
): string | undefined => {
  const activeHours = businessHours.filter((h) => h.isActive);

  if (activeHours.length === 0) return undefined;

  // Implementação simplificada - pode ser expandida
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0); // Assumindo 8h como padrão

  return tomorrow.toISOString();
};
