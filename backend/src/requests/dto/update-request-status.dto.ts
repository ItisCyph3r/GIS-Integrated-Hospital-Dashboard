import { IsEnum } from 'class-validator';
import { RequestStatus } from '../../common/types/request-status.enum';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
