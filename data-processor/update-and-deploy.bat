@echo off
chcp 65001 >nul
echo 🚀 Iniciando actualización automática de datos de cotización
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

echo 🔧 Ejecutando procesamiento...
call npm run process

if %errorlevel% neq 0 (
    echo ❌ Error en el procesamiento
    pause
    exit /b 1
)

echo 📋 Copiando archivos a public...
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

echo 🔄 Preparando commit...
cd ..
git add public/*.json public/last-update.txt
git status

echo ✍️  Creando commit...
git commit -m "🔄 Actualización automática de datos de cotización - %date% %time%"

if %errorlevel% neq 0 (
    echo ⚠️  No hay cambios para commitear o error en commit
    echo Esto puede ser normal si los datos no cambiaron
)

echo 📤 Subiendo cambios...
git push origin main

if %errorlevel% neq 0 (
    echo ❌ Error al hacer push
    pause
    exit /b 1
)

echo 🏗️ Construyendo aplicación...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Error en el build
    pause
    exit /b 1
)

echo 🚀 Desplegando a gh-pages...
git checkout gh-pages

if %errorlevel% neq 0 (
    echo ❌ Error cambiando a gh-pages
    pause
    exit /b 1
)

git rm -rf .
git checkout main -- dist
move dist\* .
rd /s /q dist
git add .
git commit -m "🚀 Deploy actualización automática - %date% %time%"

if %errorlevel% neq 0 (
    echo ⚠️  No hay cambios en gh-pages o error en commit
)

git push origin gh-pages

if %errorlevel% neq 0 (
    echo ❌ Error al hacer push a gh-pages
    git checkout main
    pause
    exit /b 1
)

echo 🔄 Regresando a main...
git checkout main

echo 🎉 Actualización completa exitosamente!
echo 📅 Los cambios estarán disponibles en GitHub Pages en unos minutos