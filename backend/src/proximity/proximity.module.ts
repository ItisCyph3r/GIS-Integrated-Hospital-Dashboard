import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Ambulance } from '../ambulances/entities/ambulance.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { ProximityController } from './proximity.controller';
import { ProximityService } from './proximity.service';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ambulance, Hospital]),
    HospitalsModule,
    CacheModule.register(),
  ],
  controllers: [ProximityController],
  providers: [ProximityService],
  exports: [ProximityService],
})
export class ProximityModule {}
