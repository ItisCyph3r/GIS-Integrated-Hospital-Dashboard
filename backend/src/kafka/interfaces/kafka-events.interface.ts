import { AmbulanceStatus, Point } from '../../common/types/geometry.types';

export interface KafkaLocationPayload {
  ambulanceId: number;
  callSign: string;
  location: Point;
  speed: number | null;
  heading: number | null;
  previousLocation?: Point;
  distanceMoved?: number;
}

export interface KafkaStatusPayload {
  ambulanceId: number;
  callSign: string;
  previousStatus: AmbulanceStatus;
  newStatus: AmbulanceStatus;
  assignedHospitalId?: number;
  reason?: string;
}

export interface KafkaMessage {
  value: Buffer | null;
}

export interface PostgresRawResult {
  id: number;
  callSign: string;
  equipmentLevel: string;
  location: Point;
  distanceMeters: string;
}
