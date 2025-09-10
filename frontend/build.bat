@echo off
echo Checking environment...

echo.
echo === Node.js Check ===
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.js found at:
    where node
    echo.
    echo Node.js version:
    node --version
) else (
    echo Node.js is not in your PATH or not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo === npm Check ===
where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo npm found at:
    where npm
    echo.
    echo npm version:
    npm --version
) else (
    echo npm is not in your PATH or not installed.
    echo Please install Node.js which includes npm.
    pause
    exit /b 1
)

echo.
echo === Running Build ===
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully!
pause
