# ============================================================
# Frontend Dockerfile - Multi-stage Build
# ============================================================
# Owner: Maksym (Frontend) / Integration: Michal (Infrastructure)
#
# Build stage: Compiles React application using Node.js
# Serve stage: Serves built files using Nginx
#
# Build context: frontend/ directory
# Output: e4l.frontend.docker/web/dist/
# ============================================================

# ============================================================
# Stage 1: Build
# ============================================================
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files from frontend_code/
COPY frontend_code/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend_code/ ./

# Build application
# Output goes to e4l.frontend.docker/web/dist (via webpack config)
RUN npm run build

# ============================================================
# Stage 2: Serve
# ============================================================
FROM nginx:1.28
WORKDIR /usr/share/nginx/html

# Copy nginx configuration
COPY frontend_code/e4l.frontend.docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/e4l.frontend.docker/web/dist/ ./

# Copy environment variable substitution script
COPY frontend_code/e4l.frontend.docker/web/command.sh /command.sh
RUN chmod 755 /command.sh

# Expose port 80 (standard HTTP)
EXPOSE 80

# Start nginx with environment variable substitution
CMD ["bash", "/command.sh"]
