# --- Stage 1: Build the Application ---
FROM gradle:8.3-jdk17 AS builder
WORKDIR /app

# Copy only configuration first to cache dependencies
COPY build.gradle settings.gradle gradle.properties ./
COPY src ./src

# Build the JAR (skipping tests to speed up build, tests run in CI stage)
RUN gradle bootJar -x test --no-daemon

# --- Stage 2: Run the Application ---
FROM openjdk:17-slim
WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/build/libs/e4l-server.jar app.jar

# Expose the port (Requirement: "Exposes backend container port")
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
