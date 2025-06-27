/* eslint-disable prettier/prettier */

export class UserProfileDto {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}
