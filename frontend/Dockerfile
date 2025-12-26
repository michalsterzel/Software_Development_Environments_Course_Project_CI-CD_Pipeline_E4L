# Frontend Dockerfile
# Multi-stage build for frontend application

# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build application
RUN npm run build

# Serve stage (using nginx)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy built files from build stage
COPY --from=build /app/dist .

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose frontend container port
EXPOSE <FE_CONTAINER_PORT>

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
