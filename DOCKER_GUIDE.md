# 🐳 Thai-Meow Docker Guide

คู่มือการใช้งาน Docker สำหรับ Thai-Meow Project

---

## 📋 Prerequisites

- Docker Desktop หรือ Docker Engine
- Docker Compose v2+
- Git

---

## 🚀 Quick Start

### Development Mode

```bash
# Start all services (MongoDB + Backend)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Mode

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 📦 Services

### MongoDB
- **Port**: 27017
- **Username**: admin
- **Password**: admin123 (เปลี่ยนใน Production!)
- **Database**: thai-meow

### Backend API
- **Port**: 3000
- **Health Check**: http://localhost:3000/api/health

### Nginx (Optional)
- **Port**: 80, 443
- **Profile**: production

---

## 🔧 Configuration

### Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
JWT_SECRET=your-secure-jwt-secret
VAJAX_API_KEY=your-vajax-api-key
VAJAX_SPEAKER=nana
VAJAX_STYLE=nana
VAJAX_SPEED=1.0
```

### MongoDB Connection

ใน Production, เปลี่ยน `MONGODB_URI` ใน `docker-compose.yml`:

```yaml
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/thai-meow?authSource=admin
```

---

## 🛠️ Commands

### Build Images

```bash
# Backend only
docker build -t thai-meow-backend ./backend

# Development
docker build -f ./backend/Dockerfile.dev -t thai-meow-backend:dev ./backend
```

### Run Containers

```bash
# Backend only
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://admin:admin123@host.docker.internal:27017/thai-meow \
  -e JWT_SECRET=your-secret \
  thai-meow-backend

# With volume for logs
docker run -p 3000:3000 \
  -v $(pwd)/backend/logs:/app/logs \
  -e MONGODB_URI=... \
  thai-meow-backend
```

### Database Operations

```bash
# Access MongoDB shell
docker exec -it thai-meow-mongodb mongosh -u admin -p admin123

# Backup database
docker exec thai-meow-mongodb mongodump --out=/data/backup

# Restore database
docker exec thai-meow-mongodb mongorestore /data/backup
```

---

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker ps -a

# Restart container
docker-compose restart backend
```

### MongoDB connection error

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string
docker exec thai-meow-backend env | grep MONGODB_URI
```

### Port already in use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

---

## 📊 Monitoring

### View Resource Usage

```bash
docker stats

# Specific container
docker stats thai-meow-backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# MongoDB health
docker exec thai-meow-mongodb mongosh --eval "db.adminCommand('ping')"
```

---

## 🚢 Production Deployment

### 1. Update Environment Variables

```bash
# Create .env file
cp .env.example .env
# Edit .env with production values
```

### 2. Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify
docker-compose ps
```

### 3. Setup SSL (Optional)

```bash
# Place SSL certificates in nginx/ssl/
mkdir -p nginx/ssl
# Copy cert.pem and key.pem

# Start with nginx profile
docker-compose --profile production up -d
```

---

## 🔐 Security Best Practices

1. **Change default passwords** - MongoDB admin password
2. **Use secrets** - Don't hardcode secrets in docker-compose.yml
3. **Limit network access** - Use Docker networks
4. **Enable SSL** - Use HTTPS in production
5. **Regular updates** - Keep images updated

---

## 📝 Notes

- Development mode includes hot reload with nodemon
- Production mode uses optimized Node.js image
- Logs are persisted in `backend/logs/` directory
- MongoDB data is persisted in Docker volumes

---

**Happy Dockerizing! 🐳**
