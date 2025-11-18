@echo off
chcp 65001 >nul

cd /d %~dp0\..

echo Iniciando actualizacion automatica de datos de cotizacion

echo Cambiando al directorio del procesador...
cd data-processor

echo Instalando dependencias...
call npm install

echo Ejecutando procesamiento...
call node processor.js

echo Copiando archivos a public...
copy outputs\* ..\public

echo Verificando archivos generados...
dir ..\public

echo Preparando commit...
cd ..
git add public/*.json public/last-update.txt
git commit -m "Actualizacion automatica de datos de cotizacion - %date% %time%"

echo Subiendo cambios a main...
git push origin main

echo Construyendo aplicacion...
call npm install
call npm run build

echo Desplegando a gh-pages...
git stash
git clean -fd
git checkout gh-pages
git rm -rf .
git checkout main -- dist
move dist\* .
rd /s /q dist
git add .
git commit -m "Deploy actualizacion automatica - %date% %time%"
git push origin gh-pages

echo Regresando a main...
git checkout main
git stash pop

echo Actualizacion completa exitosamente!