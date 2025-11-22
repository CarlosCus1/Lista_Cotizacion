<#
.SYNOPSIS
    Sistema automatizado de actualización de datos de cotización con PowerShell

.DESCRIPTION
    Script completo para procesar datos, actualizar JSON, hacer commit automático
    y desplegar a GitHub Pages. Incluye logging detallado, backups y validaciones.

.PARAMETER Auto
    Ejecuta en modo automático sin pausas interactivas

.PARAMETER SkipDeploy
    Omite el despliegue a GitHub Pages

.PARAMETER Force
    Fuerza la actualización incluso si no hay cambios

.EXAMPLE
    .\update-and-deploy.ps1
    .\update-and-deploy.ps1 -Auto
    .\update-and-deploy.ps1 -SkipDeploy -Force
#>

param(
    [switch]$Auto,
    [switch]$SkipDeploy,
    [switch]$Force
)

# Configuración
$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$logDir = Join-Path $rootPath "logs"
$backupDir = Join-Path $rootPath "public" | Join-Path -ChildPath "backup"

# Crear directorios si no existen
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

# Archivo de log con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $logDir "update_$timestamp.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMessage = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Write-Header {
    $header = @"
========================================
🚀 SISTEMA DE ACTUALIZACIÓN AUTOMATIZADA
========================================
PowerShell Automation Script v2.0
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    Write-Host $header -ForegroundColor Cyan
    Add-Content -Path $logFile -Value $header
}

function Test-Prerequisites {
    Write-Log "Verificando prerrequisitos..."

    # Verificar Node.js
    try {
        $nodeVersion = & node --version 2>$null
        Write-Log "Node.js encontrado: $nodeVersion"
    }
    catch {
        throw "Node.js no está instalado o no está en PATH"
    }

    # Verificar npm
    try {
        $npmVersion = & npm --version 2>$null
        Write-Log "npm encontrado: $npmVersion"
    }
    catch {
        throw "npm no está instalado o no está en PATH"
    }

    # Verificar git
    try {
        $gitVersion = & git --version 2>$null
        Write-Log "Git encontrado: $gitVersion"
    }
    catch {
        throw "Git no está instalado o no está en PATH"
    }

    # Verificar archivos requeridos
    $configFile = Join-Path $scriptPath "inputs" | Join-Path -ChildPath "configuracion_cotizacion.xlsx"
    if (!(Test-Path $configFile)) {
        throw "Archivo de configuración no encontrado: $configFile"
    }
    Write-Log "Archivo de configuración verificado: $configFile"

    # Verificar que estamos en un repositorio git
    Push-Location $rootPath
    try {
        & git status | Out-Null
        Write-Log "Repositorio git válido"
    }
    catch {
        throw "No se puede acceder al repositorio git"
    }
    finally {
        Pop-Location
    }
}

function Backup-Files {
    Write-Log "Creando backups de archivos existentes..."

    $jsonFiles = @("catalogo-base.json", "stock.json", "descuentos-fijos.json", "sin-descuentos.json")
    $publicDir = Join-Path $rootPath "public"

    foreach ($file in $jsonFiles) {
        $filePath = Join-Path $publicDir $file
        if (Test-Path $filePath) {
            $backupName = "$($file -replace '\.json$', '')_$timestamp.json"
            $backupPath = Join-Path $backupDir $backupName
            Copy-Item $filePath $backupPath -Force
            Write-Log "Backup creado: $backupName"
        }
    }
}

function Process-Data {
    Write-Log "Procesando datos de cotización..."

    Push-Location $scriptPath

    try {
        # Instalar dependencias
        Write-Log "Instalando dependencias..."
        & npm install 2>&1 | ForEach-Object { Write-Log $_ }

        if ($LASTEXITCODE -ne 0) {
            throw "Error instalando dependencias"
        }

        # Ejecutar procesamiento
        Write-Log "Ejecutando procesamiento de datos..."
        & npm run process 2>&1 | ForEach-Object { Write-Log $_ }

        if ($LASTEXITCODE -ne 0) {
            throw "Error en el procesamiento de datos"
        }

        Write-Log "Procesamiento completado exitosamente"

    }
    finally {
        Pop-Location
    }
}

function Copy-Files {
    Write-Log "Copiando archivos JSON a public..."

    $outputsDir = Join-Path $scriptPath "outputs"
    $publicDir = Join-Path $rootPath "public"

    $jsonFiles = Get-ChildItem -Path $outputsDir -Filter "*.json"
    $copiedFiles = @()

    foreach ($file in $jsonFiles) {
        $destPath = Join-Path $publicDir $file.Name
        Copy-Item $file.FullName $destPath -Force
        $copiedFiles += $file.Name
        Write-Log "Copiado: $($file.Name)"
    }

    # Crear timestamp de actualización
    $updateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss (UTC-5)"
    $updateFile = Join-Path $publicDir "last-update.txt"
    $updateTime | Out-File -FilePath $updateFile -Encoding UTF8
    Write-Log "Timestamp de actualización creado: $updateTime"

    return $copiedFiles
}

function Test-Changes {
    Write-Log "Verificando cambios en archivos..."

    Push-Location $rootPath

    try {
        $changes = & git status --porcelain public/*.json public/last-update.txt 2>$null
        if ($changes) {
            Write-Log "Cambios detectados:"
            $changes | ForEach-Object { Write-Log "  $_" }
            return $true
        }
        else {
            Write-Log "No hay cambios en los archivos JSON"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Commit-Changes {
    param([string[]]$ChangedFiles)

    Write-Log "Creando commit automático..."

    Push-Location $rootPath

    try {
        # Agregar archivos
        & git add public/*.json public/last-update.txt 2>&1 | ForEach-Object { Write-Log $_ }

        # Crear mensaje de commit
        $fileCount = $ChangedFiles.Count
        $commitMessage = "🔄 Actualización automática de datos de cotización - $fileCount archivos JSON actualizados - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

        Write-Log "Mensaje de commit: $commitMessage"

        # Crear commit
        $commitOutput = & git commit -m $commitMessage 2>&1
        $commitOutput | ForEach-Object { Write-Log $_ }

        if ($LASTEXITCODE -ne 0) {
            throw "Error creando commit"
        }

        Write-Log "Commit creado exitosamente"

    }
    finally {
        Pop-Location
    }
}

function Push-Changes {
    Write-Log "Subiendo cambios a rama main..."

    Push-Location $rootPath

    try {
        & git push origin main 2>&1 | ForEach-Object { Write-Log $_ }

        if ($LASTEXITCODE -ne 0) {
            throw "Error subiendo cambios a main"
        }

        Write-Log "Cambios subidos exitosamente"

    }
    finally {
        Pop-Location
    }
}

function Deploy-GitHubPages {
    Write-Log "Desplegando a GitHub Pages..."

    Push-Location $rootPath

    try {
        & npm run deploy 2>&1 | ForEach-Object { Write-Log $_ }

        if ($LASTEXITCODE -ne 0) {
            throw "Error en el despliegue a GitHub Pages"
        }

        Write-Log "Despliegue completado exitosamente"

    }
    finally {
        Pop-Location
    }
}

function Send-Notification {
    param([string]$Status, [string]$Message)

    # Aquí podrías agregar notificaciones por email, Slack, etc.
    Write-Log "Notificación: [$Status] $Message"
}

# Script principal
try {
    Write-Header
    Write-Log "=== INICIO DE EJECUCIÓN ==="

    # Verificar prerrequisitos
    Test-Prerequisites

    # Crear backups
    Backup-Files

    # Procesar datos
    Process-Data

    # Copiar archivos
    $copiedFiles = Copy-Files

    # Verificar cambios
    $hasChanges = Test-Changes

    if (!$hasChanges -and !$Force) {
        Write-Log "No hay cambios para procesar. Use -Force para forzar actualización."
        Send-Notification "INFO" "No hay cambios pendientes"
        exit 0
    }

    # Commit y push
    if ($hasChanges -or $Force) {
        Commit-Changes -ChangedFiles $copiedFiles
        Push-Changes
    }

    # Desplegar (si no se omite)
    if (!$SkipDeploy) {
        Deploy-GitHubPages
    }

    Write-Log "=== ACTUALIZACIÓN COMPLETADA EXITOSAMENTE ==="
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "🎉 ¡ACTUALIZACIÓN COMPLETA!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✅ Datos procesados correctamente" -ForegroundColor Green
    Write-Host "✅ Archivos JSON actualizados" -ForegroundColor Green
    Write-Host "✅ Commit creado automáticamente" -ForegroundColor Green
    Write-Host "✅ Cambios subidos a GitHub" -ForegroundColor Green
    if (!$SkipDeploy) {
        Write-Host "✅ Despliegue a GitHub Pages completado" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "📅 Los cambios estarán disponibles en GitHub Pages en unos minutos" -ForegroundColor Cyan
    Write-Host "📄 Log detallado: $logFile" -ForegroundColor Cyan

    Send-Notification "SUCCESS" "Actualización completada exitosamente"

}
catch {
    Write-Log "=== ERROR CRÍTICO ===" -Level "ERROR"
    Write-Log "Error: $($_.Exception.Message)" -Level "ERROR"
    Write-Log "StackTrace: $($_.ScriptStackTrace)" -Level "ERROR"

    Write-Host ""
    Write-Host "❌ ERROR CRÍTICO:" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📄 Revisa el log detallado: $logFile" -ForegroundColor Yellow

    Send-Notification "ERROR" "Error en actualización: $($_.Exception.Message)"

    if (!$Auto) {
        Read-Host "Presiona Enter para continuar"
    }

    exit 1

}
finally {
    Write-Log "=== FIN DE EJECUCIÓN ==="
}

if (!$Auto) {
    Read-Host "Presiona Enter para cerrar"
}