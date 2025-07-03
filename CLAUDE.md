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
- User registration with multi-pose face biometric data capture (4 poses: front, left, right, blink)
- JWT-based authentication system with automatic duplicate field validation
- Face recognition login and registration with multi-pose verification
- Real-time automatic face detection and capture system without manual buttons
- Eye Aspect Ratio (EAR) algorithm for accurate blink detection using facial landmarks
- Password-based authentication fallback
- User profile management with Thai localization
- Real-time duplicate field validation (email, studentId, phoneNumber) with API endpoint
- Basic tracking session UI
- Toast notifications for user feedback
- Responsive UI with oval face detection overlay (changed from circle)
- Modular component architecture for face capture system (5 sub-components)
- Automatic pose progression and validation system
- Enhanced face verification with multi-pose descriptor comparison
- Skip functionality removed from face registration process

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

- `src/app/api/auth/` - Authentication endpoints (login, register, face-register, face-verify, check-duplicate)
- `src/lib/` - Shared utilities (Prisma client, Supabase client, validation, face-api with pose detection)
- `src/app/components/auth/` - Authentication UI components (AuthForm, FaceCapture, FaceLogin)
- `src/app/components/auth/face-capture/` - Modular face capture sub-components
- `src/app/components/ui/` - Enhanced UI components with validation support
- `prisma/` - Database schema and migrations

## Face Capture Component Architecture

### Main Component
- `FaceCapture.tsx` - Main orchestrator for multi-pose capture flow (337 lines, refactored from 530+ lines)

### Sub-Components
- `VideoPreview.tsx` - Video streaming with overlay management
- `FaceDetectionOverlay.tsx` - Visual feedback for face detection with oval overlay
- `PoseInstructions.tsx` - User guidance and progress tracking with real-time feedback
- `CaptureStatus.tsx` - Status indicators and action buttons
- `StatusIndicators.tsx` - Real-time detection status display

### Key Features
- Automatic pose detection and validation using facial landmarks
- Real-time confidence scoring and pose analysis
- Eye Aspect Ratio (EAR) algorithm for blink detection
- Auto-progression between poses (10 consecutive stable detections)
- Visual progress indicators and real-time feedback

## Face Detection & Recognition Implementation

### Core Algorithms
- **Pose Detection**: Uses facial landmarks (nose, eyes, mouth) for yaw angle calculation
- **Blink Detection**: Eye Aspect Ratio (EAR) using 6-point eye landmarks
- **Pose Classification**: 15° threshold for front/left/right classification
- **Confidence Thresholds**: 70% minimum for pose validation, 0.25 EAR for blink detection

### face-api.js Integration (`src/lib/face-api.ts`)
- `loadFaceApiModels()` - CDN-based model loading with error handling
- `detectFaceAndGetDescriptor()` - Face detection and 128-point descriptor extraction
- `detectFacePose()` - Real-time pose analysis with landmarks and expressions
- `analyzeFacePose()` - Yaw calculation using eye and nose landmarks
- `detectBlinking()` - EAR algorithm implementation
- `isPoseReady()` - Validation logic for automatic capture
- `compareFaceDescriptors()` - Euclidean distance calculation for authentication

### Multi-Pose Capture System
1. **Front Pose**: Straight-facing capture (yaw < 15°)
2. **Left Pose**: 30° left turn (yaw < -15°)
3. **Right Pose**: 30° right turn (yaw > 15°)
4. **Blink Detection**: EAR < 0.25 threshold

## Authentication Flow

1. **Registration**: Multi-pose face biometric data capture with automatic progression
2. **Duplicate Validation**: Real-time checking via `/api/auth/check-duplicate`
3. **Login**: Email/password or face recognition with multi-pose verification
4. **Face Recognition**: Enhanced security using multi-pose descriptor comparison
5. **JWT Tokens**: Secure token-based authentication with 1-day expiry

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
- Real-time camera preview with oval face detection overlay
- Automatic capture system with visual feedback
- Loading states and comprehensive error handling
- Toast notifications for user feedback
- Gradient backgrounds and modern card-based layout
- Real-time pose confidence and detection status display
- Progress bars and status indicators for multi-pose capture

## Development & Debugging

### Face Recognition Debugging
- Console logging enabled for pose detection analysis
- Real-time confidence scoring and landmark tracking
- Detailed error handling with Thai language messages
- EAR calculation logging for blink detection debugging

### Component Architecture Benefits
- Separation of concerns with 5 specialized sub-components
- Reusable UI components with enhanced validation
- Real-time state management for capture flow
- Improved maintainability and testing capabilities

### Security Enhancements
- Multi-pose biometric data for enhanced security
- Configurable similarity thresholds (currently 0.8)
- Liveness detection through blink validation
- No skip functionality to ensure complete biometric capture
- Real-time duplicate field validation to prevent data conflicts