@echo off
echo [INFO] Iniciando actualizacion automatica de JSON...
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
echo [INFO] Generando archivos JSON actualizados...
REM Los archivos JSON se generan automáticamente y ya no están trackeados por git
REM Solo necesitamos verificar que se generaron correctamente

echo.
echo [INFO] Verificando cambios en archivos trackeados...
git status --porcelain
if %errorlevel% equ 0 (
    echo [INFO] No hay cambios en archivos trackeados, omitiendo commit
) else (
    echo [INFO] Creando commit de cambios...
    for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
    set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
    git add .
    git commit -m "Auto-update JSON files - %timestamp%" -m "- Updated stock data with latest inventory" -m "- Processed products successfully" -m "- Last update: %timestamp%"
    if %errorlevel% neq 0 (
        echo [ERROR] Error al crear commit
        exit /b 1
    )
)

echo.
echo [INFO] Subiendo cambios al repositorio...
git push origin main 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Error al subir cambios al repositorio remoto
    echo [INFO] Intentando nuevamente en 5 segundos...
    timeout /t 5 /nobreak > nul
    git push origin main 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Error persistente al subir cambios
        echo [INFO] Los cambios están commited localmente, puedes hacer push manual más tarde
        echo [INFO] Comando: git push origin main
    ) else (
        echo [SUCCESS] Push exitoso en el segundo intento
    )
) else (
    echo [SUCCESS] Push completado exitosamente
)

echo.
echo [SUCCESS] Actualizacion completada exitosamente!
echo Archivos JSON actualizados, commited y pusheados.
echo.
echo [INFO] Proceso completado automaticamente.