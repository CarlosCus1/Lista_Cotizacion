@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 SISTEMA DE ACTUALIZACIÓN AUTOMATIZADA
echo ========================================
echo Iniciando actualización automática de datos de cotización
echo Timestamp: %date% %time%
echo.

cd /d %~dp0

REM Crear directorio de logs si no existe
if not exist "..\logs" mkdir "..\logs"

REM Archivo de log
set LOG_FILE=..\logs\update_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] === INICIO DE ACTUALIZACIÓN === > "%LOG_FILE%"

REM Verificar que existe el archivo de configuración
if not exist "inputs\configuracion_cotizacion.xlsx" (
    echo ❌ ERROR: No se encuentra el archivo de configuración
    echo [%date% %time%] ERROR: Archivo de configuración faltante >> "%LOG_FILE%"
    pause
    exit /b 1
)

REM Verificar conexión a git
cd ..
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se puede acceder al repositorio git
    echo [%date% %time%] ERROR: Problema con repositorio git >> "%LOG_FILE%"
    cd data-processor
    pause
    exit /b 1
)
cd data-processor

echo 📦 Instalando dependencias del procesador...
echo [%date% %time%] Instalando dependencias... >> "%LOG_FILE%"
call npm install >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    echo [%date% %time%] ERROR: Falló instalación de dependencias >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo 🔧 Ejecutando procesamiento de datos...
echo [%date% %time%] Ejecutando procesamiento... >> "%LOG_FILE%"
call npm run process >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error en el procesamiento de datos
    echo [%date% %time%] ERROR: Falló procesamiento de datos >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo 📋 Copiando archivos JSON a public...
echo [%date% %time%] Copiando archivos a public... >> "%LOG_FILE%"

REM Crear backup de archivos anteriores
if exist "..\public\catalogo-base.json" (
    copy "..\public\catalogo-base.json" "..\public\backup\catalogo-base_%date:~-4,4%%date:~-10,2%%date:~-7,2%.json" >nul 2>&1
)

copy outputs\*.json ..\public\ >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error copiando archivos JSON
    echo [%date% %time%] ERROR: Falló copia de archivos >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo 📅 Creando timestamp de actualización...
echo [%date% %time%] Creando timestamp... >> "%LOG_FILE%"

REM Crear timestamp en formato legible
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2% (UTC-5)

echo !TIMESTAMP! > ..\public\last-update.txt
echo [%date% %time%] Timestamp creado: !TIMESTAMP! >> "%LOG_FILE%"

echo 🔍 Verificando cambios en archivos...
cd ..
git status --porcelain public/*.json public/last-update.txt > temp_changes.txt
set /p CHANGES=<temp_changes.txt
del temp_changes.txt

if "%CHANGES%"=="" (
    echo ℹ️ No hay cambios en los archivos JSON
    echo [%date% %time%] INFO: No hay cambios para commitear >> "%LOG_FILE%"
    cd data-processor
    echo.
    echo 🎉 Verificación completada - No hay cambios pendientes
    goto :cleanup
)

echo 📊 Cambios detectados:
echo %CHANGES%
echo.

echo 🔄 Preparando commit en rama main...
echo [%date% %time%] Preparando commit... >> "%LOG_FILE%"

git add public/*.json public/last-update.txt >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error agregando archivos al staging
    echo [%date% %time%] ERROR: Falló git add >> "%LOG_FILE%"
    pause
    exit /b 1
)

REM Crear mensaje de commit con estadísticas
for /f %%i in ('git status --porcelain public/*.json ^| find /c "json"') do set JSON_COUNT=%%i
set COMMIT_MSG=🔄 Actualización automática de datos de cotización - !JSON_COUNT! archivos JSON actualizados - %date% %time%

echo Creando commit: !COMMIT_MSG!
echo [%date% %time%] Commit message: !COMMIT_MSG! >> "%LOG_FILE%"

git commit -m "!COMMIT_MSG!" >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error creando commit
    echo [%date% %time%] ERROR: Falló git commit >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo 📤 Subiendo cambios a rama main...
echo [%date% %time%] Subiendo a main... >> "%LOG_FILE%"

git push origin main >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error subiendo cambios a main
    echo [%date% %time%] ERROR: Falló git push >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo 🚀 Desplegando a GitHub Pages...
echo [%date% %time%] Iniciando despliegue... >> "%LOG_FILE%"

call npm run deploy >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error en el despliegue a GitHub Pages
    echo [%date% %time%] ERROR: Falló despliegue >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [%date% %time%] === ACTUALIZACIÓN COMPLETADA EXITOSAMENTE === >> "%LOG_FILE%"

echo.
echo ========================================
echo 🎉 ¡ACTUALIZACIÓN COMPLETA!
echo ========================================
echo ✅ Datos procesados correctamente
echo ✅ Archivos JSON actualizados
echo ✅ Commit creado automáticamente
echo ✅ Cambios subidos a GitHub
echo ✅ Despliegue a GitHub Pages completado
echo.
echo 📅 Los cambios estarán disponibles en GitHub Pages en unos minutos
echo 📄 Log detallado: %LOG_FILE%
echo.

:cleanup
echo [%date% %time%] === FIN DE EJECUCIÓN === >> "%LOG_FILE%"
cd data-processor

REM Preguntar si mantener la ventana abierta (útil para debugging)
if "%1"=="auto" (
    exit /b 0
) else (
    echo Presiona cualquier tecla para cerrar...
    pause >nul
)