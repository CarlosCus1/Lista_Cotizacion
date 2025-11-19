@echo off
chcp 65001 >nul
echo 🔄 Actualización de datos de cotización
echo 📋 Este script solo actualiza los datos. El build y deploy se hace automáticamente via GitHub Actions.
echo.

cd /d %~dp0

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
call npm run process

if %errorlevel% neq 0 (
    echo ❌ Error en el procesamiento
    pause
    exit /b 1
)

echo 📋 Copiando archivos generados a public...
copy outputs\*.json ..\public\

if %errorlevel% neq 0 (
    echo ❌ Error copiando archivos
    pause
    exit /b 1
)

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