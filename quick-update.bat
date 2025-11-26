@echo off
chcp 65001 >nul

echo ========================================
echo 🚀 PROCESAR + COMMIT RÁPIDO
echo ========================================

REM Procesar datos
echo 🔄 Procesando datos...
cd data-processor
npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

npm run process
if %errorlevel% neq 0 (
    echo ❌ Error en procesamiento
    pause
    exit /b 1
)

cd ..

REM Commit automático
echo.
echo 📝 Creando commit automático...
git add .
git commit -m "🔄 Actualización automática de datos - %date% %time%"

if %errorlevel% neq 0 (
    echo ⚠️  No hay cambios para commit o error en commit
) else (
    echo ✅ Commit creado
    echo 🚀 Cambios listos para push a main
    echo.
    echo Para subir a GitHub: git push origin main
)

echo.
pause