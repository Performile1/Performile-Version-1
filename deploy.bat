@echo off
echo 🚀 Starting Performile deployment to Vercel...

:: Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI is not installed. Installing now...
    npm install -g vercel
)

:: Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo You need to log in to Vercel first. Please run 'vercel login'
    exit /b 1
)

echo 📦 Installing dependencies...
call npm ci

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo 🔨 Building application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    exit /b 1
)

echo 🚀 Deploying to Vercel...
call vercel --prod --confirm

if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment complete!
    echo 🔗 Your application is now live at: https://performile.vercel.app
) else (
    echo ❌ Deployment failed
    exit /b 1
)
