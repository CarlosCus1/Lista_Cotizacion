@echo off
chcp 65001 >nul
echo Iniciando actualizacion de datos de cotizacion...
echo.

:: Cambia al directorio donde se encuentra el script .bat
cd /d %~dp0

echo Ejecutando procesamiento de datos...
call npm run process

if %errorlevel% neq 0 (
    echo Error en el procesamiento de datos.
    pause
    exit /b 1
)

echo.
echo Los archivos JSON han sido actualizados en la carpeta 'outputs'.

echo.
echo Copiando archivos a la carpeta 'public' del proyecto principal...
copy outputs\*.json ..\public\

if %errorlevel% neq 0 (
    echo Error copiando los archivos a la carpeta 'public'.
    pause
    exit /b 1
)

echo.
echo Archivos JSON actualizados y copiados a la carpeta 'public' correctamente.
echo.
echo -------------------------------------------------------------------
echo.
echo Realizando commit y push automatico de los archivos JSON...
cd /d ..
git add public/*.json
git diff --cached --quiet
if %errorlevel% neq 0 (
    git commit -m "Actualizacion automatica de datos JSON"
    git push origin main
    if %errorlevel% neq 0 (
        echo Error en el push. Revisa el repositorio remoto.
    ) else (
        echo Commit y push realizados exitosamente.
    )
) else (
    echo No hay cambios en los archivos JSON para commitear.
)
echo.
echo -------------------------------------------------------------------
echo.
pause
