import { io, Socket } from 'socket.io-client'

export interface AmbulanceLocationUpdate {
  ambulanceId: number
  callSign: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  timestamp: Date
}

export interface AmbulanceStatusUpdate {
  ambulanceId: number
  callSign: string
  previousStatus: string
  newStatus: string
  timestamp: Date
}

let socket: Socket | null = null

export function connectWebSocket(onLocationUpdate: (data: AmbulanceLocationUpdate) => void, onStatusUpdate: (data: AmbulanceStatusUpdate) => void) {
  if (socket?.connected) return socket

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  
  socket = io(`${wsUrl}/tracking`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('✅ WebSocket connected')
  })

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected')
  })

  socket.on('ambulance:location', (data: AmbulanceLocationUpdate) => {
    onLocationUpdate(data)
  })

  socket.on('ambulance:status', (data: AmbulanceStatusUpdate) => {
    onStatusUpdate(data)
  })

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error)
  })

  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
