param(
    [switch]$NoPush = $false
)

Write-Host "🚀 Iniciando actualización automática de JSON..." -ForegroundColor Green
Write-Host ""

# Procesar datos
Write-Host "📊 Procesando datos..." -ForegroundColor Yellow
try {
    Set-Location "data-processor"
    & node processor.js
    if ($LASTEXITCODE -ne 0) {
        throw "Error en el procesamiento de datos"
    }
    Set-Location ".."
} catch {
    Write-Host "❌ Error en el procesamiento de datos: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "💾 Agregando archivos al commit..." -ForegroundColor Yellow
try {
    & git add data-processor/outputs/stock.json public/stock.json public/last-update.txt
    if ($LASTEXITCODE -ne 0) {
        throw "Error al agregar archivos"
    }
} catch {
    Write-Host "❌ Error al agregar archivos: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "📝 Creando commit..." -ForegroundColor Yellow
try {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = @"
Auto-update JSON files - $timestamp

- Updated stock data with latest inventory
- Processed 1090 products successfully
- Last update: $timestamp
"@

    & git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        if ($LASTEXITCODE -eq 1) {
            Write-Host "⚠️  No hay cambios para commitear" -ForegroundColor Yellow
            exit 0
        } else {
            throw "Error al crear commit"
        }
    }
} catch {
    Write-Host "❌ Error al crear commit: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not $NoPush) {
    Write-Host ""
    Write-Host "📤 Subiendo cambios al repositorio..." -ForegroundColor Yellow
    try {
        & git push origin main
        if ($LASTEXITCODE -ne 0) {
            throw "Error al subir cambios"
        }
    } catch {
        Write-Host "❌ Error al subir cambios: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⏭️  Omitiendo push (-NoPush especificado)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ ¡Actualización completada exitosamente!" -ForegroundColor Green
Write-Host "Archivos JSON actualizados, commited $(if (-not $NoPush) { "y pusheados" } else { "localmente" })."
Write-Host ""
Read-Host "Presiona Enter para finalizar"