import { IsNotEmpty, IsNumber } from 'class-validator';

export class SimulateMovementDto {
  @IsNotEmpty()
  @IsNumber()
  targetLongitude: number;

  @IsNotEmpty()
  @IsNumber()
  targetLatitude: number;

  @IsNumber()
  speedKmh?: number;
}
