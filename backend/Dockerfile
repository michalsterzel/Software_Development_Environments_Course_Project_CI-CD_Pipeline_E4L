# ============================================================
# Backend Dockerfile - Multi-stage Build
# ============================================================
# Owner: Jabin (Backend) / Integrated by: Michal (Infrastructure)
#
# PURPOSE:
# Builds the E4L backend Spring Boot application as a Docker image.
# Uses multi-stage build to minimize final image size.
#
# BUILD CONTEXT:
# This Dockerfile expects to be run from the backend/ directory,
# with backend_code/ containing the Gradle project.
#
# USAGE:
#   docker build -t e4l-backend:tag -f Dockerfile .
#
# The CI pipeline builds this image and pushes to GitLab Container Registry.
# ============================================================

# ============================================================
# STAGE 1: BUILD
# ============================================================
# Uses Gradle 8.5 with JDK 17 to compile the Spring Boot application.
# Tests are skipped here as they run in a separate CI stage.
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Copy the Gradle project from backend_code/
COPY backend_code/ .

# Build the executable JAR (tests run separately in CI)
# Output: build/libs/e4l-server.jar
RUN ./gradlew bootJar -x test --no-daemon

# ============================================================
# STAGE 2: RUNTIME
# ============================================================
# Uses Eclipse Temurin JDK 21 Alpine for a lightweight runtime.
# Runs as non-root user for security.
FROM eclipse-temurin:21-jdk-alpine

LABEL maintainer="Jabin (Backend Team)"
LABEL description="E4L Platform Backend API"

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built JAR from builder stage
# Uses wildcard to handle version variations in JAR name
COPY --from=builder /app/build/libs/*.jar app.jar

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/e4lapi/questionnaire || exit 1

# Expose backend container port (host port mapping done in docker-compose)
EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
