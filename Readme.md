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
   ```
   

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
│   ├── store/              # Zustand state management
│   ├── theme/              # Theme colors and styles
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images and icons
└── app.json                # Expo configuration
