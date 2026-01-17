import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyRequest } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { DeclineRequestDto } from './dto/decline-request.dto';
import { RequestStatus } from '../common/types/request-status.enum';
import { AmbulancesService } from '../ambulances/ambulances.service';
import { AmbulanceStatus, Point } from '../common/types/geometry.types';
import { RequestsGateway } from './requests.gateway';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(EmergencyRequest)
    private requestRepository: Repository<EmergencyRequest>,
    private ambulancesService: AmbulancesService,
    @Inject(forwardRef(() => RequestsGateway))
    private requestsGateway: RequestsGateway,
  ) {}

  async create(createRequestDto: CreateRequestDto): Promise<EmergencyRequest> {
    const userLocation: Point = {
      type: 'Point',
      coordinates: [createRequestDto.longitude, createRequestDto.latitude],
    };

    const ambulance = await this.ambulancesService.findOne(
      createRequestDto.ambulanceId,
    );

    if (ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new BadRequestException(
        `Ambulance ${ambulance.callSign} is not available`,
      );
    }

    const request = this.requestRepository.create({
      userLocation,
      hospitalId: createRequestDto.hospitalId,
      status: RequestStatus.PENDING,
      requestedAmbulanceId: createRequestDto.ambulanceId,
      ambulanceId: createRequestDto.ambulanceId,
    });

    const savedRequest = await this.requestRepository.save(request);

    this.requestsGateway.broadcastRequestCreated(savedRequest);

    return savedRequest;
  }

  async findAll(
    status?: RequestStatus,
    page?: number,
    limit?: number,
  ): Promise<{
    data: EmergencyRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.hospital', 'hospital')
      .leftJoinAndSelect('request.ambulance', 'ambulance')
      .orderBy('request.createdAt', 'DESC');

    if (status) {
      query.where('request.status = :status', { status });
    }

    const total = await query.getCount();

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);
    }

    const data = await query.getMany();

    return {
      data,
      total,
      page: page || 1,
      limit: limit || total,
    };
  }

  async findOne(id: number): Promise<EmergencyRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['hospital', 'ambulance'],
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return request;
  }

  async accept(
    id: number,
    acceptRequestDto: AcceptRequestDto,
  ): Promise<EmergencyRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept request with status ${request.status}`,
      );
    }

    const ambulanceId = request.ambulanceId;

    if (!ambulanceId) {
      throw new BadRequestException('No ambulance specified for this request');
    }

    const ambulance = await this.ambulancesService.findOne(ambulanceId);

    if (ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new BadRequestException(
        `Ambulance ${ambulance.callSign} is not available`,
      );
    }

    request.hospitalId = acceptRequestDto.hospitalId || request.hospitalId;
    request.status = RequestStatus.ACCEPTED;
    request.acceptedAt = new Date();

    if (request.hospitalId) {
      await this.ambulancesService.dispatch(ambulanceId, request.hospitalId);
    }

    const updatedRequest = await this.requestRepository.save(request);

    this.requestsGateway.notifyRequestAccepted(updatedRequest);

    return updatedRequest;
  }

  async decline(
    id: number,
    declineRequestDto: DeclineRequestDto,
  ): Promise<EmergencyRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decline request with status ${request.status}`,
      );
    }

    request.status = RequestStatus.DECLINED;
    request.declineReason = declineRequestDto.reason || null;
    request.declinedAt = new Date();

    return await this.requestRepository.save(request);
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateRequestStatusDto,
  ): Promise<EmergencyRequest> {
    const request = await this.findOne(id);

    request.status = updateStatusDto.status;

    if (updateStatusDto.status === RequestStatus.COMPLETED) {
      request.completedAt = new Date();
      if (request.ambulanceId) {
        await this.ambulancesService.completeAssignment(request.ambulanceId);
      }
      const savedRequest = await this.requestRepository.save(request);
      this.requestsGateway.broadcastRequestCompleted(savedRequest);
      return savedRequest;
    }

    if (updateStatusDto.status === RequestStatus.CANCELLED) {
      if (request.ambulanceId) {
        await this.ambulancesService.completeAssignment(request.ambulanceId);
      }
      const savedRequest = await this.requestRepository.save(request);
      this.requestsGateway.broadcastRequestCancelled(id);
      return savedRequest;
    }

    const savedRequest = await this.requestRepository.save(request);

    this.requestsGateway.broadcastStatusChange(savedRequest);

    return savedRequest;
  }

  async cancel(id: number): Promise<void> {
    const request = await this.findOne(id);

    if (
      request.status === RequestStatus.COMPLETED ||
      request.status === RequestStatus.DECLINED
    ) {
      throw new BadRequestException(
        `Cannot cancel request with status ${request.status}`,
      );
    }

    request.status = RequestStatus.CANCELLED;

    if (request.ambulanceId) {
      this.ambulancesService.stopSimulation(request.ambulanceId);
      await this.ambulancesService.completeAssignment(request.ambulanceId);
    }

    await this.requestRepository.save(request);

    this.requestsGateway.broadcastRequestCancelled(id);
  }

  async getPendingCount(): Promise<number> {
    return await this.requestRepository.count({
      where: { status: RequestStatus.PENDING },
    });
  }
}
