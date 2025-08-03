# Payout Automation System

A comprehensive Payout Automation System for EdTech Mentors using Spring Boot and React.

## Prerequisites

- Java 17 or higher
- PostgreSQL 12 or higher
- Maven 3.6 or higher

## Database Setup

### PostgreSQL Configuration

1. Install PostgreSQL if you haven't already

   - Download from [PostgreSQL Official Website](https://www.postgresql.org/download/)
   - Follow the installation instructions for your operating system

2. Create a database for the application

   - Open pgAdmin or your preferred PostgreSQL client
   - Create a new database named `payoutdb`
   - Or run in a terminal/command prompt: `createdb -U postgres payoutdb`

3. Configure database connection
   - The default configuration in `application.properties` assumes:
     - Database name: `payoutdb`
     - Username: `postgres`
     - Password: `postgres`
     - Host: `localhost`
     - Port: `5432`
   - If your configuration differs, update the `application.properties` file accordingly:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/payoutdb
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

4. Database initialization
   - The application will automatically create tables on startup (`spring.jpa.hibernate.ddl-auto=update`)
   - A SQL initialization script is provided at `src/main/resources/init-db.sql` for reference

## Running the Application

1. Build the project

   ```bash
   mvn clean install
   ```

2. Run the application

   ```bash
   mvn spring-boot:run
   ```

3. Access the application at https://payoutautomationsystem.onrender.com/

## Default Credentials

- Admin User:
  - Username: `admin`
  - Password: `admin123`

## Features

- **Admin Dashboard**:

  - Manage sessions
  - View mentors
  - Process payments
  - Generate reports

- **Mentor Dashboard**:
  - View scheduled sessions
  - Check payment status
  - Update profile information
  - Communicate with admins

## Technology Stack

- **Backend**: Spring Boot, Spring Security, Spring Data JPA
- **Frontend**: React, Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: JWT Token-based authentication
