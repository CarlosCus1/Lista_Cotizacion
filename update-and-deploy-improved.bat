@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 ACTUALIZACIÓN DE DATOS SIMPLE
echo ========================================
echo Procesando solo archivos JSON desde XLSX
echo Timestamp: %date% %time%
echo.

cd /d %~dp0

REM Verificar prerrequisitos
echo Verificando prerrequisitos...

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no encontrado. Instala Node.js primero.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no encontrado.
    pause
    exit /b 1
)

REM Ejecutar procesamiento
echo.
echo 🔄 Ejecutando procesamiento de datos...
cd data-processor

npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudieron instalar las dependencias
    cd ..
    pause
    exit /b 1
)

npm run process
if %errorlevel% neq 0 (
    echo ❌ ERROR: El procesamiento falló
    cd ..
    pause
    exit /b 1
)

cd ..

REM Verificar que se actualizaron los JSONs
echo.
echo ✅ Proceso completado. Archivos JSON actualizados:
echo.
dir /b data-processor\outputs\*.json
echo.
echo 📋 Para continuar con el deployment:
echo    1. Revisa los cambios: git status
echo    2. Si todo está bien, haz commit manual: git add . && git commit -m "mensaje"
echo    3. El deployment será automático via GitHub Actions

echo.
echo 🎯 Presiona cualquier tecla para continuar...
pause >nul