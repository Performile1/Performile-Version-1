# Performile Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
1. Vercel account (https://vercel.com/signup)
2. GitHub account with the Performile repository
3. Supabase or PostgreSQL database (https://supabase.com/)

### Step 1: Prepare Your Repository
1. Make sure your code is pushed to a GitHub repository
2. Ensure you have the following files in your project:
   - `/frontend/vercel.json` - Frontend configuration
   - `/.github/workflows/vercel-deploy.yml` - GitHub Actions workflow
   - All required environment variables

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `VITE_API_URL` = `https://your-api-url.vercel.app` (update after first deploy)
   - `VITE_APP_NAME` = `Performile`
   - `VITE_APP_ENV` = `production`
6. Click "Deploy"

### Step 3: Configure Custom Domain (Optional)
1. Go to your project in Vercel
2. Navigate to "Domains"
3. Add your custom domain and follow the verification steps

### Step 4: Set Up Environment Variables
After the first deployment, update these environment variables in Vercel:
1. Go to Project Settings → Environment Variables
2. Add the following variables:
   ```
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_token_secret
   NODE_ENV=production
   ```
3. Redeploy the application

## 📋 Pre-Deployment Checklist

- [x] Docker files removed (no conflicts)
- [x] GitHub Actions configured
- [x] Vercel.json updated for TypeScript
- [x] Railway.json configured
- [x] Environment variables documented

## 🔧 Environment Variables Required

**Production (.env):**
```env
# Database (Railway provides DATABASE_URL)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Generate secure keys)
JWT_SECRET=your-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-32-chars-minimum

# API Configuration
NODE_ENV=production
PORT=3001

# Frontend API URL
VITE_API_URL=https://performile-platform.vercel.app/api
```

## 🎯 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
- Connect GitHub repo to Vercel
- Set project name: performile-platform
- Add environment variables
- Deploy automatically triggers

### 3. Database Setup
For Vercel deployment, use external database (Supabase recommended):
```bash
# Run in Railway console or locally with production DB
npm run migrate
npm run seed
```

## 🔗 Access Points

- **Full Stack App**: `https://performile-platform.vercel.app`
- **Backend API**: `https://performile-platform.vercel.app/api`
- **Health Check**: `https://performile-platform.vercel.app/api/health`

## 🛠 Development vs Production

**Development**: Local servers (npm run dev)
**Production**: Cloud deployment (Railway + GitHub Pages)

No Docker required - optimized for cloud-native deployment.
