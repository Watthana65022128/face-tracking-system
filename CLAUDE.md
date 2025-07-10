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

**🔄 In Progress:**
- Behavioral tracking implementation (eye movement, mouth movement, face orientation detection)
- Session analytics and statistics
- Real-time tracking data collection using MediaPipe + Supabase Realtime

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
- `@mediapipe/tasks-vision` - Advanced facial analysis and behavioral tracking
- `bcryptjs` (3.0.2) - Password hashing
- `jsonwebtoken` (9.0.2) - JWT token management
- `react-hot-toast` (2.5.2) - Toast notifications
- `tailwindcss` (4.1.10) - Utility-first CSS framework

## Key Directories

- `src/app/api/auth/` - Authentication endpoints (login, register, face-register, face-verify, check-duplicate)
- `src/app/api/tracking/` - Real-time behavioral tracking endpoints (sessions, logs, statistics)
- `src/lib/` - Shared utilities (Prisma client, Supabase client, validation, face-api with pose detection)
- `src/lib/mediapipe/` - MediaPipe integration for advanced facial analysis
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

#### ✅ **Face Login System Redesign (Completed)**
- **Random Single-Pose Authentication**: Modified face login to randomly select 1 pose from 3 poses (front, left, right)
- **Removed Blink Detection**: Simplified login process by removing blink requirement from verification
- **Extended Verification Time**: Increased pose verification timeout from 3 seconds to 10 seconds per pose
- **UI Overhaul**: Complete interface redesign to show only the randomly selected pose
- **API Updates**: Modified face-verify endpoint to support single-pose verification mode
- **Enhanced UX**: Users now complete authentication with just one random pose instead of 4 sequential poses

#### 🔧 **Technical Implementation Updates**
- **New Function**: `isPoseReadyForLogin()` specifically for single-pose verification
- **FaceLogin.tsx**: Complete rewrite with random pose selection logic and simplified state management
- **face-verify API**: Added `singlePoseVerification` mode with appropriate validation logic
- **Error Handling**: Improved timeout and error management for single-pose flow
- **Audio Feedback**: Streamlined sound system for single-pose completion

#### 📋 **Next Phase: Real-time Behavioral Tracking**
- **Technology Stack**: MediaPipe for advanced facial analysis + Supabase Realtime for live data streaming
- **Target Features**:
  - Eye movement detection and gaze tracking
  - Mouth movement analysis (talking, eating, drinking detection)
  - Head pose estimation (pitch, yaw, roll angles)
  - Face detection loss monitoring
  - Real-time anomaly detection and alerts
- **Implementation Plan**: 
  1. Install and integrate MediaPipe tasks-vision package
  2. Create MediaPipe face mesh and gesture recognition components
  3. Implement Supabase Realtime channels for live tracking data transmission
  4. Develop behavioral tracking APIs (/api/tracking/sessions, /api/tracking/logs)
  5. Build real-time analytics dashboard with live charts and statistics
  6. Add alert system for suspicious behaviors

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

กรุณาทำทีละขั้นตอน  และให้ใช้งานได้จริง
To-Do List แบบ Step-by-Step:
Phase 1: Face Orientation Detection 🎭
Step 1.1: Setup MediaPipe Foundation
Task: สร้าง MediaPipe detector พื้นฐาน
- Install @mediapipe/face_mesh
- สร้าง lib/mediapipe-detector.ts  
- Setup camera access ใน tracking component
- Test face landmarks detection
Step 1.2: Face Orientation Algorithm
Task: คำนวณการหันหน้า
- ใช้ landmarks จมูก (1), คาง (18), แก้มซ้าย (116), แก้มขวา (345)
- คำนวณ yaw (ซ้าย/ขวา) และ pitch (บน/ล่าง) 
- กำหนด threshold สำหรับ "หันออกจากจอ"
- Test กับการหันหน้าจริง
Step 1.3: Data Logging System
Task: เก็บ log การหันหน้า
- สร้าง API route: /api/tracking/log
- เก็บข้อมูลใน tracking_logs table
- Batch processing ทุก 5 วินาที
- Test การบันทึกข้อมูล
Step 1.4: Real-time Dashboard
Task: แสดงสถิติการหันหน้าแบบ real-time
- Setup Supabase realtime subscription
- สร้าง dashboard component
- แสดงจำนวนครั้งที่หันออกจากจอ
- Live update เมื่อมีข้อมูลใหม่
Phase 2: Mouth Movement Detection 👄
Step 2.1: Mouth Landmarks Analysis
Task: วิเคราะห์การเคลื่อนไหวปาก
- ใช้ mouth landmarks (upper lip: 13, lower lip: 14, corners: 61, 291)
- คำนวณ mouth opening ratio
- กำหนด threshold สำหรับ "ปากขยับ"
- Test กับการพูด/เคี้ยว/หาว
Step 2.2: Mouth Movement Integration
Task: รวมเข้าระบบ detection
- เพิ่ม mouth detection ใน detector class
- อัปเดต logging system สำหรับ MOUTH_MOVEMENT
- เพิ่มใน dashboard แสดงสถิติปาก
- Test accuracy และ false positives
Phase 3: Eye Gaze Detection 👁️
Step 3.1: Eye Landmarks Setup
Task: เตรียมระบบตรวจจับตา
- ระบุ eye landmarks (ตาซ้าย: 33, ตาขวา: 362, etc.)
- คำนวณ iris position (ประมาณ)
- กำหนดพื้นที่ "กลางจอ" vs "นอกจอ"
Step 3.2: Gaze Direction Algorithm
Task: คำนวณทิศทางการมอง
- หาตำแหน่ง gaze point (x, y)
- แบ่งเป็น 5 ทิศทาง: CENTER/LEFT/RIGHT/UP/DOWN
- กำหนด threshold สำหรับแต่ละทิศทาง
- Test กับการมองไปทิศทางต่างๆ
Step 3.3: Complete System Integration
Task: รวมระบบทั้งหมด
- รวม 3 detection types ใน component เดียว
- อัปเดต dashboard แสดงสถิติครบ
- เพิ่ม session management
- Performance optimization
- Final testing กับ user จริง
Phase 4: Polish & Optimization ✨
Step 4.1: UI/UX Enhancement
Task: ปรับปรุง interface
- สร้าง tracking session page ที่สวยงาม
- เพิ่ม live video preview พร้อม overlays
- Real-time stats แสดงแบบ animated
- Responsive design สำหรับทุกหน้าจอ
Step 4.2: Performance & Error Handling
Task: เพิ่มประสิทธิภาพและจัดการ error
- Optimize detection frequency
- Error handling สำหรับ camera/detection failures
- Loading states และ user feedback
- Browser compatibility testing