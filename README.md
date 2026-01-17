# GIS-Integrated Hospital Dashboard

A full-stack application for visualizing hospital locations and ambulance proximity using spatial database queries, real-time updates, and intelligent caching.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Deliverables](#deliverables)

## Overview

This application demonstrates a GIS-integrated dashboard that:

- **Visualizes hospital locations** on an interactive map using MapLibre GL JS
- **Calculates nearest ambulances** using PostGIS spatial queries
- **Implements intelligent caching** with Redis to avoid redundant database queries
- **Provides real-time updates** via WebSockets and Kafka event streaming
- **Supports emergency request management** with a complete request lifecycle

### Requirements

**Spatial Database**: PostgreSQL with PostGIS containing 10+ hospitals and 5+ ambulances  
**Frontend Map**: React-based map using MapLibre GL JS  
**Proximity Logic**: PostGIS spatial queries (`ST_Distance`, `<->` operator) with GIST indexes  
**Caching Layer**: Redis-powered caching with intelligent invalidation (100m threshold)

### Extra Features

**Real-time Updates**: WebSocket integration for live ambulance tracking  
**Event Streaming**: Kafka for event-driven architecture  
**Emergency Request System**: Complete request lifecycle management  
**Admin Dashboard**: Request queue management with pagination  
**User Dashboard**: Emergency request creation and tracking  
**Smart Cache Invalidation**: Location-based invalidation
## Architecture

### Tech Stack

**Backend:**
- **NestJS** - Progressive Node.js framework
- **PostgreSQL + PostGIS** - Spatial database with geographic extensions
- **TypeORM** - Object-Relational Mapping
- **Redis** - In-memory caching layer
- **Kafka** - Event streaming platform
- **Socket.io** - WebSocket server for real-time updates

**Frontend:**
- **Next.js 16** - React framework with App Router
- **MapLibre GL JS** - Open-source map rendering library
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - WebSocket client for real-time updates

### System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│   Backend       │
│   (NestJS)      │
│   Port: 4000    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐  ┌───▼───┐  ┌───▼───┐
│PostGIS│ │Redis │  │ Kafka │  │Socket │
│  DB   │ │Cache │  │Events │  │  .io  │
└───────┘ └──────┘  └───────┘  └───────┘
```

### Data Flow

1. **User clicks hospital** → Frontend sends request to backend
2. **Backend checks cache** → Redis lookup for proximity results
3. **Cache miss** → PostGIS spatial query (`ST_Distance` with GIST index)
4. **Results cached** → Stored in Redis with 30s TTL
5. **Kafka event published** → Ambulance location/status changes
6. **Cache invalidation** → Smart invalidation based on 100m movement threshold
7. **WebSocket broadcast** → Real-time updates to connected clients

### Caching Strategy

- **Cache Key Pattern**: `proximity:hospital:{id}:nearest-available`
- **TTL**: 30 seconds
- **Invalidation Rules**:
  - **Location Update**: Invalidate only if ambulance moved >100m AND within 10km of hospital
  - **Status Change**: Invalidate all proximity caches (ambulance availability changed)
- **Cache Hit Rate**: Tracked and logged for monitoring

### Equipment Levels

Ambulances are classified by their equipment and staffing capabilities:

- **BLS - Basic Life Support**: Entry-level emergency medical care provided by EMTs. Capabilities include basic airway management, oxygen administration, CPR/AED, bleeding control, and basic vital sign monitoring. Use cases: Non-life-threatening emergencies, routine transfers, stable patients.

- **ALS - Advanced Life Support**: Advanced emergency care provided by Paramedics. Includes everything in BLS plus IV/IO access, advanced airway management (intubation), cardiac monitoring, medication administration, and manual defibrillation. Use cases: Cardiac arrests, severe trauma, stroke/heart attack, respiratory distress, critical emergencies.

- **CCT - Critical Care Transport**: Highest level of care for critically ill patients requiring ICU-level interventions. Includes everything in ALS plus ventilator management, hemodynamic monitoring, advanced medication infusions, and ICU-level nursing care. Use cases: ICU-to-ICU transfers, patients on ventilators, critically unstable patients, long-distance transfers.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v20.x LTS recommended) - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **npm** or **yarn** package manager

Verify installations:

```bash
node --version  # Should be v20.x or higher
docker --version
docker-compose --version
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project
```

### 2. Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=1132
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=hospital_dashboard

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=1133

# Kafka Configuration
KAFKA_CLIENT_ID=hospital-dashboard
KAFKA_FROM_BEGINNING=false
KAFKA_HOST=localhost
KAFKA_PORT=9092

# Cache Configuration
CACHE_INVALIDATION_THRESHOLD=100

# Proximity Service Configuration
MAX_HOSPITALS_DISPLAY=3
MAX_AMBULANCES_DISPLAY=3
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

**Important**: The `docker-compose.yml` file uses these environment variables. Make sure all values are set correctly before starting Docker services.

### 3. Start Infrastructure Services (Docker)

```bash
cd backend
docker-compose up -d
```

This starts:
- **PostgreSQL** with PostGIS extension (port from `DATABASE_PORT`)
- **Redis** (port from `REDIS_PORT`)
- **Kafka** in KRaft mode (port from `KAFKA_PORT`)

Verify services are running:

```bash
docker ps
```

You should see three containers:
- `hospital-postgres`
- `hospital-redis`
- `hospital-kafka`

### 4. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

### 5. Initialize Database

The database schema is automatically created via TypeORM's `synchronize: true` option. However, you need to seed the database with mock data.

```bash
cd backend
npm run seed
```

This creates:
- **10 hospitals** across Nigeria with real locations
- **5+ ambulances** with different equipment levels (BLS, ALS, CCT)

### 6. Start Development Servers

#### Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

Backend will start on `http://localhost:4000` (or port from `PORT` env var)

#### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

## Running the Application

### Access Points

- **Frontend Dashboard**: http://localhost:3000
- **User Dashboard**: http://localhost:3000/dashboard/user
- **Admin Dashboard**: http://localhost:3000/dashboard/admin
- **Backend API**: http://localhost:4000/api

## User Flow & Request Lifecycle

### Complete Emergency Request Flow

The application follows a complete emergency request lifecycle from creation to completion:

#### 1. **User Creates Emergency Request**

1. **Navigate to User Dashboard** (`/dashboard/user`)
2. **Allow location access** - Browser requests geolocation permission
3. **Select Hospital**:
   - Click "Select Hospital" button
   - View list of nearest hospitals sorted by distance
   - Click on a hospital to select it
4. **Select Ambulance**:
   - System automatically shows available ambulances near your location
   - View ambulance details (equipment level, distance, estimated arrival time)
   - Click on an ambulance to select it
5. **Create Request**:
   - Click "Request Ambulance" button
   - Request is created with status `pending`
   - User sees request status and can track progress

#### 2. **Admin Approves Request**

1. **Navigate to Admin Dashboard** (`/dashboard/admin`)
2. **View Request Queue**:
   - See all pending requests in the queue
   - View request details (user location, selected hospital, selected ambulance)
3. **Approve Request**:
   - Click "Accept" button on a pending request
   - Request status changes to `accepted`
   - Ambulance status changes to `busy`
   - User receives real-time update via WebSocket

#### 3. **Ambulance Movement & Status Updates**

The admin can manage the ambulance journey through several status buttons:

**Status Progression:**
1. **`en_route_to_user`** - Ambulance is traveling to user location
   - Admin can simulate movement
   - User sees real-time ambulance position on map
   
2. **`at_user_location`** - Ambulance has arrived at user
   - Admin clicks "Arrived at User" button
   - User receives notification that ambulance has arrived
   - WebSocket broadcasts update to user dashboard

3. **`transporting`** - Ambulance is transporting user to hospital
   - Admin can simulate movement toward hospital
   - Or click "Start Transport" to begin journey
   - User sees ambulance moving on map in real-time

4. **`at_hospital`** - Ambulance has arrived at hospital
   - Admin clicks "Arrived at Hospital" button
   - User receives notification that they've arrived at the hospital
   - WebSocket broadcasts update to user dashboard

5. **`completed`** - Request is complete
   - Admin clicks "Complete Request" button
   - Ambulance status returns to `available`
   - Request is marked as completed
   - User sees final status update

#### 4. **Real-time Updates**

Throughout the entire process:
- **User Dashboard** receives real-time updates via WebSocket
- **Map markers** update automatically as ambulance moves
- **Status messages** appear in real-time on user interface
- **Admin Dashboard** shows current status of all requests

### Testing Workflow Example

**Quick Test Flow:**
1. User creates request → Status: `pending`
2. Admin accepts request → Status: `accepted`
3. Admin clicks "Arrived at User" → Status: `at_user_location` (user notified)
4. Admin clicks "Start Transport" → Status: `transporting`
5. Admin clicks "Arrived at Hospital" → Status: `at_hospital` (user notified)
6. Admin clicks "Complete Request" → Status: `completed`

**Full Simulation Flow:**
1. User creates request → Status: `pending`
2. Admin accepts request → Status: `accepted`
3. Admin clicks "Simulate Movement" → Ambulance moves to user automatically
4. System updates to `at_user_location` when reached → User notified
5. Admin clicks "Start Transport" → Status: `transporting`
6. Admin clicks "Simulate Movement" → Ambulance moves to hospital automatically
7. System updates to `at_hospital` when reached → User notified
8. Admin clicks "Complete Request" → Status: `completed`

### Future Enhancements

**Planned Architecture:**
- **Separate Interfaces**: 
  - User interface (current `/dashboard/user`)
  - Driver interface (mobile app for ambulance drivers)
  - Admin interface (current `/dashboard/admin`)
  
- **Real Location Tracking**:
  - Driver app will use GPS to send actual location updates
  - Real-time movement data instead of simulation
  - Integration with mapping services for route calculation
  
- **Automated Status Updates**:
  - System will automatically detect when ambulance arrives at locations
  - Geofencing to trigger status changes
  - No manual button clicks required

### Testing the Core Feature

1. **Open the frontend** at http://localhost:3000
2. **Navigate to User Dashboard** or click "Request Ambulance"
3. **Click on a hospital marker** on the map
4. **View nearest ambulances** - The system will:
   - Check Redis cache first
   - If cache miss, query PostGIS for nearest ambulances
   - Cache results for 30 seconds
   - Display distance and estimated arrival time


### Testing Real-time Updates

1. Open admin dashboard
2. Update an ambulance location
3. Watch the map update in real-time on all connected clients
4. Kafka events trigger WebSocket broadcasts

## Features

### Core Features 

- **Spatial Database Queries**: PostGIS `ST_Distance` with GIST indexes
- **Interactive Map**: MapLibre GL JS with custom markers
- **Proximity Calculation**: Find nearest ambulances to hospitals
- **Intelligent Caching**: Redis with smart invalidation

### Enhanced Features

- **Real-time Tracking**: WebSocket updates every 3 seconds
- **Event Streaming**: Kafka for decoupled event processing
- **Emergency Requests**: Complete request lifecycle (pending → accepted → transporting → completed)
- **Admin Dashboard**: Request queue with pagination, filtering, and status management
- **User Dashboard**: Emergency request creation with hospital/ambulance selection
- **Smart Cache Invalidation**: Location-based invalidation (100m threshold)
- **Geolocation Integration**: Browser geolocation API with accuracy tracking
- **Responsive Design**: Mobile-first design with bottom drawer on mobile

## Deliverables

### GitHub Repository
- Clean, modular code structure
- TypeScript throughout (no `any` types)
- Comprehensive error handling
- ESLint and Prettier configured

### Documentation
- This README with setup instructions
- Architecture documentation
- API documentation
- Code comments where necessary

### Learning Log
- See [LEARNING-LOG.md](./LEARNING-LOG.md) for detailed documentation of the most challenging bug encountered
- Research process detailed with multiple solution attempts
- Solution explained with code examples
- Key learnings and prevention strategies documented

## Testing

### Manual Testing

1. **Proximity Calculation**:
   ```bash
   curl http://localhost:4000/api/proximity/hospital/1/nearest?limit=3
   ```

2. **Cache Verification**:
   - Make same request twice
   - Check backend logs for "Cache hit" vs "Cache miss"

3. **Real-time Updates**:
   - Open admin dashboard
   - Update ambulance location
   - Watch user dashboard update in real-time

### Database Verification

```bash
# Connect to PostgreSQL
docker exec -it hospital-postgres psql -U postgres -d hospital_dashboard

# Check hospitals
SELECT id, name, ST_AsText(location) FROM hospitals;

# Check ambulances
SELECT id, "callSign", status, ST_AsText(location) FROM ambulances;
```

## Troubleshooting

### Services Not Starting

```bash
# Check Docker logs
docker-compose logs

# Restart services
docker-compose restart
```

### Database Connection Issues

- Verify `DATABASE_PORT` in `.env` matches docker-compose port mapping
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify credentials in `.env` match docker-compose

### Kafka Topics Not Created

- Kafka auto-creates topics on first use
- Check Kafka logs: `docker logs hospital-kafka`
- Verify `KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"` in docker-compose

### Frontend Not Connecting to Backend

- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Check backend is running on correct port
- Check CORS configuration in backend

## Notes

- **Database**: Uses `synchronize: true` for development (auto-creates schema)
- **Kafka**: Uses KRaft mode
- **Caching**: 30-second TTL with smart invalidation
- **Real-time**: WebSocket updates every 3 seconds via polling + events

## Next Steps (Future Enhancements)

- [ ] Add authentication and authorization
- [ ] Implement rate limiting
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and logging (Prometheus, Grafana)
- [ ] Implement database migrations (remove synchronize)
- [ ] Add API documentation (Swagger/OpenAPI)

---

Built by ItisCyph3r
