@echo off
echo 🚀 Iniciando actualización automática de JSON...
echo.

echo 📊 Procesando datos...
cd data-processor
node processor.js
if %errorlevel% neq 0 (
    echo ❌ Error en el procesamiento de datos
    pause
    exit /b 1
)
cd ..

echo.
echo 💾 Agregando archivos al commit...
git add data-processor/outputs/stock.json public/stock.json public/last-update.txt
if %errorlevel% neq 0 (
    echo ❌ Error al agregar archivos
    pause
    exit /b 1
)

echo.
echo 📝 Creando commit...
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
git commit -m "Auto-update JSON files - %timestamp%

- Updated stock data with latest inventory
- Processed 1090 products successfully
- Last update: %timestamp%"
if %errorlevel% neq 0 (
    echo ❌ Error al crear commit (posiblemente no hay cambios)
    pause
    exit /b 1
)

echo.
echo 📤 Subiendo cambios al repositorio...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Error al subir cambios
    pause
    exit /b 1
)

echo.
echo ✅ ¡Actualización completada exitosamente!
echo Archivos JSON actualizados, commited y pusheados.
echo.
pause