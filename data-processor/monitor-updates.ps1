<#
.SYNOPSIS
    Monitorea el estado del sistema de actualización automática

.DESCRIPTION
    Revisa logs, estado de archivos, y funcionamiento del sistema de actualización
    automática de datos de cotización.

.PARAMETER Days
    Número de días de logs a revisar (por defecto 7)

.PARAMETER Detailed
    Muestra información detallada

.EXAMPLE
    .\monitor-updates.ps1
    .\monitor-updates.ps1 -Days 30 -Detailed
#>

param(
    [int]$Days = 7,
    [switch]$Detailed
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$logDir = Join-Path $rootPath "logs"
$publicDir = Join-Path $rootPath "public"
$backupDir = Join-Path $publicDir "backup"

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-FileInfo {
    param([string]$Path, [string]$Label)

    if (Test-Path $Path) {
        $file = Get-Item $Path
        $age = (Get-Date) - $file.LastWriteTime
        $ageText = if ($age.TotalHours -lt 24) {
            "$([math]::Round($age.TotalHours, 1)) horas"
        }
        elseif ($age.TotalDays -lt 7) {
            "$([math]::Round($age.TotalDays, 1)) días"
        }
        else {
            "$([math]::Round($age.TotalDays)) días"
        }

        Write-Status "✅ $Label" "Green"
        Write-Status "   Última modificación: $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) ($ageText)" "Gray"
        Write-Status "   Tamaño: $([math]::Round($file.Length / 1KB, 1)) KB" "Gray"
    }
    else {
        Write-Status "❌ $Label - ARCHIVO NO ENCONTRADO" "Red"
    }
}

function Analyze-Logs {
    param([int]$DaysBack = 7)

    Write-Status "`n📊 ANÁLISIS DE LOGS (últimos $DaysBack días)" "Cyan"

    if (!(Test-Path $logDir)) {
        Write-Status "❌ Directorio de logs no encontrado: $logDir" "Red"
        return
    }

    $logFiles = Get-ChildItem -Path $logDir -Filter "*.log" |
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-$DaysBack) } |
    Sort-Object LastWriteTime -Descending

    if ($logFiles.Count -eq 0) {
        Write-Status "⚠️ No se encontraron logs en los últimos $DaysBack días" "Yellow"
        return
    }

    Write-Status "📄 Archivos de log encontrados: $($logFiles.Count)" "Green"

    $totalUpdates = 0
    $successfulUpdates = 0
    $failedUpdates = 0
    $lastUpdate = $null

    foreach ($logFile in $logFiles) {
        $content = Get-Content $logFile.FullName -Raw

        # Contar actualizaciones
        $updateMatches = [regex]::Matches($content, "ACTUALIZACIÓN COMPLETADA EXITOSAMENTE")
        $totalUpdates += $updateMatches.Count

        $successMatches = [regex]::Matches($content, "SUCCESS")
        $successfulUpdates += $successMatches.Count

        $errorMatches = [regex]::Matches($content, "ERROR")
        $failedUpdates += $errorMatches.Count

        # Última actualización
        if ($lastUpdate -eq $null -or $logFile.LastWriteTime -gt $lastUpdate) {
            $lastUpdate = $logFile.LastWriteTime
        }
    }

    Write-Status "📈 Estadísticas:" "Yellow"
    Write-Status "   Total de ejecuciones: $totalUpdates" "White"
    Write-Status "   Actualizaciones exitosas: $successfulUpdates" "Green"
    Write-Status "   Actualizaciones fallidas: $failedUpdates" "Red"

    if ($lastUpdate) {
        $age = (Get-Date) - $lastUpdate
        Write-Status "   Última actualización: $($lastUpdate.ToString('yyyy-MM-dd HH:mm:ss')) ($([math]::Round($age.TotalHours, 1)) horas atrás)" "White"
    }

    if ($Detailed) {
        Write-Status "`n📋 Últimos logs:" "Cyan"
        $logFiles | Select-Object -First 5 | ForEach-Object {
            $age = (Get-Date) - $_.LastWriteTime
            Write-Status "   $($_.Name) - $([math]::Round($age.TotalHours, 1))h atrás - $([math]::Round($_.Length / 1KB, 1))KB" "Gray"
        }
    }
}

function Check-ScheduledTask {
    Write-Status "`n⏰ ESTADO DE TAREA PROGRAMADA" "Cyan"

    try {
        $task = schtasks /query /tn "CotizacionDataUpdate" /fo CSV /nh 2>$null |
        ConvertFrom-Csv |
        Where-Object { $_.TaskName -eq "\CotizacionDataUpdate" }

        if ($task) {
            Write-Status "✅ Tarea programada encontrada" "Green"
            Write-Status "   Estado: $($task.Status)" "White"
            Write-Status "   Próxima ejecución: $($task.'Next Run Time')" "White"
            Write-Status "   Última ejecución: $($task.'Last Run Time')" "White"
            Write-Status "   Último resultado: $($task.'Last Result')" "White"
        }
        else {
            Write-Status "❌ Tarea programada no encontrada" "Red"
            Write-Status "💡 Para crear: npm run schedule:create" "Yellow"
        }
    }
    catch {
        Write-Status "❌ Error verificando tarea programada: $($_.Exception.Message)" "Red"
    }
}

function Check-Backups {
    Write-Status "`n💾 ESTADO DE BACKUPS" "Cyan"

    if (!(Test-Path $backupDir)) {
        Write-Status "❌ Directorio de backups no encontrado: $backupDir" "Red"
        return
    }

    $backupFiles = Get-ChildItem -Path $backupDir -Filter "*.json" |
    Sort-Object LastWriteTime -Descending

    if ($backupFiles.Count -eq 0) {
        Write-Status "⚠️ No se encontraron archivos de backup" "Yellow"
        return
    }

    Write-Status "✅ Backups encontrados: $($backupFiles.Count)" "Green"

    # Agrupar por fecha
    $backupsByDate = $backupFiles | Group-Object {
        $_.LastWriteTime.ToString('yyyy-MM-dd')
    } | Sort-Object Name -Descending

    Write-Status "📅 Backups por fecha:" "Yellow"
    $backupsByDate | Select-Object -First 7 | ForEach-Object {
        Write-Status "   $($_.Name): $($_.Count) archivos" "White"
    }

    # Verificar espacio usado
    $totalSize = ($backupFiles | Measure-Object Length -Sum).Sum
    Write-Status "💽 Espacio usado: $([math]::Round($totalSize / 1MB, 2)) MB" "White"
}

# Script principal
Write-Status "=========================================" "Cyan"
Write-Status "🔍 MONITOREO DEL SISTEMA DE ACTUALIZACIÓN" "Cyan"
Write-Status "=========================================" "Cyan"
Write-Status "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Gray"
Write-Status ""

# Verificar archivos principales
Write-Status "📁 VERIFICACIÓN DE ARCHIVOS" "Cyan"

Get-FileInfo (Join-Path $publicDir "catalogo-base.json") "Catálogo Base"
Get-FileInfo (Join-Path $publicDir "stock.json") "Stock"
Get-FileInfo (Join-Path $publicDir "descuentos-fijos.json") "Descuentos Fijos"
Get-FileInfo (Join-Path $publicDir "sin-descuentos.json") "Sin Descuentos"
Get-FileInfo (Join-Path $publicDir "last-update.txt") "Última Actualización"

# Análisis de logs
Analyze-Logs -DaysBack $Days

# Verificar tarea programada
Check-ScheduledTask

# Verificar backups
Check-Backups

# Resumen de estado general
Write-Status "`n🏥 DIAGNÓSTICO GENERAL" "Cyan"

$issues = @()

# Verificar si los archivos existen y son recientes
$jsonFiles = @("catalogo-base.json", "stock.json", "descuentos-fijos.json", "sin-descuentos.json")
foreach ($file in $jsonFiles) {
    $filePath = Join-Path $publicDir $file
    if (!(Test-Path $filePath)) {
        $issues += "Archivo faltante: $file"
    }
    else {
        $fileInfo = Get-Item $filePath
        if ((Get-Date) - $fileInfo.LastWriteTime -gt [TimeSpan]::FromDays(7)) {
            $issues += "Archivo antiguo: $file ($([math]::Round(((Get-Date) - $fileInfo.LastWriteTime).TotalDays)) días)"
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Status "✅ Sistema funcionando correctamente" "Green"
}
else {
    Write-Status "⚠️ Problemas detectados:" "Yellow"
    $issues | ForEach-Object { Write-Status "   - $_" "Red" }
}

Write-Status ""
Write-Status "💡 Comandos útiles:" "Cyan"
Write-Status "   • Ejecutar actualización: npm run update" "Gray"
Write-Status "   • Ver logs recientes: Get-ChildItem ../logs/*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 5" "Gray"
Write-Status "   • Limpiar logs antiguos: npm run logs:clean" "Gray"
Write-Status "   • Crear tarea programada: npm run schedule:create" "Gray"

Write-Status ""
Write-Status "🎯 Monitoreo completado - $(Get-Date -Format 'HH:mm:ss')" "Green"