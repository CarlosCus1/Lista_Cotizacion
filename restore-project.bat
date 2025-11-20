@echo off
chcp 65001 >nul
echo 🔄 Iniciando restauración completa del proyecto
echo.

echo 📂 Cambiando al directorio raíz del proyecto...
cd /d "%~dp0\.."

echo 🔍 Verificando estado actual de Git...
git status

echo.
echo 🧹 Limpiando archivos temporales y de build...
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules
del /f /q *.log 2>nul

echo.
echo 🌿 Cambiando a la rama main...
git checkout main
if %errorlevel% neq 0 (
    echo ❌ Error al cambiar a main
    pause
    exit /b 1
)

echo.
echo 🔄 Restaurando archivos específicos del último commit...
echo ⚠️  Nota: Los archivos configuracion_cotizacion.xlsx que estén en el historial se restaurarán
echo    Los archivos locales NO trackeados por Git no se modificarán

git restore --staged . 2>nul
git restore . 2>nul

echo.
echo 📋 Verificando archivos críticos...
echo Configuraciones disponibles:
if exist "data-processor/inputs/configuracion_cotizacion.xlsx" (
    echo ✅ configuracion_cotizacion.xlsx encontrado
) else (
    echo ⚠️  configuracion_cotizacion.xlsx NO encontrado
)

if exist "data-processor/inputs/configuracion-sample.csv" (
    echo ✅ configuracion-sample.csv encontrado
) else (
    echo ⚠️  configuracion-sample.csv NO encontrado
)

echo.
echo 📦 Instalando dependencias del proyecto principal...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del proyecto principal
)

echo.
echo 📦 Instalando dependencias del procesador de datos...
cd data-processor
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del procesador
)
cd ..

echo.
echo ✅ Restauración completada!
echo 📋 Estado final:
git status

echo.
echo 🎯 Siguientes pasos recomendados:
echo 1. Verificar que tus archivos de configuracion estén en su lugar
echo 2. Ejecutar tu script de procesamiento
echo 3. Hacer commit de cambios si es necesario

pause