import { Hospital } from '../../hospitals/entities/hospital.entity';

export interface ProximityResult {
  hospitalId: number;
  hospitalName: string;
  ambulances: Array<{
    id: number;
    callSign: string;
    equipmentLevel: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    distanceMeters: number;
    distanceKm: number;
    estimatedMinutes: number;
  }>;
  calculatedAt: number;
  fromCache: boolean;
}

export interface HospitalWithDistance extends Hospital {
  distance: number;
  estimatedMinutes: number;
}

export interface AmbulanceWithDistance {
  id: number;
  callSign: string;
  status: string;
  vehicleType: string;
  equipmentLevel: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance: number;
  distanceKm: number;
  estimatedMinutes: number;
}
