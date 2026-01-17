import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HospitalStatus } from '../../common/types/geometry.types';
import type { Point } from '../../common/types/geometry.types';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
  })
  location: Point;

  @Column({ type: 'int', default: 100 })
  capacity: number;

  @Column({ type: 'jsonb', default: '[]' })
  services: string[];

  @Column({
    type: 'enum',
    enum: HospitalStatus,
    default: HospitalStatus.OPERATIONAL,
  })
  status: HospitalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
