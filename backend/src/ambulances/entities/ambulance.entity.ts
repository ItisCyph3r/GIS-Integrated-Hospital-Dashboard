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
import {
  AmbulanceStatus,
  EquipmentLevel,
} from '../../common/types/geometry.types';
import type { Point } from '../../common/types/geometry.types';

@Entity('ambulances')
export class Ambulance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  callSign: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
  })
  location: Point;

  @Column({
    type: 'enum',
    enum: AmbulanceStatus,
    default: AmbulanceStatus.AVAILABLE,
  })
  status: AmbulanceStatus;

  @Column({ nullable: true })
  assignedHospitalId: number;

  @ManyToOne(() => Hospital, { nullable: true })
  @JoinColumn({ name: 'assignedHospitalId' })
  assignedHospital: Hospital;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Type II',
  })
  vehicleType: string;

  @Column({
    type: 'enum',
    enum: EquipmentLevel,
    default: EquipmentLevel.BLS,
  })
  equipmentLevel: EquipmentLevel;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
