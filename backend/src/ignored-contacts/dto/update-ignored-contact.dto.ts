import { PartialType } from '@nestjs/swagger';
import { CreateIgnoredContactDto } from './create-ignored-contact.dto';

export class UpdateIgnoredContactDto extends PartialType(
  CreateIgnoredContactDto,
) {}
