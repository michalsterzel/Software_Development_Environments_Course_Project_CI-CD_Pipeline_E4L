# ============================================
# STAGE 1: BUILD
# ============================================
FROM gradle:8.5-jdk17 AS builder

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build the application
# We use the wrapper (./gradlew) and specifically call 'bootJar' 
# to ensure the executable JAR is created.
RUN ./gradlew bootJar -x test --no-daemon

# ============================================
# STAGE 2: RUNTIME
# ============================================
FROM eclipse-temurin:21-jdk-alpine

# Set metadata
LABEL maintainer="Jabin <jabin@uni.lu>"
LABEL description="E4L Platform Backend API"

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# THE FIX: We use a wildcard (*.jar) to find the file 
# and copy it directly to app.jar. This avoids the "file not found" error.
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/e4lapi/questionnaire || exit 1

# Expose port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]