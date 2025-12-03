@echo off
echo [INFO] Iniciando commit y deploy de cambios...
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo [INFO] Verificando cambios en archivos trackeados...
git status --porcelain
if %errorlevel% equ 0 (
    echo [INFO] No hay cambios en archivos trackeados
    echo [INFO] Verificando si hay archivos sin trackear...
    git status --porcelain --ignored
    echo.
    echo [SUCCESS] Todos los archivos están actualizados
    echo.
    pause
    exit /b 0
)

echo.
echo [INFO] Agregando todos los cambios...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Error al agregar archivos
    pause
    exit /b 1
)

echo.
echo [INFO] Creando commit...
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
git commit -m "Auto-update and deploy - %timestamp%" -m "- Updated stock data and application files" -m "- Processed latest inventory data" -m "- Deploy timestamp: %timestamp%"
if %errorlevel% neq 0 (
    echo [ERROR] Error al crear commit
    echo [INFO] Posiblemente no hay cambios nuevos o hay conflictos
    pause
    exit /b 1
)

echo.
echo [INFO] Subiendo cambios al repositorio remoto...
git push origin main 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Error al subir cambios al repositorio remoto
    echo [INFO] Intentando nuevamente en 5 segundos...
    timeout /t 5 /nobreak > nul
    git push origin main 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Error persistente al subir cambios
        echo [INFO] Los cambios están commited localmente
        echo [INFO] Puedes hacer push manual más tarde con: git push origin main
        pause
        exit /b 1
    ) else (
        echo [SUCCESS] Push exitoso en el segundo intento
    )
) else (
    echo [SUCCESS] Push completado exitosamente
)

echo.
echo [SUCCESS] Commit y deploy completados exitosamente!
echo Todos los cambios han sido commited y pusheados al repositorio remoto.
echo.
pause