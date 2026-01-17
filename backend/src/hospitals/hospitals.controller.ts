import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { Hospital } from './entities/hospital.entity';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  async findAll(): Promise<{ data: Hospital[]; total: number }> {
    const data = await this.hospitalsService.findAll();
    return {
      data,
      total: data.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Hospital> {
    return this.hospitalsService.findOne(id);
  }
}
