import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProximityService } from './proximity.service';
import { ProximityResult } from './types/proximity.types';
import type { Point } from '../common/types/geometry.types';

@Controller('proximity')
export class ProximityController {
  constructor(private readonly proximityService: ProximityService) {}

  @Get('hospital/:id/nearest')
  async findNearest(
    @Param('id', ParseIntPipe) hospitalId: number,
    @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ): Promise<ProximityResult> {
    return this.proximityService.findNearestAmbulances(
      hospitalId,
      Math.min(limit, 10),
    );
  }

  @Get('hospital/:id/within-radius')
  async findWithinRadius(
    @Param('id', ParseIntPipe) hospitalId: number,
    @Query('radius', new DefaultValuePipe(5000), ParseIntPipe) radius: number,
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
    return this.proximityService.findWithinRadius(hospitalId, radius);
  }

  @Post('nearest-hospitals')
  async findNearestHospitalsToLocation(
    @Body('longitude') longitude: number,
    @Body('latitude') latitude: number,
    @Body('limit') limit?: number,
  ) {
    const userLocation: Point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const defaultLimit = parseInt(process.env.MAX_HOSPITALS_DISPLAY || '3');
    const maxAllowed = 10; // Hard cap to prevent abuse
    const requestedLimit = limit || defaultLimit;
    const finalLimit = Math.min(requestedLimit, maxAllowed);

    const hospitals =
      await this.proximityService.findNearestHospitalsToLocation(
        userLocation,
        finalLimit,
      );

    return {
      success: true,
      data: hospitals,
      userLocation,
      count: hospitals.length,
      limit: finalLimit,
    };
  }

  @Post('nearest-ambulances')
  async findNearestAmbulancesToLocation(
    @Body('longitude') longitude: number,
    @Body('latitude') latitude: number,
    @Body('limit') limit?: number,
  ) {
    const userLocation: Point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const defaultLimit = parseInt(process.env.MAX_AMBULANCES_DISPLAY || '3');
    const maxAllowed = 10;
    const requestedLimit = limit || defaultLimit;
    const finalLimit = Math.min(requestedLimit, maxAllowed);

    const ambulances =
      await this.proximityService.findNearestAmbulancesToLocation(
        userLocation,
        finalLimit,
      );

    return {
      success: true,
      data: ambulances,
      userLocation,
      count: ambulances.length,
      limit: finalLimit,
    };
  }
}
