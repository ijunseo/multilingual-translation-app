# Multilingual Translation App (React Native + Expo)

This is a mobile translation app built with React Native and Expo. The original project was a React+Vite web application that has been converted to a native mobile app.

## Overview

A multilingual translation app that supports:
- Multiple language translations (Japanese, Korean, English variants)
- Different translation tones (Casual, Neutral, Semi-formal, Formal)
- Translation history and phrasebook
- Flashcard study mode
- OpenAI-powered translations

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Translation**: OpenAI API
- **Platform**: iOS, Android, Web

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (iOS/Android)

### Environment Configuration
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your API keys:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

## Running the App

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   # or
   expo start
   ```

3. Run on different platforms:
   ```bash
   # Run on iOS simulator
   npm run ios
   # or
   expo start --ios

   # Run on Android emulator
   npm run android
   # or
   expo start --android

   # Run on web browser
   npm run web
   # or
   expo start --web
   ```

### Mobile Device Testing

1. Install the **Expo Go** app on your mobile device:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code displayed in the terminal or browser with:
   - iOS: Camera app or Expo Go app
   - Android: Expo Go app

### Building for Production

To create production builds, you'll need to create an Expo account and configure app.json:

1. Create production build:
   ```bash
   expo build:android  # For Android APK
   expo build:ios      # For iOS (requires Apple Developer account)
   ```

2. For modern EAS Build (recommended):
   ```bash
   npm install -g eas-cli
   eas build --platform android
   eas build --platform ios
   ```

## Project Structure

```
src/
├── components/           # React Native components
│   ├── ui/              # Basic UI components (Button, etc.)
│   ├── MobileSourceLanguageSelector.tsx
│   ├── MobileToneSelector.tsx
│   ├── MobileTranslationInput.tsx
│   ├── MultiTranslationOutput.tsx
│   ├── BottomNavigation.tsx
│   └── ...
├── services/            # API services
│   └── translation.ts   # OpenAI translation service
└── App.tsx             # Main app component
```

## Features

- ✅ **Translation Interface**: Enter text and see translations in multiple languages
- ✅ **Language Selection**: Support for Japanese, Korean, and English variants
- ✅ **Translation Tones**: Choose between casual, neutral, semi-formal, and formal tones
- ✅ **Mobile-First Design**: Optimized for mobile devices with native components
- 🚧 **History & Phrasebook**: Save and organize translations (coming soon)
- 🚧 **Flashcard Study**: Study saved phrases with flashcards (coming soon)
- 🚧 **Settings**: Customize language preferences (coming soon)

## API Configuration

The app uses OpenAI's API for translations. Make sure to:
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to your `.env` file
3. Monitor your API usage to avoid unexpected charges

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**:
   ```bash
   expo start --clear
   ```

2. **Package version conflicts**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**:
   The app includes TypeScript configuration that will auto-generate when you start the development server.

### Platform-Specific Issues

- **iOS**: Requires Xcode and iOS Simulator for local testing
- **Android**: Requires Android Studio and Android Emulator for local testing
- **Web**: Runs in browser but may have limited native functionality

## Contributing

This project was converted from a React+Vite web application to React Native+Expo. The core translation functionality and UI design have been preserved while adapting to mobile-native patterns.

## License

[Add your license information here]