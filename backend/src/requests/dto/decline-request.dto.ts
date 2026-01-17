import { IsOptional, IsString } from 'class-validator';

export class DeclineRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
