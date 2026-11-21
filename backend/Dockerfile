# Use Maven with JDK 17 for building
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml first (for dependency caching)
COPY pom.xml .

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage - use smaller JRE image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create xml-storage directory
RUN mkdir -p xml-storage/transactions

# Copy the built JAR
COPY --from=builder /app/target/*.jar app.jar

# Expose port (Render provides PORT env var)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
