import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AmbulancesService } from './ambulances.service';
import { Ambulance } from './entities/ambulance.entity';
import { AmbulanceStatus } from '../common/types/geometry.types';

@Controller('ambulances')
export class AmbulancesController {
  constructor(private readonly ambulancesService: AmbulancesService) {}

  @Get()
  async findAll(
    @Query('status') status?: AmbulanceStatus,
  ): Promise<{ data: Ambulance[]; total: number }> {
    const data = await this.ambulancesService.findAll(status);
    return {
      data,
      total: data.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Ambulance> {
    return this.ambulancesService.findOne(id);
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      longitude: number;
      latitude: number;
      speed?: number;
      heading?: number;
    },
  ): Promise<{ success: boolean; ambulance: Ambulance }> {
    const ambulance = await this.ambulancesService.updateLocation(
      id,
      body.longitude,
      body.latitude,
      body.speed,
      body.heading,
    );

    return {
      success: true,
      ambulance,
    };
  }

  @Patch(':id/dispatch')
  async dispatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { hospitalId: number },
  ): Promise<{ success: boolean; ambulance: Ambulance }> {
    const ambulance = await this.ambulancesService.dispatch(
      id,
      body.hospitalId,
    );

    return {
      success: true,
      ambulance,
    };
  }

  @Patch(':id/complete')
  async complete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; ambulance: Ambulance }> {
    const ambulance = await this.ambulancesService.completeAssignment(id);

    return {
      success: true,
      ambulance,
    };
  }

  @Patch(':id/simulate-movement')
  async simulateMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      targetLongitude: number;
      targetLatitude: number;
      speedKmh?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    const speed = body.speedKmh;
    console.log(
      `🚀 Simulate request received - speedKmh: ${body.speedKmh}, using: ${speed} km/h`,
    );

    await this.ambulancesService.simulateMovement(
      id,
      body.targetLongitude,
      body.targetLatitude,
      speed,
    );

    return {
      success: true,
      message: `Ambulance movement simulation started at ${speed} km/h`,
    };
  }

  @Patch(':id/teleport')
  async teleport(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      targetLongitude: number;
      targetLatitude: number;
    },
  ): Promise<{ success: boolean; ambulance: Ambulance }> {
    const ambulance = await this.ambulancesService.teleportToLocation(
      id,
      body.targetLongitude,
      body.targetLatitude,
    );

    return {
      success: true,
      ambulance,
    };
  }

  @Get(':id/simulation-progress')
  getSimulationProgress(@Param('id', ParseIntPipe) id: number): {
    success: boolean;
    progress: any;
  } {
    const progress = this.ambulancesService.getSimulationProgress(id);

    return {
      success: true,
      progress: progress || null,
    };
  }
}
