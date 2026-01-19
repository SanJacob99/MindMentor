# MindMentor

MindMentor is a minimalistic mental wellness application designed to help users track their daily emotional state and receive practical, data-driven recommendations.

## Tech Stack

### Frontend
- **Framework**: React Native (Expo Managed Workflow)
- **Navigation**: React Navigation (Stack)
- **State Management**: Zustand (Auth/Session), TanStack Query (Server State)
- **UI**: Custom components (StyleSheet)
- **Language**: TypeScript

### Backend
- **Framework**: Fastify
- **Database**: PostgreSQL (Prisma ORM)
- **Validation**: Zod
- **Auth**: JWT (Stateless)
- **Language**: TypeScript

## Architecture Overview

The project follows a monorepo-style structure:

- `frontend/`: Expo/React Native mobile application.
- `backend/`: Fastify REST API server.

Data flows from the Frontend App → REST API → PostgreSQL Database.
Insights and Recommendations are computed on-demand for this MVP.

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database running locally or remotely

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Update `.env` with your database credentials.
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mindmentor?schema=public"
   JWT_SECRET="your-secret"
   ```
4. Initialize Database:
   ```bash
   npx prisma db push
   ```
5. Run Server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start App:
   ```bash
   npx expo start
   ```
4. Run on Device/Simulator:
   - Press `w` for Web.
   - Scan QR code with **Expo Go** app on Android/iOS.

   > **Note**: For physical devices, update `API_URL` in `frontend/src/api/client.ts` to your computer's local IP address (e.g., `http://192.168.1.X:3000`) instead of `localhost`.

## Features (MVP)
0. **Authentication**: Secure Signup & Login.
1. **Onboarding**: Set preferences and reminder times.
2. **Daily Check-in**: Log Mood, Stress, and Energy (0-10).
3. **Recommendations**: Deterministic guidance based on recent entries.
4. **Insights**: 7-day visualization of mood trends.
5. **History**: View past journal logs.
