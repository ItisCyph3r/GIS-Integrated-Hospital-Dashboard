import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { DeclineRequestDto } from './dto/decline-request.dto';
import { RequestStatus } from '../common/types/request-status.enum';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() createRequestDto: CreateRequestDto) {
    const request = await this.requestsService.create(createRequestDto);
    return {
      success: true,
      data: request,
      message: 'Emergency request created successfully',
    };
  }

  @Get()
  async findAll(
    @Query('status') status?: RequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    const result = await this.requestsService.findAll(
      status,
      pageNum,
      limitNum,
    );
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('pending-count')
  async getPendingCount() {
    const count = await this.requestsService.getPendingCount();
    return {
      success: true,
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const request = await this.requestsService.findOne(id);
    return {
      success: true,
      data: request,
    };
  }

  @Patch(':id/accept')
  async accept(
    @Param('id', ParseIntPipe) id: number,
    @Body() acceptRequestDto: AcceptRequestDto,
  ) {
    const request = await this.requestsService.accept(id, acceptRequestDto);
    return {
      success: true,
      data: request,
      message: 'Request accepted successfully',
    };
  }

  @Patch(':id/decline')
  async decline(
    @Param('id', ParseIntPipe) id: number,
    @Body() declineRequestDto: DeclineRequestDto,
  ) {
    const request = await this.requestsService.decline(id, declineRequestDto);
    return {
      success: true,
      data: request,
      message: 'Request declined',
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateRequestStatusDto,
  ) {
    const request = await this.requestsService.updateStatus(
      id,
      updateStatusDto,
    );
    return {
      success: true,
      data: request,
      message: 'Request status updated',
    };
  }

  @Delete(':id')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    await this.requestsService.cancel(id);
    return {
      success: true,
      message: 'Request cancelled',
    };
  }
}
