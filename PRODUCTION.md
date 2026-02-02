# SmartSignDeck: Production Deployment Guide

This document outlines the steps to deploy SmartSignDeck to a production environment.

## 🏗️ Infrastructure Requirements
- **Server**: Linux (Ubuntu 22.04+ recommended)
- **Engine**: Docker & Docker Compose
- **Database**: MongoDB (Managed via Docker or External)
- **Storage**: Cloudinary (Media assets)

## 🚀 Quick Start (Docker Compose)

1. **Clone the repository** on your production server.
2. **Configure Environment Variables**:
   - Copy `backend/.env.example` to `backend/.env`.
   - Update `MONGODB_URL` to point to the `smartsign_db` container or your external DB.
   - Update `CLOUDINARY_*` and `SMTP_*` credentials.
   - Set a strong `JWT_SECRET`.
3. **Run the Orchestration**:
   ```bash
   docker-compose up -d --build
   ```

## 🛡️ Post-Deployment Security Checklist

- [ ] **SSL/TLS**: Configure a reverse proxy (e.g., Nginx, Traefik, or Cloudflare) to provide HTTPS.
- [ ] **Firewall**: Ensure only ports 80 (HTTP/S) and 5000 (API) are exposed if necessary. 
- [ ] **Credential Rotation**: Ensure no default secrets from `.env.example` are used.
- [ ] **Monitoring**: Set up monitoring for the `/v1/health` endpoint.

## 💾 Maintenance & Backups

- **Database**: Backup the `mongodb_data` volume regularly.
- **Logs**: Backend logs are managed by Docker (configured in `docker-compose.yml` log driver) or accessible via `docker logs smartsign_backend`.

## 🛠️ Manual Build (Without Docker)

### Backend
```bash
cd backend
npm install --legacy-peer-deps
npm run build
pm2 start dist/index.js --name signage-backend
```

### Frontend
```bash
cd frontend
npm install
npm run build
# Serve the dist folder using Nginx or Apache
```
