import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { TrackingGateway } from '../../tracking/tracking.gateway';
import {
  KafkaLocationPayload,
  KafkaStatusPayload,
} from '../interfaces/kafka-events.interface';
import { createKafkaConfig } from '../kafka-config.factory';

interface KafkaEvent {
  payload: KafkaLocationPayload | KafkaStatusPayload;
}

@Injectable()
export class WebSocketConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor(private readonly trackingGateway: TrackingGateway) {
    this.kafka = new Kafka(
      createKafkaConfig(
        process.env.KAFKA_CLIENT_ID || 'hospital-dashboard-websocket',
        {
          logLevel: (process.env.NODE_ENV === 'production' ? 1 : 3) as number,
        },
      ),
    );
    this.consumer = this.kafka.consumer({
      groupId: 'websocket-consumers',
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log('--------------------------------');
      console.log('WebSocket Consumer connected');
      console.log('--------------------------------');

      await this.consumer.subscribe({
        topics: ['ambulance.locations.v1', 'ambulance.status.changed.v1'],
        fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true',
      });

      await this.consumer.run({
        eachMessage: ({ topic, message }: EachMessagePayload) => {
          try {
            if (!message.value) return Promise.resolve();

            const event = JSON.parse(message.value.toString()) as KafkaEvent;

            if (topic === 'ambulance.locations.v1') {
              this.trackingGateway.broadcastLocationUpdate(
                event.payload as KafkaLocationPayload,
              );
            } else if (topic === 'ambulance.status.changed.v1') {
              this.trackingGateway.broadcastStatusChange(
                event.payload as KafkaStatusPayload,
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Error processing Kafka message:', errorMessage);
          }
          return Promise.resolve();
        },
      });

      console.log('📡 WebSocket Consumer listening to topics');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ WebSocket Consumer failed to start:', errorMessage);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      console.log('🔌 WebSocket Consumer disconnected');
    }
  }
}
