@echo off
echo [INFO] Iniciando actualizacion de archivos JSON...
echo.

echo [INFO] Procesando datos...
cd data-processor
node processor.js
if %errorlevel% neq 0 (
    echo [ERROR] Error en el procesamiento de datos
    pause
    exit /b 1
)
cd ..

echo.
echo [SUCCESS] Archivos JSON actualizados exitosamente!
echo Los archivos JSON han sido generados y copiados a public/ y docs/
echo.
echo [INFO] Para hacer commit y push de los cambios, ejecuta: commit-and-deploy.bat
echo.
pause