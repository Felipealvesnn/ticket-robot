import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReportFiltersDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;
}
