# Backend Dockerfile
# Multi-stage build for backend application

# Build stage
FROM openjdk:17-slim AS build
WORKDIR /app

# Copy source files
COPY . .

# Build application (adjust command based on your build tool)
# RUN ./gradlew build --no-daemon

# Runtime stage
FROM openjdk:17-slim
WORKDIR /app

# Copy built artifact from build stage
# COPY --from=build /app/build/libs/*.jar app.jar

# Expose backend container port
EXPOSE <BE_CONTAINER_PORT>

# Run application
# CMD ["java", "-jar", "app.jar"]
