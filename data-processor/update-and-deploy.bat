@echo off
chcp 65001 >nul

cd /d %~dp0\..

echo 🚀 Iniciando actualización automática de datos de cotización

echo ­ƒôé Cambiando al directorio del procesador...
cd data-processor

echo ­ƒôª Instalando dependencias...
npm install

echo ­ƒöº Ejecutando procesamiento...
node processor.js

echo ­ƒôï Copiando archivos a public...
copy outputs\* ..\public

echo ­ƒôè Verificando archivos generados...
dir ..\public

echo ­ƒöä Preparando commit...
cd ..
git add .
git commit -m "🔄 Actualización automática de datos de cotización - %date% %time%"

echo ­ƒôñ Subiendo cambios a main...
git push origin main

echo 🏗️ Construyendo aplicación...
npm run build

echo 🚀 Desplegando a gh-pages...
git checkout gh-pages
git rm -rf .
git checkout main -- dist
move dist\* .
rd /s /q dist
git add .
git commit -m "🚀 Deploy actualización automática - %date% %time%"
git push origin gh-pages

echo 🔄 Regresando a main...
git checkout main

echo ✅ Actualización completa exitosamente!
pause