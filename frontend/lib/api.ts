import type { 
  NearestAmbulance, 
  NearestHospital,
  Point,
  Hospital,
  Ambulance,
  EmergencyRequest
} from '@/types'

export type { NearestAmbulance, NearestHospital, Point, Hospital, Ambulance }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'


export interface ProximityResult {
  hospitalId: number
  hospitalName: string
  ambulances: NearestAmbulance[]
  calculatedAt: number
  fromCache: boolean
}

// API functions
export async function fetchHospitals(): Promise<{ data: Hospital[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/hospitals`)
  if (!response.ok) {
    throw new Error('Failed to fetch hospitals')
  }
  return response.json()
}

export async function fetchHospital(id: number): Promise<Hospital> {
  const response = await fetch(`${API_BASE_URL}/hospitals/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch hospital ${id}`)
  }
  return response.json()
}

export async function fetchAmbulances(status?: string): Promise<{ data: Ambulance[]; total: number }> {
  const url = new URL(`${API_BASE_URL}/ambulances`)
  if (status && typeof status === 'string') {
    url.searchParams.append('status', status)
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch ambulances')
  }
  return response.json()
}

export async function fetchAmbulance(id: number): Promise<Ambulance> {
  const response = await fetch(`${API_BASE_URL}/ambulances/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ambulance ${id}`)
  }
  return response.json()
}

export async function fetchNearestAmbulances(
  hospitalId: number,
  limit: number = 3
): Promise<ProximityResult> {
  const response = await fetch(
    `${API_BASE_URL}/proximity/hospital/${hospitalId}/nearest?limit=${limit}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch nearest ambulances for hospital ${hospitalId}`)
  }
  return response.json()
}

export async function updateAmbulanceLocation(
  id: number,
  longitude: number,
  latitude: number
): Promise<Ambulance> {
  const response = await fetch(`${API_BASE_URL}/ambulances/${id}/location`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ longitude, latitude }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update ambulance ${id} location`)
  }
  return response.json()
}

export async function dispatchAmbulance(
  id: number,
  hospitalId: number
): Promise<Ambulance> {
  const response = await fetch(`${API_BASE_URL}/ambulances/${id}/dispatch`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hospitalId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to dispatch ambulance ${id}`)
  }
  return response.json()
}

export async function completeAssignment(id: number): Promise<Ambulance> {
  const response = await fetch(`${API_BASE_URL}/ambulances/${id}/complete`, {
    method: 'PATCH',
  })
  if (!response.ok) {
    throw new Error(`Failed to complete assignment for ambulance ${id}`)
  }
  return response.json()
}

export async function updateAmbulanceStatus(
  id: number,
  status: string
): Promise<Ambulance> {
  const response = await fetch(`${API_BASE_URL}/ambulances/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update ambulance ${id} status`)
  }
  return response.json()
}

// Emergency Request APIs
export async function createRequest(data: {
  longitude: number
  latitude: number
  hospitalId?: number
  ambulanceId?: number
}): Promise<{ success: boolean; data: EmergencyRequest }> {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create request')
  }
  return response.json()
}

export async function fetchRequests(
  status?: string,
  page?: number,
  limit?: number
): Promise<{ success: boolean; data: EmergencyRequest[]; total: number; page: number; limit: number }> {
  const url = new URL(`${API_BASE_URL}/requests`)
  if (status) {
    url.searchParams.append('status', status)
  }
  if (page !== undefined) {
    url.searchParams.append('page', page.toString())
  }
  if (limit !== undefined) {
    url.searchParams.append('limit', limit.toString())
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch requests')
  }
  return response.json()
}

export async function fetchRequest(id: number): Promise<{ success: boolean; data: EmergencyRequest }> {
  const response = await fetch(`${API_BASE_URL}/requests/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch request ${id}`)
  }
  return response.json()
}

export async function getPendingCount(): Promise<{ success: boolean; count: number }> {
  const response = await fetch(`${API_BASE_URL}/requests/pending-count`)
  if (!response.ok) {
    throw new Error('Failed to fetch pending count')
  }
  return response.json()
}

export async function acceptRequest(
  id: number,
  ambulanceId?: number
): Promise<{ success: boolean; data: EmergencyRequest }> {
  const body: { ambulanceId?: number } = {};
  if (ambulanceId) {
    body.ambulanceId = ambulanceId;
  }
  
  const response = await fetch(`${API_BASE_URL}/requests/${id}/accept`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error('Failed to accept request')
  }
  return response.json()
}

export async function declineRequest(
  id: number,
  reason?: string
): Promise<{ success: boolean; data: EmergencyRequest }> {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/decline`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!response.ok) {
    throw new Error('Failed to decline request')
  }
  return response.json()
}

export async function cancelEmergencyRequest(id: number): Promise<{ success: boolean; data: EmergencyRequest }> {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  })
  if (!response.ok) {
    throw new Error(`Failed to cancel emergency request ${id}`)
  }
  return response.json()
}

export async function updateRequestStatus(
  id: number,
  status: string
): Promise<{ success: boolean; data: EmergencyRequest }> {
  const response = await fetch(`${API_BASE_URL}/requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error('Failed to update request status')
  }
  return response.json()
}

export async function cancelRequest(id: number): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to cancel request')
  }
  return response.json()
}

// Proximity APIs for user location
export async function findNearestHospitals(
  longitude: number,
  latitude: number,
  limit?: number
): Promise<{ success: boolean; data: NearestHospital[]; userLocation: Point; count: number; limit: number }> {
  const response = await fetch(`${API_BASE_URL}/proximity/nearest-hospitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ longitude, latitude, limit }),
  })
  if (!response.ok) {
    throw new Error('Failed to find nearest hospitals')
  }
  return response.json()
}

export async function findNearestAmbulancesToUser(
  longitude: number,
  latitude: number,
  limit?: number
): Promise<{ success: boolean; data: NearestAmbulance[]; userLocation: Point; count: number; limit: number }> {
  const response = await fetch(`${API_BASE_URL}/proximity/nearest-ambulances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ longitude, latitude, limit }),
  })
  if (!response.ok) {
    throw new Error('Failed to find nearest ambulances')
  }
  return response.json()
}

export async function getConfig(): Promise<{
  success: boolean
  data: {
    maxHospitals: number
    maxAmbulances: number
    features: Record<string, boolean>
  }
}> {
  const response = await fetch(`${API_BASE_URL}/config`)
  if (!response.ok) {
    throw new Error('Failed to fetch config')
  }
  return response.json()
}
