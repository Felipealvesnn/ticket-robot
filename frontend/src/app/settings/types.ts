export interface BusinessHour {
  id?: string;
  companyId?: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessHourDto {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
}

export interface UpdateBusinessHourDto {
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
}

export interface Holiday {
  id?: string;
  companyId?: string;
  name: string;
  date: string;
  type: "HOLIDAY" | "SPECIAL_HOURS" | "CLOSED";
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHolidayDto {
  name: string;
  date: string;
  type: "HOLIDAY" | "SPECIAL_HOURS" | "CLOSED";
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  description?: string;
}

export interface BusinessStatus {
  isOpen: boolean;
  nextBusinessTime?: string;
  currentDay?: number;
  currentTime?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface BusinessHourFormData {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}
