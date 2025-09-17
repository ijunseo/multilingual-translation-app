# Multilingual Translation App

This is a code bundle for Multilingual Translation App. The original project is available at https://www.figma.com/design/8mFu77Omn1pkky7IKnRDKc/Multilingual-Translation-App.

## Setup

### Environment Configuration
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the code

### Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000/

### Production Build
1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

   The production build will be generated in the `build/` directory.