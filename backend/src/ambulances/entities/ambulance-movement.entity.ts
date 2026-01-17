import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { Point } from '../../common/types/geometry.types';
import { Ambulance } from './ambulance.entity';

@Entity('ambulance_movements')
@Index(['ambulanceId'])
@Index(['createdAt'])
export class AmbulanceMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ambulanceId: number;

  @ManyToOne(() => Ambulance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ambulanceId' })
  ambulance: Ambulance;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: Point;

  @Column({ type: 'float', nullable: true })
  speed?: number;

  @Column({ type: 'float', nullable: true })
  heading?: number;

  @CreateDateColumn()
  createdAt: Date;
}
