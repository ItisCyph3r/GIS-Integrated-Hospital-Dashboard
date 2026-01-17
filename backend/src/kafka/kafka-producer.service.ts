import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { randomUUID } from 'crypto';
import { Ambulance } from '../ambulances/entities/ambulance.entity';
import { AmbulanceStatus, Point } from '../common/types/geometry.types';
import { createKafkaConfig } from './kafka-config.factory';

export interface AmbulanceLocationEvent {
  eventId: string;
  eventType: 'ambulance.location.updated';
  timestamp: number;
  aggregateId: string;
  payload: {
    ambulanceId: number;
    callSign: string;
    location: Point;
    speed: number | null;
    heading: number | null;
    previousLocation?: Point;
    distanceMoved?: number;
  };
  metadata: {
    correlationId: string;
    source: 'simulation' | 'gps' | 'manual';
    version: number;
  };
}

export interface AmbulanceStatusEvent {
  eventId: string;
  eventType: 'ambulance.status.changed';
  timestamp: number;
  aggregateId: string;
  payload: {
    ambulanceId: number;
    callSign: string;
    previousStatus: AmbulanceStatus;
    newStatus: AmbulanceStatus;
    assignedHospitalId?: number;
    reason?: string;
  };
  metadata: {
    correlationId: string;
    causationId?: string;
    userId?: string;
  };
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka(
      createKafkaConfig(
        process.env.KAFKA_CLIENT_ID || 'hospital-dashboard-producer',
        {
          retry: {
            retries: 5,
            initialRetryTime: 300,
          },
          logLevel: (process.env.NODE_ENV === 'production' ? 1 : 3) as number,
        },
      ),
    );
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('--------------------------------');
      console.log('Kafka Producer connected');
      console.log('--------------------------------');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Kafka Producer connection failed:', errorMessage);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      console.log('🔌 Kafka Producer disconnected');
    }
  }

  async publishLocationUpdate(
    ambulance: Ambulance,
    previousLocation?: Point,
    distanceMoved?: number,
  ): Promise<void> {
    if (!this.isConnected) return;

    const event: AmbulanceLocationEvent = {
      eventId: randomUUID(),
      eventType: 'ambulance.location.updated',
      timestamp: Date.now(),
      aggregateId: `ambulance:${ambulance.id}`,
      payload: {
        ambulanceId: ambulance.id,
        callSign: ambulance.callSign,
        location: ambulance.location,
        speed: null,
        heading: null,
        previousLocation,
        distanceMoved,
      },
      metadata: {
        correlationId: randomUUID(),
        source: 'manual',
        version: 1,
      },
    };

    try {
      await this.producer.send({
        topic: 'ambulance.locations.v1',
        messages: [
          {
            key: String(ambulance.id),
            value: JSON.stringify(event),
            partition: ambulance.id % 5,
          },
        ],
      });
      // console.log(`📤 Published location update for ${ambulance.callSign}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to publish location event:', errorMessage);
    }
  }

  async publishStatusChange(
    ambulance: Ambulance,
    previousStatus: AmbulanceStatus,
    newStatus: AmbulanceStatus,
    userId?: string,
  ): Promise<void> {
    if (!this.isConnected) return;

    const event: AmbulanceStatusEvent = {
      eventId: randomUUID(),
      eventType: 'ambulance.status.changed',
      timestamp: Date.now(),
      aggregateId: `ambulance:${ambulance.id}`,
      payload: {
        ambulanceId: ambulance.id,
        callSign: ambulance.callSign,
        previousStatus,
        newStatus,
        assignedHospitalId: ambulance.assignedHospitalId,
      },
      metadata: {
        correlationId: randomUUID(),
        userId,
      },
    };

    try {
      await this.producer.send({
        topic: 'ambulance.status.changed.v1',
        messages: [
          {
            key: String(ambulance.id),
            value: JSON.stringify(event),
          },
        ],
      });
      console.log(
        `📤 Published status change for ${ambulance.callSign}: ${previousStatus} → ${newStatus}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to publish status event:', errorMessage);
    }
  }
}
