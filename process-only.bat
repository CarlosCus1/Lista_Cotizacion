@echo off
chcp 65001 >nul

echo ========================================
echo 🔄 PROCESAMIENTO SOLO DATOS
echo ========================================
echo.

cd /d %~dp0
cd data-processor

echo 📦 Instalando dependencias...
npm install

if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 🔄 Procesando datos...
npm run process

if %errorlevel% neq 0 (
    echo ❌ Error en procesamiento
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ JSONs actualizados correctamente
echo.
echo Archivos generados:
dir /b data-processor\outputs\*.json
echo.
pause