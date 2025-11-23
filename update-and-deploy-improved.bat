@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 SISTEMA DE ACTUALIZACIÓN MEJORADO
echo ========================================
echo Automatización robusta con manejo de errores
echo Timestamp: %date% %time%
echo.

cd /d %~dp0

REM Verificar que PowerShell esté disponible
powershell -Command "Write-Host 'PowerShell disponible'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: PowerShell no está disponible
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

REM Verificar prerrequisitos básicos
echo 🔍 Verificando prerrequisitos...

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en PATH
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está instalado o no está en PATH
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

REM Verificar git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Git no está instalado o no está en PATH
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

echo ✅ Prerrequisitos verificados correctamente
echo.

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

REM Archivo de log con timestamp
set LOG_FILE=logs\update_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] === INICIO DE EJECUCIÓN === > "%LOG_FILE%"

REM Función para logging
:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
echo %~1
goto :eof

REM Paso 1: Backup de archivos existentes
call :log "💾 Creando backups de archivos existentes..."
if not exist "public\backup" mkdir public\backup
for %%f in (public\*.json) do (
    copy "%%f" "public\backup\%%~nf_%date:~-4,4%%date:~-10,2%%date:~-7,2%%time:~0,2%%time:~3,2%%time:~6,2%.json" >nul
    set LOG_FILE=!LOG_FILE: =0!
)
call :log "✅ Backups creados"

REM Paso 2: Procesar datos
call :log "🔄 Procesando datos de stock..."
cd data-processor
call npm install >> "../%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "❌ ERROR: Falló instalación de dependencias"
    cd ..
    goto error
)

call npm run process >> "../%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "❌ ERROR: Falló procesamiento de datos"
    cd ..
    goto error
)
cd ..
call :log "✅ Procesamiento completado"

REM Paso 3: Verificar cambios
call :log "🔍 Verificando cambios en archivos..."
git status --porcelain public/*.json public/last-update.txt > temp_changes.txt
set /p CHANGES=<temp_changes.txt
del temp_changes.txt >nul 2>&1

if defined CHANGES (
    call :log "📝 Cambios detectados:"
    call :log "%CHANGES%"
    set HAS_CHANGES=1
) else (
    call :log "📋 No hay cambios en los archivos"
    set HAS_CHANGES=0
)

REM Paso 4: Commit y push si hay cambios
if !HAS_CHANGES! equ 1 (
    call :log "💾 Creando commit automático..."

    git add public/*.json public/last-update.txt data-processor/outputs/*.json >> "%LOG_FILE%" 2>&1

    for /f %%i in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set TIMESTAMP=%%i

    git commit -m "🔄 Actualización automática de stock - !TIMESTAMP! [Local Script]\n\n✅ Datos procesados desde sistema de gestión\n📊 Cambios detectados en archivos JSON\n⏰ Timestamp: !TIMESTAMP! (UTC-5)\n\nGenerado por script automatizado local" >> "%LOG_FILE%" 2>&1

    if %errorlevel% neq 0 (
        call :log "❌ ERROR: Falló creación del commit"
        goto error
    )

    call :log "📤 Subiendo cambios a repositorio..."
    git push origin main >> "%LOG_FILE%" 2>&1

    if %errorlevel% neq 0 (
        call :log "❌ ERROR: Falló subida de cambios"
        goto error
    )

    call :log "✅ Cambios subidos exitosamente"
) else (
    call :log "⏭️  No hay cambios para subir"
)

REM Paso 5: Build y deploy
call :log "🏗️  Construyendo aplicación..."
call npm run build >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "❌ ERROR: Falló construcción de la aplicación"
    goto error
)

call :log "🚀 Desplegando a GitHub Pages..."
call npm run deploy >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "❌ ERROR: Falló despliegue a GitHub Pages"
    goto error
)

call :log "✅ Despliegue completado exitosamente"

REM Éxito
echo.
echo ========================================
echo 🎉 ¡ACTUALIZACIÓN COMPLETA!
echo ========================================
echo ✅ Procesamiento de datos: OK
if !HAS_CHANGES! equ 1 (
    echo ✅ Commit y push: OK
) else (
    echo ⏭️  Sin cambios para commit
)
echo ✅ Build: OK
echo ✅ Deploy: OK
echo.
echo 📅 Los cambios estarán disponibles en GitHub Pages en unos minutos
echo 📄 Log detallado: %LOG_FILE%
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
exit /b 0

:error
echo.
echo ========================================
echo ❌ ERROR EN LA ACTUALIZACIÓN
echo ========================================
echo Revisa el log detallado: %LOG_FILE%
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
exit /b 1