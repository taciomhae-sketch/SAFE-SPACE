@echo off
setlocal
echo =======================================================
echo Pushing SAFE SPACE to GitHub
echo Repository: https://github.com/taciomhae-sketch/SAFE-SPACE
echo =======================================================
set "GIT_EXE=%LOCALAPPDATA%\MinGit\cmd\git.exe"

if not exist "%GIT_EXE%" (
    where git >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        set "GIT_EXE=git"
    ) else (
        echo [ERROR] Git executable not found!
        pause
        exit /b 1
    )
)

"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin https://github.com/taciomhae-sketch/SAFE-SPACE.git
"%GIT_EXE%" branch -M main

echo.
echo Staging any modified/new files...
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "Update Safe Space codebase" 2>nul

echo.
echo Pushing commits to GitHub...
"%GIT_EXE%" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo Successfully pushed to https://github.com/taciomhae-sketch/SAFE-SPACE
    echo =======================================================
) else (
    echo.
    echo If push failed due to remote conflict or authentication,
    echo please verify your network and credentials.
)
pause

