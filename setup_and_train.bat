@echo off
REM ══════════════════════════════════════════════════════════════════════
REM  AI Waste Sorting - Environment Setup & Training Launcher
REM  Run this from the project root:
REM     setup_and_train.bat
REM ══════════════════════════════════════════════════════════════════════

SET "PROJECT_ROOT=%~dp0"
SET "VENV=%PROJECT_ROOT%venv"
SET "PIP=%VENV%\Scripts\pip.exe"
SET "PYTHON=%VENV%\Scripts\python.exe"

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║   AI Waste Sorting ^& Recycling Assistant            ║
echo ║   Environment Setup + Training Launcher             ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Step 1: Check venv exists ─────────────────────────────────────────
IF NOT EXIST "%VENV%\Scripts\activate.bat" (
    echo [1/5] Creating virtual environment...
    python -m venv "%VENV%"
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create venv. Is Python 3.11 installed?
        pause & exit /b 1
    )
    echo [1/5] Virtual environment created at: %VENV%
) ELSE (
    echo [1/5] Virtual environment already exists. Skipping creation.
)

REM ── Step 2: Install PyTorch with CUDA 12.1 ───────────────────────────
echo.
echo [2/5] Installing PyTorch with CUDA 12.1 support...
echo       This may take 5-10 minutes on first run (downloading ~2.4 GB).
%PIP% install torch torchvision --index-url https://download.pytorch.org/whl/cu121 --quiet
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PyTorch installation failed. Check your internet connection.
    pause & exit /b 1
)
echo [2/5] PyTorch installed.

REM ── Step 3: Install training requirements ────────────────────────────
echo.
echo [3/5] Installing training dependencies (ultralytics, onnx, etc.)...
%PIP% install -r "%PROJECT_ROOT%training\requirements-train.txt" --quiet
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install training requirements.
    pause & exit /b 1
)
echo [3/5] All training dependencies installed.

REM ── Step 4: Verify GPU is visible ────────────────────────────────────
echo.
echo [4/5] Verifying GPU availability...
%PYTHON% -c "import torch; gpu=torch.cuda.is_available(); name=torch.cuda.get_device_name(0) if gpu else 'N/A'; print(f'  GPU: {name}' if gpu else '  [WARNING] CUDA not available - will train on CPU')"

REM ── Step 5: Launch training ───────────────────────────────────────────
echo.
echo [5/5] Starting YOLO detection training...
echo       Logs will appear below. Expected time: 20-40 min on RTX 3050.
echo       Press Ctrl+C at any time to pause (best.pt is saved each epoch).
echo.

%PYTHON% "%PROJECT_ROOT%training\train_detection.py"
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Training script exited with an error.
    echo         Check the output above for details.
    pause & exit /b 1
)

echo.
echo ══════════════════════════════════════════════════════
echo  Training complete!
echo  Best weights saved to: backend\weights\yolo_waste.pt
echo.
echo  Next steps (run in order):
echo    %VENV%\Scripts\activate
echo    python training\evaluate_detection.py
echo    python training\export_onnx.py
echo ══════════════════════════════════════════════════════
pause
