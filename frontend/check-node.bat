@echo off
echo Checking Node.js installation...
where node

if %ERRORLEVEL% EQU 0 (
    echo Node.js is installed at:
    where node
    echo.
    echo Node.js version:
    node -v
    echo.
    echo npm version:
    npm -v
    echo.
    echo Running build...
    call npm run build
) else (
    echo Node.js is not in your PATH or not installed.
    echo Please install Node.js from https://nodejs.org/
)

pause
