# 🎯 Face Tracking System
### Real-time Behavioral Monitoring for Online Examinations

A comprehensive Next.js application featuring advanced face recognition authentication and real-time behavioral tracking using MediaPipe and Supabase technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## 🚀 Features

### ✅ Authentication System (Completed)
- **Multi-Pose Face Recognition**: 4-pose biometric capture (front, left, right, blink)
- **Advanced Liveness Detection**: Anti-spoofing protection with 6-method scoring system
- **JWT-based Security**: Secure token authentication with 1-day expiry
- **Real-time Validation**: Duplicate field checking during registration
- **Password Fallback**: Traditional email/password authentication option
- **Thai Localization**: Complete Thai language support with 83 title options

### ✅ Real-time Face Tracking (Phase 1 Complete)
- **MediaPipe Integration**: 468-point facial landmark analysis
- **Face Orientation Detection**: Looking away monitoring (±20° yaw, ±15° pitch)
- **Sci-Fi Visualization**: Advanced mesh rendering with color-coded status
- **Live Analytics Dashboard**: Real-time statistics and attention rate tracking
- **Performance Optimized**: 100ms interval processing with error recovery

### 🔄 Planned Features (Phases 2-3)
- **Mouth Movement Detection**: Talking, eating, drinking behavior analysis
- **Eye Gaze Tracking**: Directional gaze monitoring (up/down/left/right)
- **Session Management**: Database logging and persistence
- **Supabase Realtime**: Live dashboard streaming and analytics

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS 4.1
- **Backend**: Next.js App Router API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT + face-api.js
- **Real-time**: Supabase Realtime
- **Face Detection**: MediaPipe FaceLandmarker + face-api.js
- **Security**: bcryptjs, comprehensive liveness detection

### Core Components
```
src/
├── app/
│   ├── api/auth/              # Authentication endpoints
│   ├── api/tracking/          # Behavioral tracking APIs
│   ├── components/
│   │   ├── auth/              # Auth components
│   │   │   ├── face-capture/  # Modular capture system (5 components)
│   │   │   └── face-login/    # Login components
│   │   ├── tracking/          # Real-time tracking UI
│   │   └── ui/                # Reusable UI components
│   └── pages/                 # Application pages
├── lib/
│   ├── face-api/              # Face recognition utilities
│   ├── mediapipe-detector.ts  # MediaPipe integration
│   ├── prisma.ts              # Database client
│   └── supabase.ts            # Supabase client
└── hooks/                     # Custom React hooks
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Supabase account
- npm or yarn

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd tracking-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env.local` file:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tracking_db"
   DIRECT_URL="postgresql://username:password@localhost:5432/tracking_db"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

   # JWT
   JWT_SECRET="your-jwt-secret-key"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit http://localhost:3000 to access the application.

## 📊 Database Schema

### Core Models
- **User**: Profile with face biometric data (Base64 descriptors)
- **TrackingSession**: Individual monitoring sessions
- **TrackingLog**: Granular behavioral events with DetectionType enum
- **SessionStatistics**: Aggregated analytics per session

### Detection Types
```typescript
enum DetectionType {
  EYE_MOVEMENT       // Eye gaze direction changes
  MOUTH_MOVEMENT     // Talking, eating, drinking
  FACE_ORIENTATION   // Looking away from screen
  FACE_DETECTION_LOSS // Face not detected
}
```

## 🔒 Security Features

### Face Recognition Security
- **Multi-Pose Biometrics**: 4-pose capture for enhanced security
- **Strict Matching**: 0.4 similarity threshold for verification
- **Liveness Detection**: 6-method anti-spoofing system (100-point scoring)
- **Natural Movement**: Blink detection, depth variation, landmark analysis
- **Video Attack Prevention**: Detects unnatural patterns and loops

### Authentication Flow
1. **Registration**: Multi-pose face capture with automatic progression
2. **Login**: Random single-pose verification or password fallback
3. **Session Management**: JWT tokens with automatic expiry
4. **Real-time Validation**: Duplicate field checking (email, studentId, phone)

## 🎮 Usage

### User Registration
1. Navigate to `/register`
2. Fill user information with Thai title selection
3. Complete 4-pose face capture (automatic detection)
4. Receive audio feedback for each successful pose
5. Account created with secure biometric data

### Face Recognition Login
1. Navigate to `/login`
2. Enter email or use face recognition
3. Complete randomly selected pose verification
4. Automatic authentication and dashboard access

### Real-time Tracking
1. Access `/tracking` after authentication
2. Grant camera permissions
3. View live face detection with sci-fi mesh
4. Monitor attention statistics and orientation data
5. Real-time analytics with detection counting

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma studio    # Open database GUI

# Face API Models
# Models load automatically from CDN on first use
```

## 🧪 Key Algorithms

### Face Orientation Detection
```typescript
// Yaw calculation using eye position ratio
const eyeRatio = leftEyeWidth / rightEyeWidth;
const yaw = (eyeRatio - 1) * 90;

// Pitch calculation using facial proportions  
const noseToForehead = landmarks[10].y - landmarks[151].y;
const noseToBottom = landmarks[175].y - landmarks[10].y;
const pitch = ((noseToForehead / noseToBottom) - 0.7) * 100;
```

### Blink Detection (EAR Algorithm)
```typescript
// Eye Aspect Ratio calculation
const p1p5 = distance(landmarks[1], landmarks[5]);
const p2p4 = distance(landmarks[2], landmarks[4]);  
const p0p3 = distance(landmarks[0], landmarks[3]);
const ear = (p1p5 + p2p4) / (2 * p0p3);

// Blink detected when EAR < 0.25
```

### Liveness Detection Scoring
- Natural Eye Blinking (20 points)
- Face Movement Variation (15 points)
- Depth Movement Detection (10 points)
- Landmark Movement Analysis (15 points)
- Confidence Variation (10 points)
- Blink Pattern Analysis (10 points)
- Sufficient Blinking (20 points)
- EAR Variation (10 points)

**Minimum Score**: 60/100 for liveness verification

## 🐛 Troubleshooting

### Common Issues

**MediaPipe Loading Errors**
```bash
# Clear browser cache and cookies
# Ensure stable internet connection for CDN access
# Check browser console for specific error messages
```

**Face Detection Not Working**
```bash
# Grant camera permissions
# Ensure adequate lighting
# Position face within detection area
# Check if camera is being used by other applications
```

**Database Connection Issues**
```bash
# Verify DATABASE_URL in .env.local
# Check PostgreSQL service status
npx prisma db push  # Re-sync database schema
```

**Build Failures**
```bash
npm run lint        # Check for TypeScript errors
npx prisma generate # Regenerate Prisma client
rm -rf .next        # Clear Next.js cache
npm run build       # Rebuild application
```

## 📈 Performance Optimization

- **MediaPipe Processing**: 100ms intervals for real-time analysis
- **Error Recovery**: Comprehensive fallback systems
- **Memory Management**: Automatic cleanup of detection history
- **CDN Integration**: Fast model loading with fallback mechanisms
- **Component Architecture**: Modular design for better maintainability

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **MediaPipe**: Google's framework for real-time face analysis
- **face-api.js**: TensorFlow.js face recognition library
- **Supabase**: Real-time database and authentication
- **Next.js**: React framework for production applications
- **Prisma**: Modern database toolkit and ORM

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Phase 1 Complete (Face Orientation Detection)

For technical support or feature requests, please open an issue in the repository.
