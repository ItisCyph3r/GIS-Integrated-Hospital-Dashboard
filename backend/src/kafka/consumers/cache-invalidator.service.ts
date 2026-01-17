import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { HospitalIdResult } from '../../common/interfaces/database-results.interface';

@Injectable()
export class CacheInvalidatorService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private readonly INVALIDATION_THRESHOLD_METERS = parseInt(
    process.env.CACHE_INVALIDATION_THRESHOLD || '100',
  );

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
  ) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'hospital-dashboard-cache',
      brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
      logLevel: (process.env.NODE_ENV === 'production' ? 1 : 3) as number,
    });
    this.consumer = this.kafka.consumer({
      groupId: 'cache-invalidators',
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log('--------------------------------');
      console.log('Cache Invalidator Consumer connected');
      console.log('--------------------------------');

      await this.consumer.subscribe({
        topics: ['ambulance.locations.v1', 'ambulance.status.changed.v1'],
        fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true',
      });

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            if (!message.value) return;

            const event = JSON.parse(message.value.toString()) as {
              payload: {
                distanceMoved?: number;
                location: { coordinates: [number, number] };
                previousStatus: string;
                newStatus: string;
              };
            };

            if (topic === 'ambulance.locations.v1') {
              await this.handleLocationUpdate(event);
            } else if (topic === 'ambulance.status.changed.v1') {
              await this.handleStatusChange(event);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Error in cache invalidation:', errorMessage);
          }
        },
      });

      console.log('--------------------------------');
      console.log('Cache Invalidator Consumer listening');
      console.log('--------------------------------');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Cache Invalidator Consumer failed:', errorMessage);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      console.log('--------------------------------');
      console.log('Cache Invalidator Consumer disconnected');
      console.log('--------------------------------');
    }
  }

  private async handleLocationUpdate(event: {
    payload: {
      distanceMoved?: number;
      location: { coordinates: [number, number] };
    };
  }) {
    const { distanceMoved, location } = event.payload;

    if (!distanceMoved || distanceMoved < this.INVALIDATION_THRESHOLD_METERS) {
      // console.log(
      //   `⏭Skipping cache invalidation (moved ${distanceMoved?.toFixed(0) ?? 0}m < 100m threshold)`,
      // );
      return;
    }

    // console.log(
    //   `Invalidating caches (ambulance moved ${distanceMoved.toFixed(0)}m)`,
    // );

    const affectedHospitals = await this.findAffectedHospitals(location);
    await this.invalidateHospitalCaches(affectedHospitals.map((h) => h.id));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleStatusChange(_event: {
    payload: { previousStatus: string; newStatus: string };
  }) {
    // console.log(
    //   `Invalidating ALL proximity caches (ambulance status changed: ${_event.payload.previousStatus} → ${_event.payload.newStatus})`,
    // );
    // console.log(
    //   '   Reason: Status change affects which ambulances are considered "available" for proximity calculations',
    // );
    await this.invalidateAllProximityCaches();
  }

  private async findAffectedHospitals(ambulanceLocation: {
    coordinates: [number, number];
  }): Promise<HospitalIdResult[]> {
    const result = await this.hospitalRepository.query<HospitalIdResult[]>(
      `
      SELECT id, name
      FROM hospitals
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        10000
      )
    `,
      [ambulanceLocation.coordinates[0], ambulanceLocation.coordinates[1]],
    );

    return result;
  }

  private async invalidateHospitalCaches(hospitalIds: number[]) {
    await Promise.all(
      hospitalIds.map((id) =>
        this.cacheManager.del(`proximity:hospital:${id}:nearest-available`),
      ),
    );
    // console.log('--------------------------------');
    // console.log(`Invalidated caches for ${hospitalIds.length} hospitals`);
    // console.log('--------------------------------');
  }

  private async invalidateAllProximityCaches() {
    const hospitals = await this.hospitalRepository.find();
    await Promise.all(
      hospitals.map((h) =>
        this.cacheManager.del(`proximity:hospital:${h.id}:nearest-available`),
      ),
    );
    // console.log('--------------------------------');
    // console.log(`Invalidated all proximity caches (${hospitals.length} hospitals)`);
    // console.log('--------------------------------');
  }
}
