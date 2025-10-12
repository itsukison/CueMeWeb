# CueMe Project Structure

This repository contains both the web application (CueMeWeb) and the desktop Electron application (CueMeFinal).

## CueMeFinal - Desktop Electron Application

CueMe is an AI-powered interview assistant desktop application built with Electron, React, and TypeScript. It helps users during coding interviews by providing real-time assistance through audio analysis and screenshot processing.

### Project Structure

#### Core Architecture
```
CueMeFinal/
├── electron/                    # Electron main process
│   ├── core/                   # Core application logic
│   │   └── AppState.ts         # Main application state management
│   ├── services/               # Business logic services
│   │   ├── AuthCallbackServer.ts    # Authentication callback handling
│   │   ├── DeepLinkHandler.ts       # Deep link protocol handling
│   │   └── AudioStreamEventHandler.ts # Audio stream event management
│   ├── utils/                  # Utility functions
│   │   └── EnvironmentLoader.ts     # Environment variable loading
│   ├── constants/              # Application constants
│   │   └── ProcessingEvents.ts      # Event type definitions
│   ├── main.ts                 # Electron main entry point (~80 lines)
│   ├── preload.ts              # Electron preload script
│   └── ipcHandlers.ts          # IPC communication handlers
├── src/                        # React frontend
│   ├── components/             # React components
│   │   ├── Queue/              # Queue-related components
│   │   │   ├── QueueCommands.tsx    # Main queue controls (~180 lines)
│   │   │   ├── ResponseModeDropdown.tsx # Response mode selection
│   │   │   ├── ScreenshotItem.tsx   # Individual screenshot display
│   │   │   └── ScreenshotQueue.tsx  # Screenshot queue management
│   │   ├── AudioListener/      # Audio processing components
│   │   ├── Solutions/          # Solution display components
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioStream.ts   # Audio streaming functionality
│   │   └── useVerticalResize.ts # Window resizing utilities
│   ├── types/                  # TypeScript type definitions
│   └── _pages/                 # Main application pages
└── package.json                # Dependencies and scripts
```

#### Key Services & Components

**Electron Backend Services:**
- `AppState.ts` - Central application state management, coordinates all services
- `AuthService.ts` - Supabase authentication handling
- `AudioStreamProcessor.ts` - Real-time audio processing and question detection
- `LLMHelper.ts` - AI/LLM integration (Gemini API)
- `QnAService.ts` - Question & Answer collection management
- `DocumentService.ts` - Document processing and RAG functionality
- `WindowHelper.ts` - Electron window management
- `ScreenshotHelper.ts` - Screenshot capture and processing
- `UsageTracker.ts` - API usage monitoring and limits

**React Frontend Components:**
- `QueueCommands.tsx` - Main control panel with audio controls and mode selection
- `ResponseModeDropdown.tsx` - Collection/mode selection dropdown
- `useAudioStream.ts` - Custom hook for audio streaming functionality
- `AudioSettings.tsx` - Audio source configuration
- `Queue.tsx` - Screenshot queue management page
- `Solutions.tsx` - AI-generated solutions display

#### Key Features

1. **Audio Processing**
   - Real-time audio capture and transcription (OpenAI Whisper)
   - Automatic question detection and refinement
   - Multiple audio source support (microphone, system audio)
   - Always-on listening mode

2. **Screenshot Analysis**
   - Automatic screenshot capture
   - AI-powered problem extraction from images
   - Solution generation for coding problems

3. **Authentication & Data**
   - Supabase integration for user management
   - Q&A collection management
   - Document processing with RAG (Retrieval Augmented Generation)
   - Usage tracking and limits

4. **AI Integration**
   - Google Gemini API for solution generation
   - OpenAI Whisper for audio transcription
   - Multiple response modes (plain, Q&A collections)

#### Development Setup

```bash
# Install dependencies
npm install

# Development mode
npm run dev                    # Start Vite dev server
npm run electron:dev          # Start Electron in development

# Build
npm run build                 # Build for production
npm run app:build            # Build Electron app
```

#### Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Recent Refactoring (Cleanup)

The codebase was recently cleaned up to improve maintainability:

**Removed:**
- `renderer/` folder (unused duplicate React app)
- Jest configuration files (no active tests)
- Test certificates and unused files

**Extracted Large Files:**
- `main.ts` (1188 → 80 lines) - Split into multiple services
- `QueueCommands.tsx` (1230 → 180 lines) - Extracted audio hook and dropdown component

This structure makes the codebase more modular and easier to maintain while preserving all functionality.

---

## CueMeWeb - Next.js Web Application

This is the companion web application built with Next.js for CueMe authentication and web-based features.

### Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
