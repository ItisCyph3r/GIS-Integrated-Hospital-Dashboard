export interface Point {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum EquipmentLevel {
  BLS = 'Basic Life Support',
  ALS = 'Advanced Life Support',
  CCT = 'Critical Care Transport',
}

export enum HospitalStatus {
  OPERATIONAL = 'operational',
  LIMITED = 'limited',
  CLOSED = 'closed',
}
