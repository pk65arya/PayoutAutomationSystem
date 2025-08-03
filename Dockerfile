# ---------- Build Stage ----------
FROM maven:3.9.0-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# ---------- Run Stage ----------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built JAR from previous stage
COPY --from=builder /app/target/*.jar app.jar

# Expose app port
EXPOSE 8080

ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "target/payout-automation-0.0.1-SNAPSHOT.jar"]