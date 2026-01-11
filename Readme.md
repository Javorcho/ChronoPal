# ChronoPal

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for mobile testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChronoPal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **Getting a Gemini API Key:**
   1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   2. Sign in with your Google account
   3. Click "Create API Key"
   4. Copy the API key and add it to your `.env` file
   
   **Note:** The Gemini API key is required for the AI Schedule Planner feature. Without it, the AI planner will show an error when trying to generate schedules.
   

## Running the App

### Web
```bash
npm run web
```
Then open [http://localhost:8081](http://localhost:8081) in your browser.

### Mobile (using Expo Go)
```bash
npm start
```
Then scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app

### Platform-specific
```bash
# Android
npm run android

# iOS
npm run ios
```

## Project Structure

ChronoPal/
├── App.tsx                 # App entry point
├── src/
│   ├── components/         # Reusable UI components
│   ├── config/             # Environment configuration
│   ├── lib/                # External service clients (Supabase)
│   ├── screens/            # Screen components
│   ├── services/           # API and business logic
│   │   ├── ai/             # AI services (Gemini integration)
│   │   │   ├── geminiClient.ts    # Gemini API client
│   │   │   ├── plannerService.ts   # Schedule generation logic
│   │   │   ├── prompts.ts          # AI prompt templates
│   │   │   └── index.ts            # Public API exports
│   │   ├── auth/           # Authentication services
│   │   │   ├── authService.ts     # Auth logic (email, OAuth)
│   │   │   └── index.ts            # Public API exports
│   │   ├── database/       # Database services (Supabase)
│   │   │   ├── activityService.ts  # Activity CRUD operations
│   │   │   ├── categoryService.ts  # Category management
│   │   │   ├── exceptionService.ts # Recurrence exceptions
│   │   │   ├── reminderService.ts   # Reminder management
│   │   │   └── index.ts            # Public API exports
│   │   └── integrations/   # External integrations
│   │       ├── calendarService.ts  # Google Calendar integration
│   │       └── index.ts            # Public API exports
│   ├── store/              # Zustand state management
│   ├── theme/              # Theme colors and styles
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images and icons
└── app.json                # Expo configuration
