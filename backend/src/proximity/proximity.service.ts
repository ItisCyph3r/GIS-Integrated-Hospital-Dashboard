import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Ambulance } from '../ambulances/entities/ambulance.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { HospitalsService } from '../hospitals/hospitals.service';
import { AmbulanceStatus, Point } from '../common/types/geometry.types';
import {
  ProximityQueryResult,
  RadiusQueryResult,
  HospitalLocationQueryResult,
  AmbulanceLocationQueryResult,
} from '../common/interfaces/database-results.interface';
import {
  ProximityResult,
  HospitalWithDistance,
  AmbulanceWithDistance,
} from './types/proximity.types';

@Injectable()
export class ProximityService {
  constructor(
    @InjectRepository(Ambulance)
    private ambulanceRepository: Repository<Ambulance>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
    private hospitalsService: HospitalsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findNearestAmbulances(
    hospitalId: number,
    limit: number = 3,
  ): Promise<ProximityResult> {
    const cacheKey = `proximity:hospital:${hospitalId}:nearest-available`;

    const cached = await this.cacheManager.get<ProximityResult>(cacheKey);
    if (cached) {
      return {
        ...cached,
        fromCache: true,
      };
    }

    const hospital = await this.hospitalsService.findOne(hospitalId);

    const result = await this.ambulanceRepository.query<ProximityQueryResult[]>(
      `
      SELECT 
        a.id,
        a."callSign",
        a."equipmentLevel",
        ST_AsGeoJSON(a.location)::json as location,
        ST_Distance(a.location, h.location) as "distanceMeters"
      FROM ambulances a
      CROSS JOIN hospitals h
      WHERE h.id = $1
        AND a.status = $2
      ORDER BY a.location <-> h.location
      LIMIT $3
    `,
      [hospitalId, AmbulanceStatus.AVAILABLE, limit],
    );

    const proximityResult: ProximityResult = {
      hospitalId,
      hospitalName: hospital.name,
      ambulances: result.map((row) => ({
        id: row.id,
        callSign: row.callSign,
        equipmentLevel: row.equipmentLevel,
        location: row.location,
        distanceMeters: parseFloat(row.distanceMeters),
        distanceKm: parseFloat(row.distanceMeters) / 1000,
        estimatedMinutes: Math.round(
          (parseFloat(row.distanceMeters) / 1000 / 60) * 60,
        ),
      })),
      calculatedAt: Date.now(),
      fromCache: false,
    };

    await this.cacheManager.set(cacheKey, proximityResult, 30000);

    return proximityResult;
  }

  async findWithinRadius(
    hospitalId: number,
    radiusMeters: number = 5000,
  ): Promise<{
    hospitalId: number;
    radius: number;
    ambulances: Array<{
      id: number;
      callSign: string;
      distanceMeters: number;
    }>;
    total: number;
  }> {
    const result = await this.ambulanceRepository.query<RadiusQueryResult[]>(
      `
      SELECT 
        a.id,
        a."callSign",
        ST_Distance(a.location, h.location) as "distanceMeters"
      FROM ambulances a
      CROSS JOIN hospitals h
      WHERE h.id = $1
        AND a.status = $2
        AND ST_DWithin(a.location, h.location, $3)
      ORDER BY "distanceMeters"
    `,
      [hospitalId, AmbulanceStatus.AVAILABLE, radiusMeters],
    );

    return {
      hospitalId,
      radius: radiusMeters,
      ambulances: result.map((row) => ({
        id: row.id,
        callSign: row.callSign,
        distanceMeters: parseFloat(row.distanceMeters),
      })),
      total: result.length,
    };
  }

  async invalidateCache(hospitalId?: number): Promise<void> {
    if (hospitalId) {
      await this.cacheManager.del(
        `proximity:hospital:${hospitalId}:nearest-available`,
      );
    } else {
      const keys = this.getAllCacheKeys();
      const proximityKeys = keys.filter((key) => key.startsWith('proximity:'));
      await Promise.all(proximityKeys.map((key) => this.cacheManager.del(key)));
    }
  }

  private getAllCacheKeys(): string[] {
    return [];
  }

  // Find nearest hospitals to user location
  async findNearestHospitalsToLocation(
    userLocation: Point,
    limit: number = 3,
  ): Promise<HospitalWithDistance[]> {
    const result = await this.hospitalRepository.query<
      HospitalLocationQueryResult[]
    >(
      `
      SELECT 
        h.id,
        h.name,
        h.capacity,
        h.services,
        h.status,
        ST_AsGeoJSON(h.location)::json as location,
        ST_Distance(h.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM hospitals h
      WHERE h.status = 'operational'
      ORDER BY distance
      LIMIT $3
    `,
      [userLocation.coordinates[0], userLocation.coordinates[1], limit],
    );

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      services: row.services,
      status: row.status,
      location: row.location,
      distance: parseFloat(row.distance),
      estimatedMinutes: Math.round((parseFloat(row.distance) / 1000 / 60) * 60),
    })) as HospitalWithDistance[];
  }

  // Find nearest ambulances to user location
  async findNearestAmbulancesToLocation(
    userLocation: Point,
    limit: number = 3,
  ): Promise<AmbulanceWithDistance[]> {
    const result = await this.ambulanceRepository.query<
      AmbulanceLocationQueryResult[]
    >(
      `
      SELECT 
        a.id,
        a."callSign",
        a.status,
        a."vehicleType",
        a."equipmentLevel",
        ST_AsGeoJSON(a.location)::json as location,
        ST_Distance(a.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM ambulances a
      WHERE a.status = 'available'
      ORDER BY distance
      LIMIT $3
    `,
      [userLocation.coordinates[0], userLocation.coordinates[1], limit],
    );

    return result.map((row) => ({
      id: row.id,
      callSign: row.callSign,
      status: row.status,
      vehicleType: row.vehicleType,
      equipmentLevel: row.equipmentLevel,
      location: row.location,
      distance: parseFloat(row.distance),
      distanceKm: parseFloat(row.distance) / 1000,
      estimatedMinutes: Math.round((parseFloat(row.distance) / 1000 / 60) * 60),
    }));
  }
}
