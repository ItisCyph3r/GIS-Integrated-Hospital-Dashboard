# Hospital Dashboard Backend

NestJS backend with PostGIS for spatial queries, Redis caching, and Kafka event streaming.

## 🚀 Quick Start

### 1. Start Infrastructure

```bash
# Start PostgreSQL, Redis, ZooKeeper, and Kafka
docker-compose up -d

# Check services are running
docker ps
```

Expected containers:
- `hospital-postgres` (port 1132)
- `hospital-redis` (port 1133)
- `hospital-zookeeper` (port 2181)
- `hospital-kafka` (port 9092)

### 2. Run Database Migrations

```bash
npm run migration:run
```

### 3. Seed Mock Data

```bash
npm run seed
```

This creates:
- 10 hospitals across NYC
- 5 ambulances with different equipment levels

### 4. Start Development Server

```bash
npm run start:dev
```

Server will start on: `http://localhost:3001`

## 📡 API Endpoints

### Hospitals

- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get single hospital

### Ambulances

- `GET /api/ambulances` - Get all ambulances
- `GET /api/ambulances?status=available` - Filter by status
- `GET /api/ambulances/:id` - Get single ambulance
- `PATCH /api/ambulances/:id/location` - Update ambulance location
- `PATCH /api/ambulances/:id/dispatch` - Dispatch to hospital
- `PATCH /api/ambulances/:id/complete` - Mark as available

### Proximity (Core Feature)

- `GET /api/proximity/hospital/:id/nearest?limit=3` - Find nearest ambulances
- `GET /api/proximity/hospital/:id/within-radius?radius=5000` - Find within radius

## 🧪 Testing Endpoints

```bash
# Get all hospitals
curl http://localhost:3001/api/hospitals

# Find nearest 3 ambulances to hospital 1
curl http://localhost:3001/api/proximity/hospital/1/nearest?limit=3

# Update ambulance location
curl -X PATCH http://localhost:3001/api/ambulances/1/location \
  -H "Content-Type: application/json" \
  -d '{"longitude": -73.9857, "latitude": 40.7484}'
```

## 📁 Project Structure

```
src/
├── ambulances/         # Ambulance CRUD + location updates
├── hospitals/          # Hospital CRUD
├── proximity/          # Proximity calculations (PostGIS)
├── tracking/           # WebSocket gateway (TODO)
├── kafka/              # Kafka producers/consumers (TODO)
├── cache/              # Cache invalidation logic (TODO)
├── database/
│   ├── migrations/     # TypeORM migrations
│   └── seeds/          # Seed data
└── common/
    └── types/          # Shared TypeScript types
```

## 🔧 Available Scripts

```bash
npm run start:dev          # Start in development mode
npm run build              # Build for production
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database with mock data
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers
npm run docker:logs        # View container logs
```

## ✅ What's Implemented

- ✅ NestJS project structure
- ✅ PostgreSQL + PostGIS setup
- ✅ TypeORM entities with spatial types
- ✅ Database migrations
- ✅ Seed data (10 hospitals, 5 ambulances)
- ✅ Hospital CRUD endpoints
- ✅ Ambulance CRUD + location updates
- ✅ **Proximity calculations with PostGIS**
- ✅ **Redis caching (30s TTL)**
- ✅ Docker Compose configuration

## 🚧 TODO

- [ ] Kafka producers and consumers
- [ ] WebSocket gateway for real-time updates
- [ ] Cache invalidation service (100m threshold)
- [ ] Admin simulation endpoint
- [ ] Swagger API documentation
- [ ] Health check endpoint

## 🐛 Troubleshooting

### Docker fails to start

If you get TLS/network errors:
1. Restart Docker Desktop
2. Check internet connection
3. Try: `docker system prune -f`
4. Retry: `docker-compose up -d`

### Database connection refused

Check PostgreSQL is running:
```bash
docker logs hospital-postgres
```

Connection string should use **port 1132** (not 5432):
```
postgresql://postgres:postgres@localhost:1132/hospital_dashboard
```

### Redis connection refused

Check Redis is running:
```bash
docker logs hospital-redis
docker exec -it hospital-redis redis-cli ping
```

Should connect on **port 133** (not 6379).

## 📊 Database

PostGIS spatial queries:

```sql
-- Find nearest ambulance
SELECT id, "callSign", 
  ST_Distance(location, ST_MakePoint(-73.9857, 40.7484)::geography) as distance
FROM ambulances
WHERE status = 'available'
ORDER BY location <-> ST_MakePoint(-73.9857, 40.7484)::geography
LIMIT 3;
```

## 🎯 Next Steps

1. Fix Docker network issues if containers aren't running
2. Implement Kafka event streaming
3. Add WebSocket for real-time updates
4. Build cache invalidation logic
5. Create ambulance movement simulation

---

**Status**: Core backend functionality complete. Infrastructure setup pending Docker network resolution.
