@echo off
setlocal

REM Define the repository URL and project name
set REPO_URL=https://github.com/drawdb-io/drawdb
set PROJECT_NAME=drawdb

REM Clone the repository
echo Cloning the repository...
git clone %REPO_URL%
if errorlevel 1 (
    echo Error: Failed to clone repository.
    pause
    exit /b 1
)

cd %PROJECT_NAME%

REM Install dependencies using npm
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo Error: Failed to install npm dependencies.
    pause
    exit /b 1
)

REM Build the project
echo Building the project...
npm run build
if errorlevel 1 (
    echo Error: Build failed.
    pause
    exit /b 1
)

REM Set up Docker (optional)
set /p DOCKER_SETUP=Do you want to set up Docker? (y/n): 
if /i "%DOCKER_SETUP%"=="y" (
    echo Building Docker image...
    docker build -t %PROJECT_NAME% .
    if errorlevel 1 (
        echo Error: Docker build failed.
        pause
        exit /b 1
    )
    echo Running Docker container...
    docker run -p 3000:80 %PROJECT_NAME%
    if errorlevel 1 (
        echo Error: Failed to run Docker container.
        pause
        exit /b 1
    )
)

REM Display success message
echo.
echo Setup completed successfully.
pause

endlocal
exit /b 0
