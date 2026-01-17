import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  hospitalId?: number;

  @IsNotEmpty()
  @IsNumber()
  ambulanceId: number;
}
