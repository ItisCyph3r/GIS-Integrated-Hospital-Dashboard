import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { KafkaProducerService } from './kafka-producer.service';
import { WebSocketConsumerService } from './consumers/websocket-consumer.service';
import { CacheInvalidatorService } from './consumers/cache-invalidator.service';
import { KafkaTopicsService } from './kafka-topics.service';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital]), TrackingModule],
  providers: [
    KafkaTopicsService,
    KafkaProducerService,
    WebSocketConsumerService,
    CacheInvalidatorService,
  ],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
