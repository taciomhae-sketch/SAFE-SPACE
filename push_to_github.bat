@echo off
setlocal
echo =======================================================
echo Pushing SAFE SPACE to GitHub
echo Repository: https://github.com/taciomhae-sketch/SAFE-SPACE
echo =======================================================
set "GIT_EXE=%LOCALAPPDATA%\MinGit\cmd\git.exe"

"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin https://github.com/taciomhae-sketch/SAFE-SPACE.git
"%GIT_EXE%" branch -M main

echo.
echo Pushing commits to GitHub...
echo (If prompted, please sign in to your GitHub account)
echo.
"%GIT_EXE%" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo Successfully pushed to https://github.com/taciomhae-sketch/SAFE-SPACE
    echo =======================================================
) else (
    echo.
    echo If push failed due to authentication, you can also push using a Personal Access Token (PAT)
    echo or Git Credential Manager.
)
pause
