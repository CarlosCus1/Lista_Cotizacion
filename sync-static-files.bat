@echo off
chcp 65001 >nul

echo ========================================
echo 🔄 SINCRONIZACIÓN DE ARCHIVOS STATIC
echo ========================================
echo.

REM Sincronizar favicon.svg y manifest.json a la raíz
echo 📋 Copiando archivos estáticos...

if exist "public\favicon.svg" (
    copy "public\favicon.svg" "favicon.svg" >nul
    echo ✅ favicon.svg sincronizado
) else (
    echo ⚠️  public\favicon.svg no encontrado
)

if exist "public\manifest.json" (
    copy "public\manifest.json" "manifest.json" >nul
    echo ✅ manifest.json sincronizado
) else (
    echo ⚠️  public\manifest.json no encontrado
)

echo.
echo 🎯 Archivos listos para GitHub Pages
echo.
pause