import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambulance } from './entities/ambulance.entity';
import { AmbulanceMovement } from './entities/ambulance-movement.entity';
import { AmbulanceStatus, Point } from '../common/types/geometry.types';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { DistanceQueryResult } from '../common/interfaces/database-results.interface';

interface SimulationProgress {
  progress: number;
  currentStep: number;
  totalSteps: number;
  eta: number;
  speedKmh: number;
  distanceMeters: number;
  targetLocation: Point;
}

@Injectable()
export class AmbulancesService {
  private readonly logger = new Logger(AmbulancesService.name);
  private activeSimulations: Map<number, NodeJS.Timeout> = new Map();
  private simulationProgress: Map<number, SimulationProgress> = new Map();

  constructor(
    @InjectRepository(Ambulance)
    private ambulanceRepository: Repository<Ambulance>,
    @InjectRepository(AmbulanceMovement)
    private movementRepository: Repository<AmbulanceMovement>,
    private kafkaProducerService: KafkaProducerService,
  ) {}

  async findAll(status?: AmbulanceStatus): Promise<Ambulance[]> {
    const query = this.ambulanceRepository.createQueryBuilder('a');

    if (status) {
      query.where('a.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Ambulance> {
    const ambulance = await this.ambulanceRepository.findOne({
      where: { id },
      relations: ['assignedHospital'],
    });

    if (!ambulance) {
      throw new NotFoundException(`Ambulance with ID ${id} not found`);
    }

    return ambulance;
  }

  async updateLocation(
    id: number,
    longitude: number,
    latitude: number,
    speed?: number,
    heading?: number,
  ): Promise<Ambulance> {
    const ambulance = await this.findOne(id);

    const previousLocation = ambulance.location;

    const newLocation: Point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const distanceMoved = previousLocation
      ? await this.calculateDistance(previousLocation, newLocation)
      : 0;

    await this.ambulanceRepository
      .createQueryBuilder()
      .update(Ambulance)
      .set({
        location: () =>
          `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
        lastUpdated: new Date(),
      })
      .where('id = :id', { id })
      .execute();

    await this.movementRepository.save({
      ambulanceId: id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      speed,
      heading,
    });

    const updated = await this.findOne(id);

    await this.kafkaProducerService.publishLocationUpdate(
      updated,
      previousLocation,
      distanceMoved,
    );

    return updated;
  }

  async dispatch(id: number, hospitalId: number): Promise<Ambulance> {
    const ambulance = await this.findOne(id);

    if (ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new ConflictException(
        `Ambulance ${ambulance.callSign} is not available (current status: ${ambulance.status})`,
      );
    }

    const previousStatus: AmbulanceStatus = ambulance.status;

    await this.ambulanceRepository.update(id, {
      status: AmbulanceStatus.BUSY,
      assignedHospitalId: hospitalId,
    });

    const updated = await this.findOne(id);

    await this.kafkaProducerService.publishStatusChange(
      updated,
      previousStatus,
      AmbulanceStatus.BUSY,
    );

    return updated;
  }

  async updateStatus(id: number, status: AmbulanceStatus): Promise<Ambulance> {
    const ambulance = await this.findOne(id);
    const previousStatus: AmbulanceStatus = ambulance.status;

    await this.ambulanceRepository.update(id, { status });

    if (status === AmbulanceStatus.AVAILABLE) {
      await this.ambulanceRepository.update(id, {
        assignedHospitalId: null as unknown as number,
      });
    }

    const updated = await this.findOne(id);

    await this.kafkaProducerService.publishStatusChange(
      updated,
      previousStatus,
      status,
    );

    return updated;
  }

  async completeAssignment(id: number): Promise<Ambulance> {
    return this.updateStatus(id, AmbulanceStatus.AVAILABLE);
  }

  private async calculateDistance(
    point1: Point,
    point2: Point,
  ): Promise<number> {
    const result = await this.ambulanceRepository.query<DistanceQueryResult[]>(
      `
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
      ) as distance
    `,
      [
        point1.coordinates[0],
        point1.coordinates[1],
        point2.coordinates[0],
        point2.coordinates[1],
      ],
    );

    return parseFloat(result[0].distance);
  }

  // Simulate ambulance movement towards a target location
  async simulateMovement(
    id: number,
    targetLongitude: number,
    targetLatitude: number,
    speedKmh: number = 50000, // todo: Very fast simulation speed for testing
  ): Promise<void> {
    const ambulance = await this.findOne(id);

    const currentLocation = ambulance.location;
    const targetLocation: Point = {
      type: 'Point',
      coordinates: [targetLongitude, targetLatitude],
    };

    // Calculate distance
    const distanceMeters = await this.calculateDistance(
      currentLocation,
      targetLocation,
    );

    const updateIntervalMs = 500;
    const speedMetersPerSecond = (speedKmh * 1000) / 3600;
    const distancePerUpdate = speedMetersPerSecond * (updateIntervalMs / 1000);
    const totalSteps = Math.ceil(distanceMeters / distancePerUpdate);

    // Calculate incremental changes
    const deltaLng =
      (targetLocation.coordinates[0] - currentLocation.coordinates[0]) /
      totalSteps;
    const deltaLat =
      (targetLocation.coordinates[1] - currentLocation.coordinates[1]) /
      totalSteps;

    let currentStep = 0;
    const startLng = currentLocation.coordinates[0];
    const startLat = currentLocation.coordinates[1];

    this.stopSimulation(id);

    const estimatedTimeSeconds = distanceMeters / speedMetersPerSecond;
    this.logger.log(
      `🚑 Starting simulation for ambulance ${id}: ${totalSteps} steps, ${distanceMeters.toFixed(0)}m distance, ETA: ${estimatedTimeSeconds.toFixed(0)}s`,
    );

    // Initialize progress tracking
    this.simulationProgress.set(id, {
      progress: 0,
      currentStep: 0,
      totalSteps,
      eta: estimatedTimeSeconds,
      speedKmh,
      distanceMeters,
      targetLocation,
    });

    const intervalId = setInterval(() => {
      currentStep++;

      if (currentStep >= totalSteps) {
        void this.updateLocation(
          id,
          targetLocation.coordinates[0],
          targetLocation.coordinates[1],
          0,
        ).then(() => {
          this.stopSimulation(id);
          console.log('--------------------------------');
          this.logger.log(
            `Ambulance ${id} reached destination at [${targetLocation.coordinates[0].toFixed(6)}, ${targetLocation.coordinates[1].toFixed(6)}]`,
          );
          console.log('--------------------------------');
          this.logger.log(
            `🎯 Ambulance ${id} arrived! Admin should update request status to AT_USER_LOCATION or AT_HOSPITAL`,
          );
          console.log('--------------------------------');
        });
        return;
      }

      // Calculate new position based on progress ratio
      const progress = (currentStep / totalSteps) * 100;
      const remainingSteps = totalSteps - currentStep;
      const remainingEta = (remainingSteps * updateIntervalMs) / 1000;

      const newLng = startLng + deltaLng * currentStep;
      const newLat = startLat + deltaLat * currentStep;

      void this.updateLocation(id, newLng, newLat, speedKmh);

      this.simulationProgress.set(id, {
        progress,
        currentStep,
        totalSteps,
        eta: remainingEta,
        speedKmh,
        distanceMeters,
        targetLocation,
      });

      if (currentStep % 20 === 0) {
        this.logger.log(
          `📍 Ambulance ${id} progress: ${progress.toFixed(0)}% (${currentStep}/${totalSteps}), ETA: ${remainingEta.toFixed(0)}s`,
        );
      }
    }, updateIntervalMs);

    this.activeSimulations.set(id, intervalId);
  }

  stopSimulation(id: number): void {
    const intervalId = this.activeSimulations.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSimulations.delete(id);
      this.simulationProgress.delete(id);
      this.logger.log(`🛑 Stopped simulation for ambulance ${id}`);
    }
  }

  // Teleport ambulance instantly to target location
  async teleportToLocation(
    id: number,
    targetLongitude: number,
    targetLatitude: number,
  ): Promise<Ambulance> {
    this.stopSimulation(id);

    const ambulance = await this.updateLocation(
      id,
      targetLongitude,
      targetLatitude,
      0,
    );

    this.logger.log(
      `⚡ Teleported ambulance ${id} to [${targetLongitude.toFixed(6)}, ${targetLatitude.toFixed(6)}]`,
    );

    return ambulance;
  }

  // Get current simulation progress
  getSimulationProgress(id: number): SimulationProgress | null {
    return this.simulationProgress.get(id) || null;
  }
}
