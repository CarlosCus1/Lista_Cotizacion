@echo off

echo Iniciando actualizacion automatica de datos de cotizacion

cd data-processor

echo Instalando dependencias...
npm install

echo Ejecutando procesamiento...
node processor.js

echo Copiando archivos a public...
copy outputs\* ..\public

echo Creando timestamp...
cd ..
echo %date% %time% > public\last-update.txt

echo Copiando archivos a public...
copy outputs\* ..\public

echo Verificando archivos generados...
dir ..\public

echo Creando timestamp...
cd ..
echo %date% %time% > public\last-update.txt

echo Preparando commit...
git add public/*.json public/last-update.txt
git commit -m "Actualizacion automatica de datos de cotizacion - %date% %time%"

echo Subiendo cambios...
git push origin main

echo Construyendo aplicacion...
npm install
npm run build

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
echo Los cambios estaran disponibles en GitHub Pages en unos minutos