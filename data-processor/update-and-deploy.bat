@echo off
chcp 65001 >nul
<<<<<<< HEAD
echo Iniciando actualizacion de datos de cotizacion...
=======
echo 🔄 Actualización de datos de cotización
echo 📋 Este script solo actualiza los datos. El build y deploy se hace automáticamente via GitHub Actions.
>>>>>>> bab1b55f30a776e2ad9e4e112d3c7f0edc3e5c59
echo.

:: Cambia al directorio donde se encuentra el script .bat
cd /d %~dp0

<<<<<<< HEAD
echo Ejecutando procesamiento de datos...
=======
echo 📂 Cambiando al directorio del procesador...
cd data-processor

echo 📦 Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo 🔧 Ejecutando procesamiento de datos...
>>>>>>> bab1b55f30a776e2ad9e4e112d3c7f0edc3e5c59
call npm run process

if %errorlevel% neq 0 (
    echo Error en el procesamiento de datos.
    pause
    exit /b 1
)

<<<<<<< HEAD
echo.
echo Los archivos JSON han sido actualizados en la carpeta 'outputs'.

echo.
echo Copiando archivos a la carpeta 'public' del proyecto principal...
=======
echo 📋 Copiando archivos generados a public...
>>>>>>> bab1b55f30a776e2ad9e4e112d3c7f0edc3e5c59
copy outputs\*.json ..\public\

if %errorlevel% neq 0 (
    echo Error copiando los archivos a la carpeta 'public'.
    pause
    exit /b 1
)

<<<<<<< HEAD
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
=======
echo 📊 Verificando archivos generados...
dir ..\public\*.json

echo 📅 Creando timestamp...
echo %date% %time% > ..\public\last-update.txt

echo.
echo 🔄 Preparando commit de datos actualizados...
cd ..
git add public/*.json public/last-update.txt
git status

echo ✍️  Creando commit...
git commit -m "🔄 Actualización automática de datos - %date% %time%"

if %errorlevel% neq 0 (
    echo ⚠️  No hay cambios para commitear o error en commit
    echo Esto puede ser normal si los datos no cambiaron
) else (
    echo ✅ Commit realizado exitosamente
    echo 📤 Subiendo cambios a GitHub...
    git push origin main
    
    if %errorlevel% neq 0 (
        echo ❌ Error al hacer push
        echo 💡 Sugerencia: Verifica tu conexión y credenciales de Git
        pause
        exit /b 1
    ) else (
        echo ✅ Push completado exitosamente
        echo 🎉 Datos actualizados y subidos a GitHub
        echo.
        echo 📍 Siguiente paso: GitHub Actions construirá y desplegará automáticamente
        echo 🔗 Revisa el progreso en: https://github.com/tu-usuario/tu-repo/actions
    )
)

echo.
echo ✨ Actualización de datos completada exitosamente!
echo 📋 Workflow: Datos → GitHub → GitHub Actions → Deploy automático
pause
>>>>>>> bab1b55f30a776e2ad9e4e112d3c7f0edc3e5c59
