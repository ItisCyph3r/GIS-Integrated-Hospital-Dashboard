import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { Ambulance } from '../../ambulances/entities/ambulance.entity';
import type { Point } from '../../common/types/geometry.types';
import { RequestStatus } from '../../common/types/request-status.enum';

@Entity('emergency_requests')
export class EmergencyRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
  })
  userLocation: Point;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ nullable: true })
  hospitalId: number;

  @ManyToOne(() => Hospital, { nullable: true })
  @JoinColumn({ name: 'hospitalId' })
  hospital: Hospital;

  @Column({ nullable: true })
  ambulanceId: number;

  @ManyToOne(() => Ambulance, { nullable: true })
  @JoinColumn({ name: 'ambulanceId' })
  ambulance: Ambulance;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  requestedAmbulanceId: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  declineReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  declinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
