import { IsOptional, IsNumber } from 'class-validator';

export class AcceptRequestDto {
  @IsOptional()
  @IsNumber()
  ambulanceId?: number;

  @IsOptional()
  @IsNumber()
  hospitalId?: number;
}
