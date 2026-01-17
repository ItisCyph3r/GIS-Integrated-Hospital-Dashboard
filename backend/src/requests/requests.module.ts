import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsGateway } from './requests.gateway';
import { EmergencyRequest } from './entities/request.entity';
import { AmbulancesModule } from '../ambulances/ambulances.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyRequest]), AmbulancesModule],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsGateway],
  exports: [RequestsService, RequestsGateway],
})
export class RequestsModule {}
