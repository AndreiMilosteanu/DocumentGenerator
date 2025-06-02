# Docker Setup for React App

This document provides instructions for building and running the React application using Docker.

## Files Overview

- `Dockerfile` - Production build with nginx
- `Dockerfile.dev` - Development build with Vite dev server
- `docker-compose.yml` - Orchestration for both environments
- `nginx.conf` - Nginx configuration for production
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Production Build

```bash
# Build and run production container
docker-compose --profile production up --build

# Or manually:
docker build -t my-react-app .
docker run -p 80:80 my-react-app
```

The application will be available at `http://localhost`

### Development Build

```bash
# Build and run development container with hot reload
docker-compose --profile development up --build

# Or manually:
docker build -f Dockerfile.dev -t my-react-app-dev .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules my-react-app-dev
```

The application will be available at `http://localhost:5173`

## Build Commands

### Production
```bash
# Build production image
docker build -t my-react-app:latest .

# Run production container
docker run -d -p 80:80 --name react-app my-react-app:latest

# Stop and remove container
docker stop react-app && docker remove react-app
```

### Development
```bash
# Build development image
docker build -f Dockerfile.dev -t my-react-app:dev .

# Run development container with volume mounting
docker run -d -p 5173:5173 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --name react-app-dev \
  my-react-app:dev

# View logs
docker logs -f react-app-dev
```

## Environment Variables

You can pass environment variables to the container:

```bash
# For development
docker run -p 5173:5173 \
  -e NODE_ENV=development \
  -e VITE_API_URL=http://localhost:8000 \
  my-react-app:dev

# For production (build-time variables)
docker build --build-arg VITE_API_URL=https://api.example.com -t my-react-app .
```

## Health Check

The production container includes a health check endpoint:

```bash
curl http://localhost/health
```

## Nginx Configuration

The production build uses nginx with the following features:
- Gzip compression
- Static asset caching
- SPA routing support (fallback to index.html)
- Security headers
- Health check endpoint

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port mapping in docker-compose.yml or use different ports
2. **Permission issues**: Ensure Docker has proper permissions
3. **Build failures**: Check that all dependencies are properly listed in package.json

### Debugging

```bash
# Access container shell
docker exec -it react-app sh

# View nginx logs (production)
docker exec react-app cat /var/log/nginx/access.log
docker exec react-app cat /var/log/nginx/error.log

# View application logs (development)
docker logs react-app-dev
```

## Production Deployment

For production deployment, consider:

1. Using a reverse proxy (nginx, traefik, etc.)
2. Setting up SSL/TLS certificates
3. Configuring proper environment variables
4. Setting up monitoring and logging
5. Using container orchestration (Kubernetes, Docker Swarm)

Example with reverse proxy:

```yaml
version: '3.8'
services:
  app:
    build: .
    expose:
      - "80"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
``` 