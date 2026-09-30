import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '../../../generated/prisma/enums.js';

export class UpdateRequestStatusDto {
  @IsNotEmpty({ message: 'Status é obrigatório' })
  @IsEnum(RequestStatus, { message: 'Status inválido' })
  status!: RequestStatus;
}
