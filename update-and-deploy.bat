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

REM Verificar que PowerShell esté disponible
powershell -Command "Write-Host 'PowerShell disponible'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: PowerShell no está disponible
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

REM Ejecutar el script de PowerShell
echo Ejecutando script de automatización...
powershell -ExecutionPolicy Bypass -File "data-processor\update-and-deploy.ps1" %*

REM Verificar resultado
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 🎉 ¡ACTUALIZACIÓN COMPLETA!
    echo ========================================
    echo ✅ Proceso completado exitosamente
    echo.
    echo 📅 Los cambios estarán disponibles en GitHub Pages en unos minutos
) else (
    echo.
    echo ❌ ERROR: El proceso falló con código %errorlevel%
    echo Revisa los logs en la carpeta 'logs' para más detalles
)

echo.
echo Presiona cualquier tecla para cerrar...
pause >nul