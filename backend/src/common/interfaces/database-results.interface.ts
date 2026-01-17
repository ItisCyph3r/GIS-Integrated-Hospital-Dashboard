export interface DistanceQueryResult {
  distance: string;
}

export interface ProximityQueryResult {
  id: number;
  callSign: string;
  equipmentLevel: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distanceMeters: string;
}

export interface RadiusQueryResult {
  id: number;
  callSign: string;
  distanceMeters: string;
}

export interface HospitalIdResult {
  id: number;
  name: string;
}

export interface HospitalLocationQueryResult {
  id: number;
  name: string;
  capacity: number;
  services: string[];
  status: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance: string;
}

export interface AmbulanceLocationQueryResult {
  id: number;
  callSign: string;
  status: string;
  vehicleType: string;
  equipmentLevel: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance: string;
}
