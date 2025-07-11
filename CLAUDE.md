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
- **Real-time Tracking**: MediaPipe for behavioral analysis + Supabase Realtime for live data streaming
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
- Real-time duplicate field validation (email, studentId, phoneNumber) with API endpoint - **REGISTER ONLY**
- Basic tracking session UI
- Toast notifications for user feedback
- Responsive UI with oval face detection overlay (changed from circle)
- Modular component architecture for face capture system (5 sub-components)
- Automatic pose progression and validation system
- Enhanced face verification with multi-pose descriptor comparison with **STRICT SECURITY** (threshold 0.4)
- Skip functionality removed from face registration process
- **NEW**: Comprehensive title/prefix options (83 options) covering all Thai social groups
- **NEW**: Positive audio feedback system for face registration steps
- **NEW**: Silent real-time duplicate validation (no loading icons)

**✅ Completed Features (Updated):**
- **MediaPipe Face Tracking**: Real-time face orientation detection with 468-point landmark analysis
- **Face Orientation Monitoring**: Looking away detection with threshold-based algorithms (±20° yaw, ±15° pitch)
- **Sci-Fi Visualization Interface**: Advanced mesh rendering with color-coded status indicators
- **Live Analytics Dashboard**: Real-time statistics including detection counts and attention rates
- **Performance Optimized Detection**: 100ms interval processing with robust error handling

**🔄 In Progress:**
- **Phase 2**: Mouth Movement Detection (talking, eating, drinking behaviors)
- **Phase 3**: Eye Gaze Tracking (directional gaze analysis: up/down/left/right)
- Session data persistence and database logging
- Supabase Realtime dashboard integration

## Core Data Models

The system tracks user behavior through four main entities:

1. **User** - User info with face biometric data (Base64), includes title, firstName, lastName, studentId, phoneNumber
2. **TrackingSession** - Individual monitoring sessions with start/end times and sessionName
3. **TrackingLog** - Granular behavioral events with DetectionType enum (EYE_MOVEMENT, MOUTH_MOVEMENT, FACE_ORIENTATION, FACE_DETECTION_LOSS)
4. **SessionStatistics** - Aggregated analytics per session with detailed metrics

## Key Dependencies

- `@prisma/client` (6.10.1) - Database ORM
- `@supabase/supabase-js` (2.50.2) - Real-time data streaming and storage services
- `face-api.js` (0.22.2) - Face recognition and detection
- `@mediapipe/tasks-vision` (0.10.22) - Advanced facial analysis and behavioral tracking with 468-point FaceLandmarker
- `@mediapipe/drawing_utils` (0.3.1675466124) - MediaPipe visualization utilities
- `bcryptjs` (3.0.2) - Password hashing
- `jsonwebtoken` (9.0.2) - JWT token management
- `react-hot-toast` (2.5.2) - Toast notifications
- `tailwindcss` (4.1.10) - Utility-first CSS framework

## Key Directories

- `src/app/api/auth/` - Authentication endpoints (login, register, face-register, face-verify, check-duplicate)
- `src/app/api/tracking/` - Real-time behavioral tracking endpoints (sessions, logs, statistics)
- `src/lib/` - Shared utilities (Prisma client, Supabase client, validation, face-api with pose detection)
- `src/lib/mediapipe-detector.ts` - MediaPipe FaceLandmarker integration with real-time tracking
- `src/app/components/auth/` - Authentication UI components (AuthForm, FaceCapture, FaceLogin)
- `src/app/components/auth/face-capture/` - Modular face capture sub-components
- `src/app/components/tracking/` - Real-time behavioral tracking components
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
- **NEW**: Positive audio feedback with progressive musical tones (C5→D5→E5→F5)
- **NEW**: Completion melody (C5→E5→G5→C6) when all poses captured

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
2. **Duplicate Validation**: Real-time checking via `/api/auth/check-duplicate` - **REGISTER ONLY**
3. **Login**: Email/password or face recognition with multi-pose verification
4. **Face Recognition**: Enhanced security using multi-pose descriptor comparison with **STRICT** threshold (0.4)
5. **JWT Tokens**: Secure token-based authentication with 1-day expiry

## Security Updates (Latest)

### Face Recognition Security
- **CRITICAL**: Updated face verification threshold from 0.8 to 0.4 for enhanced security
- **FIXED**: Unauthorized access issue where different faces could pass verification
- **IMPROVED**: Real-time duplicate validation now only runs during registration, not login
- **ENHANCED**: Additional validMatch checks in face verification process

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
- **NEW**: Comprehensive title selection with 83 Thai social prefixes (academic, military, royal, religious, family)
- **NEW**: Silent real-time validation without loading indicators for better UX
- **NEW**: Progressive audio feedback system using Web Audio API

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
- **STRICT** similarity threshold (0.4) for face verification - prevents unauthorized access
- Liveness detection through blink validation
- No skip functionality to ensure complete biometric capture
- Real-time duplicate field validation to prevent data conflicts **REGISTER ONLY**
- Enhanced face verification with additional validMatch checks
- Comprehensive logging for security analysis and debugging

## Recent Updates (Current Session)

### Session Progress Summary

#### ✅ **MediaPipe Face Tracking System Implementation (Latest Session)**
- **BREAKTHROUGH**: Successfully resolved MediaPipe loading and detection issues
- **Core System Architecture**: Built comprehensive real-time face tracking system for exam monitoring
- **Phase 1 Complete**: Face Orientation Detection (looking away from screen) fully operational
- **Real-time Analytics**: Live statistics dashboard with detection counting and behavior analysis
- **Sci-Fi Visual Interface**: Advanced face mesh visualization with 468 landmark points

#### 🔧 **MediaPipe Integration Solutions (Completed)**
**Critical Problem Resolution:**
- **CDN Configuration**: Fixed MediaPipe tasks-vision CDN loading with fallback mechanisms
- **GPU/CPU Delegation**: Optimized for CPU processing with graceful GPU fallback
- **Model Loading**: Streamlined model asset loading with comprehensive error handling
- **Detection Loop**: Resolved React state timing issues and component lifecycle problems

**Technical Achievements:**
- **Real-time Face Detection**: 100ms interval processing with MediaPipe FaceLandmarker
- **Face Orientation Algorithm**: Advanced yaw/pitch calculation using eye ratio analysis
- **Landmark Processing**: 468-point facial landmark analysis for precise tracking
- **Performance Optimization**: Efficient rendering with selective landmark visualization

#### 🎯 **Face Orientation Detection System (Phase 1 Complete)**
**Core Features:**
- **Looking Away Detection**: Threshold-based algorithm (Yaw: ±20°, Pitch: ±15°)
- **Real-time Counting**: Live statistics for total detections and away-from-screen events
- **Visual Feedback**: Color-coded Sci-Fi mesh (green=focused, red=looking away)
- **Performance Metrics**: Attention rate percentage calculation and duration tracking

**Algorithm Implementation:**
- **Eye Ratio Analysis**: Left/right eye width comparison for yaw calculation
- **Vertical Positioning**: Nose-to-forehead/chin ratio for pitch detection
- **Landmark Validation**: Robust error handling for missing or invalid landmark data
- **Threshold Calibration**: Fine-tuned sensitivity for accurate detection

#### 🖥️ **Advanced UI Components (Completed)**
**FaceTracker.tsx (492 lines):**
- **Video Streaming**: Real-time camera feed with overlay canvas
- **Sci-Fi Mesh Rendering**: 468-point landmark visualization with glowing effects
- **Live Statistics Display**: Real-time counters and percentage calculations
- **Auto-start System**: Automatic tracking initialization on component mount

**MediaPipe Detector Class (`src/lib/mediapipe-detector.ts`):**
- **Initialization Methods**: Primary and fallback loading strategies
- **Detection Pipeline**: Video processing with timestamp management
- **Orientation Calculation**: Mathematical algorithms for pose analysis
- **History Management**: Rolling detection history for analytics

#### 🐛 **Critical Bug Fixes (This Session)**
**State Management Issues:**
- **React Hook Dependencies**: Resolved infinite re-render loops in useCallback
- **Component Lifecycle**: Fixed auto-start timing and state synchronization
- **Detection Loop**: Eliminated isActive dependency causing detection failures
- **Error Handling**: Comprehensive try-catch blocks with detailed logging

**MediaPipe Loading Problems:**
- **CDN Version Conflicts**: Unified package versions and CDN URLs
- **GPU Fallback**: Implemented CPU-first approach for broader compatibility
- **Model Asset Loading**: Streamlined Google Storage model access
- **Initialization Sequence**: Proper async/await flow with error recovery

#### 📊 **Current System Capabilities**
**Operational Features:**
- ✅ **Real-time Face Detection**: MediaPipe FaceLandmarker integration
- ✅ **Face Orientation Tracking**: Looking away detection and counting
- ✅ **Live Statistics**: Detection counts, away-time tracking, attention rates
- ✅ **Sci-Fi Visualization**: 468-point mesh rendering with effects
- ✅ **Performance Optimization**: 100ms interval processing without lag
- ✅ **Error Recovery**: Robust fallback systems and logging

**Next Phase Preparation:**
- 🔄 **Mouth Movement Detection**: Ready for Phase 2 implementation
- 🔄 **Eye Gaze Tracking**: Prepared landmark analysis for gaze direction
- 🔄 **Database Integration**: Tracking logs and session management pending
- 🔄 **Supabase Realtime**: Dashboard streaming and analytics ready for development

#### 📋 **Previous Phase: Face Login System Redesign**
- **Random Single-Pose Authentication**: Modified face login to randomly select 1 pose from 3 poses (front, left, right)
- **Removed Blink Detection**: Simplified login process by removing blink requirement from verification
- **Extended Verification Time**: Increased pose verification timeout from 3 seconds to 10 seconds per pose
- **UI Overhaul**: Complete interface redesign to show only the randomly selected pose
- **API Updates**: Modified face-verify endpoint to support single-pose verification mode
- **Enhanced UX**: Users now complete authentication with just one random pose instead of 4 sequential poses

### Advanced Security Enhancements (Previous Update)

#### 1. Enhanced Face Login with 4-Pose Verification System
- **MAJOR UPGRADE**: Completely rebuilt `FaceLogin.tsx` component (517 lines)
- **4-Pose Mandatory Verification**: Users must complete all 4 poses (front, left, right, blink) in sequence
- **Automatic Pose Progression**: Real-time detection with 10-frame stability requirement (~1 second)
- **Progressive Audio Feedback**: Musical tones (C5→D5→E5→F5) for each pose + completion melody
- **Enhanced Visual Feedback**: 
  - Color-coded face detection overlay (red→yellow→green based on Liveness status)
  - Real-time progress tracking with pose completion indicators
  - Grid display showing completed vs. pending poses

#### 2. Advanced Liveness Detection System (`src/lib/face-api.ts`)
**SECURITY BREAKTHROUGH**: Comprehensive anti-spoofing protection against video attacks

**Core Detection Algorithms (6 methods, 100-point scoring system):**
- **Natural Eye Blinking** (20 points): Minimum 2 blinks, max 500ms interval
- **Face Movement Variation** (15 points): Pose changes detected over time
- **Depth Movement Detection** (10 points): Face size variations (near/far camera movement)
- **Landmark Movement Analysis** (15 points): 68-point facial landmark motion tracking
- **Confidence Variation** (10 points): Prevents looped video detection
- **Blink Pattern Analysis** (10 points): Natural blinking rhythm validation
- **Sufficient Blinking** (20 points): Adequate blinks within timeframe
- **EAR Variation** (10 points): Eye Aspect Ratio changes for natural movement

**Implementation Features:**
- **10-second rolling history**: Continuous analysis of face data
- **60/100 minimum score**: Strict threshold for liveness verification
- **Adaptive thresholds**: Flexible scoring (40 points after 50 detections for user experience)
- **Error-resistant design**: Safe fallbacks when landmarks data is incomplete
- **Real-time feedback**: Live scoring and detection reasons display

#### 3. Updated Face-Verify API Security
- **4-Pose Confirmation**: Server-side validation that all poses were completed
- **Enhanced Logging**: Detailed security logs with pose verification status
- **Stricter Validation**: Combined face matching (0.4 threshold) + 4-pose completion
- **Comprehensive Error Messages**: Clear feedback for incomplete pose verification

#### 4. User Experience Improvements
**Visual Enhancements:**
- **Smart Color Coding**: Border colors indicate Liveness status
- **Real-time Statistics**: Live display of detection confidence, pose stability, and Liveness score
- **Progressive Guidance**: Adaptive instructions based on detection quality
- **Error Prevention**: Warning messages only when truly needed (score < 40, after 20 detections)

**Performance Optimizations:**
- **Graceful Error Handling**: Try-catch protection for all Liveness detection operations
- **Memory Management**: Automatic cleanup of detection history
- **Fallback Calculations**: Alternative face size calculation when boundingBox unavailable

#### 5. Anti-Spoofing Protection Effectiveness
**✅ Prevents Mobile Video Attacks**: Detects unnatural movement patterns
**✅ Prevents Photo Attacks**: Requires real blinking and movement
**✅ Prevents Screen/Monitor Attacks**: Detects lack of natural depth variation
**✅ Prevents Looped Video**: Analyzes movement and confidence patterns
**✅ Prevents Static Images**: Requires continuous natural facial movement

#### 6. Comment Localization (Completed)
- **Comprehensive Thai Translation**: Converted 170+ English comments to Thai across 38 files
- **Improved Code Readability**: Thai developers can better understand implementation
- **Consistent Terminology**: Standardized technical terms in Thai language
- **Complete Coverage**: All API routes, components, utilities, and page files

### Technical Implementation Details

#### Face-API Integration Updates
- **New Functions**:
  - `checkLivenessDetection()` - Core liveness analysis with 6-method scoring
  - `resetLivenessDetection()` - State management for clean sessions
  - Enhanced `isPoseReady()` - Now includes Liveness validation
- **Error Handling**: Comprehensive try-catch with safe fallbacks
- **Performance**: Optimized for real-time analysis (100ms intervals)

#### Security Architecture
- **Multi-layered Protection**: Pose verification + Liveness detection + Face matching
- **Threshold Management**: Adaptive scoring based on detection history
- **Session Management**: Automatic cleanup and reset functionality
- **Logging & Monitoring**: Detailed security event logging for analysis

### Migration Notes
- **Backward Compatibility**: Existing face data remains valid
- **Progressive Enhancement**: System works without Liveness for existing users
- **Graceful Degradation**: Continues functioning even if Liveness detection fails
- **Performance Impact**: Minimal - adds ~10ms per detection cycle

คุณเป็น Senior Full-Stack Developer ที่เชี่ยวชาญ Next.js + MediaPipe + Supabase Realtime
กำลังทำระบบ Face Tracking สำหรับการสอบออนไลน์

**โปรเจคปัจจุบัน:**
- Next.js + TypeScript + TailwindCSS
- Supabase + Prisma (PostgreSQL)
- Register + Login + Face 2FA เสร็จแล้ว
- ต้องการทำ Real-time Detection + Logging

**เป้าหมาย:**
สร้างระบบ tracking แบบ step-by-step ตามลำดับ:
1. Face Orientation Detection (ใบหน้าหันออกจากจอ)
2. Mouth Movement Detection (ปากขยับ)  
3. Eye Gaze Detection (ตาหันทิศทาง: บน/ล่าง/ซ้าย/ขวา)

**Technical Requirements:**
- ใช้ MediaPipe FaceMesh
- เก็บ logs ใน database
- Supabase Realtime สำหรับ dashboard
- Batch processing ทุก 5 วินาที
- Responsive UI พร้อม live stats

