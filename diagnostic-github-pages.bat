@echo off
chcp 65001 >nul

echo ========================================
echo 🔧 DIAGNÓSTICO GITHUB PAGES
echo ========================================
echo.

REM Verificar que estamos en un repositorio Git
echo 📋 Verificando repositorio Git...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No es un repositorio Git válido
    pause
    exit /b 1
)
echo ✅ Repositorio Git válido

REM Verificar que el workflow existe
echo 📋 Verificando GitHub Actions...
if exist ".github\workflows\deploy.yml" (
    echo ✅ Workflow de GitHub Actions encontrado
) else (
    echo ❌ Workflow no encontrado
)

REM Verificar build
echo 📋 Verificando build...
if exist "dist\" (
    echo ✅ Build completado - directorio dist/ existe
    dir dist\ /b | findstr "index.html" >nul
    if %errorlevel% equ 0 (
        echo ✅ Archivo index.html encontrado en dist/
    ) else (
        echo ❌ Archivo index.html no encontrado en dist/
    )
) else (
    echo ⚠️  Build no realizado - ejecuta npm run build primero
    echo 💡 Para hacer build: npm run build
)

echo.
echo ========================================
echo 🚨 PROBLEMA IDENTIFICADO
echo ========================================
echo El build funciona localmente, pero GitHub Pages
echo no está habilitado para este repositorio.
echo.
echo 🔧 SOLUCIÓN:
echo 1. Ve a: https://github.com/CarlosCus1/Lista_Cotizacion
echo 2. Click en Settings (tab superior)
echo 3. Click en Pages (sidebar izquierdo)
echo 4. En "Source" selecciona "GitHub Actions"
echo 5. Guarda la configuración
echo.
echo 📝 El workflow ya está configurado en:
echo    .github/workflows/deploy.yml
echo.
echo 🔄 Después de configurar GitHub Pages:
echo 1. Haz un commit dummy: git commit --allow-empty -m "Activar GitHub Pages"
echo 2. Push: git push origin main
echo 3. Ve a Actions tab para ver el deployment

echo.
pause