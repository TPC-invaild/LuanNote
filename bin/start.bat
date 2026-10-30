@echo off
setlocal
pushd "%~dp0.."
if errorlevel 1 exit /b 1
set "PYTHONUTF8=1"

rem Prefer an activated environment, then the project's local environment.
if defined VIRTUAL_ENV if exist "%VIRTUAL_ENV%\Scripts\python.exe" (
    set "LUANNOTE_PYTHON=%VIRTUAL_ENV%\Scripts\python.exe"
    goto ready
)
if exist ".venv\Scripts\python.exe" (
    set "LUANNOTE_PYTHON=%CD%\.venv\Scripts\python.exe"
    goto ready
)
if exist ".venv" (
    echo The .venv folder is not a Windows environment. Move it aside and retry.
    goto failed
)
if defined PYTHON goto custom_python
py -3 -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>&1
if not errorlevel 1 (
    py -3 -m venv .venv
    if errorlevel 1 goto failed
    goto local_python
)
python -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>&1
if not errorlevel 1 (
    python -m venv .venv
    if errorlevel 1 goto failed
    goto local_python
)
echo Please install Python 3.10+ from https://www.python.org/downloads/windows/
echo Enable the Python launcher or Add Python to PATH during installation.
goto failed

:custom_python
"%PYTHON%" -c "import sys; sys.exit(sys.version_info < (3, 10))"
if errorlevel 1 goto failed
"%PYTHON%" -m venv .venv
if errorlevel 1 goto failed

:local_python
set "LUANNOTE_PYTHON=%CD%\.venv\Scripts\python.exe"

:ready
"%LUANNOTE_PYTHON%" -c "import sys; sys.exit(sys.version_info < (3, 10))"
if errorlevel 1 (
    echo Python 3.10 or newer is required.
    goto failed
)
"%LUANNOTE_PYTHON%" -c "import fastapi, pydantic, uvicorn; from importlib.metadata import version; assert all(lo <= tuple(int(v) for v in version(n).split('.')[:2]) < hi for n, lo, hi in [('fastapi',(0,115),(1,)),('pydantic',(2,9),(3,)),('uvicorn',(0,30),(1,))])" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    "%LUANNOTE_PYTHON%" -m pip install -r requirements.txt
    if errorlevel 1 goto failed
)
"%LUANNOTE_PYTHON%" bin\run.py %*
if errorlevel 1 goto failed
popd
exit /b 0

:failed
echo LuanNote could not start. See the error above.
pause
popd
exit /b 1
