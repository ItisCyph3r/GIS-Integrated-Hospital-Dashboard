import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { typeOrmConfig } from './database/typeorm.config';
import { AmbulancesModule } from './ambulances/ambulances.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { ProximityModule } from './proximity/proximity.module';
import { KafkaModule } from './kafka/kafka.module';
import { TrackingModule } from './tracking/tracking.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '1133'),
      ttl: 30,
    }),
    AmbulancesModule,
    HospitalsModule,
    ProximityModule,
    KafkaModule,
    TrackingModule,
    RequestsModule,
  ],
})
export class AppModule {}
