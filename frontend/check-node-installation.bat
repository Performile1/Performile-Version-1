@echo off
echo Checking Node.js installation in common locations...
echo ===============================================

echo.
echo 1. Checking Program Files...
if exist "C:\Program Files\nodejs\node.exe" (
    echo [FOUND] Node.js in Program Files
    echo Version: "C:\Program Files\nodejs\node.exe" -v
) else (
    echo [NOT FOUND] Node.js in Program Files
)

echo.
echo 2. Checking Program Files (x86)...
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo [FOUND] Node.js in Program Files (x86)
    echo Version: "C:\Program Files (x86)\nodejs\node.exe" -v
) else (
    echo [NOT FOUND] Node.js in Program Files (x86)
)

echo.
echo 3. Checking AppData\Roaming\npm...
if exist "%APPDATA%\npm\node.exe" (
    echo [FOUND] Node.js in AppData\Roaming\npm
    echo Version: "%APPDATA%\npm\node.exe" -v
) else (
    echo [NOT FOUND] Node.js in AppData\Roaming\npm
)

echo.
echo 4. Checking nvm installation...
if exist "%USERPROFILE%\AppData\Roaming\nvm" (
    echo [FOUND] nvm installation
    echo Listing installed Node.js versions:
    dir "%USERPROFILE%\AppData\Roaming\nvm" /b
) else (
    echo [NOT FOUND] nvm installation
)

echo.
echo 5. Checking PATH environment variable...
echo %PATH% | find /i "node" >nul
if %ERRORLEVEL% EQU 0 (
    echo [FOUND] Node.js in PATH
) else (
    echo [NOT FOUND] Node.js in PATH
)

echo.
echo ===============================================
echo If Node.js is not found, please install it from:
echo https://nodejs.org/
echo ===============================================
pause
