# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Database Management

- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema changes to database (development)
- `npx prisma studio` - Open Prisma Studio database GUI

## Architecture Overview

This is a Next.js 15 tracking system with face recognition authentication and behavioral monitoring capabilities. The application uses:

- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT-based auth with face recognition using face-api.js (fully implemented)
- **Storage**: Supabase for additional services
- **Frontend**: React 19 with TypeScript and Tailwind CSS 4.1
- **API**: Next.js App Router API routes
- **Security**: bcryptjs for password hashing, JWT for tokens

## Current Implementation Status

**✅ Completed Features:**
- User registration with face biometric data capture
- JWT-based authentication system
- Face recognition login and registration
- Real-time face detection and capture
- Password-based authentication fallback
- User profile management with Thai localization
- Basic tracking session UI
- Toast notifications for user feedback
- Responsive UI with Tailwind CSS

**🔄 In Progress:**
- Behavioral tracking implementation (eye movement, mouth movement, face orientation detection)
- Session analytics and statistics
- Real-time tracking data collection

## Core Data Models

The system tracks user behavior through four main entities:

1. **User** - User info with face biometric data (Base64), includes title, firstName, lastName, studentId, phoneNumber
2. **TrackingSession** - Individual monitoring sessions with start/end times and sessionName
3. **TrackingLog** - Granular behavioral events with DetectionType enum (EYE_MOVEMENT, MOUTH_MOVEMENT, FACE_ORIENTATION, FACE_DETECTION_LOSS)
4. **SessionStatistics** - Aggregated analytics per session with detailed metrics

## Key Dependencies

- `@prisma/client` (6.10.1) - Database ORM
- `@supabase/supabase-js` (2.50.2) - Additional storage services
- `face-api.js` (0.22.2) - Face recognition and detection
- `bcryptjs` (3.0.2) - Password hashing
- `jsonwebtoken` (9.0.2) - JWT token management
- `react-hot-toast` (2.5.2) - Toast notifications
- `tailwindcss` (4.1.10) - Utility-first CSS framework

## Key Directories

- `src/app/api/auth/` - Authentication endpoints (login, register, face-register, face-verify)
- `src/lib/` - Shared utilities (Prisma client, Supabase client, validation, face-api)
- `src/app/components/auth/` - Authentication UI components (AuthForm, FaceCapture, FaceLogin)
- `src/app/components/ui/` - Reusable UI components (Button, Card, Input, Select, etc.)
- `prisma/` - Database schema and migrations

## Authentication Flow

1. **Registration**: User registers with email/password + face biometric data
2. **Login**: User can login with email/password or face recognition
3. **Face Recognition**: Uses face-api.js for real-time face detection and verification
4. **JWT Tokens**: Secure token-based authentication with 1-day expiry

## Import Paths

Use `@/*` alias for imports from `src/` directory (configured in tsconfig.json).

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for Prisma
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - Secret key for JWT token signing

## UI/UX Features

- Thai language support throughout the interface
- Responsive design with mobile-first approach
- Real-time camera preview with face detection overlay
- Loading states and error handling
- Toast notifications for user feedback
- Gradient backgrounds and modern card-based layout