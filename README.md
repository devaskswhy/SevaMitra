# SevaMitra - Volunteer Management System

## Overview
SevaMitra is a full-stack Volunteer Management System designed for Mahakumbh, capable of handling over 10,000 volunteers across 20+ zones. The system is optimized for real-time updates using Socket.io.

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Caching**: Redis
- **ORM**: Prisma

## Project Structure
```
/apps
  /web          # Frontend application
  /api          # Backend API
/packages
  /shared       # Shared code and utilities
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Docker
- PostgreSQL
- Redis

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SevaMitra
   ```

2. Install dependencies for the API and web applications:
   ```bash
   cd apps/api
   npm install
   cd ../web
   npm install
   ```

3. Set up the environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

4. Start the development environment using Docker Compose:
   ```bash
   docker-compose up
   ```

5. Run the migrations to set up the database:
   ```bash
   npx prisma migrate dev
   ```

6. Start the API and web applications:
   ```bash
   cd apps/api
   npm run dev
   cd ../web
   npm run dev
   ```

### Code Quality
- ESLint and Prettier are configured for code quality and formatting.
- Husky is set up for pre-commit hooks to ensure code quality before commits.

## Models
The Prisma schema includes the following models:
- **Volunteer**
- **Zone**
- **Task**
- **Assignment**
- **Incident**
- **Shift**
- **Skill**

## Real-time Updates
The system utilizes Socket.io for real-time updates, ensuring that all volunteers and tasks are managed efficiently.

## License
This project is licensed under the MIT License.