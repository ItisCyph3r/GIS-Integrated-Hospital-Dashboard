// Shared types for the application

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EN_ROUTE_TO_USER = 'en_route_to_user',
  AT_USER_LOCATION = 'at_user_location',
  TRANSPORTING = 'transporting',
  AT_HOSPITAL = 'at_hospital',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

export enum EquipmentLevel {
  BLS = 'Basic Life Support',
  ALS = 'Advanced Life Support',
  CCT = 'Critical Care Transport',
}

export interface Hospital {
  id: number;
  name: string;
  location: Point;
  capacity: number;
  services: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ambulance {
  id: number;
  callSign: string;
  location: Point;
  status: AmbulanceStatus;
  assignedHospitalId?: number;
  vehicleType: string;
  equipmentLevel: EquipmentLevel;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyRequest {
  id: number;
  userLocation: Point;
  status: RequestStatus;
  hospitalId?: number;
  hospital?: Hospital;
  ambulanceId?: number;
  ambulance?: Ambulance;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  requestedAmbulanceId?: number;
  declineReason?: string;
  declinedAt?: string;
  updatedAt: string;
}

export interface NearestHospital extends Hospital {
  distance: number;
  estimatedMinutes?: number;
}

export interface NearestAmbulance extends Partial<Omit<Ambulance, 'id' | 'callSign' | 'location' | 'status' | 'vehicleType' | 'equipmentLevel'>> {
  id: number;
  callSign: string;
  location: Point;
  status: AmbulanceStatus;
  vehicleType: string;
  equipmentLevel: EquipmentLevel;
  distance: number;
  distanceKm: number;
  estimatedMinutes: number;
}
