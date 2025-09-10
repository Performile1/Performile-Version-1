# Performile Frontend

This is the frontend for the Performile logistics performance platform, built with React, TypeScript, and Vite.

## Recent Updates

### Configuration Updates
- Updated TypeScript configuration for Vercel compatibility
  - Set `moduleResolution` to "Bundler"
  - Enabled `moduleDetection` for better ESM support
- Optimized Vercel deployment settings
  - Configured proper build commands with directory context
  - Added API route handling and caching headers

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

To create a production build:

```bash
npm run build
```

## Deployment

This project is configured for deployment on Vercel. The deployment is automatically triggered on pushes to the `main` branch.

## Environment Variables

Required environment variables:
- `VITE_API_BASE_URL`: Base URL for API requests
- `VITE_BASE_URL`: Base URL for the application
- `VITE_APP_ENV`: Environment (development, production, etc.)

## Project Structure

```
frontend/
├── src/               # Source files
├── public/            # Static files
├── api/               # API route handlers
└── dist/              # Production build output
```
