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
- **Authentication**: Custom auth with face recognition (face-api.js integration planned)
- **Storage**: Supabase for additional services
- **Frontend**: React 19 with TypeScript and Tailwind CSS
- **API**: Next.js App Router API routes

## Core Data Models

The system tracks user behavior through three main entities:

1. **User** - Basic user info with optional face biometric data stored as Base64
2. **TrackingSession** - Individual monitoring sessions with start/end times
3. **TrackingLog** - Granular behavioral events (eye movement, mouth movement, face orientation, face detection loss)
4. **SessionStatistics** - Aggregated analytics per session

## Key Directories

- `src/app/api/auth/` - Authentication endpoints including face registration/verification
- `src/lib/` - Shared utilities (Prisma client, Supabase client, validation)
- `src/app/components/` - Reusable UI components organized by domain
- `prisma/` - Database schema and migrations

## Import Paths

Use `@/*` alias for imports from `src/` directory (configured in tsconfig.json).

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for Prisma
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key